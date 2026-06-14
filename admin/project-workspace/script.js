import { auth, db, storage } from "../../js/firebase.js";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const LOGIN_ROUTE = "../../index/index.html";
const PROJECTS_ROUTE = "../projects/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/project-manager/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  team: "/team/dashboard/index.html",
  cold_caller: "/cold-caller/dashboard/index.html",
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
  users: [],
  files: [],
  messages: [],
  activities: [],
  activeTab: "overview",
  canEditProject: false,
  canManageTeam: false,
  canUploadFiles: false,
  canCreateInvoices: false,
  canDeleteProject: false,
  unsubscribe: [],
  ready: false,
  promptCallback: null,
  deletePending: false,
  syncingPaymentRecords: false,
};

const el = (id) => document.getElementById(id);

const els = {
  sidebar: el("sidebar"),
  backdrop: el("backdrop"),
  openSidebar: el("openSidebar"),
  closeSidebar: el("closeSidebar"),
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
  tabs: [...document.querySelectorAll("#tabs .tab")],
  phaseSelect: el("phaseSelect"),
  timelineList: el("timelineList"),
  fileGrid: el("fileGrid"),
  fileInput: el("fileInput"),
  uploadBtn: el("uploadBtn"),
  updatesList: el("updatesList"),
  teamList: el("teamList"),
  editBtn: el("editBtn"),
  archiveBtn: el("archiveBtn"),
  deleteBtn: el("deleteBtn"),
  addUpdateBtn: el("addUpdateBtn"),
  addMemberBtn: el("addMemberBtn"),
  modalBackdrop: el("modalBackdrop"),
  deleteModal: el("deleteModal"),
  deleteTitle: el("deleteTitle"),
  deleteText: el("deleteText"),
  cancelDelete: el("cancelDelete"),
  confirmDelete: el("confirmDelete"),
  promptModal: el("promptModal"),
  promptTitle: el("promptTitle"),
  promptText: el("promptText"),
  promptInput: el("promptInput"),
  cancelPrompt: el("cancelPrompt"),
  confirmPrompt: el("confirmPrompt"),
  logoutBtn: document.querySelector(".logout-btn"),
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindStaticUi();
  showLoadingState();

  onAuthStateChanged(auth, async (user) => {
    await handleAuthChange(user);
  });
}

function bindStaticUi() {
  els.logoutBtn?.addEventListener("click", async () => {
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  });

  els.openSidebar?.addEventListener("click", () => setSidebar(true));
  els.closeSidebar?.addEventListener("click", () => setSidebar(false));
  els.backdrop?.addEventListener("click", () => setSidebar(false));

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      renderTabs();
    });
  });

  els.phaseSelect?.addEventListener("change", async () => {
    if (!state.project || !state.canEditProject) return;

    const phase = els.phaseSelect.value;
    await updateProjectPhase(phase);
  });

  els.uploadBtn?.addEventListener("click", () => {
    if (!state.canUploadFiles) {
      alert("You do not have permission to upload files.");
      return;
    }
    els.fileInput.click();
  });

  els.fileInput?.addEventListener("change", async () => {
    if (!state.canUploadFiles) return;
    const file = els.fileInput.files?.[0];
    if (!file) return;
    await uploadProjectFile(file);
    els.fileInput.value = "";
  });

  els.editBtn?.addEventListener("click", async () => {
    if (!state.canEditProject) {
      alert("You do not have permission to edit this project.");
      return;
    }
    await editProjectFlow();
  });

  els.archiveBtn?.addEventListener("click", async () => {
    if (!state.canEditProject) {
      alert("You do not have permission to archive this project.");
      return;
    }
    await archiveProject();
  });

  els.deleteBtn?.addEventListener("click", () => {
    if (!state.canDeleteProject) {
      alert("Only admins can delete a project.");
      return;
    }
    openDeleteModal();
  });

  
  els.addUpdateBtn?.addEventListener("click", async () => {
    if (!state.canEditProject) {
      alert("You do not have permission to add updates.");
      return;
    }
    const title = window.prompt("Update title:");
    if (!title) return;
    const details = window.prompt("Update details (optional):") || "";
    await addProjectUpdate(title.trim(), details.trim());
  });

  els.addMemberBtn?.addEventListener("click", async () => {
    if (!state.canManageTeam) {
      alert("You do not have permission to manage team members.");
      return;
    }
    const email = window.prompt("Enter the team member email to add:");
    if (!email) return;
    await addTeamMemberByEmail(email.trim().toLowerCase());
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.close;
      if (target === "deleteModal") closeDeleteModal();
      if (target === "promptModal") closePromptModal();
    });
  });

  els.cancelDelete?.addEventListener("click", closeDeleteModal);
  els.confirmDelete?.addEventListener("click", async () => {
    if (state.deletePending) return;
    state.deletePending = true;
    try {
      await deleteProject();
    } finally {
      state.deletePending = false;
    }
  });

  els.cancelPrompt?.addEventListener("click", closePromptModal);
  els.confirmPrompt?.addEventListener("click", async () => {
    const value = els.promptInput.value.trim();
    if (!value) return;
    const cb = state.promptCallback;
    closePromptModal();
    if (typeof cb === "function") {
      await cb(value);
    }
  });

  els.modalBackdrop?.addEventListener("click", () => {
    closeDeleteModal();
    closePromptModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSidebar(false);
      closeDeleteModal();
      closePromptModal();
    }

    if ((event.key === "Enter" || event.key === " ") && document.activeElement?.classList?.contains("project-card-link")) {
      event.preventDefault();
      openFile(document.activeElement.dataset.url);
    }
  });

  document.addEventListener("click", async (event) => {
    const target = event.target;

    const downloadBtn = target.closest("[data-action='download-file']");
    if (downloadBtn) {
      openFile(downloadBtn.dataset.url);
      return;
    }

    const deleteFileBtn = target.closest("[data-action='delete-file']");
    if (deleteFileBtn) {
      await deleteFile(deleteFileBtn.dataset.id);
      return;
    }

    const removeMemberBtn = target.closest("[data-action='remove-member']");
    if (removeMemberBtn) {
      await removeTeamMember(removeMemberBtn.dataset.uid);
      return;
    }

    const phaseBtn = target.closest("[data-action='set-phase']");
    if (phaseBtn) {
      await updateProjectPhase(phaseBtn.dataset.phase);
      return;
    }
  });
}

