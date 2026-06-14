import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { requireRole } from "../../js/guards/roleGuard.js";
import { ROLES } from "../../js/utils/permissions.js";

const LOGIN_ROUTE = "../../index/index.html";
const ASSIGNABLE_ROLES = new Set([ROLES.DEVELOPER, ROLES.COLD_CALLER]);

const els = {
  welcomeHeading: document.querySelector(".topbar h1"),
  topbarSubtext: document.querySelector(".topbar .subtext"),
  logoutBtn: document.querySelector(".logout-btn"),
  openSidebarBtn: document.getElementById("openSidebar"),
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),

  statProjects: document.getElementById("statProjects"),
  statMembers: document.getElementById("statMembers"),
  statOpenTasks: document.getElementById("statOpenTasks"),
  statProgress: document.getElementById("statProgress"),
  projectsRows: document.getElementById("projectsRows"),

  workspaceBackdrop: document.getElementById("workspaceBackdrop"),
  closeWorkspace: document.getElementById("closeWorkspace"),
  workspaceTitle: document.getElementById("workspaceTitle"),
  workspaceClient: document.getElementById("workspaceClient"),
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabPanels: document.querySelectorAll(".tab-panel"),

  memberList: document.getElementById("memberList"),
  addMemberSelect: document.getElementById("addMemberSelect"),
  addMemberBtn: document.getElementById("addMemberBtn"),

  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskAssignee: document.getElementById("taskAssignee"),
  taskPriority: document.getElementById("taskPriority"),
  taskDueDate: document.getElementById("taskDueDate"),
  taskFormError: document.getElementById("taskFormError"),
  taskList: document.getElementById("taskList"),

  projectStatus: document.getElementById("projectStatus"),
  projectProgress: document.getElementById("projectProgress"),
  projectNote: document.getElementById("projectNote"),
  saveStatusBtn: document.getElementById("saveStatusBtn"),
  addNoteBtn: document.getElementById("addNoteBtn"),
  notesFormError: document.getElementById("notesFormError"),
  noteList: document.getElementById("noteList"),
};

const state = {
  uid: null,
  projects: [],
  users: [],
  usersById: new Map(),
  membersByProject: new Map(),
  tasksByProject: new Map(),
  activeProjectId: null,
  unsubscribe: [],
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindUi();

  onAuthStateChanged(auth, async (user) => {
    teardown();

    if (!user) {
      window.location.href = LOGIN_ROUTE;
      return;
    }

    let profile;
    try {
      profile = await requireRole(user.uid, [ROLES.MANAGER]);
    } catch (err) {
      console.error("Role check failed:", err);
      await signOut(auth).catch(() => {});
      window.location.href = LOGIN_ROUTE;
      return;
    }

    if (!profile) return;

    state.uid = user.uid;

    if (els.welcomeHeading) {
      els.welcomeHeading.textContent = `Welcome Back, ${profile.name || "Manager"}`;
    }

    await loadUsers();
    startProjectsListener(user.uid);
  });
}

function teardown() {
  state.unsubscribe.forEach((unsub) => unsub());
  state.unsubscribe = [];
  state.projects = [];
  state.membersByProject = new Map();
  state.tasksByProject = new Map();
}

async function loadUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));
    state.users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    state.usersById = new Map(state.users.map((u) => [u.id, u]));
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

function startProjectsListener(uid) {
  const projectsQuery = query(collection(db, "projects"), where("projectManagerId", "==", uid));

  const unsub = onSnapshot(projectsQuery, (snap) => {
    state.projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    state.projects.forEach((project) => {
      startMembersListener(project.id);
      startTasksListener(project.id);
    });
    render();
  }, (err) => console.error("Projects listener error:", err));

  state.unsubscribe.push(unsub);
}

