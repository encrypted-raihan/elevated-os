import { setupShell, renderNotificationDropdown, setActiveNav } from "../shared/ui.js";
import { auth, db } from "../../js/firebase.js";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const LOGIN_ROUTE = "/index/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/team/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  team: "/team/dashboard/index.html",
  client: "/client/dashboard/index.html",
};

const PHASE_PROGRESS = {
  planning: 10,
  active: 60,
  review: 85,
  completed: 100,
  paused: 60,
  cancelled: 0,
};

const state = {
  user: null,
  profile: null,
  projects: [],
  activeProject: null,
  projectUsers: new Map(),
  files: [],
  invoices: [],
  notifications: [],
  activityLogs: [],
  legacyMessages: [],
  conversationMessages: [],
  activeProjectId: null,
  subs: [],
  projectSubs: [],
  notificationsSub: null,
  ready: false,
};

const el = (id) => document.getElementById(id);

const els = {
  sidebar: el("sidebar"),
  backdrop: el("backdrop"),
  openSidebar: el("openSidebar"),
  notificationBtn: el("notificationBtn"),
  notificationDropdown: el("notificationDropdown"),
  notificationList: el("notificationList"),
  notificationCount: el("notificationCount"),
  clientName: el("clientName"),
  dashboardSubtitle: el("dashboardSubtitle"),
  openProjectBtn: el("openProjectBtn"),
  summaryBadge: el("summaryBadge"),
  projectProgressValue: el("projectProgressValue"),
  projectProgressHint: el("projectProgressHint"),
  filesSharedValue: el("filesSharedValue"),
  invoicesValue: el("invoicesValue"),
  daysLeftValue: el("daysLeftValue"),
  daysLeftHint: el("daysLeftHint"),
  activeProjectTitle: el("activeProjectTitle"),
  activeProjectStatus: el("activeProjectStatus"),
  activeProjectDescription: el("activeProjectDescription"),
  activeProjectProgressText: el("activeProjectProgressText"),
  activeProjectProgressBar: el("activeProjectProgressBar"),
  activeProjectDueDate: el("activeProjectDueDate"),
  activeProjectManager: el("activeProjectManager"),
  activeProjectClient: el("activeProjectClient"),
  latestUpdatesList: el("latestUpdatesList"),
  recentProjectsTable: el("recentProjectsTable"),
  recentMessagesList: el("recentMessagesList"),
  logoutBtn: document.querySelector(".logout-btn"),
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  setupShell();
  renderNotificationDropdown();
  setActiveNav("dashboard");
  bindUi();
  showLoadingState();

  onAuthStateChanged(auth, async (user) => {
    await handleAuthChange(user);
  });
}

function bindUi() {
  els.logoutBtn?.addEventListener("click", async () => {
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  });

  els.openSidebar?.addEventListener("click", () => toggleSidebar(true));
  els.backdrop?.addEventListener("click", () => {
    toggleSidebar(false);
    closeNotificationDropdown();
  });

  els.notificationBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleNotificationDropdown();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".notification-wrap")) {
      closeNotificationDropdown();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleSidebar(false);
      closeNotificationDropdown();
    }
  });

  document.addEventListener("click", async (event) => {
    const projectRow = event.target.closest("[data-action='open-project']");
    if (projectRow) {
      openProject(projectRow.dataset.projectId);
      return;
    }

    const notificationItem = event.target.closest("[data-action='open-notification']");
    if (notificationItem) {
      await markNotificationRead(notificationItem.dataset.id);
      return;
    }

    const messageItem = event.target.closest("[data-action='open-messages']");
    if (messageItem) {
      window.location.href = "../messages/index.html";
    }
  });
}