async function handleAuthChange(user) {
  teardownListeners();
  state.user = user;
  state.profile = null;
  state.project = null;
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

    const projectId = resolveProjectId();
    if (!projectId) {
      window.location.href = PROJECTS_ROUTE;
      return;
    }

    const projectSnap = await getDoc(doc(db, "projects", projectId));
    if (!projectSnap.exists()) {
      window.location.href = PROJECTS_ROUTE;
      return;
    }

    const project = normalizeProject({ id: projectSnap.id, ...projectSnap.data() });

    if (!canAccessProject(profile, project)) {
      window.location.href = ROLE_REDIRECTS[normalizeRole(profile.role)] || PROJECTS_ROUTE;
      return;
    }

    state.profile = profile;
    state.projectId = projectId;
    state.project = { ...project };
    updatePermissions();

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking
    }

    startListeners();
    state.ready = true;
    renderAll();
  } catch (error) {
    console.error("Workspace initialization failed:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

function startListeners() {
  if (!state.projectId) return;

  const usersUnsub = onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      state.users = snapshot.docs.map(mapDoc);
      renderAll();
    },
    handleListenerError("users")
  );
  state.unsubscribe.push(usersUnsub);

  const filesUnsub = onSnapshot(
    query(
      collection(db, "files"),
      where("projectId", "==", state.projectId),
      orderBy("createdAt", "desc")
    ),
    (snapshot) => {
      state.files = snapshot.docs.map(mapDoc);
      renderFiles();
    },
    handleListenerError("files")
  );
  state.unsubscribe.push(filesUnsub);

  const invoicesUnsub = onSnapshot(
    query(
      collection(db, "invoices"),
      where("projectId", "==", state.projectId),
      orderBy("issueDate", "desc")
    ),
    (snapshot) => {
      state.invoices = snapshot.docs.map(mapDoc);
      void syncMissingPaymentsFromPaidInvoices();
          },
    handleListenerError("invoices")
  );
  state.unsubscribe.push(invoicesUnsub);

  const paymentsUnsub = onSnapshot(
    collection(db, "payments"),
    (snapshot) => {
      state.payments = snapshot.docs.map(mapDoc);
          },
    handleListenerError("payments")
  );
  state.unsubscribe.push(paymentsUnsub);

  const activitiesUnsub = onSnapshot(
    query(
      collection(db, "activityLogs"),
      where("targetId", "==", state.projectId),
      orderBy("timestamp", "desc")
    ),
    (snapshot) => {
      state.activities = snapshot.docs.map(mapDoc);
      renderUpdates();
    },
    handleListenerError("activity logs")
  );
  state.unsubscribe.push(activitiesUnsub);
}

