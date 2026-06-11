import { setupShell, renderNotificationDropdown, setActiveNav } from "../shared/ui.js";
import { auth, db } from "../../js/firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

setupShell();
renderNotificationDropdown();
setActiveNav("project");

const LOGIN_ROUTE = "/index/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/team/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  team: "/team/dashboard/index.html",
  client: "/client/dashboard/index.html",
};

const PHASES = ["Planning", "Design", "Development", "Testing", "Launch"];
const PHASE_TO_STATUS = {
  Planning: "planning",
  Design: "active",
  Development: "active",
  Testing: "review",
  Launch: "completed",
};
const PHASE_PROGRESS = {
  Planning: 10,
  Design: 30,
  Development: 60,
  Testing: 85,
  Launch: 100,
};
const STATUS_TO_LABEL = {
  planning: "Planning",
  active: "Development",
  review: "Testing",
  completed: "Launch",
  paused: "On Hold",
  cancelled: "Cancelled",
  development: "Development",
  testing: "Testing",
  onhold: "On Hold",
};

const state = {
  user: null,
  profile: null,
  projectId: null,
  project: null,
  usersById: new Map(),
  files: [],
  activities: [],
  activeTab: "overview",
  ready: false,
  unsubscribers: [],
  userUnsubs: new Map(),
};

const el = (id) => document.getElementById(id);

const els = {
  sidebar: el("sidebar"),
  backdrop: el("backdrop"),
  openSidebar: el("openSidebar"),
  logoutBtn: document.querySelector(".logout-btn"),
  projectName: el("projectName"),
  projectMeta: el("projectMeta"),
  summaryProgress: el("summaryProgress"),
  summaryPhase: el("summaryPhase"),
  summaryBudget: el("summaryBudget"),
  summaryDueDate: el("summaryDueDate"),
  detailName: el("detailName"),
  detailDescription: el("detailDescription"),
  detailClient: el("detailClient"),
  detailId: el("detailId"),
  detailStatus: el("detailStatus"),
  detailStartDate: el("detailStartDate"),
  detailDueDate: el("detailDueDate"),
  detailPhase: el("detailPhase"),
  detailBudget: el("detailBudget"),
  overviewTeam: el("overviewTeam"),
  timelineList: el("timelineList"),
  fileGrid: el("fileGrid"),
  updatesList: el("updatesList"),
  teamList: el("teamList"),
  tabs: [...document.querySelectorAll("#tabs .tab")],
};

document.addEventListener("DOMContentLoaded", init);

function init() {
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

  els.openSidebar?.addEventListener("click", () => setSidebar(true));
  els.backdrop?.addEventListener("click", () => setSidebar(false));

  els.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab || "overview";
      renderTabs();
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".sidebar") && !event.target.closest("#openSidebar")) {
      setSidebar(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSidebar(false);
  });

  document.addEventListener("click", (event) => {
    const fileBtn = event.target.closest("[data-action='open-file']");
    if (fileBtn) {
      openFile(fileBtn.dataset.url);
    }
  });
}

