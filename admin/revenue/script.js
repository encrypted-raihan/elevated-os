const projects = [
  {
    id: "EWS-001",
    name: "Luxury Villa Website",
    client: "ABC Builders",
    budget: 180000,
    collected: 90000,
    pending: 90000,
    progress: 50
  },
  {
    id: "EWS-002",
    name: "Restaurant Website",
    client: "XYZ Foods",
    budget: 120000,
    collected: 60000,
    pending: 60000,
    progress: 50
  },
  {
    id: "EWS-003",
    name: "Ecommerce Store",
    client: "Nova Retail",
    budget: 250000,
    collected: 200000,
    pending: 50000,
    progress: 80
  },
  {
    id: "EWS-004",
    name: "SEO Campaign",
    client: "Prime Dentals",
    budget: 90000,
    collected: 40000,
    pending: 50000,
    progress: 44
  },
  {
    id: "EWS-005",
    name: "Law Firm Portfolio",
    client: "Justice & Co.",
    budget: 160000,
    collected: 60000,
    pending: 100000,
    progress: 38
  }
];

const invoices = [
  {
    id: "INV-EWS001-01",
    projectId: "EWS-001",
    project: "Luxury Villa Website",
    client: "ABC Builders",
    amount: 90000,
    milestone: "50% Advance",
    status: "Paid",
    date: "12 Jun 2026",
    created: "05 Jun 2026",
    due: "12 Jun 2026",
    notes: "Initial deposit received after kickoff call."
  },
  {
    id: "INV-EWS001-02",
    projectId: "EWS-001",
    project: "Luxury Villa Website",
    client: "ABC Builders",
    amount: 54000,
    milestone: "30% Approval Payment",
    status: "Pending",
    date: "21 Jul 2026",
    created: "14 Jul 2026",
    due: "21 Jul 2026",
    notes: "Due after homepage and services page approval."
  },
  {
    id: "INV-EWS001-03",
    projectId: "EWS-001",
    project: "Luxury Villa Website",
    client: "ABC Builders",
    amount: 36000,
    milestone: "20% Final Hosting Payment",
    status: "Pending",
    date: "01 Aug 2026",
    created: "24 Jul 2026",
    due: "01 Aug 2026",
    notes: "Pending before final deployment and hosting handoff."
  },
  {
    id: "INV-EWS002-01",
    projectId: "EWS-002",
    project: "Restaurant Website",
    client: "XYZ Foods",
    amount: 60000,
    milestone: "50% Advance",
    status: "Paid",
    date: "08 Jun 2026",
    created: "02 Jun 2026",
    due: "08 Jun 2026",
    notes: "Deposit collected for menu and reservation section."
  },
  {
    id: "INV-EWS002-02",
    projectId: "EWS-002",
    project: "Restaurant Website",
    client: "XYZ Foods",
    amount: 36000,
    milestone: "30% Approval Payment",
    status: "Overdue",
    date: "24 Jul 2026",
    created: "17 Jul 2026",
    due: "24 Jul 2026",
    notes: "Approval payment overdue. Send reminder."
  },
  {
    id: "INV-EWS003-01",
    projectId: "EWS-003",
    project: "Ecommerce Store",
    client: "Nova Retail",
    amount: 125000,
    milestone: "50% Advance",
    status: "Paid",
    date: "10 Jun 2026",
    created: "04 Jun 2026",
    due: "10 Jun 2026",
    notes: "Advance received for catalog build and payment gateway integration."
  },
  {
    id: "INV-EWS003-02",
    projectId: "EWS-003",
    project: "Ecommerce Store",
    client: "Nova Retail",
    amount: 75000,
    milestone: "30% Approval Payment",
    status: "Pending",
    date: "29 Jul 2026",
    created: "20 Jul 2026",
    due: "29 Jul 2026",
    notes: "Waiting on product grid approval."
  },
  {
    id: "INV-EWS004-01",
    projectId: "EWS-004",
    project: "SEO Campaign",
    client: "Prime Dentals",
    amount: 40000,
    milestone: "Monthly Retainer",
    status: "Paid",
    date: "15 Jun 2026",
    created: "15 Jun 2026",
    due: "15 Jun 2026",
    notes: "Monthly SEO service retainer."
  },
  {
    id: "INV-EWS005-01",
    projectId: "EWS-005",
    project: "Law Firm Portfolio",
    client: "Justice & Co.",
    amount: 60000,
    milestone: "50% Advance",
    status: "Overdue",
    date: "11 Jul 2026",
    created: "03 Jul 2026",
    due: "11 Jul 2026",
    notes: "Follow up needed. Final reminder sent."
  }
];