async function handleAuthChange(user) {
  teardownAllListeners();
  state.user = user;
  state.profile = null;
  state.projects = [];
  state.activeProject = null;
  state.projectUsers = new Map();
  state.files = [];
  state.invoices = [];
  state.notifications = [];
  state.activityLogs = [];
  state.legacyMessages = [];
  state.conversationMessages = [];
  state.activeProjectId = null;
  state.ready = false;

  if (!user) {
    window.location.href = LOGIN_ROUTE;
    return;
  }

  try {
    const profile = await loadUserProfile(user.uid);
    if (!profile) {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    if (profile.active === false) {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    const role = normalizeRole(profile.role);
    if (role !== "client") {
      window.location.href = ROLE_REDIRECTS[role] || LOGIN_ROUTE;
      return;
    }

    state.profile = profile;
    setHeaderUserName(profile);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch {
      // non-blocking
    }

    startGlobalListeners();
    state.ready = true;
    renderDashboard();
  } catch (error) {
    console.error("Client dashboard initialization failed:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

function startGlobalListeners() {
  if (!state.user?.uid) return;

  const projectsSub = onSnapshot(
    query(collection(db, "projects"), where("clientId", "==", state.user.uid)),
    async (snapshot) => {
      state.projects = snapshot.docs.map(mapDoc).map(normalizeProject);
      const nextProject = selectActiveProject(state.projects);
      const changed = nextProject?.id !== state.activeProject?.id;

      if (changed) {
        state.activeProject = nextProject || null;
        state.activeProjectId = nextProject?.id || null;
        sessionStorage.setItem("ews:selectedClientProjectId", state.activeProjectId || "");
        await switchProjectListeners();
      } else {
        state.activeProject = nextProject || null;
        state.activeProjectId = nextProject?.id || null;
      }

      renderDashboard();
    },
    handleListenerError("projects")
  );
  state.subs.push(projectsSub);

  state.notificationsSub = onSnapshot(
    query(collection(db, "notifications"), where("userId", "==", state.user.uid), limit(25)),
    (snapshot) => {
      state.notifications = snapshot.docs.map(mapDoc).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      renderNotifications();
    },
    handleListenerError("notifications")
  );
}

async function switchProjectListeners() {
  teardownProjectListeners();

  if (!state.activeProject?.id) {
    renderDashboard();
    return;
  }

  const project = state.activeProject;
  const userIds = new Set([state.user.uid, project.clientId, project.projectManagerId, ...(project.assignedDevelopers || [])].filter(Boolean));
  await hydrateProjectUsers([...userIds]);

  const filesSub = onSnapshot(
    query(collection(db, "files"), where("projectId", "==", project.id)),
    (snapshot) => {
      state.files = snapshot.docs.map(mapDoc).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      renderDashboard();
    },
    handleListenerError("files")
  );
  state.projectSubs.push(filesSub);

  const invoicesSub = onSnapshot(
    query(collection(db, "invoices"), where("projectId", "==", project.id), where("clientId", "==", state.user.uid)),
    (snapshot) => {
      state.invoices = snapshot.docs.map(mapDoc).sort((a, b) => toMillis(b.issueDate) - toMillis(a.issueDate));
      renderDashboard();
    },
    handleListenerError("invoices")
  );
  state.projectSubs.push(invoicesSub);

  const activitySub = onSnapshot(
    query(collection(db, "activityLogs"), where("targetId", "==", project.id)),
    (snapshot) => {
      state.activityLogs = snapshot.docs.map(mapDoc).sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
      renderDashboard();
    },
    handleListenerError("activityLogs")
  );
  state.projectSubs.push(activitySub);

  const legacyMessagesSub = onSnapshot(
    query(collection(db, "messages"), where("projectId", "==", project.id)),
    (snapshot) => {
      state.legacyMessages = snapshot.docs.map(mapDoc).sort((a, b) => toMillis(a.timestamp || a.createdAt) - toMillis(b.timestamp || b.createdAt));
      renderDashboard();
    },
    handleListenerError("legacyMessages")
  );
  state.projectSubs.push(legacyMessagesSub);

  const conversationId = projectConversationId(project.id);
  const convoMessagesSub = onSnapshot(
    query(collection(db, "conversations", conversationId, "messages"), limit(100)),
    (snapshot) => {
      state.conversationMessages = snapshot.docs.map(mapDoc).sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      renderDashboard();
    },
    handleListenerError("conversationMessages")
  );
  state.projectSubs.push(convoMessagesSub);
}

async function hydrateProjectUsers(userIds) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const fetched = await Promise.all(unique.map(async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch {
      return null;
    }
  }));

  const map = new Map();
  fetched.filter(Boolean).forEach((user) => map.set(user.id, user));
  state.projectUsers = map;
}

function teardownAllListeners() {
  teardownProjectListeners();

  while (state.subs.length) {
    const unsub = state.subs.pop();
    try { unsub(); } catch { /* ignore */ }
  }

  if (typeof state.notificationsSub === "function") {
    try { state.notificationsSub(); } catch { /* ignore */ }
  }
  state.notificationsSub = null;
}

function teardownProjectListeners() {
  while (state.projectSubs.length) {
    const unsub = state.projectSubs.pop();
    try { unsub(); } catch { /* ignore */ }
  }
}

async function loadUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function safeSignOut() {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
}

function setHeaderUserName(profile) {
  const name = getUserName(profile) || "Client";
  if (els.clientName) els.clientName.textContent = `Welcome Back, ${name}`;
  if (els.dashboardSubtitle) {
    els.dashboardSubtitle.textContent = "Track your live project progress, recent messages, and approvals from one place.";
  }
}

function selectActiveProject(projects) {
  if (!projects.length) return null;

  const stored = sessionStorage.getItem("ews:selectedClientProjectId");
  if (stored) {
    const found = projects.find((project) => project.id === stored);
    if (found) return found;
  }

  const activePriority = [...projects].sort((a, b) => {
    const scoreA = projectPriorityScore(a);
    const scoreB = projectPriorityScore(b);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt);
  });

  return activePriority[0] || null;
}

function projectPriorityScore(project) {
  const status = normalizeStatus(project.status);
  if (status === "active") return 0;
  if (status === "review") return 1;
  if (status === "planning") return 2;
  if (status === "paused") return 3;
  return 4;
}

function openProject(projectId) {
  if (!projectId) return;
  sessionStorage.setItem("ews:selectedClientProjectId", projectId);
  const url = new URL("../project/index.html", window.location.href);
  url.searchParams.set("projectId", projectId);
  window.location.href = url.toString();
}

async function markNotificationRead(id) {
  const item = state.notifications.find((n) => n.id === id);
  if (!item || item.read) return;

  try {
    await updateDoc(doc(db, "notifications", id), { read: true });
  } catch (error) {
    console.warn("Unable to mark notification as read:", error);
  }
}

function renderDashboard() {
  if (!state.ready && !state.profile) {
    showLoadingState();
    return;
  }

  renderNotifications();
  renderStats();
  renderSummary();
  renderProjectsTable();
  renderLatestUpdates();
  renderMessages();
  renderOpenProjectButton();
}

function renderOpenProjectButton() {
  if (!els.openProjectBtn) return;
  if (state.activeProject?.id) {
    els.openProjectBtn.href = `../project/index.html?projectId=${encodeURIComponent(state.activeProject.id)}`;
    els.openProjectBtn.textContent = "View Project";
  } else {
    els.openProjectBtn.href = "../project/index.html";
    els.openProjectBtn.textContent = "View Project";
  }
}

function renderStats() {
  const project = state.activeProject;
  const progress = getProjectProgress(project);
  const filesCount = state.files.length;
  const invoicesCount = state.invoices.length;
  const daysLeft = getDaysLeft(project?.dueDate);

  setText(els.projectProgressValue, project ? `${progress}%` : "0%");
  setText(els.projectProgressHint, project ? `Current status: ${humanizeStatus(project.status)}` : "No active project loaded.");
  setText(els.filesSharedValue, String(filesCount));
  setText(els.invoicesValue, String(invoicesCount));
  setText(els.daysLeftValue, project ? (daysLeft === null ? "—" : String(daysLeft)) : "—");
  setText(els.daysLeftHint, project ? (daysLeft === null ? "No due date set" : `${Math.max(daysLeft, 0)} day${Math.abs(daysLeft) === 1 ? "" : "s"} remaining`) : "Until the current deadline.");
}

function renderSummary() {
  const project = state.activeProject;

  if (!project) {
    setText(els.summaryBadge, "No project assigned");
    setText(els.activeProjectTitle, "No project yet");
    setText(els.activeProjectStatus, "—");
    setText(els.activeProjectDescription, "No project has been loaded for your account yet.");
    setText(els.activeProjectProgressText, "0%");
    setWidth(els.activeProjectProgressBar, 0);
    setText(els.activeProjectDueDate, "—");
    setText(els.activeProjectManager, "—");
    setText(els.activeProjectClient, "—");
    return;
  }

  const progress = getProjectProgress(project);
  const manager = state.projectUsers.get(project.projectManagerId);
  const client = state.projectUsers.get(project.clientId);
  const dueDate = formatDate(project.dueDate);

  setText(els.summaryBadge, `${humanizeStatus(project.status)} • ${progress}% complete`);
  setText(els.activeProjectTitle, project.title || "Untitled Project");
  setText(els.activeProjectStatus, humanizeStatus(project.status));
  setText(els.activeProjectDescription, project.description || "No project description available.");
  setText(els.activeProjectProgressText, `${progress}%`);
  setWidth(els.activeProjectProgressBar, progress);
  setText(els.activeProjectDueDate, dueDate);
  setText(els.activeProjectManager, getUserName(manager) || "—");
  setText(els.activeProjectClient, getUserName(client) || getUserName(state.profile) || "—");
}

function renderLatestUpdates() {
  if (!els.latestUpdatesList) return;

  const entries = state.activityLogs.slice(0, 3);

  if (!entries.length) {
    els.latestUpdatesList.innerHTML = `
      <div class="message-item">
        <div class="message-top">
          <div>
            <div class="message-project">No updates yet</div>
            <div class="message-sender">Project activity will appear here</div>
          </div>
          <div class="message-time">—</div>
        </div>
        <p class="message-preview">There are no recent project updates to show.</p>
      </div>
    `;
    return;
  }

  els.latestUpdatesList.innerHTML = entries.map((entry) => {
    const actor = state.projectUsers.get(entry.userId);
    const title = entry.action || "Update";
    const details = entry.details || "Project activity logged.";
    return `
      <article class="message-item" data-action="open-messages" role="button" tabindex="0">
        <div class="message-top">
          <div>
            <div class="message-project">${escapeHtml(title)}</div>
            <div class="message-sender">By ${escapeHtml(getUserName(actor) || "System")}</div>
          </div>
          <div class="message-time">${escapeHtml(formatRelativeTime(entry.timestamp))}</div>
        </div>
        <p class="message-preview">${escapeHtml(details)}</p>
      </article>
    `;
  }).join("");
}

function renderProjectsTable() {
  if (!els.recentProjectsTable) return;

  const projects = [...state.projects].sort((a, b) => {
    const score = projectPriorityScore(a) - projectPriorityScore(b);
    if (score !== 0) return score;
    return toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt);
  });

  const head = els.recentProjectsTable.querySelector(".table-head");
  els.recentProjectsTable.innerHTML = "";
  if (head) els.recentProjectsTable.appendChild(head);

  if (!projects.length) {
    const empty = document.createElement("div");
    empty.className = "table-row";
    empty.style.gridTemplateColumns = "1fr";
    empty.innerHTML = `<div class="min-muted">No projects assigned yet.</div>`;
    els.recentProjectsTable.appendChild(empty);
    return;
  }

  projects.forEach((project) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.style.gridTemplateColumns = "2.1fr 1.2fr 1fr 1fr 1fr 24px";
    const progress = getProjectProgress(project);
    row.dataset.action = "open-project";
    row.dataset.projectId = project.id;
    row.innerHTML = `
      <div style="font-weight:700">${escapeHtml(project.title || "Untitled Project")}</div>
      <div class="min-muted">${escapeHtml(getUserName(state.projectUsers.get(project.clientId)) || getUserName(state.profile) || "Client")}</div>
      <div>
        <div class="progress-wrap"><span class="min-muted">${progress}%</span><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div></div>
      </div>
      <div><span class="status ${statusClass(project.status)}">${escapeHtml(humanizeStatus(project.status))}</span></div>
      <div class="min-muted">${escapeHtml(formatDate(project.dueDate))}</div>
      <div class="min-muted" style="text-align:right">↗</div>
    `;
    row.style.cursor = "pointer";
    els.recentProjectsTable.appendChild(row);
  });
}

