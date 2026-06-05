"use strict";

const state = {
  filter: "all",
  search: "",
  clients: [
    { id: "CL-001", name: "ABC Builders", username: "abcbuilders", password: "Temp@1234" },
    { id: "CL-002", name: "XYZ Foods", username: "xyzfoods", password: "Temp@1234" },
    { id: "CL-003", name: "Nova Retail", username: "novaretail", password: "Temp@1234" },
    { id: "CL-004", name: "Prime Dentals", username: "primedentals", password: "Temp@1234" },
    { id: "CL-005", name: "Justice & Co.", username: "justiceco", password: "Temp@1234" },
    { id: "CL-006", name: "Sunrise Properties", username: "sunriseproperties", password: "Temp@1234" },
  ],
  projects: [
    {
      id: "EWS-001",
      name: "Luxury Villa Website",
      description: "Premium real-estate website with high-end visuals and lead capture.",
      clientId: "CL-001",
      clientName: "ABC Builders",
      phase: "Development",
      status: "development",
      progress: 72,
      dueDate: "2026-07-15",
      startDate: "2026-05-18",
      budget: 180000,
      team: ["Rahul", "Akash", "Arjun"],
      invoices: ["INV-EWS001-01", "INV-EWS001-02", "INV-EWS001-03"],
      invoiceBreakdown: [50, 30, 20],
    },
    {
      id: "EWS-002",
      name: "Restaurant Website",
      description: "Modern restaurant brand site with menu system and reservation flow.",
      clientId: "CL-002",
      clientName: "XYZ Foods",
      phase: "Content Integration",
      status: "development",
      progress: 48,
      dueDate: "2026-07-21",
      startDate: "2026-05-28",
      budget: 95000,
      team: ["Rahul", "Sarah"],
      invoices: ["INV-EWS002-01", "INV-EWS002-02", "INV-EWS002-03"],
      invoiceBreakdown: [50, 30, 20],
    },
    {
      id: "EWS-003",
      name: "Ecommerce Store",
      description: "Fast storefront with catalog structure, payments, and admin operations.",
      clientId: "CL-003",
      clientName: "Nova Retail",
      phase: "Testing",
      status: "testing",
      progress: 83,
      dueDate: "2026-07-29",
      startDate: "2026-05-15",
      budget: 240000,
      team: ["Akash", "Arjun"],
      invoices: ["INV-EWS003-01", "INV-EWS003-02", "INV-EWS003-03"],
      invoiceBreakdown: [50, 30, 20],
    },
    {
      id: "EWS-004",
      name: "SEO Campaign",
      description: "Search visibility and content optimization for a dental practice.",
      clientId: "CL-004",
      clientName: "Prime Dentals",
      phase: "Optimization",
      status: "development",
      progress: 61,
      dueDate: "2026-08-05",
      startDate: "2026-05-10",
      budget: 65000,
      team: ["Rahul", "Sarah"],
      invoices: ["INV-EWS004-01", "INV-EWS004-02", "INV-EWS004-03"],
      invoiceBreakdown: [50, 30, 20],
    },
    {
      id: "EWS-005",
      name: "Law Firm Portfolio",
      description: "Trust-focused website for a legal brand with case-study structure.",
      clientId: "CL-005",
      clientName: "Justice & Co.",
      phase: "Planning",
      status: "planning",
      progress: 36,
      dueDate: "2026-08-11",
      startDate: "2026-06-02",
      budget: 120000,
      team: ["Arjun"],
      invoices: ["INV-EWS005-01", "INV-EWS005-02", "INV-EWS005-03"],
      invoiceBreakdown: [50, 30, 20],
    },
    {
      id: "EWS-006",
      name: "Brand Refresh Sprint",
      description: "Short sprint for updated UI, messaging, and visual consistency.",
      clientId: "CL-002",
      clientName: "XYZ Foods",
      phase: "Hold Review",
      status: "onhold",
      progress: 18,
      dueDate: "2026-08-18",
      startDate: "2026-06-01",
      budget: 40000,
      team: ["Sarah"],
      invoices: ["INV-EWS006-01", "INV-EWS006-02", "INV-EWS006-03"],
      invoiceBreakdown: [50, 30, 20],
    },
    {
      id: "EWS-007",
      name: "Client Portal",
      description: "Internal portal for project tracking, timelines, files, and invoices.",
      clientId: "CL-001",
      clientName: "ABC Builders",
      phase: "Completed",
      status: "completed",
      progress: 100,
      dueDate: "2026-05-30",
      startDate: "2026-04-20",
      budget: 210000,
      team: ["Rahul", "Akash", "Arjun", "Sarah"],
      invoices: ["INV-EWS007-01", "INV-EWS007-02", "INV-EWS007-03"],
      invoiceBreakdown: [50, 30, 20],
    },
  ],
  teamMembers: ["Rahul", "Akash", "Arjun", "Sarah"],
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
  teamList: document.getElementById("teamList"),
  projectName: document.getElementById("projectName"),
  description: document.getElementById("description"),
  budget: document.getElementById("budget"),
  startDate: document.getElementById("startDate"),
  dueDate: document.getElementById("dueDate"),
  clientName: document.getElementById("clientName"),
  clientUsername: document.getElementById("clientUsername"),
  clientPassword: document.getElementById("clientPassword"),
  notificationList: document.getElementById("notificationList"),
  notificationBtn: document.getElementById("notificationBtn"),
  notificationDropdown: document.getElementById("notificationDropdown"),
  notificationCount: document.getElementById("notificationCount"),
  openSidebarBtn: document.getElementById("openSidebar"),
  closeSidebarBtn: document.getElementById("closeSidebar"),
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
};