const notifications = [
  "Client approved Homepage Design",
  "Invoice INV-EWS001-02 marked paid",
  "New message in Luxury Villa Website"
];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const sidebar = $("#sidebar");
const backdrop = $("#backdrop");
const openSidebarBtn = $("#openSidebar");
const notificationBtn = $("#notificationBtn");
const notificationDropdown = $("#notificationDropdown");
const notificationList = $("#notificationList");
const notificationCount = $("#notificationCount");
const generateInvoiceBtn = $("#generateInvoiceBtn");

const chartGrid = $("#chartGrid");
const chartArea = $("#chartArea");
const chartLine = $("#chartLine");
const chartDots = $("#chartDots");
const chartLabels = $("#chartLabels");

const projectRevenueList = $("#projectRevenueList");
const invoiceTable = $("#invoiceTable");
const invoiceCards = $("#invoiceCards");
const invoiceEmpty = $("#invoiceEmpty");
const invoiceSearch = $("#invoiceSearch");
const filterButtons = $$(".filter-btn");
const outstandingInvoicesCount = $("#outstandingInvoicesCount");
const collectionRateChip = $("#collectionRateChip");

const invoiceViewModal = $("#invoiceViewModal");
const generateInvoiceModal = $("#generateInvoiceModal");
const modalBackdrop = $("#modalBackdrop");
const viewModalTitle = $("#viewModalTitle");
const viewModalBody = $("#viewModalBody");
const viewModalNotesWrap = $("#viewModalNotesWrap");
const viewModalNotes = $("#viewModalNotes");
const markPaidFromModal = $("#markPaidFromModal");
const invoiceProject = $("#invoiceProject");
const invoiceType = $("#invoiceType");
const invoiceAmount = $("#invoiceAmount");
const invoiceDueDate = $("#invoiceDueDate");
const invoiceNotes = $("#invoiceNotes");
const generateInvoiceForm = $("#generateInvoiceForm");

let activeFilter = "All";
let activeInvoiceId = null;
let invoicesState = structuredClone(invoices);
let notificationsState = [...notifications];

function currency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(n);
}

function openSidebar(open) {
  sidebar.classList.toggle("open", open);
  backdrop.hidden = !open;
}

function openModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  modalBackdrop.hidden = false;
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function closeAllModals() {
  [invoiceViewModal, generateInvoiceModal].forEach(closeModal);
  modalBackdrop.hidden = true;
}

function statusClass(status) {
  return status.toLowerCase();
}

function matchesFilter(invoice) {
  if (activeFilter !== "All" && invoice.status !== activeFilter) return false;
  const q = invoiceSearch.value.trim().toLowerCase();
  if (!q) return true;
  return [invoice.id, invoice.projectId, invoice.project, invoice.client].some((v) => v.toLowerCase().includes(q));
}

function filteredInvoices() {
  return invoicesState.filter(matchesFilter);
}

function invoiceCountForProject(projectId) {
  return invoicesState.filter((invoice) => invoice.projectId === projectId).length;
}

function updateStats() {
  const outstanding = invoicesState.filter((inv) => inv.status !== "Paid").length;
  outstandingInvoicesCount.textContent = String(outstanding);

  const collected = projects.reduce((sum, p) => sum + p.collected, 0);
  const total = projects.reduce((sum, p) => sum + p.budget, 0);
  const rate = total ? Math.round((collected / total) * 100) : 0;
  collectionRateChip.textContent = `${rate}% paid`;
}

function renderNotifications() {
  notificationList.innerHTML = "";
  notificationsState.forEach((note) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.innerHTML = `<strong>${note}</strong><span>Just now</span>`;
    notificationList.appendChild(item);
  });
  notificationCount.textContent = String(notificationsState.length);
}