async function handleAuthChange(user) {
  teardownListeners();
  state.user = user;
  state.profile = null;
  state.project = null;
  state.projectId = null;
  state.usersById = new Map();
  state.files = [];
  state.activities = [];
  state.ready = false;

  if (!user) {
    window.location.href = LOGIN_ROUTE;
    return;
  }

  try {
    const profile = await loadUserProfile(user.uid);

    if (!profile || normalizeRole(profile.role) !== "client" || profile.active === false) {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    const projectId = await resolveProjectId(user.uid);
    if (!projectId) {
      window.location.href = ROLE_REDIRECTS.client;
      return;
    }

    const projectSnap = await getDoc(doc(db, "projects", projectId));
    if (!projectSnap.exists()) {
      window.location.href = ROLE_REDIRECTS.client;
      return;
    }

    const project = normalizeProject({ id: projectSnap.id, ...projectSnap.data() });

    if (project.clientId !== profile.id) {
      window.location.href = ROLE_REDIRECTS.client;
      return;
    }

    state.profile = profile;
    state.projectId = projectId;
    state.project = project;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch {
      // non-blocking
    }

    startListeners();
    state.ready = true;
    renderAll();
  } catch (error) {
    console.error("Client project workspace failed:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

async function resolveProjectId(uid) {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("projectId") || params.get("project") || sessionStorage.getItem("ews:selectedProjectId");

  if (requestedId) return requestedId;

  const snap = await getDocs(query(collection(db, "projects"), where("clientId", "==", uid)));
  if (snap.empty) return null;

  const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  projects.sort((a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt));
  return projects[0]?.id || null;
}

function startListeners() {
  if (!state.projectId) return;

  const projectUnsub = onSnapshot(
    doc(db, "projects", state.projectId),
    (snapshot) => {
      if (!snapshot.exists()) {
        window.location.href = ROLE_REDIRECTS.client;
        return;
      }

      state.project = normalizeProject({ id: snapshot.id, ...snapshot.data() });
      syncProjectUserListeners();
      renderAll();
    },
    handleListenerError("project")
  );
  state.unsubscribers.push(projectUnsub);

  const filesUnsub = onSnapshot(
    query(collection(db, "files"), where("projectId", "==", state.projectId), orderBy("createdAt", "desc")),
    (snapshot) => {
      state.files = snapshot.docs.map(mapDoc);
      renderFiles();
    },
    handleListenerError("files")
  );
  state.unsubscribers.push(filesUnsub);

  const updatesUnsub = onSnapshot(
    query(collection(db, "activityLogs"), where("targetId", "==", state.projectId), orderBy("timestamp", "desc")),
    (snapshot) => {
      state.activities = snapshot.docs.map(mapDoc);
      renderUpdates();
    },
    handleListenerError("activityLogs")
  );
  state.unsubscribers.push(updatesUnsub);

  syncProjectUserListeners();
}

function syncProjectUserListeners() {
  if (!state.project) return;

  const ids = new Set([
    state.project.clientId,
    state.project.projectManagerId,
    ...(Array.isArray(state.project.assignedDevelopers) ? state.project.assignedDevelopers : []),
  ].filter(Boolean));

  for (const [uid, unsub] of state.userUnsubs.entries()) {
    if (!ids.has(uid)) {
      try { unsub(); } catch {}
      state.userUnsubs.delete(uid);
      state.usersById.delete(uid);
    }
  }

  ids.forEach((uid) => {
    if (state.userUnsubs.has(uid)) return;

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          state.usersById.delete(uid);
          renderAll();
          return;
        }
        state.usersById.set(uid, { id: snapshot.id, ...snapshot.data() });
        renderAll();
      },
      handleListenerError(`user:${uid}`)
    );

    state.userUnsubs.set(uid, unsub);
  });
}

function teardownListeners() {
  while (state.unsubscribers.length) {
    const unsub = state.unsubscribers.pop();
    try { unsub(); } catch {}
  }

  for (const unsub of state.userUnsubs.values()) {
    try { unsub(); } catch {}
  }
  state.userUnsubs.clear();
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

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function normalizeProject(project) {
  const status = normalizeStatus(project.status);
  const currentPhase = project.currentPhase || phaseFromStatus(status);

  return {
    ...project,
    status,
    currentPhase,
    progress: clampNumber(project.progress ?? PHASE_PROGRESS[currentPhase] ?? 0, 0, 100),
  };
}

function normalizeStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "development") return "active";
  if (s === "testing") return "review";
  if (s === "onhold" || s === "hold") return "paused";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (["planning", "active", "review", "completed", "paused"].includes(s)) return s;
  return "planning";
}

function phaseFromStatus(status) {
  return STATUS_TO_LABEL[normalizeStatus(status)] || "Planning";
}

function getCurrentPhase(project) {
  return project?.currentPhase || phaseFromStatus(project?.status);
}

