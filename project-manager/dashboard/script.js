import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const LOGIN_ROUTE = "../../index/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/project-manager/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  client: "/client/dashboard/index.html",
};

const ACTIVE_PROJECT_STATUSES = new Set(["planning", "active", "review", "paused"]);

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
  openSidebarBtn: document.getElementById("openSidebar"),
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  logoutBtn: document.querySelector(".logout-btn"),
  newProjectBtn: document.getElementById("newProjectBtn"),
  welcomeHeading: document.querySelector(".topbar h1"),
  topbarSubtext: document.querySelector(".topbar .subtext"),
  statProjects: document.getElementById("statProjects"),
  statMembers: document.getElementById("statMembers"),
  statOpenTasks: document.getElementById("statOpenTasks"),
  statProgress: document.getElementById("statProgress"),
};

const state = {
  uid: null,
  profile: null,
  users: [],
  projects: [],
  tasks: [],
  messages: [],
  activity: [],
  usersById: new Map(),
  projectsById: new Map(),
  unsubscribe: [],
  ready: false,
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindUi();

  onAuthStateChanged(auth, async (user) => {
    teardown();
    state.ready = false;
    state.uid = null;
    state.profile = null;

    if (!user) {
      window.location.href = LOGIN_ROUTE;
      return;
    }

    let profile;
    try {
      profile = await loadProfile(user.uid);
    } catch (err) {
      console.error("Profile load failed:", err);
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    if (!profile || profile.active === false) {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    const role = normalizeText(profile.role);
    if (role !== "manager") {
      await safeSignOut();
      window.location.href = ROLE_REDIRECTS[role] || LOGIN_ROUTE;
      return;
    }

    state.uid = user.uid;
    state.profile = profile;

    if (els.welcomeHeading) {
      els.welcomeHeading.textContent = `Welcome Back, ${profile.name || "Manager"}`;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch {
      // Non-blocking.
    }

    state.ready = true;
    startListeners(user.uid);
  });
}

function bindUi() {
  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", async () => {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
    });
  }

  if (els.newProjectBtn) {
    els.newProjectBtn.addEventListener("click", () => {
      window.location.href = "../projects/index.html";
    });
  }

  if (els.openSidebarBtn && els.sidebar && els.backdrop) {
    els.openSidebarBtn.addEventListener("click", () => {
      els.sidebar.classList.add("open");
      els.backdrop.hidden = false;
    });
  }

  if (els.backdrop && els.sidebar) {
    els.backdrop.addEventListener("click", () => {
      els.sidebar.classList.remove("open");
      els.backdrop.hidden = true;
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.sidebar) {
      els.sidebar.classList.remove("open");
      if (els.backdrop) els.backdrop.hidden = true;
    }
  });

  if (els.projectsTable) {
    els.projectsTable.addEventListener("click", (event) => {
      const openBtn = event.target.closest("[data-open-project]");
      if (openBtn) {
        openProject(openBtn.dataset.openProject);
      }
    });
  }
}

function startListeners(uid) {
  renderLoadingState();

  state.unsubscribe.push(
    onSnapshot(collection(db, "users"), (snapshot) => {
      state.users = snapshot.docs.map(mapDoc);
      state.usersById = buildMap(state.users);
      render();
    }, handleListenerError("users"))
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "projects"), where("projectManagerId", "==", uid)),
      (snapshot) => {
        state.projects = snapshot.docs.map(mapDoc);
        state.projectsById = buildMap(state.projects);
        render();
      },
      handleListenerError("projects")
    )
  );

  state.unsubscribe.push(
    onSnapshot(
      collection(db, "tasks"),
      (snapshot) => {
        state.tasks = snapshot.docs.map(mapDoc);
        render();
      },
      handleListenerError("tasks")
    )
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "messages"), orderBy("timestamp", "desc")),
      (snapshot) => {
        state.messages = snapshot.docs.map(mapDoc);
        renderMessages();
      },
      handleListenerError("messages")
    )
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "activityLogs"), orderBy("timestamp", "desc")),
      (snapshot) => {
        state.activity = snapshot.docs.map(mapDoc);
        renderActivity();
      },
      handleListenerError("activity logs")
    )
  );
}

