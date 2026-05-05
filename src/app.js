const STORE = "scheduleplanner-state-v1";
const DAY = 86400000;
const now = start(new Date());
const todayISO = iso(now);
const colors = {
  lime: { bg: "#fffffb", text: "#132434", line: "#f4ead0" },
  blue: { bg: "#eaf6fd", text: "#183a55", line: "#82b7dc" },
  red: { bg: "#3f8fbd", text: "#fffffb", line: "#3f8fbd" },
  teal: { bg: "#c9e6f5", text: "#183a55", line: "#82b7dc" },
  violet: { bg: "#f4ead0", text: "#33414b", line: "#f4ead0" },
  amber: { bg: "#f3e5bf", text: "#34434f", line: "#f3e5bf" }
};
const colorLabels = { lime: "Ivory", blue: "Sky", red: "Ocean", teal: "Ice", violet: "Mist", amber: "Warm Ivory" };
const typeLabel = { work: "작업", meeting: "미팅", deadline: "마감", personal: "약속", todo: "할일" };
const catLabel = { work: "Work", client: "Client", study: "Study", personal: "Personal", todo: "To do" };
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
let state = load();

function defaults() {
  return { profile: { name: "SchedulePlanner", bio: "일정과 프로젝트를 한 화면에서 정리하세요", avatar: "" }, viewYear: now.getFullYear(), viewMonth: now.getMonth(), selected: todayISO, calFilter: "all", projectFilter: "all", search: "", projects: [], events: [] };
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    return saved ? { ...defaults(), ...saved, profile: { ...defaults().profile, ...(saved.profile || {}) }, projects: Array.isArray(saved.projects) ? saved.projects : [], events: Array.isArray(saved.events) ? saved.events : [] } : defaults();
  } catch { return defaults(); }
}
function save() { localStorage.setItem(STORE, JSON.stringify(state)); }
function id() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function start(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function iso(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parse(v) { const [y,m,d] = v.split("-").map(Number); return new Date(y, m - 1, d); }
function add(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function days(a, b) { return Math.round((parse(b) - parse(a)) / DAY); }
function between(v, a, b) { return v >= a && v <= b; }
function esc(v) { return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function format(v, weekday = true) { return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: weekday ? "short" : undefined }).format(parse(v)); }
function holiday(v) { return holidays[v] || fixed[v.slice(5)] || ""; }
function eventEnd(e) { return e.endDate || e.date; }
function eventRange(e) { const end = eventEnd(e); return end && end !== e.date ? " · " + format(e.date, false) + " - " + format(end, false) : ""; }
function status(p) { if (p.status === "done") return "done"; if (todayISO < p.start) return "upcoming"; if (todayISO > p.end) return "overdue"; return "active"; }
function statusText(s) { return ({ active: "진행", upcoming: "예정", overdue: "지연", done: "완료" })[s] || "진행"; }
function progress(p) { const total = Math.max(1, days(p.start, p.end) + 1); if (p.status === "done") return 100; if (todayISO < p.start) return 0; if (todayISO > p.end) return 100; return Math.min(100, Math.max(0, Math.round(((days(p.start, todayISO) + 1) / total) * 100))); }
function match(text) { const q = state.search.trim().toLowerCase(); return !q || text.toLowerCase().includes(q); }
function projects(forCalendar = false) {
  const f = forCalendar ? state.calFilter : state.projectFilter;
  return state.projects.filter(p => {
    if (!match(`${p.name} ${p.category}`)) return false;
    const s = status(p);
    if (f === "all") return true;
    if (f === "active") return s === "active" || s === "overdue";
    return s === f;
  }).sort((a,b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name));
}
function events(date) { return state.events.filter(e => between(date, e.date, eventEnd(e)) && match(`${e.title} ${e.type} ${eventEnd(e)}`)).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title)); }