function getProjectProgress(project) {
  return clampNumber(project?.progress ?? PHASE_PROGRESS[getCurrentPhase(project)] ?? 0, 0, 100);
}

function humanizeStatus(status) {
  return STATUS_TO_LABEL[normalizeStatus(status)] || humanizeRole(status);
}

function humanizeRole(role) {
  return String(role || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
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

  return formatDate(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getUser(uid) {
  return state.usersById.get(uid) || null;
}

function getUserName(user) {
  if (!user) return "";
  return user.name || user.fullName || user.displayName || user.email?.split("@")[0] || "";
}

function renderAll() {
  if (!state.project) {
    showLoadingState();
    return;
  }

  renderHeader();
  renderOverview();
  renderTabs();
  renderTimeline();
  renderFiles();
  renderUpdates();
  renderTeam();
}

function renderTabs() {
  els.tabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.activeTab);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === state.activeTab);
  });
}

function renderHeader() {
  const project = state.project;
  const client = getUser(project.clientId);
  const manager = getUser(project.projectManagerId);

  els.projectName.textContent = project.title || "Project Workspace";
  els.projectMeta.textContent = `Project ID ${project.id} • Client ${getUserName(client) || "—"} • Manager ${getUserName(manager) || "—"}`;

  els.summaryProgress.textContent = `${getProjectProgress(project)}%`;
  els.summaryPhase.textContent = getCurrentPhase(project);
  els.summaryBudget.textContent = formatCurrency(project.budget);
  els.summaryDueDate.textContent = formatDate(project.dueDate);

  els.detailName.textContent = project.title || "—";
  els.detailDescription.textContent = project.description || "—";
  els.detailClient.textContent = getUserName(client) || "—";
  els.detailId.textContent = project.id || "—";
  els.detailStatus.textContent = humanizeStatus(project.status);
  els.detailStartDate.textContent = formatDate(project.startDate);
  els.detailDueDate.textContent = formatDate(project.dueDate);
  els.detailPhase.textContent = getCurrentPhase(project);
  els.detailBudget.textContent = formatCurrency(project.budget);
}

function renderOverview() {
  if (!els.overviewTeam) return;

  const project = state.project;
  const chips = [];

  const client = getUser(project.clientId);
  const manager = getUser(project.projectManagerId);
  const developers = (Array.isArray(project.assignedDevelopers) ? project.assignedDevelopers : [])
    .map((uid) => getUser(uid))
    .filter(Boolean);

  if (client) chips.push(chipMarkup(`Client: ${getUserName(client)}`));
  if (manager) chips.push(chipMarkup(`Manager: ${getUserName(manager)}`));
  developers.forEach((user) => chips.push(chipMarkup(`${getUserName(user)} • ${humanizeRole(user.role)}`)));

  els.overviewTeam.innerHTML = chips.length
    ? chips.join("")
    : `<div class="empty-state">No team members assigned yet.</div>`;
}

