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
  title: 'Team Dashboard — Elevated Web Solutions',
  subtitle: 'Overview of tasks, timeline and active work.',
  stats: [['Assigned Works', '8', '+2 this week', 'good'], ['Pending Reviews', '3', 'Needs attention', 'warn'], ['Messages', '12', 'Latest: Design update', ''], ['Completion', '76%', 'On track for delivery', 'good']],
  body: '<div class="layout-two">\n  <section class="panel" style="margin:0">\n    <div class="section-head"><div><div class="eyebrow">WORK</div><h3>Assigned Work</h3></div></div>\n    <div class="list">\n      <div class="list-item">Complete homepage polish</div>\n      <div class="list-item">Fix login redirect issue</div>\n      <div class="list-item">Review client feedback</div>\n    </div>\n  </section>\n  <section class="panel" style="margin:0">\n    <div class="section-head"><div><div class="eyebrow">UPCOMING</div><h3>Next</h3></div></div>\n    <div class="list">\n      <div class="list-item">Deploy staging build</div>\n      <div class="list-item">Prepare weekly report</div>\n      <div class="list-item">Share invoice draft</div>\n    </div>\n  </section>\n</div>'
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
