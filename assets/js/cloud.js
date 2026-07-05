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

  var APP_VER = "29"; // keep in step with the ?v= cache-buster
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

  /* ---------- offline outbox ----------
     Fire-and-forget writes (analytics, attendance ticks, reminder logs)
     that fail on a flaky network are queued in localStorage and replayed
     on reconnect, so a booking marked in a venue dead-zone isn't lost.
     Money-path writes deliberately stay reject-on-fail (the UI reacts). */
  var OUTBOX_KEY = "lt-outbox";
  function outbox() { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY)) || []; } catch (e) { return []; } }
  function saveOutbox(q) { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(q.slice(-300))); } catch (e) {} }
  function isNetworkErr(e) { return /Failed to fetch|NetworkError|Load failed|no connection/.test(String(e && e.message || e)); }
  function durable(method, path, body, extra) {
    return req(method, path, body, extra).catch(function (err) {
      if (isNetworkErr(err)) { var q = outbox(); q.push({ method: method, path: path, body: body, extra: extra }); saveOutbox(q); }
      return null;
    });
  }
  function flushOutbox() {
    var q = outbox();
    if (!q.length) return Promise.resolve();
    var remaining = [], chain = Promise.resolve();
    q.forEach(function (op) {
      chain = chain.then(function () {
        return req(op.method, op.path, op.body, op.extra).catch(function (err) { if (isNetworkErr(err)) remaining.push(op); });
      });
    });
    return chain.then(function () { saveOutbox(remaining); });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("online", flushOutbox);
    setTimeout(flushOutbox, 1500);
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
    cancelBooking: function (id, reason) { return rpc("cancel_booking", { p_id: id, p_reason: reason || null }); },
    blockMaintenance: function (sport, date, hour, court, reason) {
      return rpc("block_maintenance", { p_tenant: TENANT, p_sport: sport, p_date: date, p_hour: hour, p_court: court, p_reason: reason || "Maintenance" });
    },

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
    // public enquiry — validated + rate-limited server-side (REJECTS on failure)
    addApplication: function (a) {
      return rpc("submit_application", {
        p_tenant: TENANT, p_name: a.name, p_phone: a.phone || null, p_email: a.email || null,
        p_level: a.level || null, p_goal: a.goal || null, p_program: a.program || null,
        p_slot: a.slot || null, p_trial: a.date || null,
      });
    },
    // booking-channel master list (single source of truth in the DB)
    fetchChannels: function () { return rpc("get_channels", {}).catch(soft); },
    // per-tenant booker analytics + finance streams (staff of tenant / operator)
    fetchBookerStats: function (tenant) { return rpc("tenant_booker_stats", { p_tenant: tenant || TENANT }).catch(soft); },
    fetchRevenueStreams: function (months, tenant) { return rpc("tenant_revenue_streams", { p_tenant: tenant || TENANT, p_months: months || 6 }).catch(soft); },
    // channel-partner integrations (fed to the centralised CourtSync engine)
    fetchIntegrations: function (tenant) {
      return req("GET", "/integrations?tenant_id=eq." + (tenant || TENANT) + "&select=channel,enabled,last_sync_at,last_result&order=channel").catch(soft);
    },
    // config carries method + whether creds are stored (secret_id) — used to
    // prefill the academy's own connect form. Credentials themselves stay in
    // Vault and are never returned here.
    fetchIntegrationConfig: function (tenant) {
      return req("GET", "/integrations?tenant_id=eq." + (tenant || TENANT) + "&select=channel,enabled,config").catch(soft);
    },
    // academy staff link a channel: method (manual/autologin/api) + optional
    // credentials -> encrypted into Vault by the RPC, wired to the sync engine.
    connectIntegration: function (channel, method, creds, enabled, tenant) {
      return rpc("connect_integration", { p_tenant: tenant || TENANT, p_channel: channel, p_method: method, p_creds: creds || null, p_enabled: enabled !== false });
    },
    partnerSync: function (channel, tenant) { return rpc("partner_sync", { p_tenant: tenant || TENANT, p_channel: channel }); },
    // drain the propagation queue (block/unblock pushes to the other channels)
    processSyncJobs: function (limit) { return rpc("process_sync_jobs", { p_limit: limit || 50 }); },
    // court regulars (derived contacts view) — staff-scoped by RLS to own tenant
    fetchContacts: function () {
      return req("GET", "/contacts?order=bookings.desc&limit=100&select=phone,name,bookings,spent,last_seen").catch(soft);
    },
    fetchApplications: function (limit) {
      return req("GET", "/applications?tenant_id=eq." + TENANT +
        "&order=created_at.desc&limit=" + (limit || 12) +
        "&select=name,phone,program,slot,trial_date,created_at").catch(soft);
    },
    // roster members (staff of tenant). Add persists to the members table.
    fetchMembers: function () {
      return req("GET", "/members?tenant_id=eq." + TENANT +
        "&select=id,name,phone,program,joined,valid_till,status&order=joined.desc").catch(soft);
    },
    addMember: function (m) {
      return req("POST", "/members", {
        tenant_id: TENANT, name: m.name, phone: m.phone || null, program: m.program,
        joined: m.joined, valid_till: m.validTill, status: m.status || "active",
      }, { Prefer: "return=representation" }).catch(soft);
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
    // attendance ticks survive a flaky network via the outbox
    setPresence: function (dateIso, kind, personId, present) {
      return durable("POST", "/attendance", {
        tenant_id: TENANT, date: dateIso, kind: kind,
        person_id: String(personId), present: !!present,
      }, { Prefer: "resolution=merge-duplicates" });
    },
    logReminder: function (memberId, upi) {
      return durable("POST", "/reminders_log", {
        tenant_id: TENANT, member_id: String(memberId), channel: "whatsapp", upi_used: upi,
      });
    },

    /* usage analytics (outbox-backed so events aren't lost offline) */
    track: function (name, props) {
      var sid;
      try {
        sid = sessionStorage.getItem("lt-sid") ||
          (sid = Math.random().toString(36).slice(2), sessionStorage.setItem("lt-sid", sid), sid);
      } catch (e) { sid = null; }
      return durable("POST", "/events", {
        tenant_id: TENANT, name: name, props: props || {},
        session_id: sid, page: location.pathname.split("/").pop() || "index.html",
      });
    },
  };

  /* ---------- breadcrumbs ----------
     A lightweight ring of the last dozen things the user did (page loads,
     tracked actions, clicks). Attached to every client_error so you can
     replay what led to a bug without a session-replay tool. */
  var crumbs = [];
  function crumb(type, label) {
    crumbs.push({ t: new Date().toISOString().slice(11, 19), type: type, label: String(label).slice(0, 48) });
    if (crumbs.length > 12) crumbs.shift();
  }
  LT_CLOUD.crumb = crumb; // pages can add their own (e.g. "confirmed booking")
  if (typeof document !== "undefined") {
    document.addEventListener("click", function (e) {
      var el = e.target.closest("button, a, .chip, .court-card, [data-confirm]");
      if (!el) return;
      crumb("click", (el.getAttribute("aria-label") || el.textContent || el.id || el.tagName).replace(/\s+/g, " ").trim());
    }, true);
  }
  crumb("load", location.pathname.split("/").pop() || "index.html");

  function device() {
    try {
      return {
        vw: window.innerWidth + "x" + window.innerHeight,
        ua: (navigator.userAgent.match(/(iPhone|iPad|Android|Macintosh|Windows|CrOS|Linux)[^;)]*/) || ["?"])[0],
        online: navigator.onLine,
      };
    } catch (e) { return {}; }
  }
  function sessionRole() { var s = session(); return s ? (s.role || "legacy") : "anon"; }

  LT_CLOUD.track("page_view", { ver: APP_VER });

  // error telemetry — enriched with breadcrumbs + device + role for triage
  var errSent = 0;
  function reportError(props) {
    if (errSent++ >= 5) return;
    var dv = device();
    LT_CLOUD.track("client_error", Object.assign({
      ver: APP_VER, url: (location.pathname + location.search).slice(0, 120),
      role: sessionRole(), vw: dv.vw, ua: dv.ua, online: dv.online,
      crumbs: crumbs.slice(-8),
    }, props));
  }
  window.addEventListener("error", function (e) {
    reportError({
      msg: String(e.message || "").slice(0, 200),
      src: String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0) + ":" + (e.colno || 0),
      stack: e.error && e.error.stack ? String(e.error.stack).slice(0, 300) : null,
    });
  });
  window.addEventListener("unhandledrejection", function (e) {
    reportError({ msg: ("promise: " + String(e.reason && e.reason.message || e.reason || "")).slice(0, 200) });
  });
})();
