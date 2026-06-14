import { auth, db } from "../../js/firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const LOGIN_ROUTE = "../../index/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/project-manager/dashboard/index.html",
  cold_caller: "/cold-caller/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  client: "/client/dashboard/index.html",
  team: "/team/dashboard/index.html",
};

const TEAM_ROLES = new Set(["admin", "manager", "developer", "cold_caller", "team"]);
const ACTIVE_PROJECT_STATUSES = new Set(["planning", "active", "review", "design", "development", "testing"]);

const state = {
  user: null,
  profile: null,
  users: [],
  projects: [],
  activeTab: "clients",
  filter: "all",
  search: "",
  selectedUserId: null,
  relatedFilter: "all",
  deleteTargetUid: null,
  unsubscribe: [],
  ready: false,
};

const els = {
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  openSidebar: document.getElementById("openSidebar"),
  clientsCount: document.getElementById("clientsCount"),
  teamCount: document.getElementById("teamCount"),
  activeCount: document.getElementById("activeCount"),
  inactiveCount: document.getElementById("inactiveCount"),
  searchInput: document.getElementById("searchInput"),
  tabs: [...document.querySelectorAll(".tab")],
  segBtns: [...document.querySelectorAll(".seg-btn")],
  grid: document.getElementById("grid"),
  sectionKicker: document.getElementById("sectionKicker"),
  sectionTitle: document.getElementById("sectionTitle"),
  sectionNote: document.getElementById("sectionNote"),
  emptyState: document.getElementById("emptyState"),
  emptyTitle: document.getElementById("emptyTitle"),
  emptyText: document.getElementById("emptyText"),
  emptyActionBtn: document.getElementById("emptyActionBtn"),
  newClientBtn: document.getElementById("newClientBtn"),
  newTeamBtn: document.getElementById("newTeamBtn"),
  detailsModal: document.getElementById("detailsModal"),
  detailsEyebrow: document.getElementById("detailsEyebrow"),
  detailsTitle: document.getElementById("detailsTitle"),
  detailsBody: document.getElementById("detailsBody"),
  relatedTitle: document.getElementById("relatedTitle"),
  relatedList: document.getElementById("relatedList"),
  formModal: document.getElementById("formModal"),
  formEyebrow: document.getElementById("formEyebrow"),
  formTitle: document.getElementById("formTitle"),
  formMode: document.getElementById("formMode"),
  editUid: document.getElementById("editUid"),
  nameInput: document.getElementById("nameInput"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  phoneInput: document.getElementById("phoneInput"),
  companyInput: document.getElementById("companyInput"),
  roleFieldWrap: document.getElementById("roleFieldWrap"),
  roleInput: document.getElementById("roleInput"),
  statusInput: document.getElementById("statusInput"),
  submitBtn: document.getElementById("submitBtn"),
  entityForm: document.getElementById("entityForm"),
  deleteModal: document.getElementById("deleteModal"),
  deleteEyebrow: document.getElementById("deleteEyebrow"),
  deleteTitle: document.getElementById("deleteTitle"),
  deleteMessage: document.getElementById("deleteMessage"),
  deleteWarning: document.getElementById("deleteWarning"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
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
    if (role !== "admin") {
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
      // Non-blocking
    }

    startListeners();
  } catch (error) {
    console.error("Failed to initialize people page:", error);
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

  if (els.openSidebar) {
    els.openSidebar.addEventListener("click", () => setSidebar(true));
  }

  if (els.backdrop) {
    els.backdrop.addEventListener("click", () => {
      setSidebar(false);
      closeModal(els.detailsModal);
      closeModal(els.formModal);
      closeModal(els.deleteModal);
    });
  }

  els.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      state.filter = "all";
      state.search = "";
      state.selectedUserId = null;
      state.relatedFilter = "all";
      if (els.searchInput) els.searchInput.value = "";
      els.segBtns.forEach((seg) => seg.classList.toggle("active", seg.dataset.filter === "all"));
      syncPageState();
      renderAll();
    });
  });

  els.segBtns.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      els.segBtns.forEach((seg) => seg.classList.toggle("active", seg === button));
      renderGrid();
    });
  });

  if (els.searchInput) {
    els.searchInput.addEventListener("input", (e) => {
      state.search = e.target.value.trim();
      renderGrid();
    });
  }

  if (els.newClientBtn) {
    els.newClientBtn.addEventListener("click", () => {
      state.activeTab = "clients";
      state.filter = "all";
      syncTabsOnly();
      openForm("create", "client");
    });
  }

  if (els.newTeamBtn) {
    els.newTeamBtn.addEventListener("click", () => {
      state.activeTab = "team";
      state.filter = "all";
      syncTabsOnly();
      openForm("create", "team");
    });
  }

  if (els.emptyActionBtn) {
    els.emptyActionBtn.addEventListener("click", () => {
      openForm("create", state.activeTab === "clients" ? "client" : "team");
    });
  }

  if (els.entityForm) {
    els.entityForm.addEventListener("submit", handleFormSubmit);
  }

  if (els.confirmDeleteBtn) {
    els.confirmDeleteBtn.addEventListener("click", handleArchive);
  }

  document.querySelectorAll(".close-modal").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.close;
      if (target === "detailsModal") closeModal(els.detailsModal);
      if (target === "formModal") closeModal(els.formModal);
      if (target === "deleteModal") closeModal(els.deleteModal);
    });
  });

  [els.detailsModal, els.formModal, els.deleteModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setSidebar(false);
      closeModal(els.detailsModal);
      closeModal(els.formModal);
      closeModal(els.deleteModal);
    }
  });

  document.addEventListener("click", (e) => {
    const cardButton = e.target.closest("[data-action]");
    if (cardButton) {
      const uid = cardButton.dataset.uid;
      const action = cardButton.dataset.action;

      if (action === "view") openDetails(uid);
      if (action === "edit") openForm("edit", uid);
      if (action === "archive") openArchive(uid);
      return;
    }

    const projectFilterBtn = e.target.closest(".project-filter");
    if (projectFilterBtn) {
      document.querySelectorAll(".project-filter").forEach((btn) => btn.classList.remove("active"));
      projectFilterBtn.classList.add("active");
      state.relatedFilter = projectFilterBtn.dataset.projectFilter;
      renderRelatedProjects();
    }
  });
}

