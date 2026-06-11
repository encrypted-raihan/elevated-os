
import { auth, db, storage } from "../../js/firebase.js";
import {
  addDoc,
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

const LOGIN_ROUTE = "/index/index.html";
const ROLE_REDIRECTS = {
  admin: "/admin/dashboard/index.html",
  manager: "/team/dashboard/index.html",
  developer: "/team/dashboard/index.html",
  team: "/team/dashboard/index.html",
  client: "/client/dashboard/index.html",
};

const ALLOWED_ROLES = new Set(["admin", "manager"]);

const state = {
  user: null,
  profile: null,
  projects: [],
  invoices: [],
  payments: [],
  notifications: [],
  users: [],
  activeFilter: "All",
  activeInvoiceId: null,
  activeTab: "revenue",
  projectMap: new Map(),
  listeners: [],
  ready: false,
  busyInvoiceId: null,
};

const $ = (id) => document.getElementById(id);

const els = {
  sidebar: $("sidebar"),
  backdrop: $("backdrop"),
  openSidebar: $("openSidebar"),
  notificationBtn: $("notificationBtn"),
  notificationDropdown: $("notificationDropdown"),
  notificationList: $("notificationList"),
  notificationCount: $("notificationCount"),
  generateInvoiceBtn: $("generateInvoiceBtn"),

  chartGrid: $("chartGrid"),
  chartArea: $("chartArea"),
  chartLine: $("chartLine"),
  chartDots: $("chartDots"),
  chartLabels: $("chartLabels"),

  totalRevenueValue: $("totalRevenueValue"),
  collectedRevenueValue: $("collectedRevenueValue"),
  pendingRevenueValue: $("pendingRevenueValue"),
  projectRevenueList: $("projectRevenueList"),
  invoiceTable: $("invoiceTable"),
  invoiceCards: $("invoiceCards"),
  invoiceEmpty: $("invoiceEmpty"),
  invoiceSearch: $("invoiceSearch"),
  filterButtons: [...document.querySelectorAll(".filter-btn")],
  outstandingInvoicesCount: $("outstandingInvoicesCount"),
  collectionRateChip: $("collectionRateChip"),

  invoiceViewModal: $("invoiceViewModal"),
  generateInvoiceModal: $("generateInvoiceModal"),
  modalBackdrop: $("modalBackdrop"),
  viewModalTitle: $("viewModalTitle"),
  viewModalBody: $("viewModalBody"),
  viewModalNotesWrap: $("viewModalNotesWrap"),
  viewModalNotes: $("viewModalNotes"),
  markPaidFromModal: $("markPaidFromModal"),
  invoiceProject: $("invoiceProject"),
  invoiceType: $("invoiceType"),
  invoiceAmount: $("invoiceAmount"),
  invoiceDueDate: $("invoiceDueDate"),
  invoiceNotes: $("invoiceNotes"),
  generateInvoiceForm: $("generateInvoiceForm"),
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

  els.openSidebar?.addEventListener("click", () => openSidebar(true));
  els.backdrop?.addEventListener("click", () => {
    openSidebar(false);
    closeNotifications();
  });

  els.notificationBtn?.addEventListener("click", () => {
    const willOpen = els.notificationDropdown.hidden;
    els.notificationDropdown.hidden = !willOpen;
    els.notificationBtn.setAttribute("aria-expanded", String(willOpen));
  });

  els.generateInvoiceBtn?.addEventListener("click", () => {
    if (!hasInvoicePermission()) {
      alert("You do not have permission to generate invoices.");
      return;
    }
    syncGenerateFormDefaults();
    openModal(els.generateInvoiceModal);
  });

  els.invoiceProject?.addEventListener("change", () => updateInvoiceAmountPreview());
  els.invoiceType?.addEventListener("change", () => updateInvoiceAmountPreview());

  els.generateInvoiceForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!hasInvoicePermission()) {
      alert("You do not have permission to generate invoices.");
      return;
    }
    await handleGenerateInvoice();
  });

  els.invoiceSearch?.addEventListener("input", () => renderInvoices());

  els.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.filterButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      state.activeFilter = button.dataset.filter || "All";
      renderInvoices();
    });
  });

  els.markPaidFromModal?.addEventListener("click", async () => {
    if (!state.activeInvoiceId) return;
    await markPaid(state.activeInvoiceId);
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeAllModals);
  });

  els.modalBackdrop?.addEventListener("click", closeAllModals);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      openSidebar(false);
      closeNotifications();
      closeAllModals();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;

    const invoiceButton = target.closest("[data-action]");
    if (invoiceButton) {
      const { action, id } = invoiceButton.dataset;
      if (action === "view") openInvoiceModal(id);
      if (action === "download") downloadInvoicePDF(id);
      if (action === "paid") markPaid(id);
      return;
    }

    if (!target.closest(".notification-wrap")) {
      closeNotifications();
    }
  });
}

