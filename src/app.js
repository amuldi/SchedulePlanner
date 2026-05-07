const STORE = "scheduleplanner-state-v1";
const DAY = 86400000;
const now = start(new Date());
const todayISO = iso(now);

const colors = {
  lime: { bg: "#d9f7e8", text: "#12362a", line: "#41b983" },
  blue: { bg: "#e5f1ff", text: "#173a59", line: "#5f9fe8" },
  red: { bg: "#ffe7df", text: "#6d2b1c", line: "#ff795f" },
  teal: { bg: "#def7f5", text: "#143c3a", line: "#2aa5a0" },
  violet: { bg: "#efe9ff", text: "#36275f", line: "#8b6be8" },
  amber: { bg: "#fff1cc", text: "#5b3d07", line: "#d9a72f" }
};
const colorLabels = { lime: "Mint", blue: "Sky", red: "Coral", teal: "Teal", violet: "Violet", amber: "Gold" };
const typeLabel = { work: "작업", meeting: "미팅", deadline: "마감", personal: "약속", todo: "할일" };
const catLabel = { work: "Work", client: "Client", study: "Study", personal: "Personal", todo: "To do" };
const reminderLabel = { none: "없음", 10: "10분 전", 30: "30분 전", 60: "1시간 전" };
const holidays = {
  "2026-01-01": "신정", "2026-02-16": "설날", "2026-02-17": "설날", "2026-02-18": "설날",
  "2026-03-01": "3·1절", "2026-03-02": "3·1절 대체", "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날", "2026-05-25": "부처님오신날 대체", "2026-06-03": "지방선거",
  "2026-06-06": "현충일", "2026-08-15": "광복절", "2026-08-17": "광복절 대체",
  "2026-09-24": "추석", "2026-09-25": "추석", "2026-09-26": "추석",
  "2026-10-03": "개천절", "2026-10-05": "개천절 대체", "2026-10-09": "한글날",
  "2026-12-25": "크리스마스"
};
const fixed = { "01-01": "신정", "03-01": "3·1절", "05-05": "어린이날", "06-06": "현충일", "08-15": "광복절", "10-03": "개천절", "10-09": "한글날", "12-25": "크리스마스" };
const icon = {
  edit: '<svg viewBox="0 0 24 24"><path d="M5 16.6 15.9 5.7l2.4 2.4L7.4 19H5v-2.4ZM17.2 4.4l1.1-1.1a1.7 1.7 0 0 1 2.4 2.4l-1.1 1.1-2.4-2.4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.8 11H7.8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/></svg>'
};
const formatters = {
  month: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }),
  date: new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }),
  dateWeekday: new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" })
};

const $ = id => document.getElementById(id);
const els = {
  avatar: $("avatar"),
  profileName: $("profileName"),
  openProfile: $("openProfile"),
  closeProfile: $("closeProfile"),
  profileModal: $("profileModal"),
  profileForm: $("profileForm"),
  profileNameInput: $("profileNameInput"),
  profileAvatarInput: $("profileAvatarInput"),
  profileAvatarName: $("profileAvatarName"),
  clearAvatar: $("clearAvatar"),
  searchInput: $("searchInput"),
  clearSearch: $("clearSearch"),
  exportBtn: $("exportBtn"),
  importBtn: $("importBtn"),
  importFile: $("importFile"),
  notificationBtn: $("notificationBtn"),
  notificationStatus: $("notificationStatus"),
  calendarTitle: $("calendarTitle"),
  calendar: $("calendar"),
  holidayStrip: $("holidayStrip"),
  prevMonth: $("prevMonth"),
  nextMonth: $("nextMonth"),
  todayBtn: $("todayBtn"),
  selectedLabel: $("selectedLabel"),
  agendaTitle: $("agendaTitle"),
  agendaTodayBadge: $("agendaTodayBadge"),
  agendaList: $("agendaList"),
  eventForm: $("eventForm"),
  eventId: $("eventId"),
  eventDate: $("eventDate"),
  eventEndDate: $("eventEndDate"),
  eventTime: $("eventTime"),
  eventEndTime: $("eventEndTime"),
  eventReminder: $("eventReminder"),
  eventTitle: $("eventTitle"),
  eventSubmit: $("eventSubmit"),
  projectList: $("projectList"),
  projectForm: $("projectForm"),
  projectId: $("projectId"),
  projectName: $("projectName"),
  projectStart: $("projectStart"),
  projectEnd: $("projectEnd"),
  projectCategory: $("projectCategory"),
  projectColor: $("projectColor"),
  projectSubmit: $("projectSubmit"),
  toast: $("toast")
};