function renderProjectRevenue() {
  projectRevenueList.innerHTML = "";
  projects.forEach((project) => {
    const row = document.createElement("article");
    row.className = "project-row";

    const pct = Math.round((project.collected / project.budget) * 100);
    const invoiceCount = invoiceCountForProject(project.id);

    row.innerHTML = `
      <div class="project-row-top">
        <div>
          <span class="project-id-line">${project.id}</span>
          <span class="project-name-line">${project.name}</span>
          <div class="project-meta">Budget: ${currency(project.budget)}</div>
        </div>
        <div class="project-title">${pct}%</div>
      </div>

      <div class="progress-wrap">
        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="project-summary">
        <div>Collected: <strong>${currency(project.collected)}</strong></div>
        <div>Pending: <strong>${currency(project.pending)}</strong></div>
        <div>Invoices: <strong>${invoiceCount}</strong></div>
      </div>
    `;
    projectRevenueList.appendChild(row);
  });
}

function renderInvoiceControls() {
  invoiceProject.innerHTML = projects
    .map((p) => `<option value="${p.id}">${p.id} — ${p.name}</option>`)
    .join("");
}

function generateInvoiceId(projectId) {
  const invoiceNo = String(invoicesState.filter((i) => i.projectId === projectId).length + 1).padStart(2, "0");
  const compactProjectId = projectId.replace("-", "");
  return `INV-${compactProjectId}-${invoiceNo}`;
}

function projectLabel(projectId, projectName) {
  return `
    <span class="project-id-line">${projectId}</span>
    <span class="project-name-line">${projectName}</span>
  `;
}

function openInvoiceModal(invoiceId) {
  const invoice = invoicesState.find((i) => i.id === invoiceId);
  if (!invoice) return;

  activeInvoiceId = invoiceId;
  viewModalTitle.textContent = invoice.id;
  viewModalBody.innerHTML = "";

  const fields = [
    ["Invoice ID", invoice.id],
    ["Project ID", invoice.projectId],
    ["Project", invoice.project],
    ["Client", invoice.client],
    ["Amount", currency(invoice.amount)],
    ["Milestone", invoice.milestone],
    ["Status", invoice.status],
    ["Created Date", invoice.created],
    ["Due Date", invoice.due]
  ];

  fields.forEach(([label, value]) => {
    const box = document.createElement("div");
    box.className = "modal-field";
    box.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    viewModalBody.appendChild(box);
  });

  if (invoice.notes) {
    viewModalNotesWrap.hidden = false;
    viewModalNotes.textContent = invoice.notes;
  } else {
    viewModalNotesWrap.hidden = true;
    viewModalNotes.textContent = "";
  }

  markPaidFromModal.disabled = invoice.status === "Paid";
  markPaidFromModal.textContent = invoice.status === "Paid" ? "Already Paid" : "Mark Paid";

  openModal(invoiceViewModal);
}

function markPaid(id) {
  const invoice = invoicesState.find((i) => i.id === id);
  if (!invoice || invoice.status === "Paid") return;

  invoice.status = "Paid";
  notificationsState.unshift(`Invoice ${invoice.id} marked paid`);
  notificationsState = notificationsState.slice(0, 5);
  renderNotifications();
  renderInvoices();
  updateStats();
  if (activeInvoiceId === id) openInvoiceModal(id);
}