function startMembersListener(projectId) {
  const membersQuery = query(collection(db, "projectMembers"), where("projectId", "==", projectId));

  const unsub = onSnapshot(membersQuery, (snap) => {
    state.membersByProject.set(projectId, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    render();
    if (state.activeProjectId === projectId) renderWorkspace();
  }, (err) => console.error("Members listener error:", err));

  state.unsubscribe.push(unsub);
}

function startTasksListener(projectId) {
  const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));

  const unsub = onSnapshot(tasksQuery, (snap) => {
    state.tasksByProject.set(projectId, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    render();
    if (state.activeProjectId === projectId) renderWorkspace();
  }, (err) => console.error("Tasks listener error:", err));

  state.unsubscribe.push(unsub);
}

function startNotesListener(projectId) {
  const notesQuery = query(collection(db, "projectNotes"), where("projectId", "==", projectId));

  const unsub = onSnapshot(notesQuery, (snap) => {
    const notes = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));
    renderNotes(notes);
  }, (err) => console.error("Notes listener error:", err));

  state.unsubscribe.push(unsub);
  return unsub;
}

function render() {
  const totalProjects = state.projects.length;

  let totalMembers = 0;
  let totalProgress = 0;
  let openTasks = 0;

  state.projects.forEach((project) => {
    const members = state.membersByProject.get(project.id) || [];
    const tasks = state.tasksByProject.get(project.id) || [];

    totalMembers += members.length;
    totalProgress += Number(project.progress || 0);
    openTasks += tasks.filter((t) => t.status !== "completed").length;
  });

  setText(els.statProjects, totalProjects);
  setText(els.statMembers, totalMembers);
  setText(els.statOpenTasks, openTasks);
  setText(els.statProgress, totalProjects ? `${Math.round(totalProgress / totalProjects)}%` : "0%");

  renderProjectsTable();
}