let state = load();
let notificationTimers = [];
let serviceWorkerReady = null;

function defaults() {
  return {
    profile: { name: "SchedulePlanner", bio: "일정과 프로젝트를 한 화면에서 정리하세요", avatar: "" },
    viewYear: now.getFullYear(),
    viewMonth: now.getMonth(),
    selected: todayISO,
    calFilter: "all",
    projectFilter: "all",
    search: "",
    notified: {},
    projects: [],
    events: []
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!saved) return defaults();
    const base = defaults();
    return {
      ...base,
      ...saved,
      profile: { ...base.profile, ...(saved.profile || {}) },
      notified: saved.notified && typeof saved.notified === "object" ? saved.notified : {},
      projects: Array.isArray(saved.projects) ? saved.projects.map(normalizeProject).filter(Boolean) : [],
      events: Array.isArray(saved.events) ? saved.events.map(normalizeEvent).filter(Boolean) : []
    };
  } catch {
    return defaults();
  }
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
    return true;
  } catch {
    toast("저장 공간이 부족합니다", "error");
    return false;
  }
}

function id() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function start(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function parse(v) { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d); }
function add(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function days(a, b) { return Math.round((parse(b) - parse(a)) / DAY); }
function between(v, a, b) { return v >= a && v <= b; }
function esc(v) { return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function validDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")); }
function validTime(v) { return /^\d{2}:\d{2}$/.test(String(v || "")); }
function format(v, weekday = true) { return (weekday ? formatters.dateWeekday : formatters.date).format(parse(v)); }
function holiday(v) { return holidays[v] || fixed[v.slice(5)] || ""; }
function eventEnd(e) { return e.endDate || e.date; }
function eventFinishTime(e) { return e.endTime || e.time; }
function timeRange(e) { const end = eventFinishTime(e); return end && end !== e.time ? `${e.time} - ${end}` : e.time; }
function eventRange(e) { const end = eventEnd(e); return end && end !== e.date ? ` · ${format(e.date, false)} - ${format(end, false)}` : ""; }
function status(p) { if (p.status === "done") return "done"; if (todayISO < p.start) return "upcoming"; if (todayISO > p.end) return "overdue"; return "active"; }
function statusText(s) { return ({ active: "진행", upcoming: "예정", overdue: "지연", done: "완료" })[s] || "진행"; }
function progress(p) {
  const total = Math.max(1, days(p.start, p.end) + 1);
  if (p.status === "done") return 100;
  if (todayISO < p.start) return 0;
  if (todayISO > p.end) return 100;
  return Math.min(100, Math.max(0, Math.round(((days(p.start, todayISO) + 1) / total) * 100)));
}
function normalizeReminder(value) {
  const key = String(value || "none");
  return Object.prototype.hasOwnProperty.call(reminderLabel, key) ? key : "none";
}

function normalizeEvent(event) {
  if (!event || typeof event !== "object") return null;
  const date = validDate(event.date) ? event.date : todayISO;
  const endDate = validDate(event.endDate || event.date) && (event.endDate || event.date) >= date ? (event.endDate || event.date) : date;
  const time = validTime(event.time) ? event.time : "09:00";
  const endTime = validTime(event.endTime) ? event.endTime : time;
  return {
    id: event.id || id(),
    date,
    endDate,
    time,
    endTime,
    type: typeLabel[event.type] ? event.type : "work",
    reminder: normalizeReminder(event.reminder),
    title: String(event.title || "").trim() || "제목 없음",
    done: Boolean(event.done)
  };
}
function normalizeProject(project) {
  if (!project || typeof project !== "object") return null;
  const startDate = validDate(project.start) ? project.start : todayISO;
  const endDate = validDate(project.end) && project.end >= startDate ? project.end : startDate;
  const category = catLabel[project.category] ? project.category : "work";
  const color = colors[project.color] ? project.color : "lime";
  return {
    id: project.id || id(),
    name: String(project.name || "").trim() || "새 프로젝트",
    start: startDate,
    end: endDate,
    category,
    color,
    status: project.status === "done" ? "done" : "active"
  };
}
function searchText() { return state.search.trim().toLowerCase(); }
function match(text) {
  const q = searchText();
  return !q || String(text).toLowerCase().includes(q);
}
function matchEvent(e) {
  return match(`${e.title} ${e.type} ${typeLabel[e.type]} ${e.time} ${eventFinishTime(e)} ${eventEnd(e)} ${reminderLabel[e.reminder] || ""}`);
}
function matchProject(p) {
  return match(`${p.name} ${p.category} ${catLabel[p.category]} ${statusText(status(p))}`);
}
function compareEvents(a, b) {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title);
}
function filteredEvents() {
  return state.events.filter(matchEvent).sort(compareEvents);
}
function eventsForDate(date, source = filteredEvents()) {
  return source.filter(e => between(date, e.date, eventEnd(e))).sort(compareEvents);
}
function projects(forCalendar = false) {
  const f = forCalendar ? state.calFilter : state.projectFilter;
  return state.projects.filter(p => {
    if (!matchProject(p)) return false;
    const s = status(p);
    if (f === "all") return true;
    if (f === "active") return s === "active" || s === "overdue";
    return s === f;
  }).sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name));
}

