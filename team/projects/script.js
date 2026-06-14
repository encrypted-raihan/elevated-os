import { auth, db } from "../../js/firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const LOGIN_ROUTE = "/index/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/team/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  client: "/client/dashboard/index.html",
  team: "/team/dashboard/index.html",
};

const ACTIVE_STATUSES = new Set(["planning", "development", "testing", "review", "active"]);
const TEAM_ROLES = new Set(["manager", "developer", "team"]);

const state = {
  user: null,
  profile: null,
  users: [],
  projects: [],
  notifications: [],
  filter: "all",
  search: "",
  unsubscribe: [],
  ready: false,
};

const els = {
  projectsGrid: document.getElementById("projectsGrid"),
  emptyState: document.getElementById("emptyState"),
  resultsCount: document.getElementById("resultsCount"),
  searchInput: document.getElementById("searchInput"),
  filterPills: [...document.querySelectorAll(".filter-pill")],
  projectModal: document.getElementById("projectModal"),
  clientModal: document.getElementById("clientModal"),
  openProjectModalBtn: document.getElementById("openProjectModalBtn"),
  emptyNewProjectBtn: document.getElementById("emptyNewProjectBtn"),
  openClientModalBtn: document.getElementById("openClientModalBtn"),
  projectForm: document.getElementById("projectForm"),
  clientForm: document.getElementById("clientForm"),
  clientSelect: document.getElementById("clientSelect"),
  projectManagerSelect: document.getElementById("projectManagerSelect"),
  teamList: document.getElementById("teamList"),
  projectName: document.getElementById("projectName"),
  description: document.getElementById("description"),
  budget: document.getElementById("budget"),
  startDate: document.getElementById("startDate"),
  dueDate: document.getElementById("dueDate"),
  clientName: document.getElementById("clientName"),
  clientEmail: document.getElementById("clientEmail"),
  clientPassword: document.getElementById("clientPassword"),
  clientCompany: document.getElementById("clientCompany"),
  notificationList: document.getElementById("notificationList"),
  notificationBtn: document.getElementById("notificationBtn"),
  notificationDropdown: document.getElementById("notificationDropdown"),
  notificationCount: document.getElementById("notificationCount"),
  openSidebarBtn: document.getElementById("openSidebar"),
  closeSidebarBtn: document.getElementById("closeSidebar"),
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  logoutBtn: document.querySelector(".logout-btn"),
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindUi();
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

    const role = normalizeRole(profile.role);
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
    state.ready = true;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking.
    }

    startListeners();
  } catch (error) {
    console.error("Failed to initialize projects page:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

function bindUi() {
  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", async () => {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
    });
  }

  if (els.openSidebarBtn) {
    els.openSidebarBtn.addEventListener("click", () => setSidebar(true));
  }

  if (els.closeSidebarBtn) {
    els.closeSidebarBtn.addEventListener("click", () => setSidebar(false));
  }

  if (els.backdrop) {
    els.backdrop.addEventListener("click", () => {
      setSidebar(false);
      closeModal(els.projectModal);
      closeModal(els.clientModal);
      closeNotifications();
    });
  }

  if (els.searchInput) {
    els.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim();
      renderProjects();
    });
  }

  els.filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      state.filter = pill.dataset.filter;
      els.filterPills.forEach((btn) => btn.classList.toggle("active", btn === pill));
      renderProjects();
    });
  });

  if (els.openProjectModalBtn) {
    els.openProjectModalBtn.addEventListener("click", () => openProjectModal());
  }

  if (els.emptyNewProjectBtn) {
    els.emptyNewProjectBtn.addEventListener("click", () => openProjectModal());
  }

  if (els.openClientModalBtn) {
    els.openClientModalBtn.addEventListener("click", () => openClientModal());
  }

  if (els.projectForm) {
    els.projectForm.addEventListener("submit", handleProjectSubmit);
  }

  if (els.clientForm) {
    els.clientForm.addEventListener("submit", handleClientSubmit);
  }

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.close;
      if (target === "projectModal") closeModal(els.projectModal);
      if (target === "clientModal") closeModal(els.clientModal);
    });
  });

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".project-card");
    if (card) {
      openProjectWorkspace(card.dataset.projectId);
      return;
    }

    if (!els.notificationDropdown.hidden && !event.target.closest(".notification-wrap")) {
      closeNotifications();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSidebar(false);
      closeModal(els.projectModal);
      closeModal(els.clientModal);
      closeNotifications();
    }

    const focused = document.activeElement;
    if ((event.key === "Enter" || event.key === " ") && focused?.classList?.contains("project-card")) {
      event.preventDefault();
      openProjectWorkspace(focused.dataset.projectId);
    }
  });

  if (els.notificationBtn) {
    els.notificationBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = els.notificationDropdown.hidden;
      els.notificationDropdown.hidden = !willOpen;
      els.notificationBtn.setAttribute("aria-expanded", String(willOpen));
    });
  }
}