function renderProjectsTable() {
  if (!els.projectsRows) return;

  if (state.projects.length === 0) {
    els.projectsRows.innerHTML = `<div class="empty-row">No projects have been assigned to you yet. Once Admin assigns a project, it will appear here.</div>`;
    return;
  }

  els.projectsRows.innerHTML = state.projects
    .map((project) => {
      const due = project.dueDate ? dateFormatter.format(toDate(project.dueDate)) : "—";
      const progress = Number(project.progress || 0);
      return `
        <div class="pm-row" data-project="${project.id}">
          <div>
            <p class="lead-name">${escapeHtml(project.title || project.name || "Untitled project")}</p>
            <p class="lead-sub">${(state.membersByProject.get(project.id) || []).length} member(s)</p>
          </div>
          <div>${escapeHtml(project.clientId ? (state.usersById.get(project.clientId)?.name || project.clientId) : "—")}</div>
          <div><span class="status-badge status-${escapeHtml(project.status || "new")}">${formatStatus(project.status)}</span></div>
          <div><span class="priority-badge priority-${escapeHtml(project.priority || "medium")}">${formatStatus(project.priority || "medium")}</span></div>
          <div>${due}</div>
          <div class="progress-wrap">
            <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
            <span>${progress}%</span>
          </div>
          <div class="lead-actions">
            <button class="row-btn" data-open="${project.id}" type="button">Open</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function openWorkspace(projectId) {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return;

  state.activeProjectId = projectId;
  els.workspaceTitle.textContent = project.title || project.name || "Project";
  els.workspaceClient.textContent = `Client: ${state.usersById.get(project.clientId)?.name || project.clientId || "—"} · Deadline: ${project.dueDate ? dateFormatter.format(toDate(project.dueDate)) : "—"}`;

  els.projectStatus.value = project.status || "planning";
  els.projectProgress.value = project.progress || 0;
  els.projectNote.value = "";
  els.notesFormError.hidden = true;
  els.taskFormError.hidden = true;
  els.taskForm.reset();

  startNotesListener(projectId);
  switchTab("team");
  renderWorkspace();

  els.workspaceBackdrop.hidden = false;
}

function closeWorkspace() {
  els.workspaceBackdrop.hidden = true;
  state.activeProjectId = null;
}

function switchTab(tab) {
  els.tabBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  els.tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
}

function renderWorkspace() {
  if (!state.activeProjectId) return;

  renderMembers();
  renderAddMemberOptions();
  renderTaskAssigneeOptions();
  renderTasks();
}

function renderMembers() {
  const members = state.membersByProject.get(state.activeProjectId) || [];

  if (members.length === 0) {
    els.memberList.innerHTML = `<p class="empty-state">No team members assigned yet. Add programmers or cold callers below.</p>`;
    return;
  }

  els.memberList.innerHTML = members
    .map((member) => {
      const user = state.usersById.get(member.userId);
      return `
        <div class="member-row">
          <div class="member-meta">
            <span class="member-name">${escapeHtml(user?.name || member.userId)}</span>
            <span class="member-role">${escapeHtml(formatStatus(user?.role || member.role))}</span>
          </div>
          <button class="row-btn" data-remove-member="${member.id}" type="button">Remove</button>
        </div>
      `;
    })
    .join("");
}

function renderAddMemberOptions() {
  const members = state.membersByProject.get(state.activeProjectId) || [];
  const assignedIds = new Set(members.map((m) => m.userId));

  const candidates = state.users.filter(
    (u) => ASSIGNABLE_ROLES.has((u.role || "").toLowerCase()) && !assignedIds.has(u.id)
  );

  if (candidates.length === 0) {
    els.addMemberSelect.innerHTML = `<option value="">No available staff to add</option>`;
    els.addMemberBtn.disabled = true;
    return;
  }

  els.addMemberBtn.disabled = false;
  els.addMemberSelect.innerHTML = candidates
    .map((u) => `<option value="${u.id}">${escapeHtml(u.name || u.email || u.id)} — ${escapeHtml(formatStatus(u.role))}</option>`)
    .join("");
}

function renderTaskAssigneeOptions() {
  const members = state.membersByProject.get(state.activeProjectId) || [];

  if (members.length === 0) {
    els.taskAssignee.innerHTML = `<option value="">Unassigned</option>`;
    return;
  }

  els.taskAssignee.innerHTML =
    `<option value="">Unassigned</option>` +
    members
      .map((m) => {
        const user = state.usersById.get(m.userId);
        return `<option value="${m.userId}">${escapeHtml(user?.name || m.userId)}</option>`;
      })
      .join("");
}

function renderTasks() {
  const tasks = (state.tasksByProject.get(state.activeProjectId) || [])
    .slice()
    .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));

  if (tasks.length === 0) {
    els.taskList.innerHTML = `<p class="empty-state">No tasks yet. Create the first task above.</p>`;
    return;
  }

  els.taskList.innerHTML = tasks
    .map((task) => {
      const assignee = task.assignedTo ? state.usersById.get(task.assignedTo)?.name || task.assignedTo : "Unassigned";
      const due = task.dueDate ? dateFormatter.format(toDate(task.dueDate)) : "No due date";
      return `
        <div class="task-item">
          <div class="task-meta">
            <p class="task-title">${escapeHtml(task.title)}</p>
            <p class="task-sub">
              <span class="priority-badge priority-${escapeHtml(task.priority || "medium")}">${formatStatus(task.priority || "medium")}</span>
              · ${escapeHtml(assignee)} · Due ${due}
            </p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <select class="task-status-select" data-task-status="${task.id}">
              <option value="todo" ${task.status === "todo" ? "selected" : ""}>To Do</option>
              <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>In Progress</option>
              <option value="review" ${task.status === "review" ? "selected" : ""}>Review</option>
              <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
            </select>
            <button class="row-btn" data-remove-task="${task.id}" type="button">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderNotes(notes) {
  if (notes.length === 0) {
    els.noteList.innerHTML = `<p class="empty-state">No notes or status updates yet.</p>`;
    return;
  }

  els.noteList.innerHTML = notes
    .map((note) => `
      <div class="note-item">
        <p class="note-time">${dateFormatter.format(toDate(note.createdAt))} · ${escapeHtml(state.usersById.get(note.createdBy)?.name || "You")}</p>
        <p>${escapeHtml(note.message)}</p>
      </div>
    `)
    .join("");
}

async function addMember() {
  const userId = els.addMemberSelect.value;
  if (!userId || !state.activeProjectId) return;

  const user = state.usersById.get(userId);

  try {
    await addDoc(collection(db, "projectMembers"), {
      projectId: state.activeProjectId,
      userId,
      role: user?.role || "developer",
      assignedBy: state.uid,
      assignedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to add member:", err);
  }
}

async function removeMember(membershipId) {
  try {
    await deleteDoc(doc(db, "projectMembers", membershipId));
  } catch (err) {
    console.error("Failed to remove member:", err);
  }
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  if (!state.activeProjectId) return;

  const title = els.taskTitle.value.trim();
  if (!title) {
    showError(els.taskFormError, "Please enter a task title.");
    return;
  }

  try {
    await addDoc(collection(db, "tasks"), {
      projectId: state.activeProjectId,
      title,
      description: "",
      assignedTo: els.taskAssignee.value || null,
      priority: els.taskPriority.value,
      status: "todo",
      dueDate: els.taskDueDate.value ? Timestamp.fromDate(new Date(els.taskDueDate.value)) : null,
      createdBy: state.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    els.taskForm.reset();
    els.taskPriority.value = "medium";
    els.taskFormError.hidden = true;
  } catch (err) {
    console.error("Failed to create task:", err);
    showError(els.taskFormError, "Could not create this task. Please try again.");
  }
}

async function updateTaskStatus(taskId, status) {
  try {
    await updateDoc(doc(db, "tasks", taskId), { status, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error("Failed to update task status:", err);
  }
}

async function removeTask(taskId) {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
  } catch (err) {
    console.error("Failed to delete task:", err);
  }
}

async function saveProjectStatus() {
  if (!state.activeProjectId) return;

  const progress = Math.max(0, Math.min(100, Number(els.projectProgress.value) || 0));

  try {
    await updateDoc(doc(db, "projects", state.activeProjectId), {
      status: els.projectStatus.value,
      progress,
      updatedAt: serverTimestamp(),
    });
    els.notesFormError.hidden = true;
  } catch (err) {
    console.error("Failed to save project status:", err);
    showError(els.notesFormError, "Could not save project status.");
  }
}

async function addProjectNote() {
  if (!state.activeProjectId) return;

  const message = els.projectNote.value.trim();
  if (!message) {
    showError(els.notesFormError, "Write a note before saving.");
    return;
  }

  try {
    await addDoc(collection(db, "projectNotes"), {
      projectId: state.activeProjectId,
      message,
      createdBy: state.uid,
      createdAt: serverTimestamp(),
    });
    els.projectNote.value = "";
    els.notesFormError.hidden = true;
  } catch (err) {
    console.error("Failed to add note:", err);
    showError(els.notesFormError, "Could not save this note.");
  }
}

function bindUi() {
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

  if (els.projectsRows) {
    els.projectsRows.addEventListener("click", (event) => {
      const openBtn = event.target.closest("[data-open]");
      if (openBtn) openWorkspace(openBtn.dataset.open);
    });
  }

  if (els.closeWorkspace) els.closeWorkspace.addEventListener("click", closeWorkspace);

  els.tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  if (els.addMemberBtn) els.addMemberBtn.addEventListener("click", addMember);

  if (els.memberList) {
    els.memberList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("[data-remove-member]");
      if (removeBtn) removeMember(removeBtn.dataset.removeMember);
    });
  }

  if (els.taskForm) els.taskForm.addEventListener("submit", handleTaskSubmit);

  if (els.taskList) {
    els.taskList.addEventListener("change", (event) => {
      const select = event.target.closest("[data-task-status]");
      if (select) updateTaskStatus(select.dataset.taskStatus, select.value);
    });

    els.taskList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("[data-remove-task]");
      if (removeBtn) removeTask(removeBtn.dataset.removeTask);
    });
  }

  if (els.saveStatusBtn) els.saveStatusBtn.addEventListener("click", saveProjectStatus);
  if (els.addNoteBtn) els.addNoteBtn.addEventListener("click", addProjectNote);
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

function showError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function formatStatus(status) {
  return String(status || "—").replace(/_/g, " ");
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
