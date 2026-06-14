import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { requireRole } from "../../js/guards/roleGuard.js";
import { ROLES, homeFor } from "../../js/utils/permissions.js";

const LOGIN_ROUTE = "../../index/index.html";

const els = {
  welcomeHeading: document.querySelector(".topbar h1"),
  topbarSubtext: document.querySelector(".topbar .subtext"),
  statTotalLeads: document.getElementById("statTotalLeads"),
  statCallsToday: document.getElementById("statCallsToday"),
  statInterested: document.getElementById("statInterested"),
  statConfirmed: document.getElementById("statConfirmed"),
  statCallsWeek: document.getElementById("statCallsWeek"),
  statConversion: document.getElementById("statConversion"),
  followUpList: document.getElementById("followUpList"),
  recentCalls: document.getElementById("recentCalls"),
  logoutBtn: document.querySelector(".logout-btn"),
  openSidebarBtn: document.getElementById("openSidebar"),
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
};

const state = {
  leads: [],
  callLogs: [],
  unsubscribe: [],
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindStaticUi();

  onAuthStateChanged(auth, async (user) => {
    teardown();

    if (!user) {
      window.location.href = LOGIN_ROUTE;
      return;
    }

    let profile;
    try {
      profile = await requireRole(user.uid, [ROLES.COLD_CALLER]);
    } catch (err) {
      console.error("Role check failed:", err);
      await signOut(auth).catch(() => {});
      window.location.href = LOGIN_ROUTE;
      return;
    }

    if (!profile) return; // requireRole already redirected

    if (els.welcomeHeading) {
      els.welcomeHeading.textContent = `Welcome Back, ${profile.name || "Caller"}`;
    }
    if (els.topbarSubtext) {
      els.topbarSubtext.textContent = "Here is your pipeline for today.";
    }

    startListeners(user.uid);
  });
}

function bindStaticUi() {
  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", async () => {
      await signOut(auth).catch(() => {});
      window.location.href = LOGIN_ROUTE;
    });
  }

  if (els.openSidebarBtn && els.sidebar) {
    els.openSidebarBtn.addEventListener("click", () => {
      els.sidebar.classList.add("open");
      if (els.backdrop) els.backdrop.hidden = false;
    });
  }

  if (els.backdrop && els.sidebar) {
    els.backdrop.addEventListener("click", () => {
      els.sidebar.classList.remove("open");
      els.backdrop.hidden = true;
    });
  }
}

function startListeners(uid) {
  const leadsQuery = query(
    collection(db, "leads"),
    where("assignedCallerId", "==", uid)
  );

  const leadsUnsub = onSnapshot(leadsQuery, (snap) => {
    state.leads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => console.error("Leads listener error:", err));

  const callLogsQuery = query(
    collection(db, "callLogs"),
    where("callerId", "==", uid),
    orderBy("createdAt", "desc")
  );

  const callsUnsub = onSnapshot(callLogsQuery, (snap) => {
    state.callLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => console.error("Call logs listener error:", err));

  state.unsubscribe.push(leadsUnsub, callsUnsub);
}

function teardown() {
  state.unsubscribe.forEach((unsub) => unsub());
  state.unsubscribe = [];
  state.leads = [];
  state.callLogs = [];
}

function render() {
  renderStats();
  renderFollowUps();
  renderRecentCalls();
}

function renderStats() {
  const total = state.leads.length;
  const interested = state.leads.filter((l) => l.status === "interested").length;
  const confirmed = state.leads.filter((l) => l.status === "confirmed_client").length;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const callsToday = state.callLogs.filter((c) => toDate(c.callDate || c.createdAt) >= startOfToday).length;
  const callsWeek = state.callLogs.filter((c) => toDate(c.callDate || c.createdAt) >= startOfWeek).length;

  const conversion = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  setText(els.statTotalLeads, total);
  setText(els.statCallsToday, callsToday);
  setText(els.statInterested, interested);
  setText(els.statConfirmed, confirmed);
  setText(els.statCallsWeek, callsWeek);
  setText(els.statConversion, `${conversion}%`);
}

function renderFollowUps() {
  if (!els.followUpList) return;

  const now = new Date();
  const upcoming = state.leads
    .filter((l) => l.followUpDate && l.status !== "confirmed_client" && l.status !== "rejected")
    .map((l) => ({ ...l, _due: toDate(l.followUpDate) }))
    .sort((a, b) => a._due - b._due)
    .slice(0, 6);

  if (upcoming.length === 0) {
    els.followUpList.innerHTML = `<p class="empty-state">No follow-ups scheduled. Nice and clear.</p>`;
    return;
  }

  els.followUpList.innerHTML = upcoming
    .map((lead) => {
      const overdue = lead._due < now;
      return `
        <div class="lead-item">
          <div>
            <p class="lead-item-name">${escapeHtml(lead.name || "Unnamed lead")}</p>
            <p class="lead-item-sub">${escapeHtml(lead.businessName || "")} · ${escapeHtml(lead.phone || "")}</p>
          </div>
          <div style="text-align:right;">
            <span class="status-badge status-${escapeHtml(lead.status || "new")}">${formatStatus(lead.status)}</span>
            <p class="lead-item-due" style="color:${overdue ? "var(--danger)" : "var(--secondary)"}">
              ${overdue ? "Overdue: " : "Due: "}${dateFormatter.format(lead._due)}
            </p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRecentCalls() {
  if (!els.recentCalls) return;

  const recent = state.callLogs.slice(0, 8);
  const leadsById = new Map(state.leads.map((l) => [l.id, l]));

  if (recent.length === 0) {
    els.recentCalls.innerHTML = `<p class="empty-state">No calls logged yet. Open "My Leads" to log your first call.</p>`;
    return;
  }

  els.recentCalls.innerHTML = recent
    .map((call) => {
      const lead = leadsById.get(call.leadId);
      const when = toDate(call.callDate || call.createdAt);
      return `
        <div class="activity-item">
          <span class="activity-marker"></span>
          <div class="activity-meta">
            <div class="activity-top">
              <p class="activity-title">${escapeHtml(lead ? lead.name : "Lead")}</p>
              <p class="activity-time">${dateFormatter.format(when)}</p>
            </div>
            <p class="activity-text">
              Outcome: <span class="status-badge status-${escapeHtml(call.outcome || "new")}">${formatStatus(call.outcome)}</span>
              ${call.notes ? ` — ${escapeHtml(call.notes)}` : ""}
            </p>
          </div>
        </div>
      `;
    })
    .join("");
}

function toDate(value) {
  if (!value) return new Date(0);
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

function setText(el, value) {
  if (el) el.textContent = value;
}

function formatStatus(status) {
  return String(status || "new").replace(/_/g, " ");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}