function teardownListeners() {
  while (state.unsubscribe.length) {
    const unsub = state.unsubscribe.pop();
    try {
      unsub();
    } catch {
      // ignore
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
    // ignore
  }
}

function resolveProjectId() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("projectId") ||
    params.get("project") ||
    sessionStorage.getItem("ews:selectedProjectId") ||
    null
  );
}

function canAccessProject(profile, project) {
  const role = normalizeRole(profile.role);

  if (role === "admin") return true;
  if (role === "client") return project.clientId === profile.id;
  return (
    project.projectManagerId === profile.id ||
    (Array.isArray(project.assignedDevelopers) && project.assignedDevelopers.includes(profile.id))
  );
}

function updatePermissions() {
  const role = normalizeRole(state.profile?.role);

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isDeveloper = role === "developer" || role === "team";
  const isProjectManager = state.project?.projectManagerId === state.profile?.id;
  const isAssigned = Array.isArray(state.project?.assignedDevelopers) && state.project.assignedDevelopers.includes(state.profile?.id);

  state.canEditProject = Boolean(isAdmin || (isManager && isProjectManager));
  state.canManageTeam = Boolean(isAdmin || (isManager && isProjectManager));
  state.canUploadFiles = Boolean(isAdmin || isManager || isProjectManager || isDeveloper || isAssigned);
  state.canCreateInvoices = Boolean(isAdmin || (isManager && isProjectManager));
  state.canDeleteProject = Boolean(isAdmin);

  toggleVisible(els.editBtn, state.canEditProject);
  toggleVisible(els.archiveBtn, state.canEditProject);
  toggleVisible(els.deleteBtn, state.canDeleteProject);
  toggleVisible(els.addUpdateBtn, state.canEditProject || isDeveloper || isAssigned || isAdmin);
  toggleVisible(els.addMemberBtn, state.canManageTeam);
  toggleVisible(els.uploadBtn, state.canUploadFiles);
  toggleVisible(els.generatePdfBtn, state.canCreateInvoices);

  if (els.phaseSelect) {
    els.phaseSelect.disabled = !state.canEditProject;
  }
}

function renderAll() {
  if (!state.project) {
    showLoadingState();
    return;
  }

  renderHeader();
  renderOverview();
  renderTabs();
  renderPhaseSelect();
  renderTimeline();
  renderFiles();
    renderUpdates();
  renderTeam();
  renderActionStates();
}

function renderActionStates() {}