function render() {
  renderProfile();
  renderControls();
  renderCalendar();
  renderAgenda();
  renderProjects();
  syncForms();
  renderNotificationButton();
  scheduleNotifications();
}

function renderProfile() {
  const name = state.profile.name || "SchedulePlanner";
  els.profileName.textContent = name;
  els.avatar.classList.toggle("has-image", Boolean(state.profile.avatar));
  els.avatar.innerHTML = state.profile.avatar ? `<img src="${state.profile.avatar}" alt="">` : '<span class="profile-glyph" aria-hidden="true"></span>';
}
function renderControls() {
  els.searchInput.value = state.search || "";
  els.clearSearch.hidden = !state.search;
  document.querySelectorAll("[data-cal-filter]").forEach(b => b.classList.toggle("active", b.dataset.calFilter === state.calFilter));
  document.querySelectorAll("[data-project-filter]").forEach(b => b.classList.toggle("active", b.dataset.projectFilter === state.projectFilter));
}
function renderCalendar() {
  const y = state.viewYear;
  const m = state.viewMonth;
  const first = new Date(y, m, 1);
  const startDate = add(first, -first.getDay());
  const label = formatters.month.format(first);
  const visibleProjects = projects(true);
  const visibleEvents = filteredEvents();
  els.calendarTitle.textContent = label;
  els.calendar.innerHTML = Array.from({ length: 42 }, (_, i) => {
    const d = add(startDate, i);
    const v = iso(d);
    const h = holiday(v);
    const dayProjects = visibleProjects.filter(p => between(v, p.start, p.end));
    const dayEvents = eventsForDate(v, visibleEvents);
    const moreCount = Math.max(0, dayProjects.length - 3) + Math.max(0, dayEvents.length - 2);
    const cls = ["day", d.getMonth() !== m ? "outside" : "", v === todayISO ? "today" : "", v === state.selected ? "selected" : "", d.getDay() === 0 ? "sunday" : "", h ? "holiday" : ""].filter(Boolean).join(" ");
    return `<div class="${cls}" role="button" tabindex="0" aria-pressed="${v === state.selected}" data-date="${v}" aria-label="${esc(format(v))}${h ? ` ${esc(h)}` : ""}">
      <span class="day-top"><span class="num">${d.getDate()}</span><span class="meta">${esc(h)}</span></span>
      ${dayEvents.slice(0, 2).map(eventChip).join("")}
      <span class="bars">${dayProjects.slice(0, 3).map(p => bar(p, v, d)).join("")}${moreCount ? `<span class="more">+${moreCount}</span>` : ""}</span>
    </div>`;
  }).join("");
  const monthHolidays = Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => {
    const v = iso(new Date(y, m, i + 1));
    const h = holiday(v);
    return h ? `${i + 1}일 ${h}` : "";
  }).filter(Boolean);
  els.holidayStrip.textContent = monthHolidays.length ? monthHolidays.join(" · ") : "공휴일 없음";
}
function eventChip(e) {
  const bell = e.reminder !== "none" ? `<span class="chip-bell" aria-hidden="true">•</span>` : "";
  return `<span class="event-chip" draggable="true" data-event-chip="${e.id}" title="${esc(timeRange(e))} ${esc(e.title)}">${bell}${esc(e.title)}</span>`;
}
function bar(p, v, d) {
  const c = colors[p.color] || colors.lime;
  const starts = v === p.start || d.getDay() === 0 || d.getDate() === 1;
  const ends = v === p.end || d.getDay() === 6 || d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const edge = starts && ends ? "" : starts ? "start" : ends ? "end" : "mid";
  return `<span class="bar ${edge}" title="${esc(p.name)}" style="--bar-bg:${c.bg};--bar-text:${c.text}">${starts ? esc(p.name) : ""}</span>`;
}
function renderAgenda() {
  const v = state.selected || todayISO;
  const isToday = v === todayISO;
  const events = eventsForDate(v);
  els.selectedLabel.textContent = isToday ? "오늘" : format(v);
  els.agendaTitle.textContent = format(v, false);
  els.agendaTodayBadge.hidden = !isToday;
  els.agendaList.classList.toggle("is-searching", Boolean(searchText()));
  if (!events.length) {
    const title = searchText() ? "검색 결과 없음" : "등록된 일정 없음";
    const detail = searchText() ? "검색어와 날짜 조건에 맞는 일정이 없습니다" : "선택한 날짜에 바로 일정을 추가할 수 있습니다";
    els.agendaList.innerHTML = `<div class="empty empty-rich"><strong>${title}</strong><span>${detail}</span></div>`;
    return;
  }
  els.agendaList.innerHTML = events.map(e => {
    const reminder = e.reminder !== "none" ? ` · ${reminderLabel[e.reminder]} 알림` : "";
    return `<article class="item event-item ${e.done ? "done" : ""}">
      <div class="item-main">
        <div class="copy">
          <strong class="title">${esc(e.title)}</strong>
          <span class="sub">${esc(timeRange(e))}${eventRange(e)}${reminder}</span>
        </div>
        <div class="actions">
          <button class="status-btn ${e.done ? "status-done" : "status-active"}" type="button" data-toggle-event="${e.id}">${e.done ? "완료" : "진행"}</button>
          <button class="row-btn" type="button" aria-label="수정" data-edit-event="${e.id}">${icon.edit}</button>
          <button class="row-btn danger" type="button" aria-label="삭제" data-delete-event="${e.id}">${icon.trash}</button>
        </div>
      </div>
    </article>`;
  }).join("");
}
function renderProjects() {
  const ps = projects(false);
  if (!ps.length) {
    const title = searchText() ? "검색 결과 없음" : "등록된 프로젝트 없음";
    const detail = searchText() ? "검색어와 필터에 맞는 프로젝트가 없습니다" : "기간과 색상을 지정해 캘린더에 표시할 수 있습니다";
    els.projectList.innerHTML = `<div class="empty empty-rich"><strong>${title}</strong><span>${detail}</span></div>`;
    return;
  }
  els.projectList.innerHTML = ps.map(p => {
    const s = status(p);
    const c = colors[p.color] || colors.lime;
    const prog = progress(p);
    return `<article class="item project-item ${s === "done" ? "done" : ""}" style="--project-color:${c.line}">
      <div class="item-main">
        <div class="copy">
          <strong class="title">${esc(p.name)}</strong>
          <span class="sub">${catLabel[p.category] || p.category} · ${format(p.start, false)} - ${format(p.end, false)} · ${days(p.start, p.end) + 1}일</span>
        </div>
        <div class="actions">
          <button class="status-btn status-${s}" type="button" data-toggle-project="${p.id}">${statusText(s)}</button>
          <button class="row-btn" type="button" aria-label="수정" data-edit-project="${p.id}">${icon.edit}</button>
          <button class="row-btn danger" type="button" aria-label="삭제" data-delete-project="${p.id}">${icon.trash}</button>
        </div>
      </div>
      <div class="progress"><span style="--progress:${prog}%;--progress-color:${c.line}"></span></div>
    </article>`;
  }).join("");
}

