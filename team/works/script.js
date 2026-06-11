const els = {
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  openSidebar: document.getElementById("openSidebar"),
  closeSidebar: document.getElementById("closeSidebar"),
  logoutBtn: document.querySelector(".logout-btn"),
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  statsRoot: document.getElementById("statsRoot"),
  contentRoot: document.getElementById("contentRoot")
};

const data = {
  title: 'Works — Elevated Web Solutions',
  subtitle: 'Task list for this project and your assigned work.',
  stats: [['Open Tasks', '5', '2 due today', 'warn'], ['Completed', '11', 'Good momentum', 'good'], ['Blocked', '1', 'Awaiting assets', 'bad'], ['Reviews', '4', 'Ready for feedback', '']],
  body: '<div class="layout-three">\n  <article class="card" style="margin:0"><div class="stat-label">Open Tasks</div><div class="stat-value">5</div><div class="small">2 due today</div><div class="stat-trend">● Watch</div></article>\n  <article class="card" style="margin:0"><div class="stat-label">Completed</div><div class="stat-value">11</div><div class="small">Good momentum</div><div class="stat-trend">▲ Good</div></article>\n  <article class="card" style="margin:0"><div class="stat-label">Blocked</div><div class="stat-value">1</div><div class="small">Awaiting assets</div><div class="stat-trend">▼ Blocked</div></article>\n</div>\n<div class="task-board" style="margin-top:18px">\n  <div class="task-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><strong>Homepage layout</strong><span class="pill warn">In Progress</span></div><div class="small" style="margin-top:8px">Owner: You • Due: Today</div></div>\n  <div class="task-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><strong>Footer links</strong><span class="pill good">Done</span></div><div class="small" style="margin-top:8px">Owner: You • Due: Done</div></div>\n  <div class="task-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><strong>Mobile menu</strong><span class="pill warn">Review</span></div><div class="small" style="margin-top:8px">Owner: Anu • Due: Tomorrow</div></div>\n  <div class="task-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><strong>Contact section</strong><span class="pill bad">Blocked</span></div><div class="small" style="margin-top:8px">Owner: Admin • Due: Pending assets</div></div>\n</div>'
};

function init() {
  els.pageTitle.textContent = data.title;
  els.pageSubtitle.textContent = data.subtitle;
  els.statsRoot.innerHTML = data.stats.map(([label, value, note, type]) => `
    <article class="card">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="small">${note}</div>
      <div class="stat-trend">${type === "good" ? "▲ Good pace" : type === "warn" ? "● Needs attention" : type === "bad" ? "▼ Blocked" : "• Stable"}</div>
    </article>
  `).join("");
  els.contentRoot.innerHTML = data.body;

  els.openSidebar?.addEventListener("click", () => setSidebar(true));
  els.closeSidebar?.addEventListener("click", () => setSidebar(false));
  els.backdrop?.addEventListener("click", () => setSidebar(false));
  els.logoutBtn?.addEventListener("click", () => alert("Dummy sign out for the team page."));
}

function setSidebar(open) {
  els.sidebar?.classList.toggle("open", open);
  if (els.backdrop) els.backdrop.classList.toggle("hidden", !open);
}

init();