function renderMessages() {
  if (!els.recentMessagesList) return;

  const messages = getRenderableMessages().slice(-3).reverse();

  if (!messages.length) {
    els.recentMessagesList.innerHTML = `
      <article class="message-item">
        <div class="message-top">
          <div>
            <div class="message-project">No messages yet</div>
            <div class="message-sender">Waiting for the first update</div>
          </div>
          <div class="message-time">—</div>
        </div>
        <p class="message-preview">Your project messages will appear here once the team starts the chat.</p>
      </article>
    `;
    return;
  }

  els.recentMessagesList.innerHTML = messages.map((message) => {
    const senderName = message.senderName || getUserName(state.projectUsers.get(message.senderId)) || "Unknown";
    const projectName = state.activeProject?.title || message.projectTitle || "Project";
    const body = message.text || message.message || "";
    return `
      <article class="message-item">
        <div class="message-top">
          <div>
            <div class="message-project">${escapeHtml(projectName)}</div>
            <div class="message-sender">From ${escapeHtml(senderName)}</div>
          </div>
          <div class="message-time">${escapeHtml(formatRelativeTime(message.createdAt || message.timestamp))}</div>
        </div>
        <p class="message-preview">${escapeHtml(body)}</p>
      </article>
    `;
  }).join("");
}