function syncEventBounds() {
  els.eventEndDate.min = els.eventDate.value || todayISO;
  if (!els.eventEndDate.value || els.eventEndDate.value < els.eventEndDate.min) els.eventEndDate.value = els.eventEndDate.min;
  if (!els.eventEndTime.value) els.eventEndTime.value = els.eventTime.value || "09:00";
  if (els.eventEndDate.value === els.eventDate.value && els.eventEndTime.value < els.eventTime.value) els.eventEndTime.value = els.eventTime.value;
}
function syncForms() {
  const selected = state.selected || todayISO;
  const eventDraft = Boolean(els.eventId.value || els.eventTitle.value.trim());
  if (!eventDraft) {
    els.eventDate.value = selected;
    els.eventEndDate.value = selected;
    els.eventReminder.value = "none";
  }
  syncEventBounds();
  if (!els.projectId.value && !els.projectName.value.trim()) {
    els.projectStart.value = selected;
    els.projectEnd.value = selected;
  }
}
function syncColorPicker(value = "lime") {
  const key = colors[value] ? value : "lime";
  const button = $("colorButton");
  const label = $("colorLabel");
  const swatch = $("colorButtonSwatch");
  els.projectColor.value = key;
  if (label) label.textContent = colorLabels[key] || key;
  if (swatch) swatch.style.setProperty("--swatch", colors[key].line);
  document.querySelectorAll("[data-color-option]").forEach(option => {
    const active = option.dataset.colorOption === key;
    option.classList.toggle("active", active);
    option.setAttribute("aria-selected", String(active));
  });
  if (button) button.setAttribute("aria-label", `색상 ${colorLabels[key] || key}`);
}
function setColorMenu(open) {
  const picker = $("colorPicker");
  const button = $("colorButton");
  if (!picker || !button) return;
  picker.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
}
function setPlannerView(view = "agenda") {
  document.querySelectorAll("[data-planner-view]").forEach(button => {
    const active = button.dataset.plannerView === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-view-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });
}
function toast(msg, tone = "success") {
  els.toast.textContent = msg;
  els.toast.classList.toggle("is-error", tone === "error");
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function selectDate(value) {
  const d = parse(value);
  state.selected = value;
  state.viewYear = d.getFullYear();
  state.viewMonth = d.getMonth();
  save();
  render();
}
function editEvent(eventId) {
  const event = state.events.find(item => item.id === eventId);
  if (!event) return;
  setPlannerView("agenda");
  els.eventId.value = event.id;
  els.eventDate.value = event.date;
  els.eventEndDate.value = eventEnd(event);
  els.eventTime.value = event.time;
  els.eventEndTime.value = eventFinishTime(event);
  els.eventReminder.value = event.reminder;
  els.eventTitle.value = event.title;
  els.eventSubmit.textContent = "수정";
  syncEventBounds();
  els.eventTitle.focus();
}
function resetEventForm(date = state.selected || todayISO) {
  els.eventId.value = "";
  els.eventDate.value = date;
  els.eventEndDate.value = date;
  els.eventTime.value = "09:00";
  els.eventEndTime.value = "10:00";
  els.eventReminder.value = "none";
  els.eventTitle.value = "";
  els.eventSubmit.textContent = "+ 일정 추가";
  syncEventBounds();
}
function deleteEvent(eventId) {
  if (!confirm("이 일정을 삭제할까요?")) return;
  state.events = state.events.filter(e => e.id !== eventId);
  removeNotificationHistory(eventId);
  save();
  render();
  toast("일정을 삭제했습니다");
}
function toggleEvent(eventId) {
  state.events = state.events.map(e => e.id === eventId ? { ...e, done: !e.done } : e);
  save();
  render();
}
function moveEvent(eventId, targetDate) {
  const event = state.events.find(item => item.id === eventId);
  if (!event || event.date === targetDate) return;
  const span = Math.max(0, days(event.date, eventEnd(event)));
  state.events = state.events.map(item => item.id === eventId ? { ...item, date: targetDate, endDate: iso(add(parse(targetDate), span)) } : item);
  removeNotificationHistory(eventId);
  selectDate(targetDate);
  toast("일정을 이동했습니다");
}
function editProject(projectId) {
  const project = state.projects.find(item => item.id === projectId);
  if (!project) return;
  setPlannerView("projects");
  els.projectId.value = project.id;
  els.projectName.value = project.name;
  els.projectStart.value = project.start;
  els.projectEnd.value = project.end;
  els.projectCategory.value = project.category;
  syncColorPicker(project.color);
  els.projectSubmit.textContent = "수정";
  els.projectName.focus();
}
function deleteProject(projectId) {
  if (!confirm("이 프로젝트를 삭제할까요?")) return;
  state.projects = state.projects.filter(p => p.id !== projectId);
  save();
  render();
  toast("프로젝트를 삭제했습니다");
}
function toggleProject(projectId) {
  state.projects = state.projects.map(p => p.id === projectId ? { ...p, status: p.status === "done" ? "active" : "done" } : p);
  save();
  render();
}

function notificationSupported() {
  return "Notification" in window;
}
function currentPermission() {
  return notificationSupported() ? Notification.permission : "unsupported";
}
function renderNotificationButton() {
  const copy = {
    granted: "알림 켜짐",
    denied: "알림 차단",
    default: "알림 허용",
    unsupported: "알림 미지원"
  }[currentPermission()] || "알림 허용";
  els.notificationStatus.textContent = copy;
  els.notificationBtn.disabled = currentPermission() === "unsupported";
}
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return null;
  if (!serviceWorkerReady) {
    serviceWorkerReady = navigator.serviceWorker.register("./sw.js").then(() => navigator.serviceWorker.ready).catch(() => null);
  }
  return serviceWorkerReady;
}
async function requestNotifications() {
  const permission = currentPermission();
  if (permission === "unsupported") {
    toast("이 브라우저는 웹 알림을 지원하지 않습니다", "error");
    renderNotificationButton();
    return;
  }
  if (permission === "denied") {
    toast("브라우저 설정에서 알림 차단을 해제해야 합니다", "error");
    renderNotificationButton();
    return;
  }
  const result = permission === "granted" ? "granted" : await Notification.requestPermission();
  await registerServiceWorker();
  renderNotificationButton();
  scheduleNotifications();
  toast(result === "granted" ? "알림을 사용할 수 있습니다" : "알림 권한이 필요합니다", result === "granted" ? "success" : "error");
}
function eventStartMs(event) {
  return new Date(`${event.date}T${event.time}:00`).getTime();
}
function eventReminderMs(event) {
  if (event.reminder === "none") return null;
  return eventStartMs(event) - Number(event.reminder) * 60000;
}
function notificationKey(event) {
  return `${event.id}:${event.date}:${event.time}:${event.reminder}`;
}
function clearNotificationTimers() {
  notificationTimers.forEach(timer => clearTimeout(timer));
  notificationTimers = [];
}
function removeNotificationHistory(eventId) {
  Object.keys(state.notified || {}).forEach(key => {
    if (key.startsWith(`${eventId}:`)) delete state.notified[key];
  });
}
function cleanupNotificationHistory() {
  const valid = new Set(state.events.map(notificationKey));
  let changed = false;
  Object.keys(state.notified || {}).forEach(key => {
    if (!valid.has(key) || Date.now() - state.notified[key] > DAY * 45) {
      delete state.notified[key];
      changed = true;
    }
  });
  if (changed) save();
}
function scheduleNotifications() {
  clearNotificationTimers();
  cleanupNotificationHistory();
  if (currentPermission() !== "granted") return;
  const nowMs = Date.now();
  state.events.forEach(event => {
    const trigger = eventReminderMs(event);
    const key = notificationKey(event);
    if (!trigger || event.done || state.notified[key]) return;
    const delay = trigger - nowMs;
    if (delay <= 0) return;
    notificationTimers.push(setTimeout(() => {
      const current = state.events.find(item => item.id === event.id);
      const nextTrigger = current ? eventReminderMs(current) : null;
      if (nextTrigger && nextTrigger > Date.now()) {
        scheduleNotifications();
        return;
      }
      showEventNotification(event.id, key);
    }, Math.min(delay, 2147483647)));
  });
}
async function showEventNotification(eventId, key) {
  const event = state.events.find(item => item.id === eventId);
  if (!event || event.done || notificationKey(event) !== key || currentPermission() !== "granted") return;
  state.notified[key] = Date.now();
  save();
  const options = {
    body: `${format(event.date, false)} ${timeRange(event)} · ${reminderLabel[event.reminder]}`,
    tag: key,
    icon: "./assets/icons/icon-192-blue.png",
    data: { date: event.date, url: location.href }
  };
  try {
    const registration = await registerServiceWorker();
    if (registration?.showNotification) await registration.showNotification(event.title, options);
    else new Notification(event.title, options);
  } catch {
    try { new Notification(event.title, options); } catch {}
  }
}

