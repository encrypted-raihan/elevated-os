"use strict";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const phaseProgressMap = {
  Planning: 10,
  Design: 30,
  Development: 60,
  Testing: 85,
  Launch: 100,
};

const phaseOrder = ["Planning", "Design", "Development", "Testing", "Launch"];

const projects = {
  "EWS-001": {
    id: "EWS-001",
    name: "Luxury Villa Website",
    client: "ABC Builders",
    description:
      "Premium luxury villa website with immersive visuals, modern lead capture, and a clean high-end brand experience.",
    status: "Active",
    startDate: "2026-06-01",
    dueDate: "2026-07-15",
    budget: 180000,
    currentPhase: "Development",
    team: [
      { name: "Rahul", role: "Frontend Developer" },
      { name: "Akash", role: "Backend Developer" },
      { name: "Arjun", role: "UI Designer" },
    ],
    files: [
      { name: "Homepage Design.fig", uploadedBy: "Arjun", uploadDate: "2026-06-04" },
      { name: "Brand Guidelines.pdf", uploadedBy: "Rahul", uploadDate: "2026-06-06" },
      { name: "Final Website.zip", uploadedBy: "Akash", uploadDate: "2026-06-08" },
    ],
    invoices: [
      { id: "INV-EWS001-01", title: "Invoice 1", percent: 50, amount: 90000, status: "Paid" },
      { id: "INV-EWS001-02", title: "Invoice 2", percent: 30, amount: 54000, status: "Pending" },
      { id: "INV-EWS001-03", title: "Invoice 3", percent: 20, amount: 36000, status: "Pending" },
    ],
    messages: [
      { sender: "ABC Builders", role: "client", text: "Can we make the hero section bigger?", time: "2026-06-04T10:12:00" },
      { sender: "Rahul", role: "team", text: "Working on it.", time: "2026-06-04T10:18:00" },
      { sender: "Admin", role: "admin", text: "Will be updated today.", time: "2026-06-04T10:22:00" },
    ],
    updates: [
      { title: "Homepage Design Completed", description: "First visual direction approved internally.", date: "2026-06-03", createdBy: "Arjun" },
      { title: "Development Started", description: "Base layout and responsiveness implementation started.", date: "2026-06-05", createdBy: "Rahul" },
      { title: "Content Received", description: "Client shared copy and reference content.", date: "2026-06-08", createdBy: "Admin" },
      { title: "Client Approved Design", description: "Primary desktop layout approved by client.", date: "2026-06-10", createdBy: "Admin" },
    ],
  },
};

const state = {
  project: null,
  activeTab: "overview",
  deleteOpen: false,
  promptMode: null,
  promptAction: null,
};

const el = (id) => document.getElementById(id);

const projectName = el("projectName");
const projectMeta = el("projectMeta");
const summaryProgress = el("summaryProgress");
const summaryPhase = el("summaryPhase");
const summaryBudget = el("summaryBudget");
const summaryDueDate = el("summaryDueDate");

const detailName = el("detailName");
const detailDescription = el("detailDescription");
const detailClient = el("detailClient");
const detailId = el("detailId");
const detailStatus = el("detailStatus");
const detailStartDate = el("detailStartDate");
const detailDueDate = el("detailDueDate");
const detailPhase = el("detailPhase");
const detailBudget = el("detailBudget");
const overviewTeam = el("overviewTeam");

const phaseSelect = el("phaseSelect");
const timelineList = el("timelineList");
const fileGrid = el("fileGrid");
const fileInput = el("fileInput");
const uploadBtn = el("uploadBtn");

const paymentBudget = el("paymentBudget");
const paymentReceived = el("paymentReceived");
const paymentPending = el("paymentPending");
const invoiceList = el("invoiceList");

const chatList = el("chatList");
const chatForm = el("chatForm");
const messageInput = el("messageInput");

const updatesList = el("updatesList");
const teamList = el("teamList");