function getRenderableMessages() {
  if (state.conversationMessages.length) return state.conversationMessages;
  if (state.legacyMessages.length) return state.legacyMessages;
  return [];
}

function renderNotifications() {
  if (!els.notificationList) return;

  const unread = state.notifications.filter((item) => !item.read).length;
  setText(els.notificationCount, String(unread || state.notifications.length || 0));

  if (!state.notifications.length) {
    els.notificationList.innerHTML = `
      <div class="dropdown-item">
        <strong>No notifications</strong>
        <span>You're all caught up.</span>
      </div>
    `;
    return;
  }

  els.notificationList.innerHTML = state.notifications.slice(0, 6).map((note) => {
    const title = note.title || "Notification";
    const message = note.message || "";
    const time = formatRelativeTime(note.createdAt);
    return `
      <button class="dropdown-item ${note.read ? "read" : "unread"}" type="button" data-action="open-notification" data-id="${escapeAttr(note.id)}">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(message)}</span>
        <small>${escapeHtml(time)}</small>
      </button>
    `;
  }).join("");
}

function toggleNotificationDropdown(force) {
  if (!els.notificationDropdown || !els.notificationBtn) return;

  const next = typeof force === "boolean" ? force : els.notificationDropdown.hidden;
  els.notificationDropdown.hidden = !next;
  els.notificationBtn.setAttribute("aria-expanded", String(next));
}