function renderTimeline() {
  if (!els.timelineList) return;

  const phase = getCurrentPhase(state.project);
  const currentIndex = PHASES.indexOf(phase);
  const progress = getProjectProgress(state.project);

  els.timelineList.innerHTML = PHASES.map((itemPhase, index) => {
    const done = index < currentIndex;
    const current = index === currentIndex;
    const marker = done ? "✓" : current ? "●" : "○";

    return `
      <div class="timeline-item ${done ? "done" : current ? "current" : ""}">
        <div class="timeline-marker">${marker}</div>
        <div class="timeline-content">
          <div class="timeline-title">${itemPhase}</div>
          <div class="timeline-desc">${itemPhase} stage with current completion at ${progress}%.</div>
        </div>
        <div class="timeline-action">
          <button class="small-btn" type="button" disabled>${current ? "Current Phase" : done ? "Completed" : "Pending"}</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderFiles() {
  if (!els.fileGrid) return;

  if (!state.files.length) {
    els.fileGrid.innerHTML = `<div class="empty-state">No files uploaded yet.</div>`;
    return;
  }

  els.fileGrid.innerHTML = state.files.map((file) => `
    <div class="file-card">
      <div class="file-name">${escapeHtml(file.fileName || "Untitled file")}</div>
      <div class="file-meta">
        Uploaded By: ${escapeHtml(getUserName(getUser(file.uploadedBy)) || "Unknown")}<br />
        Upload Date: ${formatDate(file.createdAt)}
      </div>
      <div class="file-actions">
        <button class="small-btn" data-action="open-file" data-url="${escapeAttr(file.fileUrl)}" type="button">Download</button>
      </div>
    </div>
  `).join("");
}

function renderUpdates() {
  if (!els.updatesList) return;

  if (!state.activities.length) {
    els.updatesList.innerHTML = `<div class="empty-state">No updates yet.</div>`;
    return;
  }

  els.updatesList.innerHTML = state.activities.map((entry) => {
    const actor = getUser(entry.userId);
    return `
      <div class="update-card">
        <div class="update-title">${escapeHtml(entry.action || "Update")}</div>
        <div class="update-meta">${escapeHtml(entry.details || "Project activity logged.")}</div>
        <div class="update-meta" style="margin-top:10px">
          ${formatRelativeTime(entry.timestamp)} • Created by ${escapeHtml(getUserName(actor) || "System")}
        </div>
      </div>
    `;
  }).join("");
}

function renderTeam() {
  if (!els.teamList) return;

  const members = [];
  const project = state.project;
  const client = getUser(project.clientId);
  const manager = getUser(project.projectManagerId);

  if (client) {
    members.push({
      name: getUserName(client),
      role: "client",
      label: "Client",
    });
  }

  if (manager) {
    members.push({
      name: getUserName(manager),
      role: manager.role || "manager",
      label: "Project Manager",
    });
  }

  (Array.isArray(project.assignedDevelopers) ? project.assignedDevelopers : [])
    .map((uid) => getUser(uid))
    .filter(Boolean)
    .forEach((user) => {
      members.push({
        name: getUserName(user),
        role: user.role || "developer",
        label: "Team Member",
      });
    });

  if (!members.length) {
    els.teamList.innerHTML = `<div class="empty-state">No members assigned yet.</div>`;
    return;
  }

  els.teamList.innerHTML = members.map((member) => `
    <div class="team-card">
      <div class="team-name">${escapeHtml(member.name)}</div>
      <div class="team-role">${escapeHtml(humanizeRole(member.role))}${member.label ? ` • ${escapeHtml(member.label)}` : ""}</div>
    </div>
  `).join("");
}

function chipMarkup(text) {
  return `<div class="chip">${escapeHtml(text)}</div>`;
}

function showLoadingState() {
  if (els.projectName) els.projectName.textContent = "Loading...";
  if (els.projectMeta) els.projectMeta.textContent = "Preparing workspace…";
  if (els.summaryProgress) els.summaryProgress.textContent = "0%";
  if (els.summaryPhase) els.summaryPhase.textContent = "—";
  if (els.summaryBudget) els.summaryBudget.textContent = "—";
  if (els.summaryDueDate) els.summaryDueDate.textContent = "—";
  if (els.detailName) els.detailName.textContent = "—";
  if (els.detailDescription) els.detailDescription.textContent = "—";
  if (els.overviewTeam) els.overviewTeam.innerHTML = `<div class="empty-state">Loading project data…</div>`;
  if (els.timelineList) els.timelineList.innerHTML = `<div class="empty-state">Loading…</div>`;
  if (els.fileGrid) els.fileGrid.innerHTML = `<div class="empty-state">Loading…</div>`;
  if (els.updatesList) els.updatesList.innerHTML = `<div class="empty-state">Loading…</div>`;
  if (els.teamList) els.teamList.innerHTML = `<div class="empty-state">Loading…</div>`;
}

function setSidebar(open) {
  if (!els.sidebar || !els.backdrop) return;
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
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

function openFile(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