const modalBackdrop = el("modalBackdrop");
const deleteModal = el("deleteModal");
const deleteTitle = el("deleteTitle");
const deleteText = el("deleteText");
const cancelDelete = el("cancelDelete");
const confirmDelete = el("confirmDelete");

const promptModal = el("promptModal");
const promptTitle = el("promptTitle");
const promptText = el("promptText");
const promptInput = el("promptInput");
const cancelPrompt = el("cancelPrompt");
const confirmPrompt = el("confirmPrompt");

const sidebar = el("sidebar");
const backdrop = el("backdrop");
const openSidebar = el("openSidebar");
const closeSidebar = el("closeSidebar");

function getProjectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("project") || "EWS-001";
  return projects[id] || projects["EWS-001"];
}

function phaseIndex(phase) {
  return phaseOrder.indexOf(phase);
}

function renderHeader() {
  const p = state.project;
  projectName.textContent = p.name;
  projectMeta.textContent = `Project ID ${p.id} • Client ${p.client}`;
  summaryProgress.textContent = `${phaseProgressMap[p.currentPhase]}%`;
  summaryPhase.textContent = p.currentPhase;
  summaryBudget.textContent = money(p.budget);
  summaryDueDate.textContent = formatDate(p.dueDate);

  detailName.textContent = p.name;
  detailDescription.textContent = p.description;
  detailClient.textContent = p.client;
  detailId.textContent = p.id;
  detailStatus.textContent = p.status;
  detailStartDate.textContent = formatDate(p.startDate);
  detailDueDate.textContent = formatDate(p.dueDate);
  detailPhase.textContent = p.currentPhase;
  detailBudget.textContent = money(p.budget);
}

function renderOverviewTeam() {
  overviewTeam.innerHTML = "";
  state.project.team.forEach((member) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = member.name;
    overviewTeam.appendChild(chip);
  });
}

function renderPhaseSelect() {
  phaseSelect.innerHTML = "";
  phaseOrder.forEach((phase) => {
    const opt = document.createElement("option");
    opt.value = phase;
    opt.textContent = phase;
    if (phase === state.project.currentPhase) opt.selected = true;
    phaseSelect.appendChild(opt);
  });
}

function renderTimeline() {
  const current = phaseIndex(state.project.currentPhase);
  const isCompleted = state.project.status === "Completed" || state.project.currentPhase === "Completed";
  timelineList.innerHTML = "";

  phaseOrder.forEach((phase, index) => {
    const item = document.createElement("div");
    item.className = isCompleted ? "timeline-item done" : `timeline-item ${index < current ? "done" : index === current ? "current" : ""}`;

    const marker = document.createElement("div");
    marker.className = "timeline-marker";
    marker.textContent = isCompleted ? "✓" : index < current ? "✓" : index === current ? "●" : "○";

    const content = document.createElement("div");
    content.className = "timeline-content";

    const title = document.createElement("div");
    title.className = "timeline-title";
    title.textContent = phase;

    const desc = document.createElement("div");
    desc.className = "timeline-desc";
    desc.textContent = `${phase} stage with progress set to ${phaseProgressMap[phase]}%.`;

    content.appendChild(title);
    content.appendChild(desc);

    const actionWrap = document.createElement("div");
    actionWrap.className = "timeline-action";

    const btn = document.createElement("button");
    btn.className = "small-btn";

    if (isCompleted) {
      btn.textContent = "Completed";
      btn.disabled = true;
    } else if (index === current) {
      if (phase === "Launch") {
        btn.textContent = "Mark Complete";
        btn.addEventListener("click", () => {
          state.project.currentPhase = "Launch";
          state.project.status = "Completed";
          renderAll();
        });
      } else {
        btn.textContent = "Current Phase";
        btn.disabled = true;
      }
    } else {
      btn.textContent = "Set Active";
      btn.addEventListener("click", () => {
        state.project.currentPhase = phase;
        state.project.status = "Active";
        renderAll();
      });
    }

    actionWrap.appendChild(btn);
    item.appendChild(marker);
    item.appendChild(content);
    item.appendChild(actionWrap);
    timelineList.appendChild(item);
  });
}

