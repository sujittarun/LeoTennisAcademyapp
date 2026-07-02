/* ============================================================
   LEO TENNIS ACADEMY — application dataset (window.LT_DATA)
   Backed by sample records until the production API is wired in;
   court-booking requests and payments recorded in the app are
   persisted via LT.store and merged with these seeds.
   ============================================================ */
(function () {
  function iso(d) { return d.toISOString().slice(0, 10); }
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

    // Court rental — one-hour slots, 4 bookable courts, 6 AM – 11 PM daily
    courts: 4,
    courtsMeta: [
      { n: 1, surface: "Synthetic hard", note: "Floodlit centre court", img: "assets/img/courts/court-2.jpg" },
      { n: 2, surface: "Synthetic hard", note: "Match court by the stands", img: "assets/img/courts/court-1.jpg" },
      { n: 3, surface: "Red clay", note: "Classic clay, slower rallies", img: "assets/img/courts/court-3.jpg" },
      { n: 4, surface: "Red clay", note: "Coaching & rally court", img: "assets/img/courts/court-4.jpg" },
    ],
    slotHours: { open: 6, close: 23 },          // last slot starts 22:00 (10–11 PM)
    rates: { offPeak: 500, peak: 700, peakFrom: 16 }, // peak = 4 PM onward (floodlights)

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
      { id: 7,  name: "Farhan Sheikh",    program: "perf",    age: 29, phone: "90104 22983", joined: "2025-07-22", validTill: daysFromNow(22),  status: "active" },
      { id: 8,  name: "Divya Chandran",   program: "cardio",  age: 35, phone: "97010 38854", joined: "2025-10-08", validTill: daysFromNow(-1),  status: "due" },
      { id: 9,  name: "Vikram Bhat",      program: "found",   age: 41, phone: "98850 61147", joined: "2026-05-12", validTill: daysFromNow(33),  status: "active" },
      { id: 10, name: "Ananya Deshpande", program: "perf",    age: 26, phone: "98481 33290", joined: "2026-01-10", validTill: daysFromNow(19),  status: "active" },
      { id: 11, name: "Sanjay Reddy",     program: "cardio",  age: 52, phone: "98490 11223", joined: "2025-11-04", validTill: daysFromNow(47),  status: "active" },
      { id: 12, name: "Nikhil Prasad",    program: "found",   age: 24, phone: "99890 44215", joined: "2025-09-15", validTill: daysFromNow(25),  status: "active" },
      { id: 13, name: "Lakshmi Menon",    program: "private", age: 36, phone: "98123 40987", joined: "2026-04-20", validTill: daysFromNow(52),  status: "active" },
      { id: 14, name: "Tarun Agarwal",    program: "perf",    age: 30, phone: "97654 12309", joined: "2026-06-15", validTill: daysFromNow(74),  status: "active" },
    ],

    // Court bookings (seed). Hour = slot start in 24h.
    bookings: [
      { id: "B-1041", name: "Rohit Venkatesh", phone: "90000 87641", court: 1, date: daysFromNow(0), hour: 6,  amount: 500, status: "confirmed" },
      { id: "B-1042", name: "Kabir Nair",      phone: "99490 55876", court: 1, date: daysFromNow(0), hour: 7,  amount: 500, status: "confirmed" },
      { id: "B-1048", name: "Meera Iyer",      phone: "98661 90035", court: 2, date: daysFromNow(0), hour: 7,  amount: 500, status: "confirmed" },
      { id: "B-1049", name: "Lakshmi Menon",   phone: "98123 40987", court: 3, date: daysFromNow(0), hour: 8,  amount: 500, status: "confirmed" },
      { id: "B-1050", name: "Vikram Bhat",     phone: "98850 61147", court: 4, date: daysFromNow(0), hour: 10, amount: 500, status: "confirmed" },
      { id: "B-1043", name: "Priyanka Joshi",  phone: "98220 45671", court: 1, date: daysFromNow(0), hour: 18, amount: 700, status: "confirmed" },
      { id: "B-1051", name: "Ananya Deshpande", phone: "98481 33290", court: 2, date: daysFromNow(0), hour: 18, amount: 700, status: "confirmed" },
      { id: "B-1044", name: "Cygnus Tech (corporate)", phone: "98450 22110", court: 4, date: daysFromNow(0), hour: 19, amount: 700, status: "pending" },
      { id: "B-1045", name: "Farhan Sheikh",   phone: "90104 22983", court: 3, date: daysFromNow(0), hour: 20, amount: 700, status: "confirmed" },
      { id: "B-1052", name: "Sanjay Reddy",    phone: "98490 11223", court: 1, date: daysFromNow(0), hour: 21, amount: 700, status: "confirmed" },
      { id: "B-1046", name: "Lakshmi Menon",   phone: "98123 40987", court: 1, date: daysFromNow(1), hour: 6,  amount: 500, status: "confirmed" },
      { id: "B-1047", name: "Dheeraj Kamath",  phone: "97411 88976", court: 2, date: daysFromNow(1), hour: 21, amount: 700, status: "pending" },
    ],

    payments: [
      { id: 101, name: "Tarun Agarwal",    type: "Membership", detail: "Monthly · Performance",  amount: 4500,  on: daysFromNow(-1),  mode: "UPI" },
      { id: 102, name: "Priyanka Joshi",   type: "Court",      detail: "Court 4 · 6–7 PM",       amount: 700,   on: daysFromNow(-1),  mode: "UPI" },
      { id: 103, name: "Kabir Nair",       type: "Membership", detail: "Quarterly · Performance", amount: 12825, on: daysFromNow(-4),  mode: "UPI" },
      { id: 104, name: "Vikram Bhat",      type: "Membership", detail: "Monthly · Foundations",  amount: 4500,  on: daysFromNow(-5),  mode: "Cash" },
      { id: 105, name: "Cygnus Tech",      type: "Court",      detail: "Courts 3–4 · 7–9 PM",    amount: 2800,  on: daysFromNow(-6),  mode: "Bank" },
      { id: 106, name: "Lakshmi Menon",    type: "Membership", detail: "Half-yearly · Private",  amount: 24300, on: daysFromNow(-12), mode: "Bank" },
      { id: 107, name: "Ananya Deshpande", type: "Membership", detail: "Monthly · Performance",  amount: 4500,  on: daysFromNow(-15), mode: "UPI" },
      { id: 108, name: "Sanjay Reddy",     type: "Membership", detail: "Quarterly · Cardio",     amount: 12825, on: daysFromNow(-19), mode: "UPI" },
      { id: 109, name: "Walk-in",          type: "Court",      detail: "Court 3 · 8–10 PM",      amount: 1400,  on: daysFromNow(-20), mode: "Cash" },
    ],

    // Trailing six months of revenue for the finance chart (₹ thousands)
    revenue: [
      { m: "Feb", v: 132 }, { m: "Mar", v: 141 }, { m: "Apr", v: 128 },
      { m: "May", v: 156 }, { m: "Jun", v: 171 }, { m: "Jul", v: 84 },
    ],

    activity: [
      { icon: "join",  text: "<strong>Tarun Agarwal</strong> joined Performance · Monthly plan", time: "Yesterday" },
      { icon: "court", text: "<strong>Cygnus Tech</strong> requested Courts 5–6, 7–9 PM (corporate)", time: "Yesterday" },
      { icon: "pay",   text: "<strong>Kabir Nair</strong> renewed Quarterly · ₹12,825", time: "4 days ago" },
      { icon: "trophy", text: "<strong>Performance squad</strong> won the HCL Corporate League tie", time: "5 days ago" },
      { icon: "join",  text: "<strong>3 membership enquiries</strong> received from the website", time: "This week" },
    ],
  };

  /* Slot helpers shared by booking pages */
  window.LT_SLOTS = {
    hours: (function () { var a = []; for (var h = LT_DATA.slotHours.open; h < LT_DATA.slotHours.close; h++) a.push(h); return a; })(),
    rate: function (h) { return h >= LT_DATA.rates.peakFrom ? LT_DATA.rates.peak : LT_DATA.rates.offPeak; },
    label: function (h) {
      function f(x) { var ap = x >= 12 ? "PM" : "AM"; var v = x % 12 || 12; return v + " " + ap; }
      return f(h) + " – " + f(h + 1);
    },
  };
})();