function startListeners() {
  state.unsubscribe.push(
    onSnapshot(collection(db, "users"), (snapshot) => {
      state.users = snapshot.docs.map(mapDoc);
      renderAll();
    }, handleListenerError("users"))
  );

  state.unsubscribe.push(
    onSnapshot(collection(db, "projects"), (snapshot) => {
      state.projects = snapshot.docs.map(mapDoc);
      renderAll();
    }, handleListenerError("projects"))
  );
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

function renderAll() {
  if (!state.ready) return;
  renderStats();
  syncPageState();
  renderGrid();

  if (state.selectedUserId) {
    renderDetails(state.selectedUserId);
    renderRelatedProjects();
  }
}

function renderStats() {
  const clients = getUsersByTab("clients");
  const team = getUsersByTab("team");
  const active = state.users.filter((user) => isActiveUser(user)).length;
  const inactive = state.users.filter((user) => !isActiveUser(user)).length;

  setText(els.clientsCount, clients.length);
  setText(els.teamCount, team.length);
  setText(els.activeCount, active);
  setText(els.inactiveCount, inactive);
}

function syncPageState() {
  const isClients = state.activeTab === "clients";

  setText(els.sectionKicker, isClients ? "Clients" : "Team");
  setText(els.sectionTitle, isClients ? "Client Directory" : "Team Directory");
  setText(els.sectionNote, isClients
    ? "View and manage every client linked to projects."
    : "Track team members and admins assigned across client work."
  );

  setText(els.emptyTitle, isClients ? "No Clients Yet" : "No Team Members Yet");
  setText(els.emptyText, isClients
    ? "Create your first client to start assigning projects."
    : "Add your first team member or admin to begin building the team."
  );
  setText(els.emptyActionBtn, isClients ? "Create Client" : "Add Member");
  setText(els.formEyebrow, isClients ? "New Client" : "New Team Member");
  setText(els.formTitle, isClients ? "Create Client" : "Add Team Member");
  setText(els.submitBtn, isClients ? "Create Client" : "Add Member");
  els.roleFieldWrap.style.display = isClients ? "none" : "block";

  els.tabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.activeTab);
  });
}

