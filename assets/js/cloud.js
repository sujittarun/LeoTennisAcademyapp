/* ============================================================
   LEO ACADEMY — cloud adapter (window.LT_CLOUD)
   Supabase REST over fetch — no SDK, no build step. The anon key is
   public by design; row-level security in supabase/schema.sql is the
   gate. Every call is tenant-scoped and fails soft: if the tables
   aren't created yet (schema.sql not run) or the network is down, the
   app keeps working on LT.store/localStorage exactly as before.
   ============================================================ */
(function () {
  "use strict";

  var APP_VER = "15"; // keep in step with the ?v= cache-buster — the operator console shows it
  var BASE = "https://ugsklcipzyiogxynshnh.supabase.co/rest/v1";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc2tsY2lwenlpb2d4eW5zaG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4OTUyMzksImV4cCI6MjA5ODQ3MTIzOX0.w7xkjdTkYN2qA0oxMKLUNtua0ScKVHKQzfEyIayh9eo";
  var TENANT = "leo";

  function headers(extra) {
    var h = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
    for (var k in extra) h[k] = extra[k];
    return h;
  }

  var warned = false;
  function soft(err) {
    if (!warned) { warned = true; console.warn("LT_CLOUD offline (schema not run yet, or network):", err && err.message ? err.message : err); }
    return null;
  }

  function req(method, path, body, extra) {
    return fetch(BASE + path, {
      method: method,
      headers: headers(extra),
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + " " + t.slice(0, 120)); });
      return r.status === 204 ? null : r.json();
    });
  }

  window.LT_CLOUD = {
    tenant: TENANT,

    /* bookings ledger — the cross-channel availability source of truth */
    fetchBookings: function (sinceIso) {
      var q = "/bookings?tenant_id=eq." + TENANT + "&status=neq.cancelled&select=id,name,phone,sport,court,date,hour,amount,status,source";
      if (sinceIso) q += "&date=gte." + sinceIso;
      return req("GET", q).catch(soft);
    },
    addBooking: function (b) {
      var row = {
        id: b.id, tenant_id: TENANT, name: b.name, phone: b.phone || null,
        sport: b.sport || "tennis", court: b.court || null, date: b.date,
        hour: b.hour, amount: b.amount, status: b.status || "pending",
        source: b.source || "Website",
      };
      return req("POST", "/bookings", row, { Prefer: "resolution=merge-duplicates" }).catch(soft);
    },
    updateBooking: function (id, patch) {
      return req("PATCH", "/bookings?tenant_id=eq." + TENANT + "&id=eq." + encodeURIComponent(id), patch).catch(soft);
    },

    /* membership pipeline */
    addApplication: function (a) {
      return req("POST", "/applications", {
        tenant_id: TENANT, name: a.name, phone: a.phone || null, email: a.email || null,
        level: a.level || null, goal: a.goal || null, program: a.program || null,
        slot: a.slot || null, trial_date: a.date || null,
      }).catch(soft);
    },
    fetchApplications: function (limit) {
      return req("GET", "/applications?tenant_id=eq." + TENANT +
        "&order=created_at.desc&limit=" + (limit || 12) +
        "&select=name,phone,program,slot,trial_date,created_at").catch(soft);
    },

    /* payments ledger — ref is the app-side id used for merge/dedupe */
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

    /* attendance — one row per person per day, kind = member | staff */
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

    /* usage analytics for the Academy Manager console */
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

  // every page that loads the adapter logs a view (with app version, so
  // the operator console can see which build a tenant is running)
  LT_CLOUD.track("page_view", { ver: APP_VER });

  // error telemetry — first thing to check when a tenant reports a problem
  var errSent = 0;
  window.addEventListener("error", function (e) {
    if (errSent++ >= 5) return; // don't flood on error loops
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
