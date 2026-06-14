import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { requireRole } from "../../js/guards/roleGuard.js";
import { ROLES } from "../../js/utils/permissions.js";

const LOGIN_ROUTE = "../../index/index.html";

const els = {
  logoutBtn: document.querySelector(".logout-btn"),
  openSidebarBtn: document.getElementById("openSidebar"),
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  leadsRows: document.getElementById("leadsRows"),
  statTotal: document.getElementById("statTotal"),
  statFollowUp: document.getElementById("statFollowUp"),
  statInterestedPct: document.getElementById("statInterestedPct"),
  statConfirmedPct: document.getElementById("statConfirmedPct"),

  addLeadBtn: document.getElementById("addLeadBtn"),
  leadModalBackdrop: document.getElementById("leadModalBackdrop"),
  leadModalTitle: document.getElementById("leadModalTitle"),
  closeLeadModal: document.getElementById("closeLeadModal"),
  cancelLead: document.getElementById("cancelLead"),
  leadForm: document.getElementById("leadForm"),
  leadFormError: document.getElementById("leadFormError"),
  leadId: document.getElementById("leadId"),
  leadName: document.getElementById("leadName"),
  leadBusiness: document.getElementById("leadBusiness"),
  leadPhone: document.getElementById("leadPhone"),
  leadEmail: document.getElementById("leadEmail"),
  leadService: document.getElementById("leadService"),
  leadSource: document.getElementById("leadSource"),
  leadStatus: document.getElementById("leadStatus"),
  leadFollowUp: document.getElementById("leadFollowUp"),
  leadNotes: document.getElementById("leadNotes"),

  callModalBackdrop: document.getElementById("callModalBackdrop"),
  closeCallModal: document.getElementById("closeCallModal"),
  cancelCall: document.getElementById("cancelCall"),
  callForm: document.getElementById("callForm"),
  callFormError: document.getElementById("callFormError"),
  callLeadId: document.getElementById("callLeadId"),
  callLeadName: document.getElementById("callLeadName"),
  callOutcome: document.getElementById("callOutcome"),
  callNextFollowUp: document.getElementById("callNextFollowUp"),
  callNotes: document.getElementById("callNotes"),
};

const state = {
  uid: null,
  leads: [],
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
      profile = await requireRole(user.uid, [ROLES.COLD_CALLER]);
    } catch (err) {
      console.error("Role check failed:", err);
      await signOut(auth).catch(() => {});
      window.location.href = LOGIN_ROUTE;
      return;
    }

    if (!profile) return;

    state.uid = user.uid;
    startListeners(user.uid);
  });
}

function startListeners(uid) {
  const leadsQuery = query(collection(db, "leads"), where("assignedCallerId", "==", uid));

  const unsub = onSnapshot(leadsQuery, (snap) => {
    state.leads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => console.error("Leads listener error:", err));

  state.unsubscribe.push(unsub);
}

function teardown() {
  state.unsubscribe.forEach((unsub) => unsub());
  state.unsubscribe = [];
  state.leads = [];
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
      closeLeadModal();
      closeCallModal();
    });
  }

  if (els.searchInput) els.searchInput.addEventListener("input", render);
  if (els.statusFilter) els.statusFilter.addEventListener("change", render);

  if (els.addLeadBtn) {
    els.addLeadBtn.addEventListener("click", () => openLeadModal());
  }
  if (els.closeLeadModal) els.closeLeadModal.addEventListener("click", closeLeadModal);
  if (els.cancelLead) els.cancelLead.addEventListener("click", closeLeadModal);
  if (els.leadForm) els.leadForm.addEventListener("submit", handleLeadSubmit);

  if (els.closeCallModal) els.closeCallModal.addEventListener("click", closeCallModal);
  if (els.cancelCall) els.cancelCall.addEventListener("click", closeCallModal);
  if (els.callForm) els.callForm.addEventListener("submit", handleCallSubmit);

  if (els.leadsRows) {
    els.leadsRows.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-edit]");
      const callBtn = event.target.closest("[data-call]");

      if (editBtn) {
        const lead = state.leads.find((l) => l.id === editBtn.dataset.edit);
        if (lead) openLeadModal(lead);
      }

      if (callBtn) {
        const lead = state.leads.find((l) => l.id === callBtn.dataset.call);
        if (lead) openCallModal(lead);
      }
    });
  }
}

/* ------------------------------------------------------------------ */
/* RENDER                                                              */
/* ------------------------------------------------------------------ */

function render() {
  const search = (els.searchInput?.value || "").trim().toLowerCase();
  const statusFilter = els.statusFilter?.value || "";

  const filtered = state.leads.filter((lead) => {
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    if (!matchesStatus) return false;

    if (!search) return true;
    const haystack = [lead.name, lead.businessName, lead.phone, lead.serviceInterest]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });

  renderStats();
  renderRows(filtered);
}

function renderStats() {
  const total = state.leads.length;
  const followUp = state.leads.filter((l) => l.status === "follow_up").length;
  const interested = state.leads.filter((l) => l.status === "interested").length;
  const confirmed = state.leads.filter((l) => l.status === "confirmed_client").length;

  setText(els.statTotal, total);
  setText(els.statFollowUp, followUp);
  setText(els.statInterestedPct, total ? `${Math.round((interested / total) * 100)}%` : "0%");
  setText(els.statConfirmedPct, total ? `${Math.round((confirmed / total) * 100)}%` : "0%");
}

