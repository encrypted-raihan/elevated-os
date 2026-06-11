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
  title: 'Project Workspace — Elevated Web Solutions',
  subtitle: 'One place for files, updates, payments and chat.',
  stats: [['Progress', '64%', 'Design + dev', 'good'], ['Files', '14', '2 new uploads', ''], ['Invoices', '2', '1 pending', 'warn'], ['Messages', '23', 'Shared project chat', '']],
  body: '<div class="tabs">\n  <button class="tab active">Overview</button><button class="tab">Timeline</button><button class="tab">Files</button><button class="tab">Payments</button><button class="tab">Messages</button><button class="tab">Updates</button><button class="tab">Team</button>\n</div>\n<div class="layout-two">\n  <section class="panel" style="margin:0">\n    <div class="section-head"><div><div class="eyebrow">TIMELINE</div><h3>Progress</h3></div></div>\n    <div class="timeline">\n      <div class="timeline-item"><strong>Step 1</strong><div class="small" style="margin-top:6px">Planning completed</div></div>\n      <div class="timeline-item"><strong>Step 2</strong><div class="small" style="margin-top:6px">Design in review</div></div>\n      <div class="timeline-item"><strong>Step 3</strong><div class="small" style="margin-top:6px">Development in progress</div></div>\n      <div class="timeline-item"><strong>Step 4</strong><div class="small" style="margin-top:6px">Testing queued</div></div>\n    </div>\n  </section>\n  <section class="panel" style="margin:0">\n    <div class="section-head"><div><div class="eyebrow">CHAT</div><h3>Project Messages</h3></div></div>\n    <div class="list">\n      <div class="message-box"><div class="message-meta"><strong>Admin</strong><span>9:00 AM</span></div><div>Please adjust the hero spacing.</div></div>\n      <div class="message-box"><div class="message-meta"><strong>You</strong><span>9:10 AM</span></div><div>Updated. Sending the new version now.</div></div>\n      <div class="message-box"><div class="message-meta"><strong>Client</strong><span>9:13 AM</span></div><div>Looks clean. Approved.</div></div>\n    </div>\n  </section>\n</div>'
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