function syncTabsOnly() {
  els.tabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.activeTab);
  });
  const activeFilter = document.querySelector(`.seg-btn[data-filter="${state.filter}"]`);
  if (!activeFilter) {
    els.segBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === "all"));
  }
}

function renderGrid() {
  if (!els.grid) return;

  const items = getVisibleUsers();
  els.grid.innerHTML = "";

  if (!items.length) {
    els.emptyState?.classList.remove("hidden");
    return;
  }

  els.emptyState?.classList.add("hidden");

  items.forEach((user) => {
    const card = document.createElement("article");
    card.className = "card";

    const active = isActiveUser(user);
    const projectCount = getRelatedProjectsForUser(user).length;
    const isClient = normalizeRole(user.role) === "client";

    card.innerHTML = `
      <div>
        <div class="card-top">
          <div>
            <h3 class="card-name">${escapeHtml(user.name || "Unnamed")}</h3>
            <p class="card-username">${escapeHtml(user.email || "No email")}</p>
          </div>
          <span class="badge ${active ? "active" : "inactive"}">${active ? "Active" : "Inactive"}</span>
        </div>

        <div class="card-stats">
          <div class="kv">
            <span>${isClient ? "Company" : "Role"}</span>
            <strong>${escapeHtml(isClient ? (user.company || "—") : humanizeRole(user.role))}</strong>
          </div>
          <div class="kv">
            <span>Projects</span>
            <strong>${projectCount}</strong>
          </div>
        </div>

        <div class="card-meta">
          <span>${escapeHtml(user.phone || "No phone")}</span>
        </div>
      </div>

      <div class="card-footer">
        <button class="pill-btn" data-action="view" data-uid="${user.id}" type="button">View</button>
        <button class="pill-btn" data-action="edit" data-uid="${user.id}" type="button">Edit</button>
        <button class="pill-btn" data-action="archive" data-uid="${user.id}" type="button">Archive</button>
      </div>
    `;

    els.grid.appendChild(card);
  });
}

function openDetails(uid) {
  state.selectedUserId = uid;
  state.relatedFilter = "all";
  document.querySelectorAll(".project-filter").forEach((btn) => btn.classList.toggle("active", btn.dataset.projectFilter === "all"));
  renderDetails(uid);
  renderRelatedProjects();
  openModal(els.detailsModal);
}

function renderDetails(uid) {
  const user = state.users.find((item) => item.id === uid);
  if (!user) return;

  const relatedProjects = getRelatedProjectsForUser(user);

  setText(els.detailsEyebrow, normalizeRole(user.role) === "client" ? "Client Details" : "Team Details");
  setText(els.detailsTitle, user.name || "Unnamed");
  setText(els.relatedTitle, normalizeRole(user.role) === "client" ? "Projects" : "Projects");

  const details = [
    ["Name", user.name || "—"],
    ["Email", user.email || "—"],
    ["Phone", user.phone || "—"],
    ["Company / Organization", user.company || "—"],
    ["Role", humanizeRole(user.role)],
    ["Status", isActiveUser(user) ? "Active" : "Inactive"],
    ["Projects Linked", String(relatedProjects.length)],
    ["Created", formatDate(user.createdAt)],
    ["Last Login", formatDate(user.lastLogin)],
  ];

  els.detailsBody.innerHTML = details.map(([label, value]) => `
    <div class="detail-item">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>
  `).join("");
}

function renderRelatedProjects() {
  if (!els.relatedList) return;

  const user = state.users.find((item) => item.id === state.selectedUserId);
  if (!user) {
    els.relatedList.innerHTML = "";
    return;
  }

  let projects = getRelatedProjectsForUser(user);

  if (state.relatedFilter === "active") {
    projects = projects.filter((project) => isActiveProject(project.status));
  }

  if (state.relatedFilter === "past") {
    projects = projects.filter((project) => !isActiveProject(project.status));
  }

  if (!projects.length) {
    els.relatedList.innerHTML = `
      <div class="empty-state-inline">
        <p>No projects match this filter.</p>
      </div>
    `;
    return;
  }

  projects = projects.sort((a, b) => getTimeMs(b.updatedAt || b.createdAt) - getTimeMs(a.updatedAt || a.createdAt));

  els.relatedList.innerHTML = `
    <div class="project-list">
      ${projects.map((project) => `
        <div class="project-row">
          <div class="project-info">
            <h5>${escapeHtml(project.title || project.name || "Untitled project")}</h5>
            <div class="project-meta">${escapeHtml(humanizeRole(project.status || "unknown"))} • ${clampNumber(project.progress, 0, 100)}%</div>
          </div>
          <a href="../project-workspace/index.html?id=${encodeURIComponent(project.id)}" class="project-open">Open →</a>
        </div>
      `).join("")}
    </div>
  `;
}