const notifications = [
  "Client approved Homepage Design",
  "Invoice INV-EWS001-02 marked paid",
  "New message in Luxury Villa Website",
];

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalize(text) {
  return String(text).toLowerCase().trim();
}

function statusLabel(project) {
  return project.phase;
}

function isActiveStatus(status) {
  return status !== "completed" && status !== "onhold";
}

function matchesFilter(project, filter) {
  if (filter === "all") return true;
  if (filter === "active") return isActiveStatus(project.status);
  if (filter === "completed") return project.status === "completed";
  if (filter === "onhold") return project.status === "onhold";
  return normalize(project.status).includes(filter) || normalize(project.phase).includes(filter);
}

function matchesSearch(project, query) {
  if (!query) return true;
  const haystack = [
    project.name,
    project.clientName,
    project.id,
    project.phase,
    project.status,
    project.description,
  ].join(" ");
  return normalize(haystack).includes(query);
}

function filteredProjects() {
  const q = normalize(state.search);
  return state.projects.filter((project) => matchesFilter(project, state.filter) && matchesSearch(project, q));
}

function buildClientOptions() {
  const current = els.clientSelect.value;
  els.clientSelect.innerHTML = `
    <option value="" disabled ${current ? "" : "selected"}>Select existing client</option>
    ${state.clients
      .map((client) => `<option value="${client.id}" ${current === client.id ? "selected" : ""}>${client.name}</option>`)
      .join("")}
  `;
}

function buildTeamList() {
  els.teamList.innerHTML = state.teamMembers
    .map(
      (member, index) => `
        <label class="team-item">
          <input type="checkbox" name="team" value="${member}" ${index < 3 ? "checked" : ""} />
          <span>${member}</span>
        </label>
      `
    )
    .join("");
}

function openModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function closeAllModals() {
  [els.projectModal, els.clientModal].forEach((modal) => closeModal(modal));
}

function renderNotifications() {
  els.notificationList.innerHTML = notifications
    .map((note) => `
      <div class="dropdown-item">
        <strong>${note}</strong>
        <span>Just now</span>
      </div>
    `)
    .join("");
  els.notificationCount.textContent = notifications.length;
}