function startListeners() {
  state.unsubscribe.push(
    onSnapshot(collection(db, "users"), (snapshot) => {
      state.users = snapshot.docs.map(mapDoc);
      if (state.ready) {
        renderFormControls();
        renderProjects();
      }
    }, handleListenerError("users"))
  );

  state.unsubscribe.push(
    onSnapshot(collection(db, "projects"), (snapshot) => {
      state.projects = snapshot.docs.map(mapDoc);
      if (state.ready) renderProjects();
    }, handleListenerError("projects"))
  );

  state.unsubscribe.push(
    onSnapshot(
      query(collection(db, "notifications"), where("userId", "==", state.user.uid)),
      (snapshot) => {
        state.notifications = snapshot.docs.map(mapDoc);
        renderNotifications();
      },
      handleListenerError("notifications")
    )
  );

  renderFormControls();
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

function showLoadingState() {
  if (els.resultsCount) els.resultsCount.textContent = "Loading…";
  if (els.projectsGrid) els.projectsGrid.innerHTML = "";
  if (els.emptyState) els.emptyState.hidden = false;
  if (els.notificationCount) els.notificationCount.textContent = "0";
  if (els.notificationList) els.notificationList.innerHTML = "";
}

function renderFormControls() {

  const isAdmin = normalizeRole(state.profile?.role) === "admin";
  if (els.openProjectModalBtn) els.openProjectModalBtn.hidden = !isAdmin;
  if (els.emptyNewProjectBtn) els.emptyNewProjectBtn.hidden = !isAdmin;
  if (els.openClientModalBtn) els.openClientModalBtn.hidden = !isAdmin;
  if (els.budget) {
    const budgetGroup = els.budget.closest(".form-group");
    if (budgetGroup) budgetGroup.hidden = !isAdmin;
  }
  const clients = getUsersByRole("client");
  const managers = getUsersByRoles(["admin", "manager"]);
  const teamMembers = getUsersByRoles(["admin", "manager", "developer"]);

  if (els.clientSelect) {
    const current = els.clientSelect.value;
    els.clientSelect.innerHTML = `
      <option value="" disabled ${current ? "" : "selected"}>Select client</option>
      ${clients
        .map((client) => {
          const label = `${client.name || "Unnamed"}${client.company ? ` • ${client.company}` : ""}`;
          return `<option value="${escapeAttr(client.id)}" ${current === client.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
        })
        .join("")}
    `;
  }

  if (els.projectManagerSelect) {
    const current = els.projectManagerSelect.value;
    const defaultManager = state.user?.uid || "";

    els.projectManagerSelect.innerHTML = `
      <option value="" disabled ${current ? "" : "selected"}>Select manager</option>
      ${managers
        .map((member) => {
          const label = `${member.name || "Unnamed"}${member.role ? ` • ${humanizeRole(member.role)}` : ""}`;
          const selected = current ? current === member.id : member.id === defaultManager;
          return `<option value="${escapeAttr(member.id)}" ${selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
        })
        .join("")}
    `;

    if (!current && defaultManager && managers.some((member) => member.id === defaultManager)) {
      els.projectManagerSelect.value = defaultManager;
    }
  }

  if (els.teamList) {
    const checked = new Set(
      [...els.teamList.querySelectorAll('input[name="team"]:checked')].map((input) => input.value)
    );

    els.teamList.innerHTML = teamMembers.length
      ? teamMembers
          .map((member) => {
            const label = `${member.name || "Unnamed"}${member.role ? ` • ${humanizeRole(member.role)}` : ""}`;
            const isChecked = checked.has(member.id);
            return `
              <label class="team-item">
                <input type="checkbox" name="team" value="${escapeAttr(member.id)}" ${isChecked ? "checked" : ""} />
                <span>${escapeHtml(label)}</span>
              </label>
            `;
          })
          .join("")
      : `<div class="empty-state-inline">No team members available yet.</div>`;
  }
}

function renderProjects() {
  if (!els.projectsGrid) return;

  const items = getFilteredProjects();

  if (els.resultsCount) {
    els.resultsCount.textContent = `${items.length} project${items.length === 1 ? "" : "s"} shown`;
  }

  if (items.length === 0) {
    if (els.emptyState) els.emptyState.hidden = false;
    els.projectsGrid.innerHTML = "";
    return;
  }

  if (els.emptyState) els.emptyState.hidden = true;

  els.projectsGrid.innerHTML = items
    .map((project) => {
      const client = state.users.find((user) => user.id === project.clientId);
      const manager = state.users.find((user) => user.id === project.projectManagerId);
      const status = normalizeRole(project.status || "planning");
      const progress = clampNumber(project.progress, 0, 100);
      const teamCount = Array.isArray(project.assignedDevelopers) ? project.assignedDevelopers.length : 0;

      return `
        <article class="project-card" tabindex="0" role="button" data-project-id="${escapeAttr(project.id)}" aria-label="Open ${escapeAttr(getProjectTitle(project))}">
          <div class="project-top">
            <div>
              <h3 class="project-title">${escapeHtml(getProjectTitle(project))}</h3>
              <div class="project-client">${escapeHtml(getUserDisplayName(client) || "Unknown client")}</div>
            </div>
            <div class="badge-row">
              <span class="status-badge ${escapeAttr(status)}">${escapeHtml(humanizeRole(status))}</span>
            </div>
          </div>

          <div class="project-meta">
            <div class="meta-row">
              <span>Project ID</span>
              <strong>${escapeHtml(project.id)}</strong>
            </div>
            <div class="meta-row">
              <span>Manager</span>
              <strong>${escapeHtml(getUserDisplayName(manager) || "Unassigned")}</strong>
            </div>
            <div class="meta-row">
              <span>Due Date</span>
              <strong>${escapeHtml(formatDate(project.dueDate))}</strong>
            </div>
            <div class="meta-row">
              <span>Team</span>
              <strong>${teamCount}</strong>
            </div>
            <div class="meta-row">
              <span>Phase</span>
              <strong>${escapeHtml(project.currentPhase || humanizeStatus(project.status))}</strong>
            </div>
          </div>

          <div class="project-progress">
            <div class="progress-label">
              <span>Progress</span>
              <span><strong>${progress}%</strong> Complete</span>
            </div>
            <div class="progress-track" aria-hidden="true">
              <div class="progress-fill" style="width:${progress}%"></div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderNotifications() {
  if (!els.notificationList || !els.notificationCount) return;

  const unreadCount = state.notifications.filter((item) => !isRead(item)).length;
  els.notificationCount.textContent = String(unreadCount);

  const rows = [...state.notifications].sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));

  if (rows.length === 0) {
    els.notificationList.innerHTML = `<div class="dropdown-item"><strong>No notifications</strong><span>—</span></div>`;
    return;
  }

  els.notificationList.innerHTML = rows
    .map((notification) => `
      <div class="dropdown-item" style="opacity:${isRead(notification) ? "0.72" : "1"}">
        <strong>${escapeHtml(notification.title || "Notification")}</strong>
        <span>${escapeHtml(formatRelativeTime(notification.createdAt))}</span>
      </div>
    `)
    .join("");
}


function canAccessProject(profile, project) {
  if (!profile || !project) return false;

  const role = normalizeRole(profile.role);
  if (role === "admin") return true;

  const uid = profile.id;
  const isManager = project.projectManagerId === uid;
  const isAssigned = Array.isArray(project.assignedDevelopers) && project.assignedDevelopers.includes(uid);

  return isManager || isAssigned;
}

function getFilteredProjects() {
  const q = state.search.toLowerCase();

  return [...state.projects]
    .filter((project) => canAccessProject(state.profile, project))
    .filter((project) => {
      const client = state.users.find((user) => user.id === project.clientId);
      const manager = state.users.find((user) => user.id === project.projectManagerId);

      const haystack = [
        getProjectTitle(project),
        project.id,
        project.description,
        project.status,
        client?.name,
        client?.email,
        client?.company,
        manager?.name,
        manager?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(q);

      const status = normalizeRole(project.status || "planning");
      const matchesFilter =
        state.filter === "all"
          || (state.filter === "active" && ACTIVE_STATUSES.has(status))
          || (state.filter === "completed" && status === "completed")
          || (state.filter === "onhold" && status === "onhold")
          || state.filter === status;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => getTimeMs(b.updatedAt || b.createdAt) - getTimeMs(a.updatedAt || a.createdAt));
}

async function handleProjectSubmit(event) {
  event.preventDefault();

  const title = els.projectName.value.trim();
  const description = els.description.value.trim();
  const clientId = els.clientSelect.value;
  const projectManagerId = els.projectManagerSelect.value;
  const budget = Number(els.budget.value);
  const startDate = els.startDate.value;
  const dueDate = els.dueDate.value;
  const assignedDevelopers = [...document.querySelectorAll('input[name="team"]:checked')].map((input) => input.value);

  if (!title || !description || !clientId || !projectManagerId || !startDate || !dueDate) {
    alert("Please fill in all required project fields.");
    return;
  }

  if (!Number.isFinite(budget) || budget < 0) {
    alert("Please enter a valid budget.");
    return;
  }

  const client = state.users.find((user) => user.id === clientId);
  if (!client) {
    alert("Please choose a valid client.");
    return;
  }

  const manager = state.users.find((user) => user.id === projectManagerId);
  if (!manager) {
    alert("Please choose a valid project manager.");
    return;
  }

  const payload = {
    title,
    description,
    clientId,
    projectManagerId,
    assignedDevelopers,
    status: "planning",
    progress: 0,
    budget,
    startDate: Timestamp.fromDate(new Date(`${startDate}T00:00:00`)),
    dueDate: Timestamp.fromDate(new Date(`${dueDate}T00:00:00`)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: state.user.uid,
  };

  setButtonLoading(document.querySelector('#projectForm button[type="submit"]'), true);

  try {
    const participants = unique([
      state.user.uid,
      clientId,
      projectManagerId,
      ...assignedDevelopers,
    ]);

    const conversationRef = await addDoc(
      collection(db, "conversations"),
      {
        type: "project",
        projectName: title,
        participantIds: participants,

        lastMessageText: "",
        lastSenderId: "",
        lastSenderName: "",

        unreadCounts: Object.fromEntries(
          participants.map(id => [id, 0])
        ),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    const projectRef = await addDoc(
      collection(db, "projects"),
      {
        ...payload,
        projectConversationId: conversationRef.id,
      }
    );

    await updateDoc(
      doc(db, "conversations", conversationRef.id),
      {
        projectId: projectRef.id
      }
    );

    const recipientIds = unique([
      state.user.uid,
      clientId,
      projectManagerId,
      ...assignedDevelopers,
    ]);

    await Promise.all([
      addDoc(collection(db, "activityLogs"), {
        userId: state.user.uid,
        action: "Created Project",
        targetType: "project",
        targetId: projectRef.id,
        timestamp: serverTimestamp(),
      }),
      ...recipientIds.map((recipientId) =>
        addDoc(collection(db, "notifications"), {
          userId: recipientId,
          title: "New project created",
          message: `${title} has been created.`,
          read: recipientId === state.user.uid,
          createdAt: serverTimestamp(),
        })
      ),
    ]);

    closeModal(els.projectModal);
    els.projectForm.reset();
    renderProjects();
    openProjectWorkspace(projectRef.id);
  } catch (error) {
    console.error("Failed to create project:", error);
    alert(friendlyError(error));
  } finally {
    setButtonLoading(document.querySelector('#projectForm button[type="submit"]'), false);
  }
}

async function handleClientSubmit(event) {
  event.preventDefault();

  const name = els.clientName.value.trim();
  const email = els.clientEmail.value.trim().toLowerCase();
  const password = els.clientPassword.value.trim();
  const company = els.clientCompany.value.trim();

  if (!name || !email || !password) {
    alert("Please fill in all required client fields.");
    return;
  }

  if (password.length < 6) {
    alert("Temporary password must be at least 6 characters.");
    return;
  }

  const submitBtn = document.querySelector('#clientForm button[type="submit"]');
  setButtonLoading(submitBtn, true);

  try {
    const { uid } = await createFirebaseAuthUser(email, password);

    await setDoc(doc(db, "users", uid), {
      uid,
      name,
      email,
      role: "client",
      company: company || name,
      phone: "",
      active: true,
      avatarUrl: "",
      invitedBy: state.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
    });

    await addDoc(collection(db, "activityLogs"), {
      userId: state.user.uid,
      action: "Created Client",
      targetType: "user",
      targetId: uid,
      timestamp: serverTimestamp(),
    });

    closeModal(els.clientModal);
    els.clientForm.reset();
  } catch (error) {
    console.error("Failed to create client:", error);
    alert(friendlyError(error));
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function createFirebaseAuthUser(email, password) {
  const apiKey = auth.app?.options?.apiKey;
  if (!apiKey) {
    throw new Error("Missing Firebase API key");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Unable to create account");
  }

  return {
    uid: data.localId,
    email: data.email,
  };
}

function openProjectModal() {
  renderFormControls();
  els.projectForm.reset();

  const activeClients = getUsersByRole("client");
  const managers = getUsersByRoles(["admin", "manager"]);

  if (els.clientSelect && activeClients.length) {
    els.clientSelect.value = activeClients[0].id;
  }

  if (els.projectManagerSelect && managers.length) {
    const current = managers.find((member) => member.id === state.user?.uid);
    els.projectManagerSelect.value = current?.id || managers[0].id;
  }

  document.querySelectorAll('input[name="team"]').forEach((input) => {
    input.checked = false;
  });

  if (els.startDate) els.startDate.value = todayInputValue();
  if (els.dueDate) els.dueDate.value = tomorrowInputValue();

  openModal(els.projectModal);
}

function openClientModal() {
  els.clientForm.reset();
  openModal(els.clientModal);
}

function openProjectWorkspace(projectId) {
  try {
    sessionStorage.setItem("ews:selectedProjectId", projectId);
  } catch {
    // ignore storage failures
  }
  window.location.href = `./workspace/index.html?projectId=${encodeURIComponent(projectId)}`;
}

function openModal(modalEl) {
  if (!modalEl) return;

  modalEl.classList.add("open");
  modalEl.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
}

function closeModal(modalEl) {
  if (!modalEl) return;

  modalEl.classList.remove("open");
  modalEl.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

function closeNotifications() {
  if (!els.notificationDropdown || !els.notificationBtn) return;
  els.notificationDropdown.hidden = true;
  els.notificationBtn.setAttribute("aria-expanded", "false");
}

function setSidebar(open) {
  if (!els.sidebar || !els.backdrop) return;
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function setButtonLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  if (loading) {
    button.dataset.originalText ||= button.textContent;
    button.textContent = "Saving...";
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}

function getUsersByRole(role) {
  return state.users.filter((user) => normalizeRole(user.role) === normalizeRole(role));
}

function getUsersByRoles(roles) {
  const normalized = new Set(roles.map(normalizeRole));
  return state.users.filter((user) => normalized.has(normalizeRole(user.role)));
}

function getProjectTitle(project) {
  return project?.title || project?.name || "Untitled project";
}

function getUserDisplayName(user) {
  if (!user) return "";
  return user.name || user.fullName || user.displayName || user.email?.split("@")[0] || "";
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function humanizeRole(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function isRead(notification) {
  return Boolean(notification?.read || notification?.isRead || notification?.is_read);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
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

function getTimeMs(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function todayInputValue() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function tomorrowInputValue() {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now.toISOString().slice(0, 10);
}

function mapDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
}

function friendlyError(error) {
  const raw = String(error?.message || error?.code || "").toUpperCase();

  if (raw.includes("EMAIL_EXISTS") || raw.includes("EMAIL-ALREADY-IN-USE")) {
    return "That email is already registered.";
  }
  if (raw.includes("INVALID_EMAIL")) {
    return "Please enter a valid email address.";
  }
  if (raw.includes("WEAK_PASSWORD")) {
    return "Password must be at least 6 characters.";
  }
  if (raw.includes("MISSING_PASSWORD")) {
    return "Password is required.";
  }
  return error?.message || "Something went wrong.";
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