import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const LOGIN_ROUTE = "/index/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/team/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  client: "/client/dashboard/index.html",
};

const ACTIVE_PROJECT_STATUSES = new Set(["planning", "active", "review", "paused"]);
const TEAM_ROLES = new Set(["manager", "developer"]);

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const els = {
  projectsTable: document.getElementById("projectsTable"),
  messageList: document.getElementById("messageList"),
  activityList: document.getElementById("activityList"),
  notificationList: document.getElementById("notificationList"),
  notificationBtn: document.getElementById("notificationBtn"),
  notificationDropdown: document.getElementById("notificationDropdown"),
  notificationCount: document.getElementById("notificationCount"),
  openSidebarBtn: document.getElementById("openSidebar"),
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  logoutBtn: document.querySelector(".logout-btn"),
  openWorkspaceBtn: document.getElementById("openWorkspaceBtn"),
  welcomeHeading: document.querySelector(".topbar h1"),
  topbarSubtext: document.querySelector(".topbar .subtext"),
  statCards: Array.from(document.querySelectorAll(".stat-card")),
};

const state = {
  user: null,
  profile: null,
  users: [],
  projects: [],
  messages: [],
  activity: [],
  notifications: [],
  usersById: new Map(),
  projectsById: new Map(),
  unsubscribe: [],
  ready: false,
};

document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  bindStaticUi();
  showLoadingState();

  onAuthStateChanged(auth, async (user) => {
    await handleAuthChange(user);
  });
}

async function handleAuthChange(user) {
  teardownListeners();
  state.user = user;
  state.profile = null;
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

    const role = normalizeText(profile.role);
    if (role === "admin") {
      await safeSignOut();
      window.location.href = ROLE_REDIRECTS.admin;
      return;
    }

    if (!TEAM_ROLES.has(role)) {
      await safeSignOut();
      window.location.href = ROLE_REDIRECTS[role] || LOGIN_ROUTE;
      return;
    }

    state.profile = profile;
    setWelcomeName(`Welcome Back, ${getDisplayName(profile)}`);
    setTopbarSubtitle("Connecting to Firebase…");

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch {
      // Non-blocking. Dashboard still works if this fails.
    }

    state.ready = true;
    startRealtimeListeners(user.uid);
  } catch (error) {
    console.error("Failed to initialize team dashboard:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

function bindStaticUi() {
  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", async () => {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
    });
  }

  if (els.openWorkspaceBtn) {
    els.openWorkspaceBtn.addEventListener("click", () => {
      openPrimaryWorkspace();
    });
  }

  if (els.notificationBtn && els.notificationDropdown) {
    els.notificationBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = els.notificationDropdown.hidden;
      els.notificationDropdown.hidden = !willOpen;
      els.notificationBtn.setAttribute("aria-expanded", String(willOpen));
    });
  }

  if (els.openSidebarBtn && els.sidebar && els.backdrop) {
    els.openSidebarBtn.addEventListener("click", () => setSidebar(true));
    els.backdrop.addEventListener("click", () => {
      setSidebar(false);
      closeNotifications();
    });
  }

  document.addEventListener("click", (event) => {
    if (!els.notificationDropdown || els.notificationDropdown.hidden) return;
    if (!event.target.closest(".notification-wrap")) {
      closeNotifications();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSidebar(false);
      closeNotifications();
    }
  });
}

function startRealtimeListeners(uid) {
  showLoadingState();

  state.unsubscribe.push(
    onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        state.users = snapshot.docs.map(mapDoc);
        state.usersById = buildMap(state.users);
        renderDashboard();
      },
      handleListenerError("users")
    )
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "projects"), orderBy("updatedAt", "desc")),
      (snapshot) => {
        state.projects = snapshot.docs.map(mapDoc);
        state.projectsById = buildMap(state.projects);
        renderDashboard();
      },
      handleListenerError("projects")
    )
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(25)),
      (snapshot) => {
        state.messages = snapshot.docs.map(mapDoc);
        renderDashboard();
      },
      handleListenerError("messages")
    )
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "activityLogs"), orderBy("timestamp", "desc"), limit(20)),
      (snapshot) => {
        state.activity = snapshot.docs.map(mapDoc);
        renderDashboard();
      },
      handleListenerError("activity logs")
    )
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "notifications"), where("userId", "==", uid)),
      (snapshot) => {
        state.notifications = snapshot.docs.map(mapDoc);
        renderNotifications();
      },
      handleListenerError("notifications")
    )
  );
}

function teardownListeners() {
  while (state.unsubscribe.length) {
    const unsubscribe = state.unsubscribe.pop();
    try {
      unsubscribe();
    } catch {
      // Ignore teardown errors.
    }
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
    // Ignore sign-out errors during redirect fallback.
  }
}