function renderRows(leads) {
  if (!els.leadsRows) return;

  if (leads.length === 0) {
    els.leadsRows.innerHTML = `<div class="empty-row">No leads match your filters yet.</div>`;
    return;
  }

  els.leadsRows.innerHTML = leads
    .map((lead) => {
      const followUp = lead.followUpDate ? dateFormatter.format(toDate(lead.followUpDate)) : "—";
      return `
        <div class="lead-row">
          <div>
            <p class="lead-name">${escapeHtml(lead.name || "Unnamed")}</p>
            <p class="lead-sub">${escapeHtml(lead.email || "")}</p>
          </div>
          <div>${escapeHtml(lead.businessName || "—")}</div>
          <div>${escapeHtml(lead.phone || "—")}</div>
          <div>${escapeHtml(lead.serviceInterest || "—")}</div>
          <div><span class="status-badge status-${escapeHtml(lead.status || "new")}">${formatStatus(lead.status)}</span></div>
          <div>${followUp}</div>
          <div class="lead-actions">
            <button class="row-btn" data-call="${lead.id}" type="button">Log Call</button>
            <button class="row-btn" data-edit="${lead.id}" type="button">Edit</button>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ------------------------------------------------------------------ */
/* LEAD MODAL                                                          */
/* ------------------------------------------------------------------ */

function openLeadModal(lead = null) {
  els.leadFormError.hidden = true;
  els.leadFormError.textContent = "";

  if (lead) {
    els.leadModalTitle.textContent = "Edit Lead";
    els.leadId.value = lead.id;
    els.leadName.value = lead.name || "";
    els.leadBusiness.value = lead.businessName || "";
    els.leadPhone.value = lead.phone || "";
    els.leadEmail.value = lead.email || "";
    els.leadService.value = lead.serviceInterest || "";
    els.leadSource.value = lead.source || "";
    els.leadStatus.value = lead.status || "not_answered";
    els.leadFollowUp.value = lead.followUpDate ? toInputDate(lead.followUpDate) : "";
    els.leadNotes.value = lead.notes || "";
  } else {
    els.leadModalTitle.textContent = "New Lead";
    els.leadForm.reset();
    els.leadId.value = "";
    els.leadStatus.value = "not_answered";
  }

  els.leadModalBackdrop.hidden = false;
}

function closeLeadModal() {
  els.leadModalBackdrop.hidden = true;
}

async function handleLeadSubmit(event) {
  event.preventDefault();

  const name = els.leadName.value.trim();
  const phone = els.leadPhone.value.trim();

  if (!name || !phone) {
    showError(els.leadFormError, "Name and phone number are required.");
    return;
  }

  // Duplicate detection: same phone already in this caller's pipeline.
  const editingId = els.leadId.value;
  const duplicate = state.leads.find((l) => l.phone === phone && l.id !== editingId);
  if (duplicate) {
    showError(els.leadFormError, `A lead with this phone number already exists: "${duplicate.name}". Edit that lead instead, or use a different number.`);
    return;
  }

  const payload = {
    name,
    businessName: els.leadBusiness.value.trim(),
    phone,
    email: els.leadEmail.value.trim(),
    serviceInterest: els.leadService.value.trim(),
    source: els.leadSource.value.trim(),
    status: els.leadStatus.value,
    notes: els.leadNotes.value.trim(),
    followUpDate: els.leadFollowUp.value ? Timestamp.fromDate(new Date(els.leadFollowUp.value)) : null,
    assignedCallerId: state.uid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "leads", editingId), payload);
    } else {
      await addDoc(collection(db, "leads"), {
        ...payload,
        createdAt: serverTimestamp(),
        createdBy: state.uid,
      });
    }
    closeLeadModal();
  } catch (err) {
    console.error("Failed to save lead:", err);
    showError(els.leadFormError, "Could not save this lead. Please try again.");
  }
}

/* ------------------------------------------------------------------ */
/* CALL LOG MODAL                                                      */
/* ------------------------------------------------------------------ */

function openCallModal(lead) {
  els.callFormError.hidden = true;
  els.callFormError.textContent = "";

  els.callLeadId.value = lead.id;
  els.callLeadName.textContent = `${lead.name || "Lead"} · ${lead.phone || ""}`;
  els.callOutcome.value = lead.status || "not_answered";
  els.callNextFollowUp.value = lead.followUpDate ? toInputDate(lead.followUpDate) : "";
  els.callNotes.value = "";

  els.callModalBackdrop.hidden = false;
}

function closeCallModal() {
  els.callModalBackdrop.hidden = true;
}

async function handleCallSubmit(event) {
  event.preventDefault();

  const leadId = els.callLeadId.value;
  const outcome = els.callOutcome.value;
  const notes = els.callNotes.value.trim();
  const nextFollowUp = els.callNextFollowUp.value
    ? Timestamp.fromDate(new Date(els.callNextFollowUp.value))
    : null;

  if (!leadId || !outcome) {
    showError(els.callFormError, "Please choose a call outcome.");
    return;
  }

  try {
    await addDoc(collection(db, "callLogs"), {
      leadId,
      callerId: state.uid,
      outcome,
      notes,
      callDate: serverTimestamp(),
      nextFollowUp,
      createdAt: serverTimestamp(),
    });

    const leadUpdate = {
      status: outcome,
      followUpDate: nextFollowUp,
      updatedAt: serverTimestamp(),
    };
    if (notes) leadUpdate.notes = notes;

    await updateDoc(doc(db, "leads", leadId), leadUpdate);

    closeCallModal();
  } catch (err) {
    console.error("Failed to save call log:", err);
    showError(els.callFormError, "Could not save this call log. Please try again.");
  }
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function toDate(value) {
  if (!value) return new Date(0);
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

function toInputDate(value) {
  const d = toDate(value);
  return d.toISOString().slice(0, 10);
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
  return String(status || "new").replace(/_/g, " ");
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
