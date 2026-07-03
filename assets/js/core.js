/* ============================================================
   LEO TENNIS ACADEMY — core shell (window.LT)
   Storage layer is localStorage for now (LT.store); swap for the
   production API/Supabase without touching page controllers.
   ============================================================ */
(function () {
  "use strict";

  var LT = (window.LT = {});

  /* ---------- Brand mark (inline SVG ≈ the gold "LA" monogram) ---------- */
  LT.logoSVG = function (size) {
    return (
      '<svg viewBox="0 0 100 100" width="' + (size || 30) + '" height="' + (size || 30) + '" aria-hidden="true">' +
      '<defs><linearGradient id="ltGoldMark" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f0d795"/><stop offset=".5" stop-color="#c9a24b"/><stop offset="1" stop-color="#a67e2e"/>' +
      "</linearGradient></defs>" +
      '<path d="M 12 34 Q 50 2 88 30" fill="none" stroke="url(#ltGoldMark)" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M 16 78 Q 50 96 86 74" fill="none" stroke="url(#ltGoldMark)" stroke-width="5" stroke-linecap="round"/>' +
      '<text x="50" y="70" text-anchor="middle" font-family="Cinzel, Times New Roman, serif" font-weight="700" font-size="52" fill="url(#ltGoldMark)">LA</text>' +
      "</svg>"
    );
  };

  /* ---------- Theme (dark-first, persisted) ---------- */
  LT.theme = {
    get: function () { return document.documentElement.dataset.theme || "dark"; },
    set: function (t) {
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem("lt-theme", t); } catch (e) {}
      document.querySelectorAll(".theme-toggle").forEach(LT.theme.paint);
    },
    toggle: function () { LT.theme.set(LT.theme.get() === "dark" ? "light" : "dark"); },
    paint: function (btn) {
      var dark = LT.theme.get() === "dark";
      btn.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    },
  };

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  LT.toast = function (msg, ms) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "lt-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(function () { toastEl.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 2600);
  };

  /* ---------- Demo store (localStorage-backed) ---------- */
  LT.store = {
    read: function (key, fallback) {
      try { return JSON.parse(localStorage.getItem("lt-" + key)) || fallback; }
      catch (e) { return fallback; }
    },
    write: function (key, val) {
      try { localStorage.setItem("lt-" + key, JSON.stringify(val)); } catch (e) {}
    },
  };

  /* ---------- Auth (local session; production swaps in real auth) ---------- */
  LT.auth = {
    login: function (email) { LT.store.write("session", { email: email || "coach@leotennis.in", at: Date.now() }); },
    logout: function () { try { localStorage.removeItem("lt-session"); } catch (e) {} location.href = "index.html"; },
    session: function () { return LT.store.read("session", null); },
    require: function () {
      if (!LT.auth.session()) location.replace("login.html");
    },
  };

  /* ---------- Formatters ---------- */
  LT.fmtINR = function (n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); };
  LT.initials = function (name) {
    return String(name || "").split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ""; }).join("").toUpperCase();
  };
  LT.today = function () { return new Date().toISOString().slice(0, 10); };

  /* ---------- Count-up ---------- */
  LT.countUp = function (el, target, opts) {
    opts = opts || {};
    var dur = opts.dur || 1100, start = null, prefix = opts.prefix || "", suffix = opts.suffix || "";
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString("en-IN") + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* ---------- Manager nav shell ---------- */
  var MANAGER_TABS = [
    ["dashboard.html", "Dashboard", '<path d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"/>'],
    ["players.html", "Members", '<path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>'],
    ["bookings.html", "Bookings", '<path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14zM5 8V6h14v2zm4 6H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zm-8 4H7v-2h2zm4 0h-2v-2h2z"/>'],
    ["fees.html", "Finance",'<path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1H6.32c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>'],
  ];

  LT.managerShell = function (activeHref) {
    var s = LT.auth.session();
    var tabsHtml = MANAGER_TABS.map(function (t) {
      var act = t[0] === activeHref ? " active" : "";
      return '<a class="nav-tab' + act + '" href="' + t[0] + '"><svg viewBox="0 0 24 24" fill="currentColor">' + t[2] + "</svg><span>" + t[1] + "</span></a>";
    }).join("");
    var dockHtml = MANAGER_TABS.map(function (t) {
      var act = t[0] === activeHref ? " active" : "";
      return '<a class="dock-tab' + act + '" href="' + t[0] + '"><svg viewBox="0 0 24 24" fill="currentColor">' + t[2] + "</svg>" + t[1] + "</a>";
    }).join("");

    var nav = document.createElement("nav");
    nav.className = "lt-nav glass";
    nav.innerHTML =
      '<a class="nav-brand" href="index.html"><span class="mark">' + LT.logoSVG(30) + "</span>" +
      '<span class="t"><strong>Leo Academy</strong><span>Manager Console</span></span></a>' +
      '<div class="nav-tabs">' + tabsHtml + "</div>" +
      '<div class="nav-actions">' +
      '<button type="button" class="theme-toggle"></button>' +
      '<button type="button" class="btn btn-icon btn-glass only-mobile" data-logout aria-label="Sign out" title="Sign out">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>' +
      "</button>" +
      '<button type="button" class="btn btn-ghost btn-sm hide-mobile" data-logout>Sign out</button>' +
      "</div>";
    document.body.prepend(nav);

    var dock = document.createElement("nav");
    dock.className = "lt-dock glass";
    dock.innerHTML = dockHtml;
    document.body.appendChild(dock);

    if (s && s.email) {
      var badge = nav.querySelector("[data-logout]");
      badge.title = s.email;
    }
  };

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    // brand marks
    document.querySelectorAll("[data-logo]").forEach(function (el) {
      el.innerHTML = LT.logoSVG(el.dataset.logo || 30);
    });

    // theme toggles
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      LT.theme.paint(btn);
      btn.addEventListener("click", LT.theme.toggle);
    });

    // logout buttons
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-logout]")) LT.auth.logout();
    });

    // scroll reveal
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }

    // cursor-following specular on hover cards
    document.querySelectorAll(".glass-hover").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });

    // count-up stats when visible
    var seen = new WeakSet();
    if ("IntersectionObserver" in window) {
      var cu = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !seen.has(en.target)) {
            seen.add(en.target);
            var el = en.target;
            LT.countUp(el, Number(el.dataset.countup || 0), { prefix: el.dataset.prefix || "", suffix: el.dataset.suffix || "" });
            cu.unobserve(el);
          }
        });
      }, { threshold: 0.4 });
      document.querySelectorAll("[data-countup]").forEach(function (el) { cu.observe(el); });
    }
  });
})();