function renderDashboard() {
  if (!state.ready) return;

  renderStats();
  renderProjects();
  renderMessages();
  renderActivity();
  renderNotifications();
  renderTopbarSubtitle();
}

function getVisibleProjects() {
  const profile = state.profile;
  if (!profile) return [];

  return [...state.projects]
    .filter((project) => canAccessProject(profile, project))
    .sort((a, b) => getTimeMs(b.updatedAt || b.createdAt) - getTimeMs(a.updatedAt || a.createdAt));
}

function getStatsData() {
  const projects = getVisibleProjects();
  const visibleProjectIds = new Set(projects.map((project) => project.id));
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const activeProjects = projects.filter((project) =>
    ACTIVE_PROJECT_STATUSES.has(normalizeText(project.status))
  ).length;

  const pendingReviews = projects.filter((project) =>
    normalizeText(project.status) === "review"
  ).length;

  const recentMessages = state.messages.filter((message) => {
    const projectId = message.projectId;
    if (!visibleProjectIds.has(projectId)) return false;
    return getTimeMs(message.createdAt || message.timestamp) >= weekAgo;
  }).length;

  return {
    projects,
    activeProjects,
    pendingReviews,
    recentMessages,
  };
}

function renderStats() {
  const { projects, activeProjects, pendingReviews, recentMessages } = getStatsData();

  setStatCard(0, formatNumber(projects.length), "Assigned projects");
  setStatCard(1, formatNumber(activeProjects), "Currently active");
  setStatCard(2, formatNumber(recentMessages), "Messages this week");
  setStatCard(3, formatNumber(pendingReviews), "Waiting for review");
}

function renderTopbarSubtitle() {
  if (!els.topbarSubtext) return;

  const { projects, activeProjects, recentMessages } = getStatsData();

  if (!projects.length) {
    els.topbarSubtext.textContent = "No assigned projects yet.";
    return;
  }

  els.topbarSubtext.textContent = `${projects.length} assigned projects · ${activeProjects} active · ${recentMessages} recent messages`;
}

function renderProjects() {
  if (!els.projectsTable) return;

  const rows = getVisibleProjects().slice(0, 6);

  const fragment = document.createDocumentFragment();
  fragment.appendChild(createProjectHeadRow());

  if (rows.length === 0) {
    fragment.appendChild(createStateBlock("No projects available"));
    els.projectsTable.replaceChildren(fragment);
    return;
  }

  for (const project of rows) {
    fragment.appendChild(createProjectRow(project));
  }

  els.projectsTable.replaceChildren(fragment);
}

function renderMessages() {
  if (!els.messageList) return;

  const visibleProjectIds = new Set(getVisibleProjects().map((project) => project.id));

  const rows = [...state.messages]
    .filter((message) => visibleProjectIds.has(message.projectId))
    .sort((a, b) => getTimeMs(b.createdAt || b.timestamp) - getTimeMs(a.createdAt || a.timestamp))
    .slice(0, 5);

  const fragment = document.createDocumentFragment();

  if (rows.length === 0) {
    els.messageList.replaceChildren(createStateBlock("No messages available"));
    return;
  }

  for (const message of rows) {
    const sender = state.usersById.get(message.senderId);
    const project = state.projectsById.get(message.projectId);

    fragment.appendChild(
      createMessageItem({
        projectName: getProjectTitle(project),
        senderName: getDisplayName(sender) || message.senderName || "Unknown sender",
        preview: truncateText(message.text || message.message || "", 120),
        time: formatRelativeTime(message.createdAt || message.timestamp),
      })
    );
  }

  els.messageList.replaceChildren(fragment);
}

function renderActivity() {
  if (!els.activityList) return;

  const visibleProjectIds = new Set(getVisibleProjects().map((project) => project.id));

  const rows = [...state.activity]
    .filter((item) => item.targetType !== "project" || visibleProjectIds.has(item.targetId))
    .sort((a, b) => getTimeMs(b.timestamp) - getTimeMs(a.timestamp))
    .slice(0, 8);

  const fragment = document.createDocumentFragment();

  if (rows.length === 0) {
    els.activityList.replaceChildren(createStateBlock("No recent activity"));
    return;
  }

  for (const item of rows) {
    const actor = state.usersById.get(item.userId);
    const project = state.projectsById.get(item.targetType === "project" ? item.targetId : null);

    fragment.appendChild(
      createActivityItem({
        title: item.action || "Update",
        text: buildActivityDescription(item, project),
        projectName: project ? getProjectTitle(project) : humanize(item.targetType || "activity"),
        creatorName: getDisplayName(actor) || "System",
        time: formatRelativeTime(item.timestamp),
      })
    );
  }

  els.activityList.replaceChildren(fragment);
}

