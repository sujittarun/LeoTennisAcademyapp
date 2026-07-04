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

  // every page that loads the adapter logs a view
  LT_CLOUD.track("page_view", {});
})();