function openForm(mode, tabMode, uid = null) {
  state.activeTab = tabMode === "client" ? "clients" : "team";
  syncTabsOnly();
  syncPageState();
  state.selectedUserId = null;

  els.formMode.value = tabMode;
  els.editUid.value = uid || "";

  const isEdit = mode === "edit";
  const isClient = tabMode === "client";

  els.emailInput.disabled = isEdit;
  els.passwordInput.disabled = isEdit;
  els.passwordInput.required = !isEdit;
  els.passwordInput.placeholder = isEdit ? "Password stays unchanged on edit" : "Temp@1234";

  if (isClient) {
    els.roleFieldWrap.style.display = "none";
    els.roleInput.value = "developer";
  } else {
    els.roleFieldWrap.style.display = "block";
    if (!isEdit) els.roleInput.value = "developer";
  }

  if (mode === "create") {
    clearForm();
    els.statusInput.value = "active";
    els.companyInput.value = isClient ? "" : (state.profile?.company || "Elevated Web Solutions");
    els.formEyebrow.textContent = isClient ? "New Client" : "New Team Member";
    els.formTitle.textContent = isClient ? "Create Client" : "Add Team Member";
    els.submitBtn.textContent = isClient ? "Create Client" : "Add Member";
  } else {
    const user = state.users.find((item) => item.id === uid);
    if (!user) return;

    fillForm(user);
    els.formEyebrow.textContent = isClient ? "Edit Client" : "Edit Team Member";
    els.formTitle.textContent = isClient ? "Edit Client" : "Edit Team Member";
    els.submitBtn.textContent = "Save Changes";
  }

  openModal(els.formModal);
}

function fillForm(user) {
  els.nameInput.value = user.name || "";
  els.emailInput.value = user.email || "";
  els.passwordInput.value = "";
  els.phoneInput.value = user.phone || "";
  els.companyInput.value = user.company || "";
  els.statusInput.value = isActiveUser(user) ? "active" : "inactive";
  els.roleInput.value = TEAM_ROLES.has(normalizeRole(user.role)) ? normalizeRole(user.role) : "developer";
}

function clearForm() {
  els.nameInput.value = "";
  els.emailInput.value = "";
  els.passwordInput.value = "";
  els.phoneInput.value = "";
  els.companyInput.value = "";
  els.roleInput.value = "developer";
  els.editUid.value = "";
}

