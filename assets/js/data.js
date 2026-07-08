/* ============================================================
   LEO ACADEMY — application dataset (window.LT_DATA)
   Backed by sample records until the production API is wired in;
   court-booking requests and payments recorded in the app are
   persisted via LT.store and merged with these seeds.
   ============================================================ */
(function () {
  function iso(d) { // local date, not UTC
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function daysFromNow(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }

  window.LT_DATA = {
    programs: [
      { id: "found", name: "Foundations", level: "Beginner / returning after years", days: "Mon · Wed · Fri", time: "6–7 AM & 7–8 PM" },
      { id: "perf", name: "Performance", level: "Intermediate & advanced", days: "Tue · Thu · Sat", time: "6–7:30 AM & 8–9:30 PM" },
      { id: "cardio", name: "Cardio Tennis", level: "Fitness-first, all levels", days: "Daily", time: "7–8 AM & 6–7 PM" },
      { id: "private", name: "Private Coaching", level: "1-on-1, any level", days: "By appointment", time: "Any open court hour" },
    ],

    plans: [
      { id: "m", label: "Monthly", amount: 4500, months: 1 },
      { id: "q", label: "Quarterly", amount: 12825, months: 3, note: "5% off" },
      { id: "h", label: "Half-yearly", amount: 24300, months: 6, note: "10% off" },
    ],

    // Court rental — one-hour slots, 6 AM – 11 PM daily.
    // 5 tennis courts + 4 pickleball courts ("Leo Pickleball Den").
    sports: {
      tennis: { label: "Tennis", rates: { offPeak: 500, peak: 700 } },
      pickleball: { label: "Pickleball", rates: { offPeak: 400, peak: 600 } },
    },
    courtsMeta: [
      { id: "T1", sport: "tennis", name: "Tennis 1", note: "Centre court · floodlit", img: "assets/img/courts/court-1.jpg" },
      { id: "T2", sport: "tennis", name: "Tennis 2", note: "Match court · floodlit", img: "assets/img/courts/court-2.jpg" },
      { id: "T3", sport: "tennis", name: "Tennis 3", note: "Training court · floodlit", img: "assets/img/courts/court-3.jpg" },
      { id: "T4", sport: "tennis", name: "Tennis 4", note: "Rally court · floodlit", img: "assets/img/courts/court-4.jpg" },
      { id: "T5", sport: "tennis", name: "Tennis 5", note: "Night court · floodlit", img: "assets/img/courts/court-night.jpg" },
      { id: "P1", sport: "pickleball", name: "Pickleball 1", note: "Den court · floodlit", img: "assets/img/courts/pickle-1.jpg" },
      { id: "P2", sport: "pickleball", name: "Pickleball 2", note: "Den court · floodlit", img: "assets/img/courts/pickle-1.jpg" },
      { id: "P3", sport: "pickleball", name: "Pickleball 3", note: "Den court · floodlit", img: "assets/img/courts/pickle-1.jpg" },
      { id: "P4", sport: "pickleball", name: "Pickleball 4", note: "Den court · floodlit", img: "assets/img/courts/pickle-1.jpg" },
    ],
    slotHours: { open: 6, close: 23 },          // last slot starts 22:00 (10–11 PM)
    rates: { peakFrom: 16 },                    // peak hour shared by both sports; amounts live in sports.*.rates

    // UPI collection accounts — PLACEHOLDER IDs, swap for the real ones before
    // launch. Rotation spreads incoming payments across accounts: days 1–5 of
    // the month collect to the first ID, 6–10 to the second, then repeat.
    billing: {
      payee: "Leo Academy",
      upiIds: ["1234567890@ybl", "0123456789@ybl"],
      upiWindowDays: 5,
    },

    contact: {
      address: "Opp. Lingampally MMTS Station, Venkat Reddy Colony, Serilingampally, Hyderabad",
      phone: "+91 96768 29060",
      phone2: "+91 72081 95649",
      hours: "Open daily · 6 AM – 11 PM",
      instagram: "https://www.instagram.com/leotennishyd/",
    },

    members: [
      { id: 1,  name: "Kabir Nair",       program: "perf",    age: 32, phone: "99490 55876", joined: "2025-04-05", validTill: daysFromNow(29),  status: "active" },
      { id: 2,  name: "Arjun Malhotra",   program: "found",   age: 28, phone: "96031 74412", joined: "2026-03-01", validTill: daysFromNow(60),  status: "active" },
      { id: 3,  name: "Sneha Kulkarni",   program: "cardio",  age: 31, phone: "98495 20678", joined: "2026-06-02", validTill: daysFromNow(-3),  status: "due" },
      { id: 4,  name: "Rohit Venkatesh",  program: "perf",    age: 38, phone: "90000 87641", joined: "2025-03-02", validTill: daysFromNow(58),  status: "active" },
      { id: 5,  name: "Meera Iyer",       program: "found",   age: 27, phone: "98661 90035", joined: "2026-02-18", validTill: daysFromNow(41),  status: "active" },
      { id: 6,  name: "Adityan Pillai",   program: "private", age: 45, phone: "96520 71148", joined: "2024-12-01", validTill: daysFromNow(-8),  status: "due" },
      { id: 7,  name: "Farhan Sheikh",    program: "perf",    age: 29, phone: "90104 22983", joined: "2025-07-22", validTill: daysFromNow(2),   status: "active" },
      { id: 8,  name: "Divya Chandran",   program: "cardio",  age: 35, phone: "97010 38854", joined: "2025-10-08", validTill: daysFromNow(-1),  status: "due" },
      { id: 9,  name: "Vikram Bhat",      program: "found",   age: 41, phone: "98850 61147", joined: "2026-05-12", validTill: daysFromNow(33),  status: "active" },
      { id: 10, name: "Ananya Deshpande", program: "perf",    age: 26, phone: "98481 33290", joined: "2026-01-10", validTill: daysFromNow(19),  status: "active" },
      { id: 11, name: "Sanjay Reddy",     program: "cardio",  age: 52, phone: "98490 11223", joined: "2025-11-04", validTill: daysFromNow(47),  status: "active" },
      { id: 12, name: "Nikhil Prasad",    program: "found",   age: 24, phone: "99890 44215", joined: "2025-09-15", validTill: daysFromNow(25),  status: "active" },
      { id: 13, name: "Lakshmi Menon",    program: "private", age: 36, phone: "98123 40987", joined: "2026-04-20", validTill: daysFromNow(52),  status: "active" },
      { id: 14, name: "Tarun Agarwal",    program: "perf",    age: 30, phone: "97654 12309", joined: "2026-06-15", validTill: daysFromNow(74),  status: "active" },
    ],

    // Coaching & operations staff (attendance is tracked for them too).
    // The roster is editable in Attendance → Staff & coaches; adds/removes
    // are stored via LT.store and merged by LT_STAFF().
    staff: [
      { id: "s1", name: "Rahul Sharma",   role: "Head Coach" },
      { id: "s2", name: "Priya Krishnan", role: "Performance Coach" },
      { id: "s3", name: "David Manuel",   role: "Fitness & Conditioning" },
      { id: "s4", name: "Kavya Reddy",    role: "Front Desk & Bookings" },
      { id: "s5", name: "Mahesh Yadav",   role: "Courts & Maintenance" },
    ],

    // Expense categories (Finance → Expenses). "Other" catches anything
    // outside the fixed buckets; keep the list short and business-relevant.
    expenseCats: ["Salaries", "Ground maintenance", "Equipment", "Rent", "Power & utilities", "Other"],

    // Recent operating expenses (seed). App-recorded expenses merge from
    // LT.store; cleared at go-live with the other seed arrays (launch-reset).
    expenses: [
      { ref: "E-SEED1", category: "Salaries",           payee: "Coach & staff payroll", detail: "Monthly salaries · 5 staff",   amount: 210000, mode: "Bank", on: daysFromNow(-3) },
      { ref: "E-SEED2", category: "Rent",               payee: "Venkat Reddy (landlord)", detail: "Monthly ground lease",        amount: 85000,  mode: "Bank", on: daysFromNow(-4) },
      { ref: "E-SEED3", category: "Power & utilities",  payee: "TSSPDCL",               detail: "Floodlight power bill",         amount: 24300,  mode: "Bank", on: daysFromNow(-6) },
      { ref: "E-SEED4", category: "Ground maintenance", payee: "GreenTurf Services",    detail: "Court resurfacing patch · T3",  amount: 18500,  mode: "UPI",  on: daysFromNow(-7) },
      { ref: "E-SEED5", category: "Equipment",          payee: "Tennis Pro Store",      detail: "Balls (20 cans) + string reels", amount: 14200, mode: "Card", on: daysFromNow(-9) },
      { ref: "E-SEED6", category: "Ground maintenance", payee: "AquaClean",             detail: "Net replacement · P2",          amount: 6800,   mode: "UPI",  on: daysFromNow(-13) },
    ],

    // Court bookings (seed). Hour = slot start in 24h; court = courtsMeta id.
    bookings: [
      { id: "B-1041", name: "Rohit Venkatesh", phone: "90000 87641", court: "T1", sport: "tennis", date: daysFromNow(0), hour: 6,  amount: 500, status: "confirmed", source: "Website" },
      { id: "B-1042", name: "Kabir Nair",      phone: "99490 55876", court: "T1", sport: "tennis", date: daysFromNow(0), hour: 7,  amount: 500, status: "confirmed", source: "Website" },
      { id: "B-1048", name: "Meera Iyer",      phone: "98661 90035", court: "T2", sport: "tennis", date: daysFromNow(0), hour: 7,  amount: 500, status: "confirmed", source: "Playo" },
      { id: "B-1049", name: "Lakshmi Menon",   phone: "98123 40987", court: "T3", sport: "tennis", date: daysFromNow(0), hour: 8,  amount: 500, status: "confirmed", source: "Hudle" },
      { id: "B-1053", name: "Pickle Pros (group)", phone: "98111 22334", court: "P1", sport: "pickleball", date: daysFromNow(0), hour: 7,  amount: 400, status: "confirmed", source: "Playo" },
      { id: "B-1054", name: "Ritu & Friends",  phone: "97888 44556", court: "P2", sport: "pickleball", date: daysFromNow(0), hour: 8,  amount: 400, status: "confirmed", source: "Hudle" },
      { id: "B-1050", name: "Vikram Bhat",     phone: "98850 61147", court: "T4", sport: "tennis", date: daysFromNow(0), hour: 10, amount: 500, status: "confirmed", source: "Walk-in" },
      { id: "B-1043", name: "Priyanka Joshi",  phone: "98220 45671", court: "T1", sport: "tennis", date: daysFromNow(0), hour: 18, amount: 700, status: "confirmed", source: "Playo" },
      { id: "B-1051", name: "Ananya Deshpande", phone: "98481 33290", court: "T2", sport: "tennis", date: daysFromNow(0), hour: 18, amount: 700, status: "confirmed", source: "Website" },
      { id: "B-1055", name: "Smash Club",      phone: "96555 77889", court: "P3", sport: "pickleball", date: daysFromNow(0), hour: 19, amount: 600, status: "confirmed", source: "Playo" },
      { id: "B-1044", name: "Cygnus Tech (corporate)", phone: "98450 22110", court: "T4", sport: "tennis", date: daysFromNow(0), hour: 19, amount: 700, status: "pending", source: "Hudle" },
      { id: "B-1045", name: "Farhan Sheikh",   phone: "90104 22983", court: "T3", sport: "tennis", date: daysFromNow(0), hour: 20, amount: 700, status: "confirmed", source: "Website" },
      { id: "B-1052", name: "Sanjay Reddy",    phone: "98490 11223", court: "T1", sport: "tennis", date: daysFromNow(0), hour: 21, amount: 700, status: "confirmed", source: "Playo" },
      { id: "B-1046", name: "Lakshmi Menon",   phone: "98123 40987", court: "T1", sport: "tennis", date: daysFromNow(1), hour: 6,  amount: 500, status: "confirmed", source: "Website" },
      { id: "B-1047", name: "Dheeraj Kamath",  phone: "97411 88976", court: "T2", sport: "tennis", date: daysFromNow(1), hour: 21, amount: 700, status: "pending", source: "Playo" },
    ],

    payments: [
      { id: 101, name: "Tarun Agarwal",    type: "Membership", detail: "Monthly · Performance",  amount: 4500,  on: daysFromNow(-1),  mode: "UPI" },
      { id: 102, name: "Priyanka Joshi",   type: "Court",      detail: "Tennis 4 · 6–7 PM",      amount: 700,   on: daysFromNow(-1),  mode: "UPI" },
      { id: 103, name: "Kabir Nair",       type: "Membership", detail: "Quarterly · Performance", amount: 12825, on: daysFromNow(-4),  mode: "UPI" },
      { id: 104, name: "Vikram Bhat",      type: "Membership", detail: "Monthly · Foundations",  amount: 4500,  on: daysFromNow(-5),  mode: "Cash" },
      { id: 105, name: "Cygnus Tech",      type: "Court",      detail: "Tennis 3–4 · 7–9 PM",    amount: 2800,  on: daysFromNow(-6),  mode: "Bank" },
      { id: 106, name: "Lakshmi Menon",    type: "Membership", detail: "Half-yearly · Private",  amount: 24300, on: daysFromNow(-12), mode: "Bank" },
      { id: 107, name: "Ananya Deshpande", type: "Membership", detail: "Monthly · Performance",  amount: 4500,  on: daysFromNow(-15), mode: "UPI" },
      { id: 108, name: "Sanjay Reddy",     type: "Membership", detail: "Quarterly · Cardio",     amount: 12825, on: daysFromNow(-19), mode: "UPI" },
      { id: 109, name: "Pickle Pros",      type: "Court",      detail: "Pickleball 1–2 · 7–9 PM", amount: 1600, on: daysFromNow(-20), mode: "Cash" },
    ],

    // Trailing six months for the finance charts (₹ thousands).
    finance: [
      { m: "Feb", rev: 132, exp: 84,  memberships: 106, courts: 26, salaries: 52, maintenance: 14, power: 11, gear: 7 },
      { m: "Mar", rev: 141, exp: 88,  memberships: 110, courts: 31, salaries: 52, maintenance: 16, power: 12, gear: 8 },
      { m: "Apr", rev: 128, exp: 90,  memberships: 98,  courts: 30, salaries: 55, maintenance: 15, power: 13, gear: 7 },
      { m: "May", rev: 156, exp: 92,  memberships: 118, courts: 38, salaries: 55, maintenance: 17, power: 13, gear: 7 },
      { m: "Jun", rev: 171, exp: 95,  memberships: 126, courts: 45, salaries: 58, maintenance: 16, power: 14, gear: 7 },
      { m: "Jul", rev: 84,  exp: 46,  memberships: 62,  courts: 22, salaries: 29, maintenance: 8,  power: 6,  gear: 3 },
    ],
    get revenue() { return this.finance.map(function (f) { return { m: f.m, v: f.rev }; }); },

    activity: [
      { icon: "join",  text: "<strong>Tarun Agarwal</strong> joined Performance · Monthly plan", time: "Yesterday" },
      { icon: "court", text: "<strong>Cygnus Tech</strong> requested Tennis 4, 7–8 PM (corporate)", time: "Yesterday" },
      { icon: "pay",   text: "<strong>Kabir Nair</strong> renewed Quarterly · ₹12,825", time: "4 days ago" },
      { icon: "trophy", text: "<strong>Performance squad</strong> won the HCL Corporate League tie", time: "5 days ago" },
      { icon: "join",  text: "<strong>3 membership enquiries</strong> received from the website", time: "This week" },
    ],
  };

  /* Booking channels: courts get booked directly on the website, via the
     Playo and Hudle marketplaces, or as walk-ins added by staff. Marketplace
     API integrations are pending — until then staff record them manually. */
  window.LT_DATA.channels = [
    { id: "Website", label: "Website", cls: "gold" },
    { id: "Playo", label: "Playo", cls: "green" },
    { id: "Hudle", label: "Hudle", cls: "optic" },
    { id: "Walk-in", label: "Walk-in", cls: "" },
  ];

  /* One month of past court bookings across all channels and both sports
     (deterministic: seeded per-date so history is stable between reloads). */
  (function backfill() {
    function rng(seed) { // mulberry32
      return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    var names = ["Aditi Rao", "Karthik S", "Neha Bansal", "Cygnus Tech", "Praveen Y", "Ritu Sharma", "Mohit Jain", "Sneha K", "Imran Ali", "Deepa Nair", "Suresh Babu", "Anil Kumar", "Pooja M", "Ravi Chandra", "Harsha V"];
    var srcPool = ["Website", "Website", "Website", "Playo", "Playo", "Hudle", "Walk-in", "Playo", "Hudle", "Website", "Walk-in", "Playo"];
    var courts = window.LT_DATA.courtsMeta;
    var hist = [];
    for (var d = 1; d <= 30; d++) {
      var date = daysFromNow(-d);
      var r = rng(parseInt(date.replace(/-/g, ""), 10));
      var n = 4 + Math.floor(r() * 6); // 4–9 bookings a day across 9 courts
      var usedSlots = {};
      for (var k = 0; k < n; k++) {
        var evening = r() < 0.62; // peak hours are busier
        var hour = evening ? 16 + Math.floor(r() * 7) : 6 + Math.floor(r() * 10);
        var court = courts[Math.floor(r() * courts.length)];
        var key = hour + ":" + court.id;
        if (usedSlots[key]) continue;
        usedSlots[key] = 1;
        var rates = window.LT_DATA.sports[court.sport].rates;
        hist.push({
          id: "B-H" + date.replace(/-/g, "").slice(4) + "-" + hour + court.id,
          name: names[Math.floor(r() * names.length)],
          phone: "",
          court: court.id,
          sport: court.sport,
          date: date,
          hour: hour,
          amount: hour >= window.LT_DATA.rates.peakFrom ? rates.peak : rates.offPeak,
          status: "confirmed",
          source: srcPool[Math.floor(r() * srcPool.length)],
        });
      }
    }
    window.LT_DATA.bookings = window.LT_DATA.bookings.concat(hist);
  })();

  /* Merged roster shared by staff pages (players, attendance): seed members
     + members added on this device (LT.store "members") + per-member renewal
     overrides ("member-overrides"). Always read the roster through this so
     app-added members appear everywhere, not just on the Members page. */
  window.LT_ROSTER = function () {
    var seen = {}, out = window.LT_DATA.members.slice();
    out.forEach(function (m) { seen[String(m.id)] = 1; });
    (LT.store.read("members", []) || []).forEach(function (m) {
      if (!seen[String(m.id)]) { seen[String(m.id)] = 1; out.push(m); }
    });
    var ov = LT.store.read("member-overrides", {});
    return out.map(function (m) { return ov[m.id] ? Object.assign({}, m, ov[m.id]) : m; });
  };

  /* Merged staff/coach roster shared by Attendance: seed staff + coaches
     added on this device ("staff-added"), minus any removed ("staff-removed").
     Seed coaches can't be deleted from the array, so removal is a filter. */
  window.LT_STAFF = function () {
    var removed = LT.store.read("staff-removed", []) || [];
    var out = window.LT_DATA.staff.filter(function (s) { return removed.indexOf(s.id) === -1; });
    (LT.store.read("staff-added", []) || []).forEach(function (s) {
      if (removed.indexOf(s.id) === -1) out.push(s);
    });
    return out;
  };

  /* Slot helpers shared by booking pages */
  window.LT_SLOTS = {
    hours: (function () { var a = []; for (var h = LT_DATA.slotHours.open; h < LT_DATA.slotHours.close; h++) a.push(h); return a; })(),
    rate: function (h, sport) {
      var r = LT_DATA.sports[sport || "tennis"].rates;
      return h >= LT_DATA.rates.peakFrom ? r.peak : r.offPeak;
    },
    label: function (h) {
      function f(x) { var ap = x >= 12 ? "PM" : "AM"; var v = x % 12 || 12; return v + " " + ap; }
      return f(h) + " – " + f(h + 1);
    },
    // legacy stored bookings used numeric tennis court numbers
    courtId: function (c) { return typeof c === "number" ? "T" + c : c; },
    courtsOf: function (sport) {
      return LT_DATA.courtsMeta.filter(function (c) { return c.sport === sport; });
    },
  };
})();