function renderNotifications() {
  if (!els.notificationList || !els.notificationCount) return;

  const unreadCount = state.notifications.filter((notification) => !isRead(notification)).length;
  els.notificationCount.textContent = String(unreadCount);

  const rows = [...state.notifications]
    .sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt))
    .slice(0, 8);

  const fragment = document.createDocumentFragment();

  if (rows.length === 0) {
    els.notificationList.replaceChildren(createStateBlock("No notifications"));
    return;
  }

  for (const notification of rows) {
    fragment.appendChild(
      createNotificationItem({
        title: notification.title || "Notification",
        time: formatRelativeTime(notification.createdAt),
        read: isRead(notification),
      })
    );
  }

  els.notificationList.replaceChildren(fragment);
}

function createProjectHeadRow() {
  const row = document.createElement("div");
  row.className = "project-head-row";

  ["Project", "Client", "Progress", "Status", "Due Date", ""].forEach((label) => {
    const cell = document.createElement("div");
    cell.textContent = label;
    row.appendChild(cell);
  });

  return row;
}

function createProjectRow(project) {
  const row = document.createElement("div");
  row.className = "project-row";
  row.tabIndex = 0;
  row.setAttribute("role", "link");
  row.setAttribute("aria-label", `Open ${getProjectTitle(project)}`);

  const client = state.usersById.get(project.clientId);
  const projectTitle = getProjectTitle(project);
  const clientName = getDisplayName(client) || "Unknown client";
  const progressValue = clampNumber(project.progress, 0, 100);

  const titleCell = document.createElement("div");
  titleCell.className = "project-name";
  titleCell.textContent = projectTitle;

  const clientCell = document.createElement("div");
  clientCell.className = "project-client";
  clientCell.textContent = clientName;

  const progressCell = document.createElement("div");
  progressCell.className = "project-progress";

  const progressWrap = document.createElement("div");
  progressWrap.className = "progress-wrap";

  const progressLabel = document.createElement("span");
  progressLabel.textContent = `${progressValue}%`;

  const progressTrack = document.createElement("div");
  progressTrack.className = "progress-track";
  progressTrack.setAttribute("aria-hidden", "true");

  const progressFill = document.createElement("div");
  progressFill.className = "progress-fill";
  progressFill.style.width = `${progressValue}%`;

  progressTrack.appendChild(progressFill);
  progressWrap.append(progressLabel, progressTrack);
  progressCell.appendChild(progressWrap);

  const statusCell = document.createElement("div");
  statusCell.className = "project-phase";
  statusCell.textContent = humanize(project.status);

  const dueCell = document.createElement("div");
  dueCell.className = "project-due";
  dueCell.textContent = formatDateOrDash(project.dueDate);

  const linkCell = document.createElement("div");
  linkCell.className = "project-link";
  linkCell.setAttribute("aria-hidden", "true");
  linkCell.textContent = "↗";

  row.append(titleCell, clientCell, progressCell, statusCell, dueCell, linkCell);

  const openWorkspace = () => {
    openProjectWorkspace(project.id);
  };

  row.addEventListener("click", openWorkspace);
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWorkspace();
    }
  });

  return row;
}

function createMessageItem({ projectName, senderName, preview, time }) {
  const item = document.createElement("article");
  item.className = "message-item";

  const top = document.createElement("div");
  top.className = "message-top";

  const left = document.createElement("div");
  const project = createCell("div", "message-project", projectName);
  const sender = createCell("div", "message-sender", senderName);
  left.append(project, sender);

  const timeEl = createCell("div", "message-time", time);

  top.append(left, timeEl);

  const previewEl = document.createElement("p");
  previewEl.className = "message-preview";
  previewEl.textContent = preview || "No message text";

  item.append(top, previewEl);
  return item;
}

function createActivityItem({ title, text, projectName, creatorName, time }) {
  const item = document.createElement("article");
  item.className = "activity-item";

  const marker = document.createElement("span");
  marker.className = "activity-marker";
  marker.setAttribute("aria-hidden", "true");

  const meta = document.createElement("div");
  meta.className = "activity-meta";

  const top = document.createElement("div");
  top.className = "activity-top";

  const left = document.createElement("div");
  const activityTitle = createCell("div", "activity-title", title);
  const activityText = createCell("div", "activity-text", text);
  left.append(activityTitle, activityText);

  const timeEl = createCell("div", "activity-time", time);

  top.append(left, timeEl);

  const projectLine = document.createElement("div");
  projectLine.className = "activity-text";
  projectLine.textContent = `${projectName} · ${creatorName}`;

  meta.append(top, projectLine);
  item.append(marker, meta);
  return item;
}