function render() {
  renderProfile(); renderStats(); renderCalendar(); renderAgenda(); renderProjects(); syncForms();
}
function renderProfile() {
  const name = state.profile.name || "SchedulePlanner";
  const avatar = document.getElementById("avatar");
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileBio").textContent = state.profile.bio || "일정과 프로젝트를 한 화면에서 정리하세요";
  avatar.classList.toggle("has-image", Boolean(state.profile.avatar));
  avatar.innerHTML = state.profile.avatar ? `<img src="${state.profile.avatar}" alt="">` : '<span class="profile-glyph" aria-hidden="true"></span>';
}
function renderStats() {
  const active = state.projects.filter(p => ["active", "overdue"].includes(status(p)));
  const todayEvents = state.events.filter(e => between(todayISO, e.date, eventEnd(e)) && !e.done);
  const due = state.projects.filter(p => p.status !== "done" && days(todayISO, p.end) >= 0 && days(todayISO, p.end) <= 7);
  document.getElementById("activeStat").textContent = active.length;
  document.getElementById("todayStat").textContent = todayEvents.length;
  document.getElementById("dueStat").textContent = due.length;
  document.getElementById("activeNote").textContent = active.length ? "움직이는 중" : "대기 중";
  document.getElementById("todayNote").textContent = todayEvents.length ? `${todayEvents.length}개 남음` : "비어 있음";
  document.getElementById("dueNote").textContent = due.length ? "확인 필요" : "여유 있음";
  const weekStart = add(now, -now.getDay());
  const loads = Array.from({ length: 7 }, (_, i) => {
    const d = iso(add(weekStart, i));
    return state.events.filter(e => between(d, e.date, eventEnd(e)) && !e.done).length + state.projects.filter(p => p.status !== "done" && between(d, p.start, p.end)).length;
  });
  const max = Math.max(1, ...loads);
  document.getElementById("rhythm").innerHTML = loads.map(v => `<span style="height:${Math.max(6, Math.round((v / max) * 50))}px"></span>`).join("");
  const rhythmNote = document.getElementById("rhythmNote");
  if (rhythmNote) rhythmNote.textContent = "";
}
function renderCalendar() {
  const y = state.viewYear, m = state.viewMonth;
  const first = new Date(y, m, 1);
  const startDate = add(first, -first.getDay());
  const label = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(first);
  const monthLabel = document.getElementById("monthLabel");
  if (monthLabel) monthLabel.textContent = label;
  document.getElementById("calendarTitle").textContent = `${label} 캘린더`;
  const ps = projects(true);
  document.getElementById("calendar").innerHTML = Array.from({ length: 42 }, (_, i) => {
    const d = add(startDate, i), v = iso(d), h = holiday(v);
    const dayProjects = ps.filter(p => between(v, p.start, p.end));
    const dayEvents = events(v);
    const cls = ["day", d.getMonth() !== m ? "outside" : "", v === todayISO ? "today" : "", v === state.selected ? "selected" : "", d.getDay() === 0 ? "sunday" : "", h ? "holiday" : ""].filter(Boolean).join(" ");
    return `<button class="${cls}" type="button" data-date="${v}">
      <span class="day-top"><span class="num">${d.getDate()}</span><span class="meta">${esc(h)}</span></span>
      ${dayEvents.slice(0,2).map(e => `<span class="event-chip">${esc(e.time)} ${esc(e.title)}</span>`).join("")}
      <span class="bars">${dayProjects.slice(0,3).map(p => bar(p, v, d)).join("")}${dayProjects.length > 3 ? `<span class="more">+${dayProjects.length - 3}</span>` : ""}</span>
    </button>`;
  }).join("");
  document.querySelectorAll("[data-date]").forEach(btn => btn.addEventListener("click", () => {
    const d = parse(btn.dataset.date); state.selected = btn.dataset.date; state.viewYear = d.getFullYear(); state.viewMonth = d.getMonth(); save(); render();
  }));
  const hs = Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => {
    const v = iso(new Date(y, m, i + 1)); const h = holiday(v); return h ? `${i + 1}일 ${h}` : "";
  }).filter(Boolean);
  document.getElementById("holidayStrip").textContent = hs.length ? hs.join(" · ") : "공휴일 없음";
}
function bar(p, v, d) {
  const c = colors[p.color] || colors.lime;
  const starts = v === p.start || d.getDay() === 0 || d.getDate() === 1;
  const ends = v === p.end || d.getDay() === 6 || d.getDate() === new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const edge = starts && ends ? "" : starts ? "start" : ends ? "end" : "mid";
  return `<span class="bar ${edge}" title="${esc(p.name)}" style="--bar-bg:${c.bg};--bar-text:${c.text}">${starts ? esc(p.name) : ""}</span>`;
}
function renderAgenda() {
  const v = state.selected || todayISO;
  document.getElementById("selectedLabel").textContent = v === todayISO ? "오늘" : format(v);
  document.getElementById("agendaTitle").textContent = format(v, false);
  const list = document.getElementById("agendaList");
  const es = events(v);
  if (!es.length) { list.innerHTML = '<div class="empty">등록된 일정 없음</div>'; return; }
  list.innerHTML = es.map(e => `<article class="item ${e.done ? "done" : ""}">
    <div class="item-main"><div class="copy"><strong class="title">${esc(e.title)}</strong><span class="sub">${esc(e.time)} · ${typeLabel[e.type] || "작업"}${eventRange(e)}</span></div>
    <div class="actions"><button class="status-btn ${e.done ? "status-done" : "status-active"}" type="button" data-toggle-event="${e.id}">${e.done ? "완료" : "진행"}</button>
    <button class="row-btn" type="button" aria-label="수정" data-edit-event="${e.id}">${icon.edit}</button><button class="row-btn danger" type="button" aria-label="삭제" data-delete-event="${e.id}">${icon.trash}</button></div></div>
  </article>`).join("");
  bindAgenda();
}
function renderProjects() {
  const list = document.getElementById("projectList");
  const ps = projects(false);
  if (!ps.length) { list.innerHTML = '<div class="empty">등록된 프로젝트 없음</div>'; return; }
  list.innerHTML = ps.map(p => {
    const s = status(p), c = colors[p.color] || colors.lime, prog = progress(p);
    return `<article class="item ${s === "done" ? "done" : ""}">
      <div class="item-main"><div class="copy"><strong class="title">${esc(p.name)}</strong><span class="sub">${catLabel[p.category] || p.category} · ${format(p.start, false)} - ${format(p.end, false)} · ${days(p.start,p.end)+1}일</span></div>
      <div class="actions"><button class="status-btn status-${s}" type="button" data-toggle-project="${p.id}">${statusText(s)}</button><button class="row-btn" type="button" aria-label="수정" data-edit-project="${p.id}">${icon.edit}</button><button class="row-btn danger" type="button" aria-label="삭제" data-delete-project="${p.id}">${icon.trash}</button></div></div>
      <div class="progress"><span style="--progress:${prog}%;--progress-color:${c.line}"></span></div>
    </article>`;
  }).join("");
  bindProjects();
}
function bindAgenda() {
  document.querySelectorAll("[data-toggle-event]").forEach(b => b.onclick = () => { state.events = state.events.map(e => e.id === b.dataset.toggleEvent ? { ...e, done: !e.done } : e); save(); render(); });
  document.querySelectorAll("[data-edit-event]").forEach(b => b.onclick = () => { const e = state.events.find(x => x.id === b.dataset.editEvent); if (!e) return; eventId.value=e.id; eventDate.value=e.date; eventEndDate.value=eventEnd(e); eventEndDate.min=e.date; eventTime.value=e.time; eventType.value=e.type; eventTitle.value=e.title; eventSubmit.textContent="수정"; eventTitle.focus(); });
  document.querySelectorAll("[data-delete-event]").forEach(b => b.onclick = () => { if (!confirm("이 일정을 삭제할까요?")) return; state.events = state.events.filter(e => e.id !== b.dataset.deleteEvent); save(); render(); toast("일정을 삭제했습니다"); });
}
function bindProjects() {
  document.querySelectorAll("[data-toggle-project]").forEach(b => b.onclick = () => { state.projects = state.projects.map(p => p.id === b.dataset.toggleProject ? { ...p, status: p.status === "done" ? "active" : "done" } : p); save(); render(); });
  document.querySelectorAll("[data-edit-project]").forEach(b => b.onclick = () => { const p = state.projects.find(x => x.id === b.dataset.editProject); if (!p) return; projectId.value=p.id; projectName.value=p.name; projectStart.value=p.start; projectEnd.value=p.end; projectCategory.value=p.category; projectColor.value=p.color; syncColorPicker(p.color); projectSubmit.textContent="수정"; projectName.focus(); });
  document.querySelectorAll("[data-delete-project]").forEach(b => b.onclick = () => { if (!confirm("이 프로젝트를 삭제할까요?")) return; state.projects = state.projects.filter(p => p.id !== b.dataset.deleteProject); save(); render(); toast("프로젝트를 삭제했습니다"); });
}
function syncForms() {
  eventDate.value = state.selected || todayISO;
  eventEndDate.min = eventDate.value || todayISO;
  if (!eventEndDate.value || eventEndDate.value < eventEndDate.min) eventEndDate.value = eventEndDate.min;
  if (!projectStart.value) projectStart.value = state.selected || todayISO;
  if (!projectEnd.value) projectEnd.value = state.selected || todayISO;
}
function syncColorPicker(value = "lime") {
  const input = document.getElementById("projectColor");
  const button = document.getElementById("colorButton");
  const label = document.getElementById("colorLabel");
  const swatch = document.getElementById("colorButtonSwatch");
  const key = colors[value] ? value : "lime";
  if (input) input.value = key;
  if (label) label.textContent = colorLabels[key] || key;
  if (swatch) swatch.style.setProperty("--swatch", colors[key].line);
  document.querySelectorAll("[data-color-option]").forEach(option => {
    const active = option.dataset.colorOption === key;
    option.classList.toggle("active", active);
    option.setAttribute("aria-selected", String(active));
  });
  if (button) button.setAttribute("aria-label", "색상 " + (colorLabels[key] || key));
}
function setColorMenu(open) {
  const picker = document.getElementById("colorPicker");
  const button = document.getElementById("colorButton");
  if (!picker || !button) return;
  picker.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
}
function toast(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove("show"), 2200); }

