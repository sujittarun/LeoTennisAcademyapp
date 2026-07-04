/* ============================================================
   LEO ACADEMY — cloud adapter (window.LT_CLOUD)
   Supabase over fetch — no SDK, no build step. Three access tiers:
   · anon key (public pages): public_slots view, request_booking RPC,
     applications + events inserts — nothing with PII is readable.
   · staff session (Supabase Auth, per-tenant): operational tables.
   · operator session: the Academy Manager console.
   Money paths (request/record/confirm booking) run through Postgres
   RPCs so prices are computed server-side and courts are claimed
   atomically — those calls REJECT on failure so the UI can react.
   Read paths stay fail-soft: offline falls back to LT.store.
   STRICT_AUTH flips true in the lockdown commit (once auth users
   exist); until then the legacy local session keeps staff unblocked.
   ============================================================ */
(function () {
  "use strict";

  var APP_VER = "17"; // keep in step with the ?v= cache-buster
  var PROJECT = "https://ugsklcipzyiogxynshnh.supabase.co";
  var BASE = PROJECT + "/rest/v1";
  var AUTH = PROJECT + "/auth/v1";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc2tsY2lwenlpb2d4eW5zaG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4OTUyMzksImV4cCI6MjA5ODQ3MTIzOX0.w7xkjdTkYN2qA0oxMKLUNtua0ScKVHKQzfEyIayh9eo";
  var TENANT = "leo";
  var STRICT_AUTH = true; // real sign-in required (dummy users provisioned 2026-07-04)
  var SESSION_KEY = "lt-cloud-session";

  /* ---------- session ---------- */
  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function saveSession(s) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function tokenRequest(body) {
    var grant = body.refresh_token ? "refresh_token" : "password";
    return fetch(AUTH + "/token?grant_type=" + grant, {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error_description || j.msg || "sign-in failed");
        var meta = (j.user && j.user.app_metadata) || {};
        var s = {
          access_token: j.access_token, refresh_token: j.refresh_token,
          expires_at: Date.now() + (j.expires_in || 3600) * 1000,
          email: j.user && j.user.email, role: meta.am_role || "", tenant: meta.tenant_id || "",
        };
        saveSession(s);
        return s;
      });
    });
  }

  // resolves to the bearer to use: a (refreshed) user token, else anon key
  function bearer() {
    var s = session();
    if (!s || !s.access_token) return Promise.resolve(KEY);
    if (s.expires_at - Date.now() > 90 * 1000) return Promise.resolve(s.access_token);
    return tokenRequest({ refresh_token: s.refresh_token })
      .then(function (ns) { return ns.access_token; })
      .catch(function () { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} return KEY; });
  }

  /* ---------- transport ---------- */
  var warned = false;
  function soft(err) {
    if (!warned) { warned = true; console.warn("LT_CLOUD offline:", err && err.message ? err.message : err); }
    return null;
  }
  function friendly(err) {
    var m = err && err.message ? err.message : String(err);
    if (/slot full|all courts taken/.test(m)) return m;
    if (/Failed to fetch|NetworkError|Load failed/.test(m)) return "no connection";
    return m;
  }

  function req(method, path, body, extra) {
    return bearer().then(function (tok) {
      var h = { apikey: KEY, Authorization: "Bearer " + tok, "Content-Type": "application/json" };
      for (var k in extra) h[k] = extra[k];
      return fetch(BASE + path, {
        method: method, headers: h,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) {
        var msg = t; try { msg = JSON.parse(t).message || t; } catch (e) {}
        throw new Error(msg);
      });
      return r.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }

  function rpc(name, args) {
    return req("POST", "/rpc/" + name, args).catch(function (e) { throw new Error(friendly(e)); });
  }

  window.LT_CLOUD = {
    tenant: TENANT,
    STRICT_AUTH: STRICT_AUTH,

    /* auth */
    signIn: function (email, password) { return tokenRequest({ email: email, password: password }); },
    signOut: function () { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} },
    session: session,

    /* -------- booking money-paths: server-priced, atomic, REJECT on failure -------- */
    requestBooking: function (sport, date, hour, name, phone) {
      return rpc("request_booking", {
        p_tenant: TENANT, p_sport: sport, p_date: date, p_hour: hour,
        p_name: name, p_phone: phone || null,
      });
    },
    recordBooking: function (b) {
      return rpc("record_booking", {
        p_tenant: TENANT, p_sport: b.sport, p_date: b.date, p_hour: b.hour,
        p_name: b.name, p_phone: b.phone || null, p_source: b.source, p_court: b.court || null,
      });
    },
    confirmBooking: function (id) { return rpc("confirm_booking", { p_id: id }); },

    /* -------- reads (fail soft) -------- */
    fetchPublicSlots: function (sinceIso) { // occupancy only — no names, no phones
      var q = "/public_slots?tenant_id=eq." + TENANT + "&select=id,sport,court,date,hour,status";
      if (sinceIso) q += "&date=gte." + sinceIso;
      return req("GET", q).catch(soft);
    },
    fetchBookings: function (sinceIso) { // staff view (post-lockdown needs a staff session)
      var q = "/bookings?tenant_id=eq." + TENANT + "&status=neq.cancelled&select=id,name,phone,sport,court,date,hour,amount,status,source";
      if (sinceIso) q += "&date=gte." + sinceIso;
      return req("GET", q).catch(soft);
    },

    /* -------- operational tables (staff) -------- */
    addApplication: function (a) {
      return req("POST", "/applications", {
        tenant_id: TENANT, name: a.name, phone: a.phone || null, email: a.email || null,
        level: a.level || null, goal: a.goal || null, program: a.program || null,
        slot: a.slot || null, trial_date: a.date || null,
      }).catch(soft);
    },
    // court regulars (derived contacts view) — staff-scoped by RLS to own tenant
    fetchContacts: function () {
      return req("GET", "/contacts?order=bookings.desc&limit=100&select=phone,name,bookings,spent,last_seen").catch(soft);
    },
    fetchApplications: function (limit) {
      return req("GET", "/applications?tenant_id=eq." + TENANT +
        "&order=created_at.desc&limit=" + (limit || 12) +
        "&select=name,phone,program,slot,trial_date,created_at").catch(soft);
    },
    addPayment: function (p) {
      return req("POST", "/payments", {
        tenant_id: TENANT, ref: p.ref || null, name: p.name, type: p.type,
        detail: p.detail, amount: p.amount, mode: p.mode, on_date: p.on,
      }).catch(soft);
    },
    fetchPayments: function () {
      return req("GET", "/payments?tenant_id=eq." + TENANT +
        "&order=on_date.desc&limit=200&select=ref,name,type,detail,amount,mode,on_date").catch(soft);
    },
    fetchAttendance: function (dateIso) {
      return req("GET", "/attendance?tenant_id=eq." + TENANT + "&date=eq." + dateIso +
        "&present=eq.true&select=kind,person_id").catch(soft);
    },
    setPresence: function (dateIso, kind, personId, present) {
      return req("POST", "/attendance", {
        tenant_id: TENANT, date: dateIso, kind: kind,
        person_id: String(personId), present: !!present,
      }, { Prefer: "resolution=merge-duplicates" }).catch(soft);
    },
    logReminder: function (memberId, upi) {
      return req("POST", "/reminders_log", {
        tenant_id: TENANT, member_id: String(memberId), channel: "whatsapp", upi_used: upi,
      }).catch(soft);
    },

    /* usage analytics */
    track: function (name, props) {
      var sid;
      try {
        sid = sessionStorage.getItem("lt-sid") ||
          (sid = Math.random().toString(36).slice(2), sessionStorage.setItem("lt-sid", sid), sid);
      } catch (e) { sid = null; }
      return req("POST", "/events", {
        tenant_id: TENANT, name: name, props: props || {},
        session_id: sid, page: location.pathname.split("/").pop() || "index.html",
      }).catch(soft);
    },
  };

  LT_CLOUD.track("page_view", { ver: APP_VER });

  // error telemetry — first thing to check when a tenant reports a problem
  var errSent = 0;
  window.addEventListener("error", function (e) {
    if (errSent++ >= 5) return;
    LT_CLOUD.track("client_error", {
      msg: String(e.message || "").slice(0, 200),
      src: String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0),
      ver: APP_VER,
    });
  });
  window.addEventListener("unhandledrejection", function (e) {
    if (errSent++ >= 5) return;
    LT_CLOUD.track("client_error", {
      msg: ("promise: " + String(e.reason && e.reason.message || e.reason || "")).slice(0, 200),
      ver: APP_VER,
    });
  });
})();