function createNotificationItem({ title, time, read }) {
  const item = document.createElement("div");
  item.className = "dropdown-item";
  item.style.opacity = read ? "0.72" : "1";

  const strong = document.createElement("strong");
  strong.textContent = title;

  const span = document.createElement("span");
  span.textContent = time;

  item.append(strong, span);
  return item;
}

function createCell(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function createStateBlock(message) {
  const block = document.createElement("div");
  block.style.padding = "18px 16px";
  block.style.color = "var(--muted)";
  block.style.lineHeight = "1.6";
  block.style.border = "1px dashed rgba(255,255,255,0.10)";
  block.style.borderRadius = "16px";
  block.style.background = "rgba(255,255,255,0.02)";
  block.textContent = message;
  return block;
}

function showLoadingState() {
  setStatLoading();
  renderProjectState("Connecting to Firebase…");
  renderListState(els.messageList, "Connecting to Firebase…");
  renderListState(els.activityList, "Connecting to Firebase…");
  renderNotificationState("Connecting to Firebase…");
}

function setStatLoading() {
  els.statCards.forEach((card) => {
    const value = card.querySelector("h2");
    const sub = card.querySelector(".stat-sub");
    if (value) value.textContent = "—";
    if (sub) sub.textContent = "Loading…";
  });
}

function setStatCard(index, value, subtitle) {
  const card = els.statCards[index];
  if (!card) return;

  const valueEl = card.querySelector("h2");
  const subEl = card.querySelector(".stat-sub");

  if (valueEl) valueEl.textContent = value;
  if (subEl) subEl.textContent = subtitle;
}

function renderProjectState(message) {
  if (!els.projectsTable) return;
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createProjectHeadRow());
  fragment.appendChild(createStateBlock(message));
  els.projectsTable.replaceChildren(fragment);
}

function renderListState(container, message) {
  if (!container) return;
  container.replaceChildren(createStateBlock(message));
}

function renderNotificationState(message) {
  if (!els.notificationList) return;
  els.notificationList.replaceChildren(createStateBlock(message));
}

function setWelcomeName(fullName) {
  if (!els.welcomeHeading) return;
  els.welcomeHeading.textContent = fullName;
}

function setTopbarSubtitle(text) {
  if (!els.topbarSubtext) return;
  els.topbarSubtext.textContent = text;
}

function setSidebar(open) {
  if (!els.sidebar || !els.backdrop) return;
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function closeNotifications() {
  if (!els.notificationDropdown || !els.notificationBtn) return;
  els.notificationDropdown.hidden = true;
  els.notificationBtn.setAttribute("aria-expanded", "false");
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
}

function buildMap(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function mapDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function getDisplayName(user) {
  if (!user) return "";
  return (
    user.fullName ||
    user.name ||
    user.displayName ||
    user.username ||
    user.email?.split("@")[0] ||
    ""
  );
}

function getProjectTitle(project) {
  if (!project) return "Unknown project";
  return (
    project.title ||
    project.name ||
    project.projectName ||
    project.project_code ||
    project.code ||
    "Untitled project"
  );
}

function buildActivityDescription(item, project) {
  const targetLabel = project ? getProjectTitle(project) : humanize(item.targetType || "activity");
  const action = item.action || "Updated item";
  return `${action} · ${targetLabel}`;
}

function isActiveUser(user) {
  return user?.active !== false;
}

function isRead(notification) {
  return Boolean(notification?.read || notification?.isRead || notification?.is_read);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function humanize(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function truncateText(text, maxLength) {
  const str = String(text || "");
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDateOrDash(value) {
  const date = toDate(value);
  if (!date) return "—";
  return shortDateFormatter.format(date);
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

  return shortDateFormatter.format(date);
}

function toDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && typeof value.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function getTimeMs(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function canAccessProject(profile, project) {
  if (!profile || !project) return false;

  const role = normalizeText(profile.role);
  if (role === "admin") return true;

  const uid = profile.id;
  const isManager = project.projectManagerId === uid;
  const isAssigned = Array.isArray(project.assignedDevelopers) && project.assignedDevelopers.includes(uid);

  return isManager || isAssigned;
}

function openProjectWorkspace(projectId) {
  if (!projectId) return;

  try {
    sessionStorage.setItem("ews:selectedProjectId", projectId);
  } catch {
    // Ignore session storage failures.
  }

  window.location.href = `../project-workspace/index.html?projectId=${encodeURIComponent(projectId)}`;
}

function openPrimaryWorkspace() {
  const project = getVisibleProjects()[0];
  if (!project) {
    alert("No assigned project found yet.");
    return;
  }

  openProjectWorkspace(project.id);
}