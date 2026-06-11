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
  title: 'Team Messages — Elevated Web Solutions',
  subtitle: 'Sync with team and project updates.',
  stats: [['Threads', '3', 'Active chats', ''], ['Unread', '3', 'Needs reply', 'warn'], ['Projects', '1', 'ShipMoney', 'good'], ['Teams', '2', 'Admin + Team', '']],
  body: '<div class="search-row"><input id="searchInput" placeholder="Search conversations..." /></div>\n<div class="chat-shell">\n  <aside class="thread-list">\n    <div class="section-head" style="margin-bottom:12px"><div><div class="eyebrow">INBOX</div><h2>Conversations</h2></div></div>\n    <div class="thread active"><strong>Rajeev</strong><div class="small" style="margin-top:6px">Admin</div><div style="margin-top:10px;color:var(--muted)">Please update the project timeline.</div></div>\n    <div class="thread"><strong>ShipMoney</strong><div class="small" style="margin-top:6px">Project</div><div style="margin-top:10px;color:var(--muted)">Homepage revision is approved.</div></div>\n    <div class="thread"><strong>Anu</strong><div class="small" style="margin-top:6px">Team</div><div style="margin-top:10px;color:var(--muted)">I finished the banner section.</div></div>\n  </aside>\n  <section class="chat-pane">\n    <div class="chat-header">\n      <div><div class="eyebrow">CHAT</div><h2>Select a chat</h2></div>\n      <span class="pill warn">Dummy UI</span>\n    </div>\n    <div class="chat-body">\n      <div class="message-box"><div class="message-meta"><strong>Rajeev</strong><span>9:12 AM</span></div><div>Please update the project timeline.</div></div>\n      <div class="message-box"><div class="message-meta"><strong>You</strong><span>9:14 AM</span></div><div>Done. I pushed the updated milestones.</div></div>\n      <div class="message-box"><div class="message-meta"><strong>Rajeev</strong><span>9:15 AM</span></div><div>Perfect.</div></div>\n    </div>\n    <div class="composer">\n      <textarea class="chat-input" placeholder="Type a message..."></textarea>\n      <button class="btn primary" type="button" onclick="alert(\'Dummy send\')">Send</button>\n    </div>\n  </section>\n</div>'
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