function openArchive(uid) {
  state.deleteTargetUid = uid;
  const user = state.users.find((item) => item.id === uid);
  if (!user) return;

  const role = humanizeRole(user.role);

  els.deleteEyebrow.textContent = "Archive Account";
  els.deleteTitle.textContent = `Archive ${user.name || "this account"}?`;
  els.deleteMessage.textContent = `This will set the ${role} account to inactive and block login.`;
  els.deleteWarning.textContent = "The Firebase Auth account will still exist unless you remove it manually in the Firebase Console or through an admin backend.";
  openModal(els.deleteModal);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const tabMode = els.formMode.value;
  const isClient = tabMode === "client";
  const isEdit = Boolean(els.editUid.value);

  const name = els.nameInput.value.trim();
  const email = els.emailInput.value.trim().toLowerCase();
  const password = els.passwordInput.value.trim();
  const phone = els.phoneInput.value.trim();
  const company = els.companyInput.value.trim();
  const role = isClient ? "client" : els.roleInput.value;
  const active = els.statusInput.value === "active";

  if (!name || !email || !phone || !company) {
    alert("Please fill in all required fields.");
    return;
  }

  if (!isEdit && password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  setButtonLoading(els.submitBtn, true);

  try {
    if (isEdit) {
      const uid = els.editUid.value;
      const existing = state.users.find((item) => item.id === uid);
      if (!existing) throw new Error("User not found");

      await updateDoc(doc(db, "users", uid), {
        name,
        phone,
        company,
        role,
        active,
        updatedAt: serverTimestamp(),
      });

      closeModal(els.formModal);
      return;
    }

    const { uid } = await createFirebaseAuthUser(email, password);

    const payload = {
      uid,
      name,
      email,
      phone,
      company,
      role,
      active,
      avatarUrl: "",
      invitedBy: state.user?.uid || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
    };

    await setDoc(doc(db, "users", uid), payload);

    clearForm();
    closeModal(els.formModal);
  } catch (error) {
    console.error("Failed to save account:", error);
    alert(friendlyError(error));
  } finally {
    setButtonLoading(els.submitBtn, false);
  }
}

async function handleArchive() {
  const uid = state.deleteTargetUid;
  if (!uid) return;

  setButtonLoading(els.confirmDeleteBtn, true);

  try {
    await updateDoc(doc(db, "users", uid), {
      active: false,
      updatedAt: serverTimestamp(),
    });

    state.deleteTargetUid = null;
    closeModal(els.deleteModal);
  } catch (error) {
    console.error("Failed to archive user:", error);
    alert("Unable to archive this account.");
  } finally {
    setButtonLoading(els.confirmDeleteBtn, false);
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

function getVisibleUsers() {
  const items = getUsersByTab(state.activeTab);

  return items
    .filter((user) => {
      const haystack = [
        user.name,
        user.email,
        user.phone,
        user.company,
        user.role,
        user.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(state.search.toLowerCase());
      const matchesFilter = state.filter === "all"
        || (state.filter === "active" && isActiveUser(user))
        || (state.filter === "inactive" && !isActiveUser(user));

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
}

function getUsersByTab(tab) {
  const all = state.users.filter((user) => {
    const role = normalizeRole(user.role);
    if (tab === "clients") return role === "client";
    return TEAM_ROLES.has(role);
  });

  return all;
}

function getRelatedProjectsForUser(user) {
  const role = normalizeRole(user.role);

  return state.projects.filter((project) => {
    if (role === "client") {
      return project.clientId === user.id;
    }

    if (role === "admin") {
      return true;
    }

    const assigned = Array.isArray(project.assignedDevelopers) && project.assignedDevelopers.includes(user.id);
    const managed = project.projectManagerId === user.id;

    // projectMembers collection — state may not include this on the people page,
    // so we also fall back to the legacy assignedDevelopers array.
    return assigned || managed;
  });
}

function isActiveProject(status) {
  return ACTIVE_PROJECT_STATUSES.has(normalizeRole(status));
}

function isActiveUser(user) {
  return user?.active !== false;
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function humanizeRole(role) {
  const value = normalizeRole(role);
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
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

function getTimeMs(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
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

function mapDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
}

function setSidebar(open) {
  if (!els.sidebar || !els.backdrop) return;
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("hidden");
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("hidden");
}

function setText(el, value) {
  if (!el) return;
  el.textContent = value;
}

function setButtonLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  if (button.id === "submitBtn") {
    button.textContent = loading ? "Saving..." : (state.activeTab === "clients" ? "Create Client" : "Add Member");
  }
  if (button.id === "confirmDeleteBtn") {
    button.textContent = loading ? "Archiving..." : "Archive";
  }
}

function showLoadingState() {
  setText(els.clientsCount, "0");
  setText(els.teamCount, "0");
  setText(els.activeCount, "0");
  setText(els.inactiveCount, "0");
  if (els.grid) {
    els.grid.innerHTML = "";
  }
  if (els.emptyState) {
    els.emptyState.classList.remove("hidden");
  }
}

function friendlyError(error) {
  const code = String(error?.message || error?.code || "").toUpperCase();

  if (code.includes("EMAIL_EXISTS")) return "That email is already registered.";
  if (code.includes("WEAK_PASSWORD")) return "Password must be at least 6 characters.";
  if (code.includes("INVALID_EMAIL")) return "Please enter a valid email address.";
  if (code.includes("MISSING_PASSWORD")) return "Password is required.";
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