async function handleAuthChange(user) {
  teardownListeners();
  state.user = user;
  state.profile = null;
  state.projects = [];
  state.invoices = [];
  state.payments = [];
  state.notifications = [];
  state.users = [];
  state.projectMap = new Map();
  state.activeInvoiceId = null;
  state.ready = false;

  if (!user) {
    window.location.href = LOGIN_ROUTE;
    return;
  }

  try {
    const profile = await loadUserProfile(user.uid);
    if (!profile || profile.active === false) {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    const role = normalizeRole(profile.role);
    if (!ALLOWED_ROLES.has(role)) {
      window.location.href = ROLE_REDIRECTS[role] || LOGIN_ROUTE;
      return;
    }

    state.profile = profile;

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
    console.error("Revenue page initialization failed:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

function startListeners() {
  const uid = state.user?.uid;
  const role = normalizeRole(state.profile?.role);

  state.listeners.push(
    onSnapshot(
      query(collection(db, "users")),
      (snapshot) => {
        state.users = snapshot.docs.map(mapDoc);
        renderAll();
      },
      handleListenerError("users")
    )
  );

  state.listeners.push(
    onSnapshot(
      query(collection(db, "projects"), orderBy("createdAt", "desc")),
      (snapshot) => {
        state.projects = snapshot.docs.map(mapDoc).map(normalizeProject);
        state.projectMap = new Map(state.projects.map((project) => [project.id, project]));
        renderProjectRevenue();
        renderInvoiceControls();
        renderAll();
      },
      handleListenerError("projects")
    )
  );

  state.listeners.push(
    onSnapshot(
      query(collection(db, "invoices"), orderBy("createdAt", "desc")),
      (snapshot) => {
        state.invoices = snapshot.docs.map(mapDoc).map(normalizeInvoice);
        renderAll();
      },
      handleListenerError("invoices")
    )
  );

  state.listeners.push(
    onSnapshot(
      query(collection(db, "payments"), orderBy("paymentDate", "desc")),
      (snapshot) => {
        state.payments = snapshot.docs.map(mapDoc);
        renderAll();
      },
      handleListenerError("payments")
    )
  );

  const notificationQuery = role === "admin"
    ? query(collection(db, "notifications"), orderBy("createdAt", "desc"))
    : query(collection(db, "notifications"), where("userId", "==", uid), orderBy("createdAt", "desc"));

  state.listeners.push(
    onSnapshot(
      notificationQuery,
      (snapshot) => {
        state.notifications = snapshot.docs.map(mapDoc);
        renderNotifications();
      },
      handleListenerError("notifications")
    )
  );
}

function teardownListeners() {
  while (state.listeners.length) {
    const unsub = state.listeners.pop();
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

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function hasInvoicePermission() {
  return ["admin", "manager"].includes(normalizeRole(state.profile?.role));
}

function hasRevenueControlPermission() {
  return ["admin", "manager"].includes(normalizeRole(state.profile?.role));
}

function openSidebar(open) {
  if (!els.sidebar || !els.backdrop) return;
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function openModal(modal) {
  if (!modal || !els.modalBackdrop) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  els.modalBackdrop.hidden = false;
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function closeAllModals() {
  [els.invoiceViewModal, els.generateInvoiceModal].forEach(closeModal);
  if (els.modalBackdrop) els.modalBackdrop.hidden = true;
}

function closeNotifications() {
  if (!els.notificationDropdown || !els.notificationBtn) return;
  els.notificationDropdown.hidden = true;
  els.notificationBtn.setAttribute("aria-expanded", "false");
}

function showLoadingState() {
  if (els.totalRevenueValue) els.totalRevenueValue.textContent = "₹0";
  if (els.collectedRevenueValue) els.collectedRevenueValue.textContent = "₹0";
  if (els.pendingRevenueValue) els.pendingRevenueValue.textContent = "₹0";
  if (els.outstandingInvoicesCount) els.outstandingInvoicesCount.textContent = "0";
  if (els.collectionRateChip) els.collectionRateChip.textContent = "0% paid";
  if (els.projectRevenueList) els.projectRevenueList.innerHTML = `<div class="invoice-empty" style="display:block"><h4>Loading revenue data…</h4></div>`;
  if (els.invoiceTable) els.invoiceTable.innerHTML = "";
  if (els.invoiceCards) els.invoiceCards.innerHTML = "";
  if (els.notificationList) els.notificationList.innerHTML = "";
}

function renderAll() {
  if (!state.ready) {
    showLoadingState();
    return;
  }

  renderNotifications();
  renderProjectRevenue();
  renderInvoiceControls();
  renderInvoices();
  updateStats();
  drawChart();
}

function renderNotifications() {
  if (!els.notificationList || !els.notificationCount) return;

  const notes = state.notifications.slice(0, 6);
  els.notificationList.innerHTML = "";

  if (!notes.length) {
    els.notificationList.innerHTML = `<div class="dropdown-item"><strong>No notifications yet</strong><span>—</span></div>`;
  } else {
    notes.forEach((note) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(note.title || "Notification")}</strong>
          <div class="dropdown-message">${escapeHtml(note.message || "")}</div>
        </div>
        <span>${escapeHtml(formatRelativeTime(note.createdAt))}</span>
      `;
      els.notificationList.appendChild(item);
    });
  }

  els.notificationCount.textContent = String(state.notifications.length);
}

function updateStats() {
  const totalRevenue = state.projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const collectedRevenue = getCollectedRevenueTotal();
  const pendingRevenue = Math.max(totalRevenue - collectedRevenue, 0);
  const outstandingInvoices = state.invoices.filter((invoice) => normalizeInvoiceStatus(invoice.status) !== "paid").length;
  const rate = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0;

  if (els.totalRevenueValue) els.totalRevenueValue.textContent = currency(totalRevenue);
  if (els.collectedRevenueValue) els.collectedRevenueValue.textContent = currency(collectedRevenue);
  if (els.pendingRevenueValue) els.pendingRevenueValue.textContent = currency(pendingRevenue);
  if (els.outstandingInvoicesCount) els.outstandingInvoicesCount.textContent = String(outstandingInvoices);
  if (els.collectionRateChip) els.collectionRateChip.textContent = `${rate}% paid`;
}

function renderProjectRevenue() {
  if (!els.projectRevenueList) return;

  const byProject = buildProjectRevenueSummary();
  els.projectRevenueList.innerHTML = "";

  if (!byProject.length) {
    els.projectRevenueList.innerHTML = `<div class="invoice-empty" style="display:block"><h4>No projects found.</h4><p>Create a project first.</p></div>`;
    return;
  }

  byProject.forEach((project) => {
    const row = document.createElement("article");
    row.className = "project-row";

    const pct = project.budget > 0 ? Math.round((project.collected / project.budget) * 100) : 0;
    const invoiceCount = invoiceCountForProject(project.id);

    row.innerHTML = `
      <div class="project-row-top">
        <div>
          <span class="project-id-line">${escapeHtml(project.id)}</span>
          <span class="project-name-line">${escapeHtml(project.name)}</span>
          <div class="project-meta">Budget: ${escapeHtml(currency(project.budget))}</div>
        </div>
        <div class="project-title">${pct}%</div>
      </div>

      <div class="progress-wrap">
        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="project-summary">
        <div>Collected: <strong>${escapeHtml(currency(project.collected))}</strong></div>
        <div>Pending: <strong>${escapeHtml(currency(project.pending))}</strong></div>
        <div>Invoices: <strong>${invoiceCount}</strong></div>
      </div>
    `;
    els.projectRevenueList.appendChild(row);
  });
}

function renderInvoiceControls() {
  if (!els.invoiceProject) return;

  const projects = state.projects;
  els.invoiceProject.innerHTML = projects.length
    ? projects.map((project) => `<option value="${escapeAttr(project.id)}">${escapeHtml(project.id)} — ${escapeHtml(project.name)}</option>`).join("")
    : `<option value="">No projects available</option>`;

  updateInvoiceAmountPreview();
}

function invoiceCountForProject(projectId) {
  return state.invoices.filter((invoice) => invoice.projectId === projectId).length;
}

function filteredInvoices() {
  const q = String(els.invoiceSearch?.value || "").trim().toLowerCase();
  return state.invoices.filter((invoice) => {
    if (state.activeFilter !== "All" && invoice.statusLabel !== state.activeFilter) return false;

    if (!q) return true;

    const project = state.projectMap.get(invoice.projectId);
    const client = getUser(invoice.clientId);

    return [
      invoice.id,
      invoice.projectId,
      getProjectName(project),
      getClientName(invoice, project, client),
      invoice.invoiceType,
      invoice.notes,
    ].some((value) => String(value || "").toLowerCase().includes(q));
  });
}

function renderInvoices() {
  if (!els.invoiceTable || !els.invoiceCards || !els.invoiceEmpty) return;

  const list = filteredInvoices();
  els.invoiceTable.innerHTML = "";
  els.invoiceCards.innerHTML = "";
  els.invoiceEmpty.hidden = list.length !== 0;

  const head = document.createElement("div");
  head.className = "invoice-head-row";
  head.innerHTML = `
    <div>Invoice ID</div>
    <div class="col-project">Project</div>
    <div>Client</div>
    <div>Amount</div>
    <div class="col-milestone">Type</div>
    <div>Status</div>
    <div>Date</div>
    <div>Actions</div>
  `;
  els.invoiceTable.appendChild(head);

  list.forEach((invoice) => {
    const project = state.projectMap.get(invoice.projectId);
    const client = getUser(invoice.clientId);
    const statusClass = statusClassName(invoice.statusLabel);

    const row = document.createElement("div");
    row.className = "invoice-row";
    row.innerHTML = `
      <div class="invoice-id">${escapeHtml(invoice.id)}</div>
      <div class="invoice-project">${projectLabel(invoice.projectId, getProjectName(project))}</div>
      <div class="invoice-client">${escapeHtml(getClientName(invoice, project, client))}</div>
      <div class="invoice-amount">${escapeHtml(currency(invoice.amount))}</div>
      <div class="col-milestone">${escapeHtml(invoice.invoiceType || "Invoice")}</div>
      <div><span class="invoice-status ${statusClass}">${escapeHtml(invoice.statusLabel)}</span></div>
      <div class="invoice-date">${escapeHtml(formatDisplayDate(invoice.issueDate || invoice.createdAt))}</div>
      <div class="invoice-actions">${renderInvoiceAction(invoice)}</div>
    `;
    els.invoiceTable.appendChild(row);

    const card = document.createElement("article");
    card.className = "invoice-card";
    card.innerHTML = `
      <div class="invoice-card-top">
        <div>
          <div class="invoice-card-title">${escapeHtml(invoice.id)}</div>
          <div class="invoice-project">${projectLabel(invoice.projectId, getProjectName(project))}</div>
        </div>
        <span class="invoice-status ${statusClass}">${escapeHtml(invoice.statusLabel)}</span>
      </div>

      <div class="invoice-card-mid">
        <div>Client: <strong>${escapeHtml(getClientName(invoice, project, client))}</strong></div>
        <div>Amount: <strong>${escapeHtml(currency(invoice.amount))}</strong></div>
        <div>Type: <strong>${escapeHtml(invoice.invoiceType || "Invoice")}</strong></div>
        <div>Date: <strong>${escapeHtml(formatDisplayDate(invoice.issueDate || invoice.createdAt))}</strong></div>
      </div>

      <div class="invoice-card-actions">${renderInvoiceAction(invoice)}</div>
    `;
    els.invoiceCards.appendChild(card);
  });
}

function renderInvoiceAction(invoice) {
  const paid = normalizeInvoiceStatus(invoice.status) === "paid";
  const paidLabel = paid ? "Paid ✓" : "Mark Paid";
  const paidClass = paid ? "action-link disabled" : "action-link";

  return `
    <button class="action-link" data-action="view" data-id="${escapeAttr(invoice.id)}" type="button">View</button>
    <button class="action-link muted" data-action="download" data-id="${escapeAttr(invoice.id)}" type="button">Download PDF</button>
    <button class="${paidClass}" data-action="paid" data-id="${escapeAttr(invoice.id)}" type="button" ${paid ? "disabled" : ""}>${escapeHtml(paidLabel)}</button>
  `;
}

function openInvoiceModal(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  state.activeInvoiceId = invoiceId;
  if (els.viewModalTitle) els.viewModalTitle.textContent = invoice.id;
  if (els.viewModalBody) els.viewModalBody.innerHTML = "";

  const project = state.projectMap.get(invoice.projectId);
  const client = getUser(invoice.clientId);

  const fields = [
    ["Invoice ID", invoice.id],
    ["Project ID", invoice.projectId],
    ["Project", getProjectName(project)],
    ["Client", getClientName(invoice, project, client)],
    ["Amount", currency(invoice.amount)],
    ["Invoice Type", invoice.invoiceType || "Invoice"],
    ["Status", invoice.statusLabel],
    ["Created Date", formatDisplayDate(invoice.createdAt || invoice.issueDate)],
    ["Due Date", formatDisplayDate(invoice.dueDate)],
  ];

  fields.forEach(([label, value]) => {
    const box = document.createElement("div");
    box.className = "modal-field";
    box.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    els.viewModalBody.appendChild(box);
  });

  if (invoice.notes) {
    els.viewModalNotesWrap.hidden = false;
    els.viewModalNotes.textContent = invoice.notes;
  } else {
    els.viewModalNotesWrap.hidden = true;
    els.viewModalNotes.textContent = "";
  }

  if (els.markPaidFromModal) {
    const paid = normalizeInvoiceStatus(invoice.status) === "paid";
    els.markPaidFromModal.disabled = paid;
    els.markPaidFromModal.textContent = paid ? "Already Paid" : "Mark Paid";
  }

  openModal(els.invoiceViewModal);
}

async function markPaid(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice || normalizeInvoiceStatus(invoice.status) === "paid") return;
  if (!hasRevenueControlPermission()) {
    alert("You do not have permission to update invoices.");
    return;
  }

  try {
    await updateDoc(doc(db, "invoices", id), {
      status: "paid",
      updatedAt: serverTimestamp(),
    });

    const paymentExists = state.payments.some((payment) => payment.invoiceId === id);
    if (!paymentExists) {
      await addDoc(collection(db, "payments"), {
        invoiceId: id,
        amount: Number(invoice.amount || 0),
        method: "manual",
        paymentDate: serverTimestamp(),
        notes: "Marked paid from revenue page",
      });
    }

    await notifyInvoiceParticipants(invoice, "Invoice paid", `${invoice.id} was marked as paid.`);
    await addRevenueNotification("Invoice marked paid", `Invoice ${invoice.id} marked paid`);

    if (state.activeInvoiceId === id) {
      openInvoiceModal(id);
    }
  } catch (error) {
    console.error("Failed to mark invoice paid:", error);
    alert("Unable to mark this invoice as paid.");
  }
}

async function downloadInvoicePDF(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;

  try {
    if (invoice.invoicePdfUrl) {
      window.open(invoice.invoicePdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const pdfDoc = buildInvoicePdfDoc(invoice);
    const blob = pdfDoc.output("blob");
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download invoice PDF:", error);
    alert("Unable to download the invoice PDF.");
  }
}

function renderProjectRowLabel(projectId, projectName) {
  return projectLabel(projectId, projectName);
}

function projectLabel(projectId, projectName) {
  return `
    <span class="project-id-line">${escapeHtml(projectId)}</span>
    <span class="project-name-line">${escapeHtml(projectName || "Untitled Project")}</span>
  `;
}

function statusClassName(status) {
  return normalizeInvoiceStatus(status).toLowerCase();
}

function matchesFilter(invoice) {
  if (state.activeFilter !== "All" && invoice.statusLabel !== state.activeFilter) return false;
  const q = String(els.invoiceSearch?.value || "").trim().toLowerCase();
  if (!q) return true;

  const project = state.projectMap.get(invoice.projectId);
  const client = getUser(invoice.clientId);

  return [
    invoice.id,
    invoice.projectId,
    getProjectName(project),
    getClientName(invoice, project, client),
    invoice.invoiceType,
    invoice.notes,
    invoice.statusLabel,
  ].some((value) => String(value || "").toLowerCase().includes(q));
}

function filteredInvoicesData() {
  return state.invoices.filter(matchesFilter);
}

function updateInvoiceAmountPreview() {
  if (!els.invoiceProject || !els.invoiceType || !els.invoiceAmount) return;

  const project = state.projects.find((item) => item.id === els.invoiceProject.value);
  if (!project) {
    els.invoiceAmount.value = "";
    return;
  }

  const pctMap = {
    "50% Advance": 0.5,
    "30% Approval Payment": 0.3,
    "20% Final Hosting Payment": 0.2,
  };

  const pct = pctMap[els.invoiceType.value] ?? 0;
  els.invoiceAmount.value = String(Math.round(Number(project.budget || 0) * pct));
}

function syncGenerateFormDefaults() {
  const project = state.projects[0];
  if (!project) {
    if (els.invoiceProject) els.invoiceProject.innerHTML = `<option value="">No projects available</option>`;
    return;
  }

  if (els.invoiceProject) els.invoiceProject.value = project.id;
  if (els.invoiceType) els.invoiceType.value = "50% Advance";
  if (els.invoiceDueDate) els.invoiceDueDate.value = addDaysToDateInput(new Date(), 7);
  if (els.invoiceNotes) els.invoiceNotes.value = "";
  updateInvoiceAmountPreview();
}

async function handleGenerateInvoice() {
  const projectId = String(els.invoiceProject?.value || "").trim();
  const invoiceType = String(els.invoiceType?.value || "").trim();
  const amount = Number(els.invoiceAmount?.value || 0);
  const dueDateInput = String(els.invoiceDueDate?.value || "").trim();
  const notes = String(els.invoiceNotes?.value || "").trim();

  const project = state.projects.find((item) => item.id === projectId);
  if (!project) {
    alert("Select a valid project.");
    return;
  }

  if (!amount || amount <= 0) {
    alert("Enter a valid invoice amount.");
    return;
  }

  const issueDate = Timestamp.fromDate(new Date());
  const dueDate = timestampFromDateInput(dueDateInput) || Timestamp.fromDate(addDaysToDate(new Date(), 7));
  const invoiceNumber = generateInvoiceNumber(projectId);

  try {
    const invoiceRef = await addDoc(collection(db, "invoices"), {
      invoiceNumber,
      projectId,
      clientId: project.clientId,
      amount,
      status: "pending",
      issueDate,
      dueDate,
      invoicePdfUrl: "",
      notes,
      invoiceType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const invoiceSnapshot = await getDoc(invoiceRef);
    const storedInvoice = normalizeInvoice({
      id: invoiceRef.id,
      ...(invoiceSnapshot.exists() ? invoiceSnapshot.data() : {}),
      invoiceNumber,
      projectId,
      clientId: project.clientId,
      amount,
      status: "pending",
      issueDate,
      dueDate,
      notes,
      invoiceType,
    });

    const pdfUrl = await createAndUploadInvoicePdf(storedInvoice, project);

    if (pdfUrl) {
      await updateDoc(invoiceRef, {
        invoicePdfUrl: pdfUrl,
        updatedAt: serverTimestamp(),
      });
    }

    await notifyInvoiceParticipants(storedInvoice, "Invoice generated", `${invoiceNumber} created for ${getProjectName(project)}.`);
    await addRevenueNotification("Invoice generated", `${invoiceNumber} created`);

    closeAllModals();
    if (els.generateInvoiceForm) els.generateInvoiceForm.reset();
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    alert(error?.message || "Unable to generate invoice.");
  }
}

function generateInvoiceNumber(projectId) {
  const compact = String(projectId || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const count = state.invoices.filter((invoice) => invoice.projectId === projectId).length + 1;
  return `INV-${compact}-${String(count).padStart(2, "0")}`;
}

function normalizeProject(project) {
  return {
    ...project,
    name: project.name || project.title || "Untitled Project",
    budget: Number(project.budget || 0),
    clientId: project.clientId || "",
    collected: Number(project.collected || 0),
    pending: Number(project.pending || 0),
    progress: Number(project.progress || 0),
  };
}

function normalizeInvoice(invoice) {
  return {
    ...invoice,
    id: invoice.id,
    amount: Number(invoice.amount || 0),
    status: normalizeInvoiceStatus(invoice.status),
    statusLabel: invoiceStatusLabel(invoice.status),
    invoiceType: invoice.invoiceType || invoice.milestone || "Invoice",
  };
}

function normalizeInvoiceStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "paid") return "paid";
  if (s === "overdue") return "overdue";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  return "pending";
}

function invoiceStatusLabel(status) {
  const s = normalizeInvoiceStatus(status);
  if (s === "paid") return "Paid";
  if (s === "overdue") return "Overdue";
  if (s === "cancelled") return "Cancelled";
  return "Pending";
}

function getProjectName(project) {
  if (!project) return "Unknown Project";
  return project.name || project.title || "Untitled Project";
}

function getClientName(invoice, project, clientUser) {
  return (
    clientUser?.name ||
    clientUser?.fullName ||
    clientUser?.displayName ||
    project?.clientName ||
    invoice.clientName ||
    invoice.client ||
    "Unknown Client"
  );
}

function getUser(uid) {
  return state.users.find((user) => user.id === uid) || null;
}

function getCollectedRevenueTotal() {
  return state.invoices
    .filter((invoice) => normalizeInvoiceStatus(invoice.status) === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
}

function buildProjectRevenueSummary() {
  return state.projects.map((project) => {
    const relatedInvoices = state.invoices.filter((invoice) => invoice.projectId === project.id);
    const collected = relatedInvoices
      .filter((invoice) => normalizeInvoiceStatus(invoice.status) === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const pending = Math.max(Number(project.budget || 0) - collected, 0);

    return {
      ...project,
      collected,
      pending,
    };
  });
}

function renderRevenueChartData() {
  const months = getLastTwelveMonths();
  const map = new Map(months.map((item) => [item.key, 0]));

  state.payments.forEach((payment) => {
    const date = toDate(payment.paymentDate);
    if (!date) return;
    const key = monthKey(date);
    if (map.has(key)) {
      map.set(key, map.get(key) + Number(payment.amount || 0));
    }
  });

  return months.map((month) => ({
    label: month.label,
    value: map.get(month.key) || 0,
  }));
}

function drawChart() {
  if (!els.chartGrid || !els.chartArea || !els.chartLine || !els.chartDots || !els.chartLabels) return;

  const data = renderRevenueChartData();
  const labels = data.map((item) => item.label);
  const values = data.map((item) => Number(item.value || 0));

  const w = 1000;
  const h = 420;
  const pad = { top: 24, right: 26, bottom: 48, left: 68 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? innerW / (values.length - 1) : innerW;

  els.chartGrid.innerHTML = "";
  els.chartLabels.innerHTML = "";
  els.chartDots.innerHTML = "";

  const yTicks = buildYAxisTicks(max);
  yTicks.forEach((tick) => {
    const y = pad.top + innerH - (tick / max) * innerH;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pad.left);
    line.setAttribute("x2", w - pad.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    els.chartGrid.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", pad.left - 14);
    label.setAttribute("y", y + 5);
    label.setAttribute("text-anchor", "end");
    label.textContent = formatCompactCurrencyTick(tick);
    els.chartLabels.appendChild(label);
  });

  const points = values.map((value, index) => {
    const x = pad.left + index * stepX;
    const y = pad.top + innerH - (value / max) * innerH;
    return [x, y];
  });

  if (!points.length) {
    els.chartLine.setAttribute("d", "");
    els.chartArea.setAttribute("d", "");
    return;
  }

  const linePath = `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}`;
  const areaPath = `${linePath} L ${pad.left + innerW} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;

  els.chartLine.setAttribute("d", linePath);
  els.chartArea.setAttribute("d", areaPath);

  points.forEach(([x, y], index) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 6.5);
    els.chartDots.appendChild(dot);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", h - 14);
    label.setAttribute("text-anchor", "middle");
    label.textContent = labels[index];
    els.chartLabels.appendChild(label);
  });
}

function buildYAxisTicks(max) {
  const niceMax = Math.max(1000, Math.ceil(max / 5) * 5);
  const step = niceMax / 5;
  return [0, step, step * 2, step * 3, step * 4, step * 5];
}

function formatCompactCurrencyTick(value) {
  if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${Math.round(value)}`;
}

function getLastTwelveMonths() {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return months;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

function formatDisplayDate(value) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatInputDate(value) {
  const date = toDate(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function timestampFromDateInput(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

function addDaysToDate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addDaysToDateInput(base, days) {
  return addDaysToDate(base, days).toISOString().slice(0, 10);
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

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function openFile(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatInvoiceNumberForPdf(invoice) {
  return invoice.invoiceNumber || invoice.id || "Invoice";
}

function buildInvoicePdfDoc(invoice) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    throw new Error("jsPDF library not loaded.");
  }

  const project = state.projectMap.get(invoice.projectId);
  const client = getUser(invoice.clientId);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  doc.setFillColor(18, 18, 24);
  doc.rect(0, 0, pageWidth, 108, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Elevated Web Solutions", margin, 42);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice", margin, 64);

  doc.setTextColor(15, 23, 42);
  y = 142;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(formatInvoiceNumberForPdf(invoice), margin, y);

  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Project: ${getProjectName(project)}`, margin, y);
  y += 18;
  doc.text(`Client: ${getClientName(invoice, project, client)}`, margin, y);
  y += 18;
  doc.text(`Project ID: ${invoice.projectId || "—"}`, margin, y);
  y += 18;
  doc.text(`Invoice Type: ${invoice.invoiceType || "Invoice"}`, margin, y);

  const rightX = pageWidth - 220;
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", rightX, 142);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice ID: ${invoice.id}`, rightX, 164);
  doc.text(`Amount: ${currency(invoice.amount)}`, rightX, 182);
  doc.text(`Status: ${invoiceStatusLabel(invoice.status)}`, rightX, 200);
  doc.text(`Issue Date: ${formatDisplayDate(invoice.issueDate || invoice.createdAt)}`, rightX, 218);
  doc.text(`Due Date: ${formatDisplayDate(invoice.dueDate)}`, rightX, 236);

  y += 34;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Notes", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  const notes = doc.splitTextToSize(invoice.notes || "No additional notes.", pageWidth - margin * 2);
  doc.text(notes, margin, y);

  const notesHeight = Array.isArray(notes) ? notes.length * 14 : 14;
  y += notesHeight + 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Payment Summary", margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  const summaryLines = [
    `Total Amount: ${currency(invoice.amount)}`,
    `Status: ${invoiceStatusLabel(invoice.status)}`,
    `Generated On: ${new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())}`,
  ];

  summaryLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 18;
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 4, pageWidth - margin, y + 4);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("This invoice was generated from the Elevated Web Solutions portal.", margin, 780);

  return doc;
}

async function createAndUploadInvoicePdf(invoice, projectOverride = null) {
  const project = projectOverride || state.projectMap.get(invoice.projectId);
  const pdfDoc = buildInvoicePdfDoc({ ...invoice, projectId: invoice.projectId, project });
  const blob = pdfDoc.output("blob");
  const storagePath = `invoices/${invoice.id}.pdf`;
  const pdfRef = storageRef(storage, storagePath);
  await uploadBytes(pdfRef, blob, { contentType: "application/pdf" });
  const url = await getDownloadURL(pdfRef);
  await updateDoc(doc(db, "invoices", invoice.id), {
    invoicePdfUrl: url,
    storagePath,
    updatedAt: serverTimestamp(),
  });
  return url;
}

async function notifyInvoiceParticipants(invoice, title, message) {
  const project = state.projectMap.get(invoice.projectId);
  const recipients = new Set();

  if (project?.clientId) recipients.add(project.clientId);
  if (project?.projectManagerId) recipients.add(project.projectManagerId);
  (project?.assignedDevelopers || []).forEach((uid) => recipients.add(uid));

  if (state.user?.uid) recipients.add(state.user.uid);

  const batch = writeBatch(db);
  recipients.forEach((userId) => {
    const ref = doc(collection(db, "notifications"));
    batch.set(ref, {
      userId,
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

async function addRevenueNotification(title, message) {
  if (!state.user?.uid) return;
  try {
    await addDoc(collection(db, "notifications"), {
      userId: state.user.uid,
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch {
    // non-blocking
  }
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
}