prevMonth.onclick = () => { const d = new Date(state.viewYear, state.viewMonth - 1, 1); state.viewYear = d.getFullYear(); state.viewMonth = d.getMonth(); save(); render(); };
nextMonth.onclick = () => { const d = new Date(state.viewYear, state.viewMonth + 1, 1); state.viewYear = d.getFullYear(); state.viewMonth = d.getMonth(); save(); render(); };
todayBtn.onclick = () => { state.selected = todayISO; state.viewYear = now.getFullYear(); state.viewMonth = now.getMonth(); save(); render(); };
searchInput.oninput = e => { state.search = e.target.value; renderCalendar(); renderAgenda(); renderProjects(); };
eventDate.addEventListener("change", () => {
  eventEndDate.min = eventDate.value || todayISO;
  if (!eventEndDate.value || eventEndDate.value < eventEndDate.min) eventEndDate.value = eventEndDate.min;
});
document.querySelectorAll("input[placeholder]").forEach(input => {
  const placeholder = input.placeholder;
  input.addEventListener("focus", () => { input.placeholder = ""; });
  input.addEventListener("blur", () => { if (!input.value.trim()) input.placeholder = placeholder; });
});
document.querySelectorAll("[data-cal-filter]").forEach(b => b.onclick = () => { state.calFilter = b.dataset.calFilter; document.querySelectorAll("[data-cal-filter]").forEach(x => x.classList.toggle("active", x === b)); save(); renderCalendar(); });
document.querySelectorAll("[data-project-filter]").forEach(b => b.onclick = () => { state.projectFilter = b.dataset.projectFilter; document.querySelectorAll("[data-project-filter]").forEach(x => x.classList.toggle("active", x === b)); save(); renderProjects(); });
const colorButtonEl = document.getElementById("colorButton");
if (colorButtonEl) {
  colorButtonEl.onclick = e => {
    e.stopPropagation();
    const picker = document.getElementById("colorPicker");
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
    const picker = document.getElementById("colorPicker");
    if (picker && !picker.contains(e.target)) setColorMenu(false);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") setColorMenu(false); });
}
  const initialColorInput = document.getElementById("projectColor");
  syncColorPicker(initialColorInput ? initialColorInput.value : "lime");
eventForm.onsubmit = e => {
  e.preventDefault();
  const payload = { date: eventDate.value, endDate: eventEndDate.value || eventDate.value, time: eventTime.value, type: eventType.value, title: eventTitle.value.trim() };
  if (!payload.title) return;
  if (payload.endDate < payload.date) { toast("종료일을 시작일 이후로 선택하세요"); return; }
  if (eventId.value) { state.events = state.events.map(x => x.id === eventId.value ? { ...x, ...payload } : x); toast("일정을 수정했습니다"); }
  else { state.events.push({ id: id(), done: false, ...payload }); toast("일정을 추가했습니다"); }
  state.selected = payload.date; const d = parse(payload.date); state.viewYear = d.getFullYear(); state.viewMonth = d.getMonth();
  eventId.value = ""; eventEndDate.value = payload.date; eventTitle.value = ""; eventSubmit.textContent = "+ 일정 추가"; save(); render();
};
projectForm.onsubmit = e => {
  e.preventDefault();
  const payload = { name: projectName.value.trim(), start: projectStart.value, end: projectEnd.value, category: projectCategory.value, color: projectColor.value };
  if (!payload.name) return;
  if (payload.end < payload.start) { toast("종료일을 시작일 이후로 선택하세요"); return; }
  if (projectId.value) { state.projects = state.projects.map(x => x.id === projectId.value ? { ...x, ...payload } : x); toast("프로젝트를 수정했습니다"); }
  else { state.projects.push({ id: id(), status: "active", ...payload }); toast("프로젝트를 추가했습니다"); }
  state.selected = payload.start; const d = parse(payload.start); state.viewYear = d.getFullYear(); state.viewMonth = d.getMonth();
  projectId.value = ""; projectName.value = ""; projectSubmit.textContent = "추가"; save(); render();
};
openProfile.onclick = () => {
  profileNameInput.value = state.profile.name || "";
  profileBioInput.value = state.profile.bio || "";
  profileAvatarName.textContent = state.profile.avatar ? "등록된 사진" : "선택된 파일 없음";
  profileModal.classList.add("open");
  profileModal.setAttribute("aria-hidden", "false");
  profileNameInput.focus();
};
closeProfile.onclick = () => { profileModal.classList.remove("open"); profileModal.setAttribute("aria-hidden", "true"); };
profileModal.onclick = e => { if (e.target === profileModal) closeProfile.click(); };
profileForm.onsubmit = e => { e.preventDefault(); state.profile.name = profileNameInput.value.trim() || "SchedulePlanner"; state.profile.bio = profileBioInput.value.trim() || "일정과 프로젝트를 한 화면에서 정리하세요"; save(); renderProfile(); closeProfile.click(); toast("프로필을 저장했습니다"); };
profileAvatarInput.onchange = e => { const file = e.target.files[0]; if (!file) return; profileAvatarName.textContent = file.name; const r = new FileReader(); r.onload = () => { state.profile.avatar = String(r.result); save(); renderProfile(); toast("사진을 적용했습니다"); }; r.readAsDataURL(file); };
clearAvatar.onclick = () => { state.profile.avatar = ""; profileAvatarInput.value = ""; profileAvatarName.textContent = "선택된 파일 없음"; save(); renderProfile(); toast("사진을 삭제했습니다"); };
exportBtn.onclick = () => { const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `scheduleplanner-${todayISO}.json`; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast("데이터를 내보냈습니다"); };
importBtn.onclick = () => importFile.click();
importFile.onchange = e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { try { const data = JSON.parse(String(r.result)); if (!Array.isArray(data.projects) || !Array.isArray(data.events)) throw new Error(); state = { ...defaults(), ...data, profile: { ...defaults().profile, ...(data.profile || {}) } }; save(); render(); toast("데이터를 가져왔습니다"); } catch { toast("가져올 수 없는 파일입니다"); } }; r.readAsText(file); e.target.value = ""; };

searchInput.value = state.search || "";
document.querySelectorAll("[data-cal-filter]").forEach(b => b.classList.toggle("active", b.dataset.calFilter === state.calFilter));
document.querySelectorAll("[data-project-filter]").forEach(b => b.classList.toggle("active", b.dataset.projectFilter === state.projectFilter));
render();