function closeNotificationDropdown() {
  toggleNotificationDropdown(false);
}

function toggleSidebar(open) {
  if (!els.sidebar || !els.backdrop) return;
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function showLoadingState() {
  setText(els.clientName, "Loading...");
  setText(els.summaryBadge, "Loading...");
  setText(els.projectProgressValue, "0%");
  setText(els.projectProgressHint, "Loading your project...");
  setText(els.filesSharedValue, "0");
  setText(els.invoicesValue, "0");
  setText(els.daysLeftValue, "—");
  setText(els.daysLeftHint, "Until the current deadline.");
  setText(els.activeProjectTitle, "Loading...");
  setText(els.activeProjectStatus, "—");
  setText(els.activeProjectDescription, "Loading project data...");
  setText(els.activeProjectProgressText, "0%");
  setWidth(els.activeProjectProgressBar, 0);
  setText(els.activeProjectDueDate, "—");
  setText(els.activeProjectManager, "—");
  setText(els.activeProjectClient, "—");
  if (els.latestUpdatesList) {
    els.latestUpdatesList.innerHTML = `<div class="message-item"><div class="message-top"><div><div class="message-project">Loading...</div><div class="message-sender">Please wait</div></div><div class="message-time">—</div></div><p class="message-preview">Fetching your latest project updates.</p></div>`;
  }
  if (els.recentMessagesList) {
    els.recentMessagesList.innerHTML = `<article class="message-item"><div class="message-top"><div><div class="message-project">Loading...</div><div class="message-sender">Please wait</div></div><div class="message-time">—</div></div><p class="message-preview">Fetching your latest project messages.</p></article>`;
  }
  if (els.recentProjectsTable) {
    const head = els.recentProjectsTable.querySelector(".table-head");
    els.recentProjectsTable.innerHTML = "";
    if (head) els.recentProjectsTable.appendChild(head);
  }
}

function normalizeProject(project) {
  return {
    ...project,
    status: normalizeStatus(project.status),
    progress: clampNumber(project.progress ?? PHASE_PROGRESS[normalizeStatus(project.status)] ?? 0, 0, 100),
  };
}

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "development") return "active";
  if (value === "testing") return "review";
  if (value === "onhold" || value === "hold") return "paused";
  if (value === "canceled") return "cancelled";
  if (["planning", "active", "review", "completed", "paused", "cancelled"].includes(value)) return value;
  return "planning";
}

function humanizeStatus(status) {
  const value = normalizeStatus(status);
  return {
    planning: "Planning",
    active: "Active",
    review: "Review",
    completed: "Completed",
    paused: "Paused",
    cancelled: "Cancelled",
  }[value] || "Active";
}

function statusClass(status) {
  const value = normalizeStatus(status);
  return `status-${value === "cancelled" ? "review" : value}`;
}

function getProjectProgress(project) {
  if (!project) return 0;
  return clampNumber(project.progress ?? PHASE_PROGRESS[normalizeStatus(project.status)] ?? 0, 0, 100);
}

function getDaysLeft(dueDate) {
  const date = toDate(dueDate);
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function getUserName(user) {
  if (!user) return "";
  return user.name || user.fullName || user.displayName || user.email?.split("@")[0] || "";
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function setText(node, text) {
  if (!node) return;
  node.textContent = text;
}

function setWidth(node, percentage) {
  if (!node) return;
  node.style.width = `${clampNumber(percentage, 0, 100)}%`;
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toMillis(value) {
  const d = toDate(value);
  return d ? d.getTime() : 0;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) return "Just now";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function projectConversationId(projectId) {
  return `project_${String(projectId || "").trim()}`;
}

function mapDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
}