function renderFiles() {
  fileGrid.innerHTML = "";
  if (!state.project.files.length) {
    fileGrid.innerHTML = `<div class="empty-state">No files uploaded yet.</div>`;
    return;
  }

  state.project.files.forEach((file, index) => {
    const card = document.createElement("div");
    card.className = "file-card";
    card.innerHTML = `
      <div class="file-name">${file.name}</div>
      <div class="file-meta">
        Uploaded By: ${file.uploadedBy}<br />
        Upload Date: ${formatDate(file.uploadDate)}
      </div>
      <div class="file-actions">
        <button class="small-btn" data-action="download" data-index="${index}">Download</button>
        <button class="small-btn" data-action="delete-file" data-index="${index}">Delete</button>
      </div>
    `;
    fileGrid.appendChild(card);
  });

  fileGrid.querySelectorAll("[data-action='delete-file']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      state.project.files.splice(i, 1);
      renderFiles();
    });
  });

  fileGrid.querySelectorAll("[data-action='download']").forEach((btn) => {
    btn.addEventListener("click", () => alert("Dummy download started."));
  });
}

function renderPayments() {
  const received = state.project.invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pending = state.project.invoices
    .filter((inv) => inv.status !== "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  paymentBudget.textContent = money(state.project.budget);
  paymentReceived.textContent = money(received);
  paymentPending.textContent = money(pending);

  invoiceList.innerHTML = "";

  state.project.invoices.forEach((inv, index) => {
    const card = document.createElement("div");
    card.className = "invoice-card";
    card.innerHTML = `
      <div>
        <div class="invoice-id">${inv.id}</div>
        <div class="invoice-title">${inv.title}</div>
        <div class="invoice-meta">${inv.percent}% • ${money(inv.amount)}</div>
      </div>
      <div>
        <span class="badge ${inv.status === "Paid" ? "paid" : "pending"}">${inv.status}</span>
      </div>
      <div></div>
      <div class="invoice-actions">
        <button class="small-btn" data-action="paid" data-index="${index}">Mark Paid</button>
        <button class="small-btn" data-action="pending" data-index="${index}">Mark Pending</button>
      </div>
    `;
    invoiceList.appendChild(card);
  });

  invoiceList.querySelectorAll("[data-action='paid']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      state.project.invoices[i].status = "Paid";
      renderPayments();
    });
  });

  invoiceList.querySelectorAll("[data-action='pending']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      state.project.invoices[i].status = "Pending";
      renderPayments();
    });
  });
}

function renderChat() {
  chatList.innerHTML = "";
  const sorted = [...state.project.messages].sort((a, b) => new Date(a.time) - new Date(b.time));

  sorted.forEach((msg) => {
    const box = document.createElement("div");
    box.className = `chat-message ${msg.role === "client" ? "client" : ""}`;
    box.innerHTML = `
      <div class="chat-meta">
        <strong>${msg.sender}</strong>
        <span>${new Date(msg.time).toLocaleString([], {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
      </div>
      <div>${msg.text}</div>
    `;
    chatList.appendChild(box);
  });
}

function renderUpdates() {
  updatesList.innerHTML = "";
  state.project.updates.slice().reverse().forEach((update) => {
    const card = document.createElement("div");
    card.className = "update-card";
    card.innerHTML = `
      <div class="update-title">${update.title}</div>
      <div class="update-meta">${update.description}</div>
      <div class="update-meta" style="margin-top:10px">
        ${formatDate(update.date)} • Created by ${update.createdBy}
      </div>
    `;
    updatesList.appendChild(card);
  });
}

function renderTeam() {
  teamList.innerHTML = "";
  state.project.team.forEach((member, index) => {
    const card = document.createElement("div");
    card.className = "team-card";
    card.innerHTML = `
      <div class="team-name">${member.name}</div>
      <div class="team-role">${member.role}</div>
      <div class="team-actions">
        <button class="small-btn" data-action="remove-member" data-index="${index}">Remove Member</button>
      </div>
    `;
    teamList.appendChild(card);
  });

  teamList.querySelectorAll("[data-action='remove-member']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      state.project.team.splice(i, 1);
      renderAll();
    });
  });
}