function renderTabs() {
  document.querySelectorAll("#tabs .tab").forEach((btn) => {
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

  const phase = getCurrentPhase(project);
  const progress = getProjectProgress(project);

  els.projectName.textContent = project.title;
  els.projectMeta.textContent = `Project ID ${project.id} • Client ${getUserName(client)} • Manager ${getUserName(manager)}`;

  els.summaryProgress.textContent = `${progress}%`;
  els.summaryPhase.textContent = phase;
  els.summaryBudget.textContent = formatCurrency(project.budget);
  els.summaryDueDate.textContent = formatDate(project.dueDate);

  els.detailName.textContent = project.title;
  els.detailDescription.textContent = project.description;
  els.detailClient.textContent = getUserName(client);
  els.detailId.textContent = project.id;
  els.detailStatus.textContent = humanizeStatus(project.status);
  els.detailStartDate.textContent = formatDate(project.startDate);
  els.detailDueDate.textContent = formatDate(project.dueDate);
  els.detailPhase.textContent = phase;
  els.detailBudget.textContent = formatCurrency(project.budget);
}

function renderOverview() {
  if (!els.overviewTeam) return;

  const project = state.project;
  const client = getUser(project.clientId);
  const manager = getUser(project.projectManagerId);
  const developers = (project.assignedDevelopers || [])
    .map((uid) => getUser(uid))
    .filter(Boolean);

  const chips = [];
  if (client) chips.push(chipMarkup(`Client: ${getUserName(client)}`));
  if (manager) chips.push(chipMarkup(`Manager: ${getUserName(manager)}`));
  developers.forEach((user) => {
    chips.push(chipMarkup(`${getUserName(user)} • ${humanizeRole(user.role)}`));
  });

  els.overviewTeam.innerHTML = chips.length
    ? chips.join("")
    : `<div class="empty-state">No team members assigned yet.</div>`;
}

function renderPhaseSelect() {
  if (!els.phaseSelect) return;

  const phase = getCurrentPhase(state.project);
  els.phaseSelect.innerHTML = PHASES.map((p) => `
    <option value="${p}" ${p === phase ? "selected" : ""}>${p}</option>
  `).join("");

  els.phaseSelect.disabled = !state.canEditProject;
}

function renderTimeline() {
  if (!els.timelineList) return;

  const phase = getCurrentPhase(state.project);
  const currentIndex = PHASES.indexOf(phase);
  const currentProgress = getProjectProgress(state.project);

  els.timelineList.innerHTML = PHASES.map((itemPhase, index) => {
    const done = index < currentIndex;
    const current = index === currentIndex;
    const marker = done ? "✓" : current ? "●" : "○";

    const actionHtml = state.canEditProject
      ? current && itemPhase === "Launch" && state.project.status !== "completed"
        ? `<button class="small-btn" data-action="set-phase" data-phase="Launch" type="button">Mark Complete</button>`
        : current
          ? `<button class="small-btn" type="button" disabled>Current Phase</button>`
          : `<button class="small-btn" data-action="set-phase" data-phase="${itemPhase}" type="button">Set Active</button>`
      : `<button class="small-btn" type="button" disabled>View Only</button>`;

    return `
      <div class="timeline-item ${done ? "done" : current ? "current" : ""}">
        <div class="timeline-marker">${marker}</div>
        <div class="timeline-content">
          <div class="timeline-title">${itemPhase}</div>
          <div class="timeline-desc">
            ${itemPhase} stage with current completion at ${currentProgress}%.
          </div>
        </div>
        <div class="timeline-action">
          ${actionHtml}
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

  els.fileGrid.innerHTML = state.files.map((file) => {
    const canDelete = state.canUploadFiles || file.uploadedBy === state.user?.uid || normalizeRole(state.profile?.role) === "admin";
    return `
      <div class="file-card">
        <div class="file-name">${escapeHtml(file.fileName || "Untitled file")}</div>
        <div class="file-meta">
          Uploaded By: ${escapeHtml(getUserName(getUser(file.uploadedBy)) || "Unknown")}<br />
          Upload Date: ${formatDate(file.createdAt)}
        </div>
        <div class="file-actions">
          <button class="small-btn" data-action="download-file" data-url="${escapeAttr(file.fileUrl)}" type="button">Download</button>
          ${canDelete ? `<button class="small-btn" data-action="delete-file" data-id="${escapeAttr(file.id)}" type="button">Delete</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
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

  const manager = getUser(state.project.projectManagerId);
  if (manager) {
    members.push({
      uid: manager.id,
      name: getUserName(manager),
      role: manager.role || "manager",
      isManager: true,
    });
  }

  (state.project.assignedDevelopers || [])
    .map((uid) => getUser(uid))
    .filter(Boolean)
    .forEach((user) => {
      members.push({
        uid: user.id,
        name: getUserName(user),
        role: user.role || "developer",
        isManager: false,
      });
    });

  if (!members.length) {
    els.teamList.innerHTML = `<div class="empty-state">No members assigned yet.</div>`;
    return;
  }

  els.teamList.innerHTML = members.map((member) => {
    const removable = state.canManageTeam && !member.isManager;
    return `
      <div class="team-card">
        <div class="team-name">${escapeHtml(member.name)}</div>
        <div class="team-role">${escapeHtml(humanizeRole(member.role))}${member.isManager ? " • Project Manager" : ""}</div>
        <div class="team-actions">
          ${removable ? `<button class="small-btn" data-action="remove-member" data-uid="${escapeAttr(member.uid)}" type="button">Remove Member</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function chipMarkup(text) {
  return `<div class="chip">${escapeHtml(text)}</div>`;
}

function showLoadingState() {
  if (els.projectName) els.projectName.textContent = "Loading...";
  if (els.projectMeta) els.projectMeta.textContent = "—";
  if (els.summaryProgress) els.summaryProgress.textContent = "0%";
  if (els.summaryPhase) els.summaryPhase.textContent = "—";
  if (els.summaryBudget) els.summaryBudget.textContent = "—";
  if (els.summaryDueDate) els.summaryDueDate.textContent = "—";
  if (els.detailName) els.detailName.textContent = "—";
  if (els.detailDescription) els.detailDescription.textContent = "—";
  if (els.overviewTeam) els.overviewTeam.innerHTML = `<div class="empty-state">Loading project data…</div>`;
  if (els.timelineList) els.timelineList.innerHTML = `<div class="empty-state">Loading…</div>`;
  if (els.fileGrid) els.fileGrid.innerHTML = `<div class="empty-state">Loading…</div>`;
  if (els.invoiceList) els.invoiceList.innerHTML = `<div class="empty-state">Loading…</div>`;
  if (els.updatesList) els.updatesList.innerHTML = `<div class="empty-state">Loading…</div>`;
  if (els.teamList) els.teamList.innerHTML = `<div class="empty-state">Loading…</div>`;
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
  const s = normalizeStatus(status);
  return STATUS_TO_LABEL[s] || "Planning";
}

function getCurrentPhase(project) {
  return project.currentPhase || phaseFromStatus(project.status);
}

function getProjectProgress(project) {
  return clampNumber(
    project.progress ?? PHASE_PROGRESS[getCurrentPhase(project)] ?? 0,
    0,
    100
  );
}

function humanizeStatus(status) {
  return STATUS_TO_LABEL[normalizeStatus(status)] || humanizeRole(status);
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function humanizeRole(role) {
  return String(role || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getUser(uid) {
  return state.users.find((user) => user.id === uid) || null;
}

function getUserName(user) {
  if (!user) return "";
  return user.name || user.fullName || user.displayName || user.email?.split("@")[0] || "";
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
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

function timestampFromInput(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

function addDaysToInput(value, days) {
  const d = value ? new Date(`${value}T00:00:00`) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function resolvePhaseStatus(phase) {
  return PHASE_TO_STATUS[phase] || "active";
}

function resolvePhaseProgress(phase) {
  return PHASE_PROGRESS[phase] ?? 0;
}

function resolveProjectIdForDelete() {
  return state.projectId;
}

function openDeleteModal() {
  els.deleteTitle.textContent = `Delete ${state.project?.title || "Project"}?`;
  els.deleteText.textContent = "This action cannot be undone. All related files, messages, invoices, payments, and updates for this project will also be removed from Firebase.";
  showModal(els.deleteModal);
}

function closeDeleteModal() {
  hideModal(els.deleteModal);
}

function openPromptModal({ title, text, placeholder = "Enter value", confirmLabel = "Save", callback }) {
  state.promptCallback = callback || null;
  els.promptTitle.textContent = title;
  els.promptText.textContent = text;
  els.promptInput.value = "";
  els.promptInput.placeholder = placeholder;
  els.confirmPrompt.textContent = confirmLabel;
  showModal(els.promptModal);
  setTimeout(() => els.promptInput.focus(), 0);
}

function closePromptModal() {
  state.promptCallback = null;
  hideModal(els.promptModal);
}

function showModal(modal) {
  if (!els.modalBackdrop || !modal) return;
  els.modalBackdrop.style.display = "block";
  modal.style.display = "block";
  document.body.classList.add("modal-open");
}

function hideModal(modal) {
  if (!els.modalBackdrop || !modal) return;
  modal.style.display = "none";
  const anyOpen = [els.deleteModal, els.promptModal].some((item) => item.style.display === "block");
  if (!anyOpen) {
    els.modalBackdrop.style.display = "none";
    document.body.classList.remove("modal-open");
  }
}

function setSidebar(open) {
  if (!els.sidebar || !els.backdrop) return;
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function toggleVisible(element, show) {
  if (!element) return;
  element.style.display = show ? "" : "none";
}

async function updateProjectPhase(phase) {
  if (!state.project || !state.canEditProject) return;

  const nextStatus = resolvePhaseStatus(phase);
  const nextProgress = resolvePhaseProgress(phase);

  await updateDoc(doc(db, "projects", state.projectId), {
    currentPhase: phase,
    status: nextStatus,
    progress: nextProgress,
    updatedAt: serverTimestamp(),
  });

  await addProjectActivity(`Changed phase to ${phase}`, `Phase updated to ${phase}.`);
  await notifyProjectRecipients(
    `Phase updated to ${phase}`,
    `${state.project.title} moved to ${phase}.`
  );
}

async function editProjectFlow() {
  const current = state.project;

  const title = window.prompt("Project name:", current.title);
  if (title === null) return;

  const description = window.prompt("Description:", current.description);
  if (description === null) return;

  const budgetInput = window.prompt("Budget (number):", String(current.budget || 0));
  if (budgetInput === null) return;

  const dueDateInput = window.prompt("Due date (YYYY-MM-DD):", formatInputDate(current.dueDate));
  if (dueDateInput === null) return;

  const phaseInput = window.prompt(`Phase (${PHASES.join(", ")}):`, getCurrentPhase(current));
  if (phaseInput === null) return;

  const cleanPhase = PHASES.includes(phaseInput) ? phaseInput : getCurrentPhase(current);
  const nextStatus = resolvePhaseStatus(cleanPhase);
  const nextProgress = resolvePhaseProgress(cleanPhase);

  await updateDoc(doc(db, "projects", state.projectId), {
    title: title.trim(),
    description: description.trim(),
    budget: Number(budgetInput) || 0,
    dueDate: timestampFromInput(dueDateInput),
    currentPhase: cleanPhase,
    status: nextStatus,
    progress: nextProgress,
    updatedAt: serverTimestamp(),
  });

  await addProjectActivity("Edited Project", "Project details were updated.");
}

async function archiveProject() {
  if (!state.project) return;

  await updateDoc(doc(db, "projects", state.projectId), {
    status: "paused",
    updatedAt: serverTimestamp(),
  });

  await addProjectActivity("Archived Project", "Project moved to on hold.");
  await notifyProjectRecipients(
    "Project archived",
    `${state.project.title} has been moved to on hold.`
  );
}

async function deleteProject() {
  const projectId = resolveProjectIdForDelete();
  if (!projectId) return;

  try {
    const project = state.project;
    const invoiceIds = state.invoices.map((invoice) => invoice.id);

    await deleteRelatedFiles();
    await deleteProjectConversation(projectId);
    await deleteCollectionByQuery(query(collection(db, "activityLogs"), where("targetId", "==", projectId)));
    await deleteCollectionByQuery(query(collection(db, "invoices"), where("projectId", "==", projectId)));

    if (invoiceIds.length) {
      await deletePaymentsByInvoiceIds(invoiceIds);
    }

    await deleteDoc(doc(db, "projects", projectId));

    if (project?.title) {
      await addDoc(collection(db, "activityLogs"), {
        userId: state.user.uid,
        action: `Deleted Project`,
        details: `${project.title} was deleted.`,
        targetType: "project",
        targetId: projectId,
        timestamp: serverTimestamp(),
      });
    }

    closeDeleteModal();
    window.location.href = PROJECTS_ROUTE;
  } catch (error) {
    console.error("Delete project failed:", error);
    alert("Unable to delete this project.");
  }
}

async function deleteRelatedFiles() {
  const files = [...state.files];
  for (const file of files) {
    try {
      if (file.storagePath) {
        await deleteObject(storageRef(storage, file.storagePath));
      }
      await deleteDoc(doc(db, "files", file.id));
    } catch (error) {
      console.warn("Failed deleting file:", file.id, error);
    }
  }
}

async function deleteCollectionByQuery(queryRef) {
  const snap = await getDocs(queryRef);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}


async function deleteProjectConversation(projectId) {
  const conversationId = projectConversationId(projectId);
  const convoRef = doc(db, "conversations", conversationId);

  try {
    await deleteCollectionByQuery(query(collection(db, "conversations", conversationId, "messages")));
  } catch (error) {
    console.warn("Failed deleting project conversation messages:", error);
  }

  try {
    await deleteDoc(convoRef);
  } catch (error) {
    console.warn("Failed deleting project conversation doc:", error);
  }
}

async function deletePaymentsByInvoiceIds(invoiceIds) {
  const set = new Set(invoiceIds);
  const snap = await getDocs(collection(db, "payments"));
  const docsToDelete = snap.docs.filter((d) => set.has(d.data().invoiceId));

  if (!docsToDelete.length) return;

  const batch = writeBatch(db);
  docsToDelete.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function uploadProjectFile(file) {
  if (!state.project || !state.canUploadFiles) return;

  const safeName = file.name.replace(/\s+/g, "_");
  const path = `project-files/${state.projectId}/${Date.now()}_${safeName}`;
  const fileRef = storageRef(storage, path);

  try {
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    const uploaded = await addDoc(collection(db, "files"), {
      fileName: file.name,
      fileUrl: url,
      fileType: file.type || "application/octet-stream",
      uploadedBy: state.user.uid,
      projectId: state.projectId,
      createdAt: serverTimestamp(),
      storagePath: path,
    });

    await addProjectActivity("Uploaded File", `${file.name} uploaded to the project.`);
    await notifyProjectRecipients(
      "New file uploaded",
      `${file.name} was uploaded to ${state.project.title}.`
    );

    return uploaded.id;
  } catch (error) {
    console.error("File upload failed:", error);
    alert("Unable to upload file.");
  }
}

async function deleteFile(fileId) {
  const file = state.files.find((item) => item.id === fileId);
  if (!file) return;

  const canDelete = state.canUploadFiles || file.uploadedBy === state.user?.uid || normalizeRole(state.profile?.role) === "admin";
  if (!canDelete) {
    alert("You do not have permission to delete this file.");
    return;
  }

  try {
    if (file.storagePath) {
      await deleteObject(storageRef(storage, file.storagePath));
    }
    await deleteDoc(doc(db, "files", fileId));
    await addProjectActivity("Deleted File", `${file.fileName} was removed.`);
  } catch (error) {
    console.error("Delete file failed:", error);
    alert("Unable to delete file.");
  }
}

function openFile(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function addProjectUpdate(title, details) {
  if (!state.project) return;

  await addDoc(collection(db, "activityLogs"), {
    userId: state.user.uid,
    action: title,
    details: details || "Update added from project workspace.",
    targetType: "project",
    targetId: state.projectId,
    timestamp: serverTimestamp(),
  });

  await notifyProjectRecipients(
    "Project update posted",
    `${state.project.title}: ${title}`
  );
}

async function addTeamMemberByEmail(email) {
  const userSnap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
  if (userSnap.empty) {
    alert("No user found with that email.");
    return;
  }

  const user = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() };
  if (normalizeRole(user.role) === "client") {
    alert("Client accounts cannot be assigned as team members.");
    return;
  }

  const assigned = Array.isArray(state.project.assignedDevelopers) ? state.project.assignedDevelopers : [];
  if (assigned.includes(user.id) || state.project.projectManagerId === user.id) {
    alert("That person is already assigned to this project.");
    return;
  }

  await updateDoc(doc(db, "projects", state.projectId), {
    assignedDevelopers: arrayUnion(user.id),
    updatedAt: serverTimestamp(),
  });

  await addProjectActivity("Added Team Member", `${getUserName(user)} was assigned to the project.`);
  await notifyProjectRecipients(
    "Team member added",
    `${getUserName(user)} was added to ${state.project.title}.`
  );
}

async function removeTeamMember(uid) {
  if (!state.canManageTeam) {
    alert("You do not have permission to remove team members.");
    return;
  }

  if (state.project.projectManagerId === uid) {
    alert("The project manager cannot be removed from the team list.");
    return;
  }

  await updateDoc(doc(db, "projects", state.projectId), {
    assignedDevelopers: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });

  const user = getUser(uid);
  await addProjectActivity("Removed Team Member", `${getUserName(user) || uid} was removed from the project.`);
  await notifyProjectRecipients(
    "Team member removed",
    `${getUserName(user) || "A member"} was removed from ${state.project.title}.`
  );
}

async function addProjectActivity(action, details) {
  await addDoc(collection(db, "activityLogs"), {
    userId: state.user.uid,
    action,
    details: details || "",
    targetType: "project",
    targetId: state.projectId,
    timestamp: serverTimestamp(),
  });
}

async function notifyProjectRecipients(title, message) {
  const recipients = getProjectRecipientIds().filter((uid) => uid && uid !== state.user.uid);
  if (!recipients.length) return;

  await Promise.all(
    recipients.map((userId) =>
      addDoc(collection(db, "notifications"), {
        userId,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
      })
    )
  );
}

function getProjectRecipientIds() {
  const ids = new Set();

  if (state.project?.clientId) ids.add(state.project.clientId);
  if (state.project?.projectManagerId) ids.add(state.project.projectManagerId);
  (state.project?.assignedDevelopers || []).forEach((uid) => ids.add(uid));
  ids.add(state.user?.uid);

  return [...ids];
}


function projectConversationId(projectId) {
  return `project_${String(projectId || "").trim()}`;
}

async function markInvoicePaid(invoiceId) {
  if (!state.canCreateInvoices) {
    alert("You do not have permission to change invoice status.");
    return;
  }

  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  await updateDoc(doc(db, "invoices", invoiceId), {
    status: "paid",
  });

  const existingPayments = state.payments.filter((payment) => payment.invoiceId === invoiceId);
  if (!existingPayments.length) {
    await addDoc(collection(db, "payments"), {
      invoiceId,
      amount: Number(invoice.amount || 0),
      method: "manual",
      paymentDate: serverTimestamp(),
      notes: "Marked paid from project workspace",
    });
  } else {
    const batch = writeBatch(db);
    existingPayments.forEach((payment) => {
      batch.update(doc(db, "payments", payment.id), {
        amount: Number(invoice.amount || payment.amount || 0),
        method: payment.method || "manual",
        notes: payment.notes || "Marked paid from project workspace",
      });
    });
    await batch.commit();
  }

  await addProjectActivity("Invoice Paid", `${invoice.invoiceNumber || invoice.id} marked as paid.`);
  await notifyProjectRecipients("Invoice paid", `${invoice.invoiceNumber || invoice.id} was marked paid.`);
}

async function markInvoicePending(invoiceId) {
  if (!state.canCreateInvoices) {
    alert("You do not have permission to change invoice status.");
    return;
  }

  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  await updateDoc(doc(db, "invoices", invoiceId), {
    status: "pending",
  });

  const paymentsToDelete = state.payments.filter((payment) => payment.invoiceId === invoiceId);
  if (paymentsToDelete.length) {
    const batch = writeBatch(db);
    paymentsToDelete.forEach((payment) => batch.delete(doc(db, "payments", payment.id)));
    await batch.commit();
  }

  await addProjectActivity("Invoice Pending", `${invoice.invoiceNumber || invoice.id} marked pending.`);
}

async function generateInvoicePdf() {
  if (!state.project || !state.canCreateInvoices) return;

  const received = getProjectReceivedTotal();

  const outstanding = Math.max(Number(state.project.budget || 0) - received, 0);

  if (outstanding <= 0) {
    alert("There is no outstanding amount to invoice.");
    return;
  }

  const count = state.invoices.length + 1;
  const invoiceNumber = `INV-${String(state.project.id).replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${String(count).padStart(2, "0")}`;
  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const invoiceRef = await addDoc(collection(db, "invoices"), {
    invoiceNumber,
    projectId: state.projectId,
    clientId: state.project.clientId,
    amount: outstanding,
    status: "pending",
    issueDate: Timestamp.fromDate(issueDate),
    dueDate: Timestamp.fromDate(dueDate),
    invoicePdfUrl: "",
    notes: `Invoice generated for ${state.project.title}`,
  });

  openInvoicePrintWindow({
    invoiceId: invoiceRef.id,
    invoiceNumber,
    amount: outstanding,
    issueDate,
    dueDate,
  });

  await addProjectActivity("Generated Invoice", `${invoiceNumber} created.`);
  await notifyProjectRecipients("Invoice generated", `${invoiceNumber} was created for ${state.project.title}.`);
}

function openInvoicePrintWindow(invoice) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=920,height=1200");
  if (!win) {
    alert("Popup blocked. Please allow popups to print the invoice.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(invoice.invoiceNumber)}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; margin: 40px; color: #111; }
          .wrap { max-width: 760px; margin: 0 auto; }
          h1 { margin: 0 0 8px; }
          .muted { color: #555; }
          .card { border: 1px solid #ddd; border-radius: 16px; padding: 20px; margin-top: 24px; }
          .row { display:flex; justify-content:space-between; gap:20px; margin: 10px 0; }
          .line { border-top: 1px solid #ddd; margin: 18px 0; }
          .amount { font-size: 1.5rem; font-weight: 800; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Invoice ${escapeHtml(invoice.invoiceNumber)}</h1>
          <div class="muted">Elevated Web Solutions • Project ${escapeHtml(state.project.title)}</div>
          <div class="card">
            <div class="row"><strong>Project ID</strong><span>${escapeHtml(state.project.id)}</span></div>
            <div class="row"><strong>Client</strong><span>${escapeHtml(getUserName(getUser(state.project.clientId)))}</span></div>
            <div class="row"><strong>Issue Date</strong><span>${new Intl.DateTimeFormat("en-IN").format(invoice.issueDate)}</span></div>
            <div class="row"><strong>Due Date</strong><span>${new Intl.DateTimeFormat("en-IN").format(invoice.dueDate)}</span></div>
            <div class="line"></div>
            <div class="row"><strong>Amount</strong><span class="amount">${formatCurrency(invoice.amount)}</span></div>
          </div>
          <p class="muted" style="margin-top:20px">Save this page as PDF using the browser print dialog.</p>
        </div>
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          };
        </script>
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

function openFileIfPresent(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatInputDate(value) {
  const date = toDate(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
}

function mapDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
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