els.prevMonth.onclick = () => {
  const d = new Date(state.viewYear, state.viewMonth - 1, 1);
  state.viewYear = d.getFullYear();
  state.viewMonth = d.getMonth();
  save();
  render();
};
els.nextMonth.onclick = () => {
  const d = new Date(state.viewYear, state.viewMonth + 1, 1);
  state.viewYear = d.getFullYear();
  state.viewMonth = d.getMonth();
  save();
  render();
};
els.todayBtn.onclick = () => selectDate(todayISO);
els.searchInput.oninput = e => {
  state.search = e.target.value;
  save();
  renderCalendar();
  renderAgenda();
  renderProjects();
  renderControls();
};
els.clearSearch.onclick = () => {
  state.search = "";
  save();
  render();
  els.searchInput.focus();
};
els.notificationBtn.onclick = requestNotifications;

[els.eventDate, els.eventEndDate, els.eventTime, els.eventEndTime].forEach(input => input.addEventListener("change", syncEventBounds));
document.querySelectorAll("input[placeholder]").forEach(input => {
  const placeholder = input.placeholder;
  input.addEventListener("focus", () => { input.placeholder = ""; });
  input.addEventListener("blur", () => { if (!input.value.trim()) input.placeholder = placeholder; });
});
document.querySelectorAll("[data-cal-filter]").forEach(b => b.onclick = () => {
  state.calFilter = b.dataset.calFilter;
  save();
  renderCalendar();
  renderControls();
});
document.querySelectorAll("[data-project-filter]").forEach(b => b.onclick = () => {
  state.projectFilter = b.dataset.projectFilter;
  save();
  renderProjects();
  renderControls();
});
document.querySelectorAll("[data-planner-view]").forEach(b => b.onclick = () => setPlannerView(b.dataset.plannerView));

