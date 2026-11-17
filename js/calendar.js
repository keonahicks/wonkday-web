(() => {
  const SAMPLE_EVENTS = [
    { name: "Study group — BIA 652", type: "commitment", days: ["Mon"], start: "13:00", end: "14:30" },
    { name: "Data Science Club", type: "commitment", days: ["Wed"], start: "17:00", end: "18:00" },
    { name: "Internship stand-up", type: "work", days: ["Fri"], start: "09:30", end: "10:00" },
    { name: "Volunteer tutoring", type: "commitment", days: ["Thu"], start: "18:00", end: "19:30" },
  ];

  const START_HOUR = 8;
  const END_HOUR = 21;
  const ROW_HEIGHT = 24;

  let items = WonkStore.getItems();
  let cal = WonkStore.getCalendar();
  let connectingTo = null;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : word.endsWith("s") ? "es" : "s"}`;

  const classes = () => items.filter((i) => i.type === "class");
  const imported = () => items.filter((i) => i.source);

  function save() {
    WonkStore.saveItems(items);
    WonkStore.saveCalendar(cal);
  }

  function addLog(text) {
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    cal.log = [{ text, time }, ...cal.log].slice(0, 6);
  }

  function snapshotClasses() {
    return classes().map((c) => ({ id: c.id, name: c.name, days: c.days, start: c.start, end: c.end }));
  }

  function classChanges() {
    const now = classes();
    const added = now.filter((c) => !cal.syncedClasses.some((s) => s.id === c.id));
    const removed = cal.syncedClasses.filter((s) => !now.some((c) => c.id === s.id));
    return { added, removed };
  }

  function pushChanges() {
    const { added, removed } = classChanges();
    added.forEach((c) => addLog(`Added ${c.name} to ${cal.connected}`));
    removed.forEach((c) => addLog(`Removed ${c.name} from ${cal.connected}`));
    cal.syncedClasses = snapshotClasses();
    cal.stale = false;
    return added.length + removed.length;
  }

  function checkForClassChanges() {
    if (!cal.connected || !cal.synced) return;
    const { added, removed } = classChanges();
    if (added.length + removed.length === 0) return;
    if (cal.autoUpdate) {
      const count = pushChanges();
      save();
      showToast(`${cal.connected} updated with ${plural(count, "class change")}`);
    } else {
      cal.stale = true;
      save();
    }
  }

  function connect(name) {
    connectingTo = name;
    render();
    setTimeout(() => {
      items = items.filter((i) => !i.source);
      SAMPLE_EVENTS.forEach((e, n) => items.push({ ...e, id: `imp_${Date.now()}_${n}`, source: name }));
      cal = { ...WonkStore.defaultCalendar(), connected: name, autoUpdate: cal.autoUpdate };
      addLog(`Imported ${plural(SAMPLE_EVENTS.length, "event")} from ${name}`);
      connectingTo = null;
      save();
      render();
      showToast(`Connected to ${name}`);
    }, 1200);
  }

  function disconnect() {
    const name = cal.connected;
    if (!confirm(`Disconnect ${name}? Events imported from it will be removed from your commitments.`)) return;
    items = items.filter((i) => !i.source);
    cal = { ...WonkStore.defaultCalendar(), autoUpdate: cal.autoUpdate };
    save();
    render();
    showToast(`Disconnected ${name}`);
  }

  function setSync(on) {
    cal.synced = on;
    cal.stale = false;
    if (on) {
      cal.syncedClasses = snapshotClasses();
      addLog(`Added ${plural(cal.syncedClasses.length, "class")} to ${cal.connected} as weekly events`);
      showToast(`Added ${plural(cal.syncedClasses.length, "class")} to ${cal.connected}`);
    } else {
      cal.syncedClasses = [];
      addLog(`Removed your classes from ${cal.connected}`);
      showToast(`Removed your classes from ${cal.connected}`);
    }
    save();
    render();
  }

  function setAutoUpdate(on) {
    cal.autoUpdate = on;
    if (on && cal.stale) {
      const count = pushChanges();
      showToast(`Caught up: ${plural(count, "change")} pushed to ${cal.connected}`);
    }
    save();
    render();
  }

  function syncNow() {
    const count = pushChanges();
    save();
    render();
    showToast(`${cal.connected} is up to date (${plural(count, "change")})`);
  }

  function renderSidePanel() {
    const panel = $("sidePanel");

    if (connectingTo) {
      panel.innerHTML = `
        <h2>Connect your calendar</h2>
        <div class="connecting"><span class="spinner" aria-hidden="true"></span>Connecting to ${esc(connectingTo)}…</div>`;
      return;
    }

    if (!cal.connected) {
      panel.innerHTML = `
        <h2>Connect your calendar</h2>
        <p class="sub">Bring in your work shifts, clubs and other events so every schedule you build is checked against them.</p>
        <button class="primary" data-connect="Google Calendar">Connect Google Calendar</button>
        <button class="primary" data-connect="Outlook Calendar">Connect Outlook Calendar</button>
        <p class="privacy">Only event times and titles are used for planning. Nothing is shared with advisors or professors.</p>`;
      panel.querySelectorAll("[data-connect]").forEach((btn) =>
        btn.addEventListener("click", () => connect(btn.dataset.connect)));
      return;
    }

    const classCount = classes().length;
    const { added, removed } = classChanges();
    const pending = added.length + removed.length;

    let status;
    if (!cal.synced) {
      status = `<div class="result info">Your classes aren't on ${esc(cal.connected)} yet.</div>`;
    } else if (cal.stale && pending > 0) {
      status = `
        <div class="result bad">⚠ ${plural(pending, "class change")} not on ${esc(cal.connected)} yet.</div>
        <button class="primary" id="syncNowBtn">Sync now</button>`;
    } else if (cal.autoUpdate) {
      status = `<div class="result ok">✓ Synced. If you add, drop or swap a class, ${esc(cal.connected)} updates on its own.</div>`;
    } else {
      status = `<div class="result ok">✓ Synced. Auto-update is off, so you'll sync later changes yourself.</div>`;
    }

    panel.innerHTML = `
      <h2>Calendar connection</h2>
      <p class="sub">Your calendar's events are part of your commitments now.</p>
      <div class="result ok">✓ Connected to <strong>${esc(cal.connected)}</strong> · ${plural(imported().length, "weekly event")} imported. They also show up as commitments on <a href="schedules.html">Saved schedules</a>.</div>
      <button class="secondary" id="disconnectBtn">Disconnect ${esc(cal.connected)}</button>

      <div class="section">
        <h2>Sync my classes</h2>
        <p class="sub">Add your ${plural(classCount, "class")} to ${esc(cal.connected)} as weekly events.</p>
        <div class="options">
          <label><input type="checkbox" id="syncToggle" ${cal.synced ? "checked" : ""}>Add my classes to ${esc(cal.connected)}</label>
          <label class="${cal.synced ? "" : "disabled"}"><input type="checkbox" id="autoToggle" ${cal.autoUpdate ? "checked" : ""} ${cal.synced ? "" : "disabled"}>Update automatically when my classes change</label>
        </div>
        ${status}
        ${cal.log.length ? `
          <p class="list-title">Recent activity</p>
          <div class="item-list">
            ${cal.log.map((l) => `
              <div class="item-row"><span><span class="tag sync">sync</span>${esc(l.text)}</span><span class="source">${esc(l.time)}</span></div>`).join("")}
          </div>` : ""}
      </div>`;

    $("disconnectBtn").addEventListener("click", disconnect);
    $("syncToggle").addEventListener("change", (e) => setSync(e.target.checked));
    $("autoToggle").addEventListener("change", (e) => setAutoUpdate(e.target.checked));
    if ($("syncNowBtn")) $("syncNowBtn").addEventListener("click", syncNow);
  }

  function renderWeek() {
    const area = $("weekArea");

    if (!cal.connected) {
      $("weekTitle").textContent = "Your week";
      $("weekSub").textContent = "Your calendar's events show up here once it's connected.";
      area.innerHTML = `<div class="empty"><strong>No calendar connected</strong>Connect Google or Outlook Calendar to see your week.</div>`;
      return;
    }

    $("weekTitle").textContent = `Your ${cal.connected} this week`;
    $("weekSub").textContent = cal.synced
      ? "Your classes and imported events, together."
      : "Imported events only. Turn on \"Add my classes\" to put your classes here too.";

    const onCalendar = [
      ...(cal.synced ? cal.syncedClasses.map((c) => ({ ...c, type: "class", synced: true })) : []),
      ...imported(),
    ];
    const clashes = new Set();
    onCalendar.forEach((a, i) => onCalendar.forEach((b, j) => {
      if (i !== j && WonkStore.overlaps(a, b)) clashes.add(a);
    }));

    area.innerHTML = `
      <div class="grid-wrap"><div class="week-grid" id="weekGrid"></div></div>
      <div class="legend">
        <span><span class="swatch" style="background:var(--class-color)"></span>Class</span>
        <span><span class="swatch" style="background:var(--work-color)"></span>Work</span>
        <span><span class="swatch" style="background:var(--commit-color)"></span>Other commitment</span>
      </div>
      <div class="item-list">
        ${onCalendar.map((it) => `
          <div class="item-row ${clashes.has(it) ? "has-conflict" : ""}">
            <span>
              <span class="tag ${it.type}">${it.type}</span>
              <strong>${esc(it.name)}</strong>
              <span class="meta">${it.days.join("/")} &middot; ${WonkStore.fmtRange(it.start, it.end)}</span>
              ${clashes.has(it) ? '<span class="warn">⚠ overlap</span>' : ""}
            </span>
            <span class="source">${it.synced ? "Synced class" : `From ${esc(it.source)}`}</span>
          </div>`).join("")}
      </div>`;

    const grid = $("weekGrid");
    const totalRows = (END_HOUR - START_HOUR) * 2;
    grid.style.gridTemplateRows = `auto repeat(${totalRows}, ${ROW_HEIGHT}px)`;

    grid.insertAdjacentHTML("beforeend", `<div class="head corner"></div>` +
      WonkStore.DAYS.map((d) => `<div class="head">${d}</div>`).join(""));

    let cells = "";
    for (let r = 0; r < totalRows; r++) {
      const minutes = r * 30;
      const hour = START_HOUR + Math.floor(minutes / 60);
      const label = minutes % 60 === 0 ? WonkStore.fmtTime(`${hour}:00`) : "";
      cells += `<div class="time-label">${label}</div>` + WonkStore.DAYS.map(() => `<div class="cell"></div>`).join("");
    }
    grid.insertAdjacentHTML("beforeend", cells);

    const headerHeight = grid.querySelector(".head").getBoundingClientRect().height || 28;
    WonkStore.DAYS.forEach((day, dayIndex) => {
      onCalendar.filter((it) => it.days.includes(day)).forEach((it) => {
        const startMin = WonkStore.toMinutes(it.start) - START_HOUR * 60;
        const endMin = WonkStore.toMinutes(it.end) - START_HOUR * 60;
        const block = document.createElement("div");
        block.className = `block ${it.type}${clashes.has(it) ? " conflict-highlight" : ""}`;
        block.style.top = `${headerHeight + (startMin / 30) * ROW_HEIGHT}px`;
        block.style.height = `${Math.max(((endMin - startMin) / 30) * ROW_HEIGHT, 20)}px`;
        block.style.left = `calc(56px + ${dayIndex} * ((100% - 56px) / 5) + 3px)`;
        block.style.width = `calc((100% - 56px) / 5 - 6px)`;
        block.title = `${it.name} · ${WonkStore.fmtRange(it.start, it.end)}`;
        block.innerHTML = `<strong>${esc(it.name)}</strong>${WonkStore.fmtRange(it.start, it.end)}`;
        grid.appendChild(block);
      });
    });
  }

  function render() {
    renderSidePanel();
    renderWeek();
  }

  checkForClassChanges();
  render();
})();
