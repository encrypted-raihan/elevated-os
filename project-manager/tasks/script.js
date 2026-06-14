
import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  LOGIN_ROUTE,
  ROLE_REDIRECTS,
  canAccessManagerPortal,
  clampNumber,
  escapeAttr,
  escapeHtml,
  formatDate,
  getDisplayName,
  getProjectTitle,
  humanize,
  normalizeRole,
  isProjectVisibleToRole,
} from "../utils.js";

const els = {
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  openSidebarBtn: document.getElementById("openSidebar"),
  closeSidebarBtn: document.getElementById("closeSidebar"),
  logoutBtn: document.querySelector(".logout-btn"),
  refreshBtn: document.getElementById("refreshBtn"),
  statTotal: document.getElementById("statTotal"),
  statTodo: document.getElementById("statTodo"),
  statProgress: document.getElementById("statProgress"),
  statCompleted: document.getElementById("statCompleted"),
  taskForm: document.getElementById("taskForm"),
  projectSelect: document.getElementById("projectSelect"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskAssignee: document.getElementById("taskAssignee"),
  taskPriority: document.getElementById("taskPriority"),
  taskDueDate: document.getElementById("taskDueDate"),
  taskFormError: document.getElementById("taskFormError"),
  board: document.getElementById("board"),
};

const state = {
  user: null,
  profile: null,
  projects: [],
  tasks: [],
  users: [],
  usersById: new Map(),
  unsubscribe: [],
  ready: false,
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

  els.refreshBtn?.addEventListener("click", () => renderAll());
  els.openSidebarBtn?.addEventListener("click", () => setSidebar(true));
  els.closeSidebarBtn?.addEventListener("click", () => setSidebar(false));
  els.backdrop?.addEventListener("click", () => setSidebar(false));

  els.taskForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await addTask();
  });

  els.projectSelect?.addEventListener("change", () => {
    renderFormControls();
  });

  document.addEventListener("click", async (event) => {
    const statusBtn = event.target.closest("[data-action='set-status']");
    if (statusBtn) {
      await updateTaskStatus(statusBtn.dataset.taskId, statusBtn.dataset.status);
      return;
    }

    const deleteBtn = event.target.closest("[data-action='delete-task']");
    if (deleteBtn) {
      await deleteTask(deleteBtn.dataset.taskId);
      return;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSidebar(false);
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
    const profile = await loadProfile(user.uid);
    if (!profile || profile.active === false) {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    if (!canAccessManagerPortal(profile.role)) {
      await safeSignOut();
      window.location.href = ROLE_REDIRECTS[normalizeRole(profile.role)] || LOGIN_ROUTE;
      return;
    }

    state.profile = profile;
    state.ready = true;

    try {
      await updateDoc(doc(db, "users", user.uid), { lastLogin: serverTimestamp() });
    } catch {}

    startListeners();
  } catch (error) {
    console.error("Tasks initialization failed:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

function startListeners() {
  const role = normalizeRole(state.profile?.role);
  const projectsQuery = role === "admin"
    ? query(collection(db, "projects"), orderBy("updatedAt", "desc"))
    : query(collection(db, "projects"), where("projectManagerId", "==", state.user.uid), orderBy("updatedAt", "desc"));

  state.unsubscribe.push(
    onSnapshot(collection(db, "users"), (snap) => {
      state.users = snap.docs.map(mapDoc).filter((user) => ["admin", "manager", "developer"].includes(normalizeRole(user.role)));
      state.usersById = new Map(state.users.map((u) => [u.id, u]));
      renderAll();
    }, handleListenerError("users"))
  );

  state.unsubscribe.push(
    onSnapshot(projectsQuery, (snap) => {
      state.projects = snap.docs.map(mapDoc);
      renderAll();
    }, handleListenerError("projects"))
  );

  state.unsubscribe.push(
    onSnapshot(collection(db, "tasks"), (snap) => {
      state.tasks = snap.docs.map(mapDoc);
      renderAll();
    }, handleListenerError("tasks"))
  );

  renderAll();
}

function renderAll() {
  if (!state.ready) return;
  renderStats();
  renderFormControls();
  renderBoard();
}

function getVisibleProjects() {
  const role = normalizeRole(state.profile?.role);
  if (role === "admin") return state.projects;
  return state.projects.filter((project) => String(project.projectManagerId || "") === String(state.user.uid || ""));
}

function renderStats() {
  const projects = getVisibleProjects();
  const projectIds = new Set(projects.map((project) => project.id));
  const tasks = state.tasks.filter((task) => projectIds.has(task.projectId));

  setText(els.statTotal, tasks.length);
  setText(els.statTodo, tasks.filter((task) => task.status === "todo").length);
  setText(els.statProgress, tasks.filter((task) => task.status === "in_progress").length);
  setText(els.statCompleted, tasks.filter((task) => task.status === "completed").length);
}

function renderFormControls() {
  const projects = getVisibleProjects();
  const projectOptions = projects.map((project) => `<option value="${escapeAttr(project.id)}">${escapeHtml(getProjectTitle(project))}</option>`).join("");
  if (els.projectSelect) els.projectSelect.innerHTML = projectOptions || `<option value="">No projects available</option>`;

  const selectedProject = projects.find((project) => project.id === els.projectSelect?.value) || projects[0];
  const assigneeUsers = [];
  if (selectedProject) {
    const manager = state.usersById.get(selectedProject.projectManagerId);
    if (manager) assigneeUsers.push(manager);
    (selectedProject.assignedDevelopers || []).forEach((uid) => {
      const user = state.usersById.get(uid);
      if (user) assigneeUsers.push(user);
    });
  } else {
    state.users.filter((user) => normalizeRole(user.role) === "developer").forEach((user) => assigneeUsers.push(user));
  }

  if (els.taskAssignee) {
    els.taskAssignee.innerHTML = `<option value="">Unassigned</option>` + assigneeUsers.map((user) => `<option value="${escapeAttr(user.id)}">${escapeHtml(getDisplayName(user))}</option>`).join("");
  }
}

function renderBoard() {
  if (!els.board) return;

  const projects = getVisibleProjects();
  const projectIds = new Set(projects.map((project) => project.id));
  const tasks = state.tasks.filter((task) => projectIds.has(task.projectId));

  const grouped = { todo: [], in_progress: [], review: [], completed: [] };
  tasks.forEach((task) => {
    const status = String(task.status || "todo");
    if (grouped[status]) grouped[status].push(task);
  });

  els.board.innerHTML = `
    <div class="board-column"><h4>To Do <span class="muted">(${grouped.todo.length})</span></h4>${renderTaskCards(grouped.todo)}</div>
    <div class="board-column"><h4>In Progress <span class="muted">(${grouped.in_progress.length})</span></h4>${renderTaskCards(grouped.in_progress)}</div>
    <div class="board-column"><h4>Review <span class="muted">(${grouped.review.length})</span></h4>${renderTaskCards(grouped.review)}</div>
    <div class="board-column"><h4>Completed <span class="muted">(${grouped.completed.length})</span></h4>${renderTaskCards(grouped.completed)}</div>
  `;

  els.board.querySelectorAll("[data-action='set-task-status']").forEach((select) => {
    select.addEventListener("change", async () => {
      await updateTaskStatus(select.dataset.taskId, select.value);
    });
  });
}

function renderTaskCards(items) {
  if (!items.length) return `<div class="empty-state-inline">No tasks</div>`;

  return items.map((task) => {
    const project = state.projects.find((p) => p.id === task.projectId);
    const assignee = state.usersById.get(task.assignedTo);

    return `
      <article class="board-task">
        <div class="task-head">
          <div>
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-sub">${escapeHtml(task.description || "No description")}</div>
          </div>
          <div class="inline-actions">
            <button class="row-btn" data-action="delete-task" data-task-id="${escapeAttr(task.id)}" type="button">Delete</button>
          </div>
        </div>
        <div class="task-sub">${escapeHtml(getProjectTitle(project) || "Project")}</div>
        <div class="task-sub">${escapeHtml(getDisplayName(assignee) || "Unassigned")} • ${escapeHtml(formatDate(task.dueDate) || "No due date")}</div>
        <div class="helper-row" style="margin-top:10px;">
          <select class="task-status-select" data-action="set-task-status" data-task-id="${escapeAttr(task.id)}">
            <option value="todo" ${task.status === "todo" ? "selected" : ""}>To Do</option>
            <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>In Progress</option>
            <option value="review" ${task.status === "review" ? "selected" : ""}>Review</option>
            <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
          </select>
        </div>
      </article>
    `;
  }).join("");
}

async function addTask() {
  const title = els.taskTitle.value.trim();
  const projectId = els.projectSelect.value;
  if (!title || !projectId) {
    showError("Please choose a project and enter a task title.");
    return;
  }

  try {
    await addDoc(collection(db, "tasks"), {
      projectId,
      title,
      description: els.taskDescription.value.trim(),
      assignedTo: els.taskAssignee.value || null,
      priority: els.taskPriority.value,
      status: "todo",
      dueDate: els.taskDueDate.value ? Timestamp.fromDate(new Date(`${els.taskDueDate.value}T00:00:00`)) : null,
      createdBy: state.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    els.taskForm.reset();
    if (els.taskPriority) els.taskPriority.value = "medium";
    if (els.taskFormError) els.taskFormError.hidden = true;
  } catch (error) {
    console.error("Failed to create task:", error);
    showError("Could not create task.");
  }
}

async function updateTaskStatus(taskId, status) {
  try {
    await updateDoc(doc(db, "tasks", taskId), { status, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error("Task update failed:", error);
  }
}

async function deleteTask(taskId) {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
  } catch (error) {
    console.error("Task delete failed:", error);
  }
}

function showError(message) {
  if (!els.taskFormError) return;
  els.taskFormError.hidden = false;
  els.taskFormError.textContent = message;
}

function showLoadingState() {
  els.board && (els.board.innerHTML = `<div class="empty-state">Connecting to Firebase…</div>`);
  if (els.projectSelect) els.projectSelect.innerHTML = `<option value="">Loading…</option>`;
  if (els.taskAssignee) els.taskAssignee.innerHTML = `<option value="">Loading…</option>`;
}

function setSidebar(open) {
  els.sidebar?.classList.toggle("open", open);
  if (els.backdrop) els.backdrop.hidden = !open;
}

function setText(el, value) {
  if (el) el.textContent = String(value);
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function safeSignOut() {
  try { await signOut(auth); } catch {}
}

function teardownListeners() {
  while (state.unsubscribe.length) {
    const unsub = state.unsubscribe.pop();
    try { unsub(); } catch {}
  }
}

function mapDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function handleListenerError(label) {
  return (error) => console.error(`Firestore listener error (${label}):`, error);
}