els.calendar.addEventListener("click", e => {
  const day = e.target.closest("[data-date]");
  if (!day || e.target.closest("[data-event-chip]")) return;
  selectDate(day.dataset.date);
});
els.calendar.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const day = e.target.closest("[data-date]");
  if (!day) return;
  e.preventDefault();
  selectDate(day.dataset.date);
});
els.calendar.addEventListener("dragstart", e => {
  const chip = e.target.closest("[data-event-chip]");
  if (!chip) return;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", chip.dataset.eventChip);
  chip.classList.add("dragging");
});
els.calendar.addEventListener("dragend", e => {
  const chip = e.target.closest("[data-event-chip]");
  if (chip) chip.classList.remove("dragging");
  els.calendar.querySelectorAll(".drop-target").forEach(day => day.classList.remove("drop-target"));
});
els.calendar.addEventListener("dragover", e => {
  const day = e.target.closest("[data-date]");
  if (!day) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  day.classList.add("drop-target");
});
els.calendar.addEventListener("dragleave", e => {
  const day = e.target.closest("[data-date]");
  if (day && !day.contains(e.relatedTarget)) day.classList.remove("drop-target");
});
els.calendar.addEventListener("drop", e => {
  const day = e.target.closest("[data-date]");
  if (!day) return;
  e.preventDefault();
  const eventId = e.dataTransfer.getData("text/plain");
  day.classList.remove("drop-target");
  moveEvent(eventId, day.dataset.date);
});