function renderAll() {
  renderHeader();
  renderOverviewTeam();
  renderPhaseSelect();
  renderTimeline();
  renderFiles();
  renderPayments();
  renderChat();
  renderUpdates();
  renderTeam();
}

function openModal(modal) {
  modalBackdrop.style.display = "block";
  modal.style.display = "block";
}

function closeModal(modal) {
  modalBackdrop.style.display = "none";
  modal.style.display = "none";
  state.deleteOpen = false;
  state.promptMode = null;
  state.promptAction = null;
}

function setSidebar(open) {
  sidebar.classList.toggle("open", open);
  backdrop.hidden = !open;
}

document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(btn.dataset.tab).classList.add("active");
  state.activeTab = btn.dataset.tab;
});

phaseSelect.addEventListener("change", () => {
  state.project.currentPhase = phaseSelect.value;
  state.project.status = phaseSelect.value === "Launch" ? "Active" : "Active";
  renderAll();
});

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  state.project.files.unshift({
    name: file.name,
    uploadedBy: "Admin",
    uploadDate: new Date().toISOString().slice(0, 10),
  });

  fileInput.value = "";
  renderFiles();
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  state.project.messages.push({
    sender: "Admin",
    role: "admin",
    text,
    time: new Date().toISOString(),
  });

  messageInput.value = "";
  renderChat();
  chatList.scrollTop = chatList.scrollHeight;
});

el("addUpdateBtn").addEventListener("click", () => {
  const title = prompt("Update title:");
  if (!title) return;
  const description = prompt("Update description:");
  if (!description) return;

  state.project.updates.push({
    title,
    description,
    date: new Date().toISOString().slice(0, 10),
    createdBy: "Admin",
  });

  renderUpdates();
});

el("addMemberBtn").addEventListener("click", () => {
  const name = prompt("Member name:");
  if (!name) return;
  const role = prompt("Member role:");
  if (!role) return;
  state.project.team.push({ name, role });
  renderAll();
});

el("generatePdfBtn").addEventListener("click", () => {
  window.print();
});

el("editBtn").addEventListener("click", () => {
  alert("Edit project modal can be added next. Right now this is a dummy action.");
});

el("archiveBtn").addEventListener("click", () => {
  alert("Archive action is currently a dummy action.");
});

el("deleteBtn").addEventListener("click", () => {
  state.deleteOpen = true;
  deleteTitle.textContent = `Delete ${state.project.name}?`;
  deleteText.textContent = "This action cannot be undone.";
  openModal(deleteModal);
});

cancelDelete.addEventListener("click", () => closeModal(deleteModal));
confirmDelete.addEventListener("click", () => {
  closeModal(deleteModal);
  window.location.href = "../projects/index.html";
});

cancelPrompt.addEventListener("click", () => closeModal(promptModal));
confirmPrompt.addEventListener("click", () => {
  const value = promptInput.value.trim();
  if (!value) return;
  if (state.promptAction === "member") {
    state.project.team.push({ name: value, role: "Team Member" });
  }
  if (state.promptAction === "update") {
    state.project.updates.push({
      title: value,
      description: "Created from prompt modal.",
      date: new Date().toISOString().slice(0, 10),
      createdBy: "Admin",
    });
  }
  closeModal(promptModal);
  renderAll();
});

modalBackdrop.addEventListener("click", () => closeModal(deleteModal));
backdrop.addEventListener("click", () => setSidebar(false));
openSidebar.addEventListener("click", () => setSidebar(true));
closeSidebar.addEventListener("click", () => setSidebar(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal(deleteModal);
    closeModal(promptModal);
    setSidebar(false);
  }
});

state.project = getProjectFromUrl();
renderAll();
