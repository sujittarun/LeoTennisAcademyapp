/* ============================================================
   LEO TENNIS ACADEMY — demo dataset (window.LT_DEMO)
   Purely illustrative sample data for the showcase. Replace with
   real API / Supabase queries when the academy signs up.
   ============================================================ */
window.LT_DEMO = {
  batches: [
    { id: "tiny", name: "Tiny Aces", ages: "4–7 yrs", time: "4:00 – 5:00 PM" },
    { id: "junior", name: "Junior Development", ages: "8–12 yrs", time: "5:00 – 6:30 PM" },
    { id: "elite", name: "Elite Performance", ages: "13–18 yrs", time: "6:30 – 8:30 AM & PM" },
    { id: "adult", name: "Adult & Corporate", ages: "18+ yrs", time: "6:00 – 7:00 AM" },
  ],

  plans: [
    { id: "m", label: "Monthly", amount: 4000, months: 1 },
    { id: "q", label: "Quarterly", amount: 11400, months: 3, note: "5% off" },
    { id: "h", label: "Half-yearly", amount: 21600, months: 6, note: "10% off" },
  ],

  players: [
    { id: 1,  name: "Aarav Reddy",      batch: "junior", age: 10, phone: "98490 11223", joined: "2025-11-04", feesTill: "2026-07-31", status: "active" },
    { id: 2,  name: "Saanvi Kapoor",    batch: "junior", age: 11, phone: "99890 44215", joined: "2025-09-15", feesTill: "2026-06-30", status: "due" },
    { id: 3,  name: "Vihaan Rao",       batch: "elite",  age: 15, phone: "90000 87641", joined: "2025-03-02", feesTill: "2026-08-31", status: "active" },
    { id: 4,  name: "Anaya Sharma",     batch: "tiny",   age: 6,  phone: "98481 33290", joined: "2026-01-10", feesTill: "2026-07-31", status: "active" },
    { id: 5,  name: "Advik Mehta",      batch: "elite",  age: 16, phone: "96520 71148", joined: "2024-12-01", feesTill: "2026-06-30", status: "due" },
    { id: 6,  name: "Myra Iyer",        batch: "junior", age: 9,  phone: "98661 90035", joined: "2026-02-18", feesTill: "2026-08-31", status: "active" },
    { id: 7,  name: "Kabir Nair",       batch: "adult",  age: 32, phone: "99490 55876", joined: "2026-04-05", feesTill: "2026-07-31", status: "active" },
    { id: 8,  name: "Ishita Verma",     batch: "elite",  age: 14, phone: "90104 22983", joined: "2025-07-22", feesTill: "2026-07-31", status: "active" },
    { id: 9,  name: "Reyansh Gupta",    batch: "tiny",   age: 5,  phone: "98850 61147", joined: "2026-05-12", feesTill: "2026-07-31", status: "active" },
    { id: 10, name: "Diya Choudhary",   batch: "junior", age: 12, phone: "97010 38854", joined: "2025-10-08", feesTill: "2026-06-30", status: "due" },
    { id: 11, name: "Arjun Malhotra",   batch: "adult",  age: 28, phone: "96031 74412", joined: "2026-03-01", feesTill: "2026-08-31", status: "active" },
    { id: 12, name: "Navya Kulkarni",   batch: "junior", age: 10, phone: "98495 20678", joined: "2026-06-02", feesTill: "2026-07-31", status: "active" },
  ],

  payments: [
    { id: 101, player: "Navya Kulkarni",  amount: 4000,  plan: "Monthly",     on: "2026-07-01", mode: "UPI" },
    { id: 102, player: "Kabir Nair",      amount: 11400, plan: "Quarterly",   on: "2026-06-28", mode: "UPI" },
    { id: 103, player: "Aarav Reddy",     amount: 4000,  plan: "Monthly",     on: "2026-06-27", mode: "Cash" },
    { id: 104, player: "Ishita Verma",    amount: 21600, plan: "Half-yearly", on: "2026-06-20", mode: "Bank" },
    { id: 105, player: "Anaya Sharma",    amount: 4000,  plan: "Monthly",     on: "2026-06-18", mode: "UPI" },
    { id: 106, player: "Vihaan Rao",      amount: 11400, plan: "Quarterly",   on: "2026-06-11", mode: "UPI" },
    { id: 107, player: "Arjun Malhotra",  amount: 4000,  plan: "Monthly",     on: "2026-06-05", mode: "Cash" },
    { id: 108, player: "Myra Iyer",       amount: 11400, plan: "Quarterly",   on: "2026-06-02", mode: "UPI" },
  ],

  // Jan–Jun 2026 revenue for the dashboard area chart (₹ thousands)
  revenue: [
    { m: "Jan", v: 118 }, { m: "Feb", v: 132 }, { m: "Mar", v: 141 },
    { m: "Apr", v: 128 }, { m: "May", v: 156 }, { m: "Jun", v: 171 },
  ],

  activity: [
    { icon: "join",   text: "<strong>Navya Kulkarni</strong> joined Junior Development", time: "Today, 9:14 AM" },
    { icon: "pay",    text: "<strong>Kabir Nair</strong> paid ₹11,400 · Quarterly renewal", time: "Yesterday" },
    { icon: "trophy", text: "<strong>Vihaan Rao</strong> won U-16 District Qualifiers", time: "2 days ago" },
    { icon: "att",    text: "Evening batch attendance marked · <strong>21 / 24 present</strong>", time: "2 days ago" },
    { icon: "join",   text: "<strong>2 trial bookings</strong> received from the website", time: "3 days ago" },
  ],
};