els.agendaList.addEventListener("click", e => {
  const toggle = e.target.closest("[data-toggle-event]");
  const edit = e.target.closest("[data-edit-event]");
  const del = e.target.closest("[data-delete-event]");
  if (toggle) toggleEvent(toggle.dataset.toggleEvent);
  if (edit) editEvent(edit.dataset.editEvent);
  if (del) deleteEvent(del.dataset.deleteEvent);
});
els.projectList.addEventListener("click", e => {
  const toggle = e.target.closest("[data-toggle-project]");
  const edit = e.target.closest("[data-edit-project]");
  const del = e.target.closest("[data-delete-project]");
  if (toggle) toggleProject(toggle.dataset.toggleProject);
  if (edit) editProject(edit.dataset.editProject);
  if (del) deleteProject(del.dataset.deleteProject);
});

const colorButtonEl = $("colorButton");
if (colorButtonEl) {
  colorButtonEl.onclick = e => {
    e.stopPropagation();
    const picker = $("colorPicker");
    setColorMenu(!picker?.classList.contains("open"));
  };
  document.querySelectorAll("[data-color-option]").forEach(option => {
    option.onclick = e => {
      e.stopPropagation();
      syncColorPicker(option.dataset.colorOption);
      setColorMenu(false);
    };
  });
  document.addEventListener("click", e => {
    const picker = $("colorPicker");
    if (picker && !picker.contains(e.target)) setColorMenu(false);
  });
}

