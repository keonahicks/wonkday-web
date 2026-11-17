const WonkStore = (() => {
  const KEYS = {
    items: "scheduleItems_v1",
    candidates: "scheduleCandidates_v1",
    calendar: "calendarConnection_v1",
    generator: "scheduleGenerator_v1",
  };

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const DEFAULT_ITEMS = [
    { id: "d1", name: "BIA 652: Machine Learning", type: "class", days: ["Mon", "Wed"], start: "10:00", end: "11:15" },
    { id: "d2", name: "BIA 672: Marketing Analytics", type: "class", days: ["Tue", "Thu"], start: "11:30", end: "12:45" },
    { id: "d3", name: "Work shift — Campus IT Help Desk", type: "work", days: ["Tue", "Thu"], start: "14:00", end: "17:00" },
    { id: "d4", name: "Gym with friends", type: "commitment", days: ["Fri"], start: "18:00", end: "19:00" },
  ];
  const DEFAULT_CANDIDATES = [
    { id: "c1", name: "BIA 658: Social Network Analytics", days: ["Mon", "Wed"], start: "10:30", end: "11:30" },
    { id: "c2", name: "BIA 695: Capstone Studio", days: ["Fri"], start: "09:00", end: "10:00" },
  ];
  const DEFAULT_CALENDAR = {
    connected: null,
    synced: false,
    autoUpdate: true,
    syncedClasses: [],
    stale: false,
    log: [],
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(fallback));
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }
  function fmtTime(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }
  function fmtRange(start, end) {
    return `${fmtTime(start)}–${fmtTime(end)}`;
  }
  function overlaps(a, b) {
    const sharesDay = a.days.some((d) => b.days.includes(d));
    return sharesDay && toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
  }

  return {
    DAYS,
    getItems: () => load(KEYS.items, DEFAULT_ITEMS),
    saveItems: (items) => save(KEYS.items, items),
    getCandidates: () => load(KEYS.candidates, DEFAULT_CANDIDATES),
    saveCandidates: (candidates) => save(KEYS.candidates, candidates),
    getCalendar: () => load(KEYS.calendar, DEFAULT_CALENDAR),
    saveCalendar: (calendar) => save(KEYS.calendar, calendar),
    getGenerator: (fallback) => load(KEYS.generator, fallback),
    saveGenerator: (courses) => save(KEYS.generator, courses),
    defaultCalendar: () => JSON.parse(JSON.stringify(DEFAULT_CALENDAR)),
    toMinutes,
    fmtTime,
    fmtRange,
    overlaps,
  };
})();

function showToast(message) {
  let el = document.getElementById("app-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.remove("show"), 2600);
}