function renderProjects() {
  const items = filteredProjects();

  els.resultsCount.textContent = `${items.length} project${items.length === 1 ? "" : "s"} shown`;
  els.emptyState.hidden = items.length !== 0;

  els.projectsGrid.innerHTML = items
    .map(
      (project) => `
      <article class="project-card" tabindex="0" role="button" data-project-id="${project.id}" data-status="${project.status}" aria-label="Open ${project.name}">
        <div class="project-top">
          <div>
            <h3 class="project-title">${project.name}</h3>
            <div class="project-client">${project.clientName}</div>
          </div>
          <div class="badge-row">
            <span class="status-badge ${project.status}">${statusLabel(project)}</span>
          </div>
        </div>

        <div class="project-meta">
          <div class="meta-row">
            <span>Project ID</span>
            <strong>${project.id}</strong>
          </div>
          <div class="meta-row">
            <span>Current Phase</span>
            <strong>${project.phase}</strong>
          </div>
          <div class="meta-row">
            <span>Due Date</span>
            <strong>${formatDate(project.dueDate)}</strong>
          </div>
        </div>

        <div class="project-progress">
          <div class="progress-label">
            <span>Progress</span>
            <span><strong>${project.progress}%</strong> Complete</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${project.progress}%"></div>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  requestAnimationFrame(() => {
    document.querySelectorAll(".progress-fill").forEach((bar) => {
      bar.style.width = bar.style.width;
    });
  });

  if (items.length === 0) {
    els.projectsGrid.innerHTML = "";
  }
}

function setActiveFilter(filter) {
  state.filter = filter;
  els.filterPills.forEach((pill) => pill.classList.toggle("active", pill.dataset.filter === filter));
  renderProjects();
}

function createProjectId() {
  const ids = state.projects
    .map((project) => Number(project.id.replace("EWS-", "")))
    .filter(Number.isFinite);
  const next = (ids.length ? Math.max(...ids) : 0) + 1;
  return `EWS-${String(next).padStart(3, "0")}`;
}

function createInvoiceIds(projectId) {
  const compact = projectId.replace("-", "");
  return [1, 2, 3].map((n) => `INV-${compact}-${String(n).padStart(2, "0")}`);
}

function getCheckedTeamMembers() {
  return [...document.querySelectorAll('input[name="team"]:checked')].map((input) => input.value);
}

function resetProjectForm() {
  els.projectForm.reset();
  buildClientOptions();
  buildTeamList();
}

function resetClientForm() {
  els.clientForm.reset();
}

function openProjectModal() {
  resetProjectForm();
  openModal(els.projectModal);
}

function openClientModal() {
  resetClientForm();
  openModal(els.clientModal);
}

function addClientToDropdown(clientId) {
  buildClientOptions();
  els.clientSelect.value = clientId;
}

function navigateToWorkspace(projectId) {
  window.location.href = `../project-workspace/index.html?project=${encodeURIComponent(projectId)}`;
}

function handleProjectOpen(projectId) {
  navigateToWorkspace(projectId);
}

function setSidebar(open) {
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function notificationItem(text) {
  const item = document.createElement("div");
  item.className = "dropdown-item";
  item.innerHTML = `<strong>${text}</strong><span>Just now</span>`;
  return item;
}

document.addEventListener("click", (event) => {
  const closeBtn = event.target.closest("[data-close]");
  if (closeBtn) {
    const id = closeBtn.getAttribute("data-close");
    const modal = document.getElementById(id);
    if (modal) closeModal(modal);
    return;
  }

  if (event.target.classList.contains("modal-backdrop")) {
    closeModal(event.target);
  }

  const filterBtn = event.target.closest(".filter-pill");
  if (filterBtn) {
    setActiveFilter(filterBtn.dataset.filter);
    return;
  }

  const card = event.target.closest(".project-card");
  if (card) {
    handleProjectOpen(card.dataset.projectId);
  }

  if (!els.notificationDropdown.hidden && !event.target.closest(".notification-wrap")) {
    els.notificationDropdown.hidden = true;
    els.notificationBtn.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllModals();
    setSidebar(false);
    els.notificationDropdown.hidden = true;
    els.notificationBtn.setAttribute("aria-expanded", "false");
  }

  const focusedCard = document.activeElement?.classList?.contains("project-card");
  if ((event.key === "Enter" || event.key === " ") && focusedCard) {
    event.preventDefault();
    handleProjectOpen(document.activeElement.dataset.projectId);
  }
});

els.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderProjects();
});

els.openProjectModalBtn.addEventListener("click", openProjectModal);
els.emptyNewProjectBtn.addEventListener("click", openProjectModal);
els.openClientModalBtn.addEventListener("click", openClientModal);

els.projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const projectName = els.projectName.value.trim();
  const description = els.description.value.trim();
  const clientId = els.clientSelect.value;
  const budget = Number(els.budget.value);
  const startDate = els.startDate.value;
  const dueDate = els.dueDate.value;
  const team = getCheckedTeamMembers();

  if (!projectName || !description || !clientId || !budget || !startDate || !dueDate) return;

  const client = state.clients.find((item) => item.id === clientId);
  if (!client) return;

  const projectId = createProjectId();
  const project = {
    id: projectId,
    name: projectName,
    description,
    clientId,
    clientName: client.name,
    phase: "Planning",
    status: "planning",
    progress: 0,
    dueDate,
    startDate,
    budget,
    team: team.length ? team : [state.teamMembers[0]],
    invoices: createInvoiceIds(projectId),
    invoiceBreakdown: [50, 30, 20],
  };

  state.projects.unshift(project);
  closeModal(els.projectModal);
  setActiveFilter("all");
  state.search = "";
  els.searchInput.value = "";
  renderProjects();
  navigateToWorkspace(projectId);
});

els.clientForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = els.clientName.value.trim();
  const username = els.clientUsername.value.trim();
  const password = els.clientPassword.value.trim();

  if (!name || !username || !password) return;

  const nextClientIndex = state.clients.length + 1;
  const clientId = `CL-${String(nextClientIndex).padStart(3, "0")}`;

  state.clients.push({
    id: clientId,
    name,
    username,
    password,
  });

  addClientToDropdown(clientId);
  closeModal(els.clientModal);
});

els.notificationBtn.addEventListener("click", () => {
  const isOpen = !els.notificationDropdown.hidden;
  els.notificationDropdown.hidden = isOpen;
  els.notificationBtn.setAttribute("aria-expanded", String(!isOpen));
});

els.openSidebarBtn.addEventListener("click", () => setSidebar(true));
els.closeSidebarBtn.addEventListener("click", () => setSidebar(false));
els.backdrop.addEventListener("click", () => {
  setSidebar(false);
  els.notificationDropdown.hidden = true;
  els.notificationBtn.setAttribute("aria-expanded", "false");
});

renderNotifications();
buildClientOptions();
buildTeamList();
renderProjects();