els.eventForm.onsubmit = e => {
  e.preventDefault();
  const payload = normalizeEvent({
    id: els.eventId.value || id(),
    date: els.eventDate.value,
    endDate: els.eventEndDate.value || els.eventDate.value,
    time: els.eventTime.value,
    endTime: els.eventEndTime.value || els.eventTime.value,
    type: "work",
    reminder: els.eventReminder.value,
    title: els.eventTitle.value.trim()
  });
  if (!payload.title || payload.title === "제목 없음") return;
  if (payload.endDate < payload.date) { toast("종료일을 시작일 이후로 선택하세요", "error"); return; }
  if (payload.endDate === payload.date && payload.endTime < payload.time) { toast("종료 시간을 시작 시간 이후로 선택하세요", "error"); return; }
  const editing = Boolean(els.eventId.value);
  if (editing) {
    state.events = state.events.map(item => item.id === els.eventId.value ? { ...item, ...payload, id: item.id, done: item.done } : item);
    removeNotificationHistory(els.eventId.value);
  } else {
    state.events.push({ ...payload, done: false });
  }
  const d = parse(payload.date);
  state.selected = payload.date;
  state.viewYear = d.getFullYear();
  state.viewMonth = d.getMonth();
  resetEventForm(payload.date);
  save();
  render();
  toast(editing ? "일정을 수정했습니다" : "일정을 추가했습니다");
};
els.projectForm.onsubmit = e => {
  e.preventDefault();
  const payload = normalizeProject({
    id: els.projectId.value || id(),
    name: els.projectName.value.trim(),
    start: els.projectStart.value,
    end: els.projectEnd.value,
    category: els.projectCategory.value,
    color: els.projectColor.value
  });
  if (!payload.name || payload.name === "새 프로젝트") return;
  if (payload.end < payload.start) { toast("종료일을 시작일 이후로 선택하세요", "error"); return; }
  const editing = Boolean(els.projectId.value);
  if (editing) state.projects = state.projects.map(item => item.id === els.projectId.value ? { ...item, ...payload, id: item.id, status: item.status } : item);
  else state.projects.push({ ...payload, status: "active" });
  const d = parse(payload.start);
  state.selected = payload.start;
  state.viewYear = d.getFullYear();
  state.viewMonth = d.getMonth();
  els.projectId.value = "";
  els.projectName.value = "";
  els.projectSubmit.textContent = "추가";
  save();
  render();
  toast(editing ? "프로젝트를 수정했습니다" : "프로젝트를 추가했습니다");
};

els.openProfile.onclick = () => {
  els.profileNameInput.value = state.profile.name || "";
  els.profileAvatarName.textContent = state.profile.avatar ? "등록된 사진" : "선택된 파일 없음";
  els.profileModal.classList.add("open");
  els.profileModal.setAttribute("aria-hidden", "false");
  els.profileNameInput.focus();
};
els.closeProfile.onclick = () => {
  els.profileModal.classList.remove("open");
  els.profileModal.setAttribute("aria-hidden", "true");
};
els.profileModal.onclick = e => { if (e.target === els.profileModal) els.closeProfile.click(); };
els.profileForm.onsubmit = e => {
  e.preventDefault();
  state.profile.name = els.profileNameInput.value.trim() || "SchedulePlanner";
  save();
  renderProfile();
  els.closeProfile.click();
  toast("프로필을 저장했습니다");
};
els.profileAvatarInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  els.profileAvatarName.textContent = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    state.profile.avatar = String(reader.result);
    save();
    renderProfile();
    toast("사진을 적용했습니다");
  };
  reader.readAsDataURL(file);
};
els.clearAvatar.onclick = () => {
  state.profile.avatar = "";
  els.profileAvatarInput.value = "";
  els.profileAvatarName.textContent = "선택된 파일 없음";
  save();
  renderProfile();
  toast("사진을 삭제했습니다");
};
els.exportBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scheduleplanner-${todayISO}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("데이터를 내보냈습니다");
};
els.importBtn.onclick = () => els.importFile.click();
els.importFile.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data.projects) || !Array.isArray(data.events)) throw new Error();
      const base = defaults();
      state = {
        ...base,
        ...data,
        profile: { ...base.profile, ...(data.profile || {}) },
        notified: data.notified && typeof data.notified === "object" ? data.notified : {},
        projects: data.projects.map(normalizeProject).filter(Boolean),
        events: data.events.map(normalizeEvent).filter(Boolean)
      };
      save();
      render();
      toast("데이터를 가져왔습니다");
    } catch {
      toast("가져올 수 없는 파일입니다", "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
};

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  setColorMenu(false);
  if (els.profileModal.classList.contains("open")) els.closeProfile.click();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleNotifications();
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", e => {
    if (e.data?.type === "OPEN_DATE" && validDate(e.data.date)) selectDate(e.data.date);
  });
}

syncColorPicker(els.projectColor.value || "lime");
registerServiceWorker().then(() => {
  renderNotificationButton();
  scheduleNotifications();
});
render();