function teardown() {
  while (state.unsubscribe.length) {
    const unsubscribe = state.unsubscribe.pop();
    try {
      unsubscribe();
    } catch {
      // Ignore teardown problems.
    }
  }
  state.projects = [];
  state.tasks = [];
  state.messages = [];
  state.activity = [];
  state.users = [];
  state.usersById = new Map();
  state.projectsById = new Map();
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function safeSignOut() {
  try {
    await signOut(auth);
  } catch {
    // Ignore.
  }
}

function render() {
  if (!state.ready) return;

  renderStats();
  renderProjects();
  renderMessages();
  renderActivity();
  renderTopbarSubtitle();
}

function renderStats() {
  const projectIds = new Set(state.projects.map((project) => project.id));
  const managedProjects = state.projects.length;
  const teamMembers = countUniqueTeamMembers(state.projects);
  const openTasks = state.tasks.filter((task) => projectIds.has(task.projectId) && normalizeText(task.status) !== "completed").length;
  const avgProgress = managedProjects
    ? Math.round(state.projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / managedProjects)
    : 0;

  setText(els.statProjects, managedProjects);
  setText(els.statMembers, teamMembers);
  setText(els.statOpenTasks, openTasks);
  setText(els.statProgress, `${avgProgress}%`);
}

function renderTopbarSubtitle() {
  if (!els.topbarSubtext) return;

  const activeProjects = state.projects.filter((project) => ACTIVE_PROJECT_STATUSES.has(normalizeText(project.status))).length;
  const openTasks = state.tasks.filter((task) => normalizeText(task.status) !== "completed" && state.projects.some((project) => project.id === task.projectId)).length;
  const messageCount = state.messages.filter((message) => isRelevantMessage(message)).length;

  els.topbarSubtext.textContent = `${activeProjects} active projects · ${openTasks} open tasks · ${messageCount} relevant messages`;
}

function renderProjects() {
  if (!els.projectsTable) return;

  const sorted = [...state.projects].sort((a, b) => getTimeMs(b.updatedAt || b.createdAt) - getTimeMs(a.updatedAt || a.createdAt));
  const rows = sorted.slice(0, 6);

  const fragment = document.createDocumentFragment();
  fragment.appendChild(createProjectHeadRow());

  if (rows.length === 0) {
    fragment.appendChild(createStateBlock("No projects have been assigned to you yet."));
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

  const rows = [...state.messages].filter(isRelevantMessage).slice(0, 5);
  const fragment = document.createDocumentFragment();

  if (rows.length === 0) {
    els.messageList.replaceChildren(createStateBlock("No messages available"));
    return;
  }

  for (const message of rows) {
    const sender = state.usersById.get(message.senderId);
    const receiver = state.usersById.get(message.receiverId);
    const project = state.projectsById.get(message.projectId);

    fragment.appendChild(
      createMessageItem({
        projectName: getProjectTitle(project),
        senderName: getDisplayName(sender) || getDisplayName(receiver) || "Unknown sender",
        preview: truncateText(message.message, 120),
        time: formatRelativeTime(message.timestamp),
      })
    );
  }

  els.messageList.replaceChildren(fragment);
}

function renderActivity() {
  if (!els.activityList) return;

  const rows = [...state.activity].filter(isRelevantActivity).slice(0, 10);
  const fragment = document.createDocumentFragment();

  if (rows.length === 0) {
    els.activityList.replaceChildren(createStateBlock("No recent activity"));
    return;
  }

  for (const item of rows) {
    const actor = state.usersById.get(item.userId);
    const project = getProjectForActivity(item);

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

function createProjectHeadRow() {
  const row = document.createElement("div");
  row.className = "project-head-row";

  ["Project", "Client", "Status", "Open Tasks", "Deadline", "Progress", ""].forEach((label) => {
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
  const taskCount = state.tasks.filter((task) => task.projectId === project.id).length;
  const openTaskCount = state.tasks.filter((task) => task.projectId === project.id && normalizeText(task.status) !== "completed").length;

  const titleCell = document.createElement("div");
  titleCell.className = "project-name";
  titleCell.textContent = projectTitle;

  const clientCell = document.createElement("div");
  clientCell.className = "project-client";
  clientCell.textContent = clientName;

  const statusCell = document.createElement("div");
  statusCell.className = "project-phase";
  statusCell.textContent = humanize(project.status);

  const tasksCell = document.createElement("div");
  tasksCell.className = "project-phase";
  tasksCell.textContent = `${openTaskCount}/${taskCount}`;

  const dueCell = document.createElement("div");
  dueCell.className = "project-due";
  dueCell.textContent = formatDateOrDash(project.dueDate);

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

  const linkCell = document.createElement("div");
  linkCell.className = "project-link";
  linkCell.setAttribute("aria-hidden", "true");
  linkCell.textContent = "↗";

  row.append(titleCell, clientCell, statusCell, tasksCell, dueCell, progressCell, linkCell);

  const open = () => openProject(project.id);
  row.addEventListener("click", open);
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
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

function createCell(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function createStateBlock(message) {
  const block = document.createElement("div");
  block.className = "empty-state";
  block.textContent = message;
  return block;
}

function renderLoadingState() {
  setText(els.statProjects, "—");
  setText(els.statMembers, "—");
  setText(els.statOpenTasks, "—");
  setText(els.statProgress, "—");

  if (els.projectsTable) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(createProjectHeadRow());
    fragment.appendChild(createStateBlock("Connecting to Firebase…"));
    els.projectsTable.replaceChildren(fragment);
  }

  if (els.messageList) {
    els.messageList.replaceChildren(createStateBlock("Connecting to Firebase…"));
  }

  if (els.activityList) {
    els.activityList.replaceChildren(createStateBlock("Connecting to Firebase…"));
  }

  if (els.topbarSubtext) {
    els.topbarSubtext.textContent = "Connecting to Firebase…";
  }
}

function openProject(projectId) {
  try {
    sessionStorage.setItem("ews:selectedProjectId", projectId);
  } catch {
    // Ignore storage failures.
  }
  window.location.href = "../projects/index.html";
}

function isRelevantMessage(message) {
  if (!message) return false;
  const projectIds = new Set(state.projects.map((project) => project.id));
  return (
    message.senderId === state.uid ||
    message.receiverId === state.uid ||
    projectIds.has(message.projectId)
  );
}

function isRelevantActivity(item) {
  if (!item) return false;
  const projectIds = new Set(state.projects.map((project) => project.id));
  if (item.userId === state.uid) return true;
  if (projectIds.has(item.targetId)) return true;

  if (item.targetType === "task" && item.targetId) {
    const task = state.tasks.find((t) => t.id === item.targetId);
    return task ? projectIds.has(task.projectId) : false;
  }

  if (item.targetType === "invoice" && item.targetId) {
    const invoiceProject = state.projects.find((project) => project.id === item.projectId || project.id === item.targetId);
    return Boolean(invoiceProject);
  }

  return false;
}

function getProjectForActivity(item) {
  if (!item) return null;

  if (item.projectId && state.projectsById.has(item.projectId)) {
    return state.projectsById.get(item.projectId);
  }

  if (item.targetType === "project" && state.projectsById.has(item.targetId)) {
    return state.projectsById.get(item.targetId);
  }

  if (item.targetType === "task") {
    const task = state.tasks.find((t) => t.id === item.targetId);
    if (task) return state.projectsById.get(task.projectId) || null;
  }

  return null;
}

function buildActivityDescription(item, project) {
  const targetLabel = project ? getProjectTitle(project) : humanize(item.targetType || "activity");
  const action = item.action || "Updated item";
  return `${action} · ${targetLabel}`;
}

function countUniqueTeamMembers(projects) {
  const ids = new Set();
  for (const project of projects) {
    for (const developerId of project.assignedDevelopers || []) {
      if (developerId) ids.add(developerId);
    }
  }
  return ids.size;
}

function setText(el, value) {
  if (el) el.textContent = value;
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
    user.name ||
    user.displayName ||
    user.fullName ||
    user.username ||
    user.email?.split("@")[0] ||
    ""
  );
}

function getProjectTitle(project) {
  if (!project) return "Unknown project";
  return project.title || project.name || project.projectName || "Untitled project";
}

function humanize(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatDateOrDash(value) {
  const date = toDate(value);
  return date ? shortDateFormatter.format(date) : "—";
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

function truncateText(text, maxLength) {
  const str = String(text || "");
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function getTimeMs(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
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

function isCurrentMonth(value) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}