function downloadInvoicePDF(id) {
  const invoice = invoicesState.find((i) => i.id === id);
  if (!invoice) return;

  const content = `Invoice ID: ${invoice.id}\nProject ID: ${invoice.projectId}\nProject: ${invoice.project}\nClient: ${invoice.client}\nAmount: ${currency(invoice.amount)}\nMilestone: ${invoice.milestone}\nStatus: ${invoice.status}\nCreated: ${invoice.created}\nDue: ${invoice.due}\nNotes: ${invoice.notes || "-"}`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderInvoiceAction(invoice) {
  const paid = invoice.status === "Paid";
  const paidLabel = paid ? "Paid ✓" : "Mark Paid";
  const paidClass = paid ? "action-link disabled" : "action-link";

  return `
    <button class="action-link" data-action="view" data-id="${invoice.id}" type="button">View</button>
    <button class="action-link muted" data-action="download" data-id="${invoice.id}" type="button">Download PDF</button>
    <button class="${paidClass}" data-action="paid" data-id="${invoice.id}" type="button" ${paid ? "disabled" : ""}>${paidLabel}</button>
  `;
}

function renderInvoices() {
  const list = filteredInvoices();
  invoiceTable.innerHTML = "";
  invoiceCards.innerHTML = "";
  invoiceEmpty.hidden = list.length !== 0;

  const head = document.createElement("div");
  head.className = "invoice-head-row";
  head.innerHTML = `
    <div>Invoice ID</div>
    <div class="col-project">Project</div>
    <div>Client</div>
    <div>Amount</div>
    <div class="col-milestone">Milestone</div>
    <div>Status</div>
    <div>Date</div>
    <div>Actions</div>
  `;
  invoiceTable.appendChild(head);

  list.forEach((invoice) => {
    const row = document.createElement("div");
    row.className = "invoice-row";
    row.innerHTML = `
      <div class="invoice-id">${invoice.id}</div>
      <div class="invoice-project">${projectLabel(invoice.projectId, invoice.project)}</div>
      <div class="invoice-client">${invoice.client}</div>
      <div class="invoice-amount">${currency(invoice.amount)}</div>
      <div class="col-milestone">${invoice.milestone}</div>
      <div><span class="invoice-status ${statusClass(invoice.status)}">${invoice.status}</span></div>
      <div class="invoice-date">${invoice.date}</div>
      <div class="invoice-actions">
        ${renderInvoiceAction(invoice)}
      </div>
    `;
    invoiceTable.appendChild(row);

    const card = document.createElement("article");
    card.className = "invoice-card";
    card.innerHTML = `
      <div class="invoice-card-top">
        <div>
          <div class="invoice-card-title">${invoice.id}</div>
          <div class="invoice-project">${projectLabel(invoice.projectId, invoice.project)}</div>
        </div>
        <span class="invoice-status ${statusClass(invoice.status)}">${invoice.status}</span>
      </div>

      <div class="invoice-card-mid">
        <div>Client: <strong>${invoice.client}</strong></div>
        <div>Amount: <strong>${currency(invoice.amount)}</strong></div>
        <div>Milestone: <strong>${invoice.milestone}</strong></div>
        <div>Date: <strong>${invoice.date}</strong></div>
      </div>

      <div class="invoice-card-actions">
        ${renderInvoiceAction(invoice)}
      </div>
    `;
    invoiceCards.appendChild(card);
  });
}

function drawChart() {
  const values = [30, 44, 51, 63, 70, 88, 102, 92, 123, 136, 150, 178];
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const w = 1000;
  const h = 420;
  const pad = { top: 24, right: 26, bottom: 48, left: 68 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const max = 180;
  const stepX = innerW / (values.length - 1);

  chartGrid.innerHTML = "";
  chartLabels.innerHTML = "";
  chartDots.innerHTML = "";

  const yTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180];

  yTicks.forEach((tick) => {
    const y = pad.top + innerH - (tick / max) * innerH;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pad.left);
    line.setAttribute("x2", w - pad.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    chartGrid.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", pad.left - 14);
    label.setAttribute("y", y + 5);
    label.setAttribute("text-anchor", "end");
    label.textContent = `₹${tick}k`;
    chartLabels.appendChild(label);
  });

  const points = values.map((value, index) => {
    const x = pad.left + index * stepX;
    const y = pad.top + innerH - (value / max) * innerH;
    return [x, y];
  });

  const linePath = `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}`;
  const areaPath = `${linePath} L ${pad.left + innerW} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;

  chartLine.setAttribute("d", linePath);
  chartArea.setAttribute("d", areaPath);

  points.forEach(([x, y], i) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 6.5);
    chartDots.appendChild(dot);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", h - 14);
    label.setAttribute("text-anchor", "middle");
    label.textContent = labels[i];
    chartLabels.appendChild(label);
  });
}

function syncGenerateFormDefaults() {
  const firstProject = projects[0];
  if (!firstProject) return;
  invoiceProject.value = firstProject.id;
  invoiceType.value = "50% Advance";
  invoiceAmount.value = String(Math.round(firstProject.budget * 0.5));
  invoiceDueDate.value = "";
  invoiceNotes.value = "";
}

invoiceTable.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.disabled) return;
  const { action, id } = button.dataset;
  if (action === "view") openInvoiceModal(id);
  if (action === "download") downloadInvoicePDF(id);
  if (action === "paid") markPaid(id);
});

invoiceCards.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.disabled) return;
  const { action, id } = button.dataset;
  if (action === "view") openInvoiceModal(id);
  if (action === "download") downloadInvoicePDF(id);
  if (action === "paid") markPaid(id);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderInvoices();
  });
});

invoiceSearch.addEventListener("input", renderInvoices);

notificationBtn.addEventListener("click", () => {
  const willOpen = notificationDropdown.hidden;
  notificationDropdown.hidden = !willOpen;
  notificationBtn.setAttribute("aria-expanded", String(willOpen));
});

generateInvoiceBtn.addEventListener("click", () => {
  syncGenerateFormDefaults();
  openModal(generateInvoiceModal);
});

invoiceProject.addEventListener("change", () => {
  const project = projects.find((p) => p.id === invoiceProject.value);
  if (!project) return;
  const type = invoiceType.value;
  if (type === "50% Advance") invoiceAmount.value = String(Math.round(project.budget * 0.5));
  if (type === "30% Approval Payment") invoiceAmount.value = String(Math.round(project.budget * 0.3));
  if (type === "20% Final Hosting Payment") invoiceAmount.value = String(Math.round(project.budget * 0.2));
});

invoiceType.addEventListener("change", () => {
  const project = projects.find((p) => p.id === invoiceProject.value);
  if (!project) return;

  if (invoiceType.value === "50% Advance") invoiceAmount.value = String(Math.round(project.budget * 0.5));
  else if (invoiceType.value === "30% Approval Payment") invoiceAmount.value = String(Math.round(project.budget * 0.3));
  else if (invoiceType.value === "20% Final Hosting Payment") invoiceAmount.value = String(Math.round(project.budget * 0.2));
});

generateInvoiceForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const project = projects.find((p) => p.id === invoiceProject.value);
  if (!project) return;

  const amount = Number(invoiceAmount.value || 0);
  if (!amount || amount <= 0) {
    alert("Enter a valid amount.");
    return;
  }

  const newInvoice = {
    id: generateInvoiceId(project.id),
    projectId: project.id,
    project: project.name,
    client: project.client,
    amount,
    milestone: invoiceType.value,
    status: "Pending",
    date: invoiceDueDate.value ? new Date(invoiceDueDate.value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "TBD",
    created: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    due: invoiceDueDate.value ? new Date(invoiceDueDate.value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "TBD",
    notes: invoiceNotes.value.trim()
  };

  invoicesState.unshift(newInvoice);
  notificationsState.unshift(`New invoice ${newInvoice.id} generated`);
  notificationsState = notificationsState.slice(0, 5);

  renderNotifications();
  renderInvoices();
  renderProjectRevenue();
  updateStats();
  closeAllModals();
  generateInvoiceForm.reset();
});

markPaidFromModal.addEventListener("click", () => {
  if (!activeInvoiceId) return;
  markPaid(activeInvoiceId);
});

$$("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", closeAllModals);
});

modalBackdrop.addEventListener("click", closeAllModals);
openSidebarBtn.addEventListener("click", () => openSidebar(true));
backdrop.addEventListener("click", () => {
  openSidebar(false);
  notificationDropdown.hidden = true;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    openSidebar(false);
    notificationDropdown.hidden = true;
    closeAllModals();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".notification-wrap")) {
    notificationDropdown.hidden = true;
    notificationBtn.setAttribute("aria-expanded", "false");
  }
});

renderNotifications();
renderProjectRevenue();
renderInvoiceControls();
renderInvoices();
updateStats();
drawChart();
