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
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
  client: "/client/dashboard/index.html",
  team: "/team/dashboard/index.html",
};

const state = {
  user: null,
  profile: null,
  filter: "all",
  search: "",
  ready: false,
  users: [],
  projects: [],
  conversations: [],
  conversationMap: new Map(),
  activeId: null,
  activeConversation: null,
  messages: [],
  pendingAttachments: [],
  convoUnsub: null,
  messagesUnsub: null,
  projectUnsub: null,
  userUnsub: null,
  pendingOpenId: resolveInitialConversationId(),
};

const els = {
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("backdrop"),
  openSidebar: document.getElementById("openSidebar"),
  backBtn: document.getElementById("backBtn"),
  backToListTop: document.getElementById("backToListTop"),
  conversationView: document.getElementById("conversationView"),
  chatView: document.getElementById("chatView"),
  conversationList: document.getElementById("conversationList"),
  searchInput: document.getElementById("searchInput"),
  filterBar: document.getElementById("filterBar"),
  activeFilterLabel: document.getElementById("activeFilterLabel"),
  countLabel: document.getElementById("countLabel"),
  chatTitle: document.getElementById("chatTitle"),
  chatBadge: document.getElementById("chatBadge"),
  chatParticipants: document.getElementById("chatParticipants"),
  messagesArea: document.getElementById("messagesArea"),
  archiveBtn: document.getElementById("archiveBtn"),
  searchMessagesBtn: document.getElementById("searchMessagesBtn"),
  fileInput: document.getElementById("fileInput"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  attachmentPreview: document.getElementById("attachmentPreview"),
  logoutBtn: document.querySelector(".logout-btn"),
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindStaticUi();
  showConversationList();

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
  els.backBtn?.addEventListener("click", showConversationList);
  els.backToListTop?.addEventListener("click", showConversationList);

  els.backdrop?.addEventListener("click", () => {
    setSidebar(false);
    closeConversationIfMobile();
  });

  els.searchInput?.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderConversationList();
  });

  els.filterBar?.addEventListener("click", (event) => {
    const btn = event.target.closest(".filter-pill");
    if (!btn) return;
    setFilter(btn.dataset.filter || "all");
  });

  els.archiveBtn?.addEventListener("click", toggleArchiveCurrentConversation);

  els.searchMessagesBtn?.addEventListener("click", () => {
    els.searchInput?.focus();
  });

  els.fileInput?.addEventListener("change", () => {
    const files = [...(els.fileInput.files || [])];
    if (!files.length) return;

    state.pendingAttachments.push(...files);
    renderPendingAttachments();
    els.fileInput.value = "";
  });

  els.messageInput?.addEventListener("input", (event) => autosizeTextarea(event.target));
  els.messageInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendCurrentMessage();
    }
  });

  els.sendBtn?.addEventListener("click", sendCurrentMessage);

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".conversation-card");
    if (card) {
      openConversation(card.dataset.id, { markRead: true });
      return;
    }

    if (!event.target.closest(".sidebar") && !event.target.closest("#openSidebar")) {
      setSidebar(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSidebar(false);
      closeModalOverlays();
      if (isMobileView()) showConversationList();
    }
  });
}

async function handleAuthChange(user) {
  teardownListeners();
  state.user = user;
  state.profile = null;
  state.users = [];
  state.projects = [];
  state.conversations = [];
  state.conversationMap = new Map();
  state.activeId = null;
  state.activeConversation = null;
  state.messages = [];
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
    if (!ROLE_REDIRECTS[role]) {
      await safeSignOut();
      window.location.href = LOGIN_ROUTE;
      return;
    }

    state.profile = profile;
    state.ready = true;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch {
      // non-blocking
    }

    startDirectoryListeners();
    startConversationListener();

    renderConversationList();

    if (state.pendingOpenId) {
      const retry = setInterval(() => {
        const exists = state.conversations.some((conv) => conv.id === state.pendingOpenId);
        if (exists) {
          clearInterval(retry);
          openConversation(state.pendingOpenId, { markRead: true });
          state.pendingOpenId = null;
        }
      }, 250);

      setTimeout(() => clearInterval(retry), 5000);
    }
  } catch (error) {
    console.error("Messages page initialization failed:", error);
    await safeSignOut();
    window.location.href = LOGIN_ROUTE;
  }
}

function startDirectoryListeners() {
  const uid = state.user.uid;
  const role = normalizeRole(state.profile.role);

  if (state.userUnsub) state.userUnsub();
  if (state.projectUnsub) state.projectUnsub();

  if (role === "admin") {
    state.userUnsub = onSnapshot(
      query(collection(db, "users")),
      (snapshot) => {
        state.users = snapshot.docs.map(mapDoc).filter((u) => isActiveUser(u) || u.id === uid);
        renderConversationList();
        if (state.activeConversation) renderConversationHeader();
      },
      handleListenerError("users")
    );

    state.projectUnsub = onSnapshot(
      query(collection(db, "projects")),
      (snapshot) => {
        state.projects = snapshot.docs.map(mapDoc);
        renderConversationList();
      },
      handleListenerError("projects")
    );
    return;
  }

  if (role === "client") {
    state.userUnsub = onSnapshot(
      query(collection(db, "users"), where("role", "==", "admin")),
      (snapshot) => {
        state.users = snapshot.docs.map(mapDoc).filter(isActiveUser);
        renderConversationList();
        if (state.activeConversation) renderConversationHeader();
      },
      handleListenerError("admins")
    );

    state.projectUnsub = onSnapshot(
      query(collection(db, "projects"), where("clientId", "==", uid)),
      (snapshot) => {
        state.projects = snapshot.docs.map(mapDoc);
        renderConversationList();
      },
      handleListenerError("projects")
    );
    return;
  }

  state.userUnsub = onSnapshot(
    query(collection(db, "users"), where("role", "==", "admin")),
    (snapshot) => {
      state.users = snapshot.docs.map(mapDoc).filter(isActiveUser);
      renderConversationList();
      if (state.activeConversation) renderConversationHeader();
    },
    handleListenerError("admins")
  );

  state.projectUnsub = onSnapshot(
    query(collection(db, "projects"), where("assignedDevelopers", "array-contains", uid)),
    (snapshot) => {
      state.projects = snapshot.docs.map(mapDoc);
      renderConversationList();
    },
    handleListenerError("projects")
  );
}

function startConversationListener() {
  const uid = state.user.uid;

  if (state.convoUnsub) state.convoUnsub();

  state.convoUnsub = onSnapshot(
    query(collection(db, "conversations"), where("participantIds", "array-contains", uid)),
    (snapshot) => {
      state.conversations = snapshot.docs.map(mapDoc).map(normalizeConversation);
      state.conversationMap = new Map(state.conversations.map((conv) => [conv.id, conv]));
      renderConversationList();

      if (state.activeId) {
        const stillExists = state.conversationMap.get(state.activeId);
        if (stillExists) {
          state.activeConversation = stillExists;
          renderConversationHeader();
        } else {
          closeConversationIfMobile();
          state.activeId = null;
          state.activeConversation = null;
          state.messages = [];
          showConversationList();
        }
      }
    },
    handleListenerError("conversations")
  );
}

function teardownListeners() {
  if (typeof state.convoUnsub === "function") state.convoUnsub();
  if (typeof state.messagesUnsub === "function") state.messagesUnsub();
  if (typeof state.projectUnsub === "function") state.projectUnsub();
  if (typeof state.userUnsub === "function") state.userUnsub();

  state.convoUnsub = null;
  state.messagesUnsub = null;
  state.projectUnsub = null;
  state.userUnsub = null;
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

function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll(".filter-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  els.activeFilterLabel.textContent = filterLabel(filter);
  renderConversationList();
}

function filterLabel(filter) {
  return {
    all: "All",
    unread: "Unread",
    clients: "Clients",
    team: "Team",
    projects: "Projects",
    archived: "Archived",
  }[filter] || "All";
}

function buildEligibleContacts() {
  const role = normalizeRole(state.profile?.role);
  const currentUid = state.user?.uid;

  if (!currentUid) return [];

  if (role === "admin") {
    const people = state.users
      .filter((user) => user.id !== currentUid)
      .map((user) => ({
        kind: "direct",
        id: directConversationId(currentUid, user.id),
        title: getDisplayName(user) || "Unknown",
        subtitle: humanizeRole(user.role),
        badge: user.role,
        targetUserId: user.id,
        otherUid: user.id,
        sortKey: getConversationSortKeyFromId(directConversationId(currentUid, user.id)),
      }));

    const projects = state.projects.map((project) => ({
      kind: "project",
      id: projectConversationId(project.id),
      title: getProjectTitle(project),
      subtitle: `Project • ${getProjectClientName(project) || "Client"}`,
      badge: "project",
      projectId: project.id,
      sortKey: getConversationSortKeyFromId(projectConversationId(project.id)),
    }));

    return [...projects, ...people];
  }

  if (role === "client") {
    return state.projects.map((project) => ({
      kind: "project",
      id: projectConversationId(project.id),
      title: getProjectTitle(project),
      subtitle: `Project • ${humanizeRole(project.status)}`,
      badge: "project",
      projectId: project.id,
      sortKey: getConversationSortKeyFromId(projectConversationId(project.id)),
    }));
  }

  return state.users
    .filter((user) => normalizeRole(user.role) === "admin")
    .map((user) => ({
      kind: "direct",
      id: directConversationId(currentUid, user.id),
      title: getDisplayName(user) || "Admin",
      subtitle: humanizeRole(user.role),
      badge: user.role,
      targetUserId: user.id,
      otherUid: user.id,
      sortKey: getConversationSortKeyFromId(directConversationId(currentUid, user.id)),
    }));
}

function getVisibleContacts() {
  const q = state.search.trim().toLowerCase();
  const contacts = buildEligibleContacts();

  return contacts
    .filter((contact) => {
      const conv = state.conversationMap.get(contact.id);

      if (state.filter === "archived" && !isArchivedForMe(conv)) return false;
      if (state.filter !== "archived" && isArchivedForMe(conv)) return false;

      const unread = getUnreadCount(conv, state.user?.uid);
      if (state.filter === "unread" && unread <= 0) return false;

      if (state.filter === "clients") {
        if (normalizeRole(state.profile?.role) === "admin") {
          return contact.kind === "project" || normalizeRole(contact.badge) === "client";
        }
        return normalizeRole(contact.badge) === "client" || contact.kind === "project";
      }

      if (state.filter === "team") {
        if (normalizeRole(state.profile?.role) === "client") return false;
        return contact.kind === "direct" && normalizeRole(contact.badge) !== "client";
      }

      if (state.filter === "projects") {
        return contact.kind === "project";
      }

      if (!q) return true;

      const haystack = [
        contact.title,
        contact.subtitle,
        conv?.lastMessageText,
        conv?.lastSenderName,
      ].join(" ").toLowerCase();

      return haystack.includes(q);
    })
    .sort((a, b) => {
      const convA = state.conversationMap.get(a.id);
      const convB = state.conversationMap.get(b.id);
      const timeA = toMillis(convA?.lastMessageAt || convA?.updatedAt || convA?.createdAt || a.sortKey);
      const timeB = toMillis(convB?.lastMessageAt || convB?.updatedAt || convB?.createdAt || b.sortKey);
      return timeB - timeA;
    });
}

function renderConversationList() {
  const visible = getVisibleContacts();
  els.countLabel.textContent = `${visible.length} chat${visible.length === 1 ? "" : "s"}`;
  els.activeFilterLabel.textContent = filterLabel(state.filter);

  if (!visible.length) {
    els.conversationList.innerHTML = `
      <div class="empty-card">
        <div class="empty-illustration">⌁</div>
        <h4>No conversations found</h4>
        <p>Try a different filter or search term.</p>
      </div>
    `;
    return;
  }

  els.conversationList.innerHTML = visible.map((contact) => {
    const conv = state.conversationMap.get(contact.id);
    const unread = getUnreadCount(conv, state.user?.uid);
    const activeClass = contact.id === state.activeId ? "active" : "";
    const preview = conv?.lastMessageText || (contact.kind === "project" ? "Project chat ready." : "Tap to start chat.");
    const timeLabel = conv?.lastMessageAt
      ? formatRelativeTime(conv.lastMessageAt)
      : contact.kind === "project"
        ? "Project"
        : "New";

    return `
      <article class="conversation-card ${activeClass}" tabindex="0" role="button" data-id="${escapeAttr(contact.id)}" aria-label="Open ${escapeAttr(contact.title)}">
        <div class="avatar" aria-hidden="true">${initials(contact.title)}</div>
        <div class="card-body">
          <div class="card-top">
            <h4 class="card-name">${escapeHtml(contact.title)}</h4>
            <span class="card-type">${escapeHtml(formatContactType(contact))}</span>
          </div>
          <div class="card-meta">${escapeHtml(contact.subtitle || "")}</div>
          <p class="card-preview">${escapeHtml(preview)}</p>
          <div class="card-bottom">
            <span class="card-time">${escapeHtml(timeLabel)}</span>
            <span class="unread-badge ${unread ? "" : "hidden"}">${unread}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function formatContactType(contact) {
  if (contact.kind === "project") return "Project";
  if (normalizeRole(contact.badge) === "admin") return "Admin";
  if (normalizeRole(contact.badge) === "client") return "Client";
  return "Team";
}

async function openConversation(conversationId, { markRead = true } = {}) {
  const contact = buildEligibleContacts().find((item) => item.id === conversationId);
  if (!contact) return;

  const conv = await ensureConversation(contact);
  if (!conv) return;

  state.activeId = conv.id;
  state.activeConversation = conv;
  setSelectedConversationId(conv.id);

  if (state.messagesUnsub) state.messagesUnsub();

  state.messagesUnsub = onSnapshot(
    query(collection(db, "conversations", conv.id, "messages"), orderBy("createdAt", "asc")),
    (snapshot) => {
      state.messages = snapshot.docs.map(mapDoc);
      renderMessages();
    },
    handleListenerError("messages")
  );

  if (markRead) {
    markConversationRead(conv.id);
  }

  renderConversationHeader();
  renderConversationList();
  showChatView();
}

async function ensureConversation(contact) {
  const uid = state.user?.uid;
  const role = normalizeRole(state.profile?.role);
  if (!uid) return null;

  if (contact.kind === "direct") {
    const convoId = directConversationId(uid, contact.otherUid);
    const convoRef = doc(db, "conversations", convoId);
    const snap = await getDoc(convoRef);

    if (!snap.exists()) {
      const other = state.users.find((u) => u.id === contact.otherUid);
      const participantIds = [...new Set([uid, contact.otherUid])];

      await setDoc(convoRef, {
        type: "direct",
        title:
            getDisplayName(other) ||
            contact.title ||
            "Direct Chat",
        participantIds,
        unreadCounts: Object.fromEntries(participantIds.map((id) => [id, 0])),
        archivedBy: [],
        lastMessageText: "",
        lastMessageAt: null,
        lastSenderId: null,
        lastSenderName: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const fresh = await getDoc(convoRef);
    return fresh.exists() ? normalizeConversation({ id: fresh.id, ...fresh.data() }) : null;
  }

  const project = state.projects.find((p) => p.id === contact.projectId);
  if (!project) return null;

  const adminIds = role === "admin"
    ? [uid, ...state.users.filter((u) => normalizeRole(u.role) === "admin").map((u) => u.id)]
    : [
        ...state.users.filter((u) => normalizeRole(u.role) === "admin").map((u) => u.id),
        uid,
      ];

  const participantIds = [...new Set([project.clientId, ...adminIds])];
  const convoId = projectConversationId(project.id);
  const convoRef = doc(db, "conversations", convoId);
  const snap = await getDoc(convoRef);

  if (!snap.exists()) {
    await setDoc(convoRef, {
      type: "project",
      projectId: project.id,
      title: getProjectTitle(project),
      participantIds,
      unreadCounts: Object.fromEntries(participantIds.map((id) => [id, 0])),
      archivedBy: [],
      lastMessageText: "",
      lastMessageAt: null,
      lastSenderId: null,
      lastSenderName: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const fresh = await getDoc(convoRef);
  return fresh.exists() ? normalizeConversation({ id: fresh.id, ...fresh.data() }) : null;
}

async function markConversationRead(conversationId) {
  const uid = state.user?.uid;
  if (!uid) return;

  try {
    await updateDoc(doc(db, "conversations", conversationId), {
      [`unreadCounts.${uid}`]: 0,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // non-blocking
  }
}

function renderConversationHeader() {
  const conv = state.activeConversation;
  if (!conv) return;

  els.chatTitle.textContent = conv.title || "Conversation";
  els.chatBadge.textContent = conv.type === "project" ? "Project Chat" : "Direct Chat";
  els.chatParticipants.textContent = buildParticipantsText(conv);
  els.archiveBtn.textContent = isArchivedForMe(conv) ? "Unarchive Chat" : "Archive Chat";
}

function buildParticipantsText(conv) {

  if (!conv) return "";

  if (conv.type === "project") {

    const project = state.projects.find(
      p => p.id === conv.projectId
    );

    const client = getUser(project?.clientId);

    const clientName =
      getDisplayName(client) ||
      "Client";

    const adminNames = state.users
      .filter(
        user =>
          normalizeRole(user.role) === "admin"
      )
      .map(user => getDisplayName(user))
      .filter(Boolean);

    return [
      clientName,
      ...adminNames
    ].join(" • ");
  }

  const names = (conv.participantIds || [])
    .map(id => {
      const user = getUser(id);

      if (
        id === state.user?.uid &&
        !user
      ) {
        return getDisplayName(state.profile);
      }

      return getDisplayName(user);
    })
    .filter(Boolean);

  return names.length
    ? names.join(" • ")
    : "Participants";
}

function renderMessages() {
  const conv = state.activeConversation;
  if (!conv) {
    els.messagesArea.innerHTML = `
      <div class="empty-card">
        <div class="empty-illustration">⌁</div>
        <h4>Select a conversation</h4>
        <p>Open any chat from the left panel.</p>
      </div>
    `;
    return;
  }

  if (!state.messages.length) {
    els.messagesArea.innerHTML = `
      <div class="empty-card">
        <div class="empty-illustration">⌁</div>
        <h4>No messages yet</h4>
        <p>Start the conversation from the composer below.</p>
      </div>
    `;
    return;
  }

  const currentUid = state.user?.uid;

  els.messagesArea.innerHTML = state.messages.map((message) => {
    const outgoing = isOutgoingMessage(message, currentUid);
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];

    return `
      <div class="message-row ${outgoing ? "right" : "left"}">
        <div class="message-bubble">
          <div class="message-head">
            <span class="message-sender">${escapeHtml(message.senderName || "Unknown")}</span>
            <span class="message-time">${escapeHtml(formatRelativeTime(message.createdAt || message.timestamp))}</span>
          </div>

          <div class="message-text">${escapeHtml(message.text || "")}</div>

          ${
            attachments.length
              ? `
                <div class="attachments">
                  ${attachments
                    .map((file) => `
                      <a class="attachment-card" href="${escapeAttr(file.url)}" target="_blank" rel="noopener noreferrer">
                        <span class="file-dot"></span>
                        <div>
                          <div class="attachment-name">${escapeHtml(file.name || "Attachment")}</div>
                          <div class="attachment-type">${escapeHtml(file.type || "File")}</div>
                        </div>
                      </a>
                    `)
                    .join("")}
                </div>
              `
              : ""
          }
        </div>
      </div>
    `;
  }).join("");

  requestAnimationFrame(() => {
    els.messagesArea.scrollTop = els.messagesArea.scrollHeight;
  });
}

function renderPendingAttachments() {
  if (!state.pendingAttachments.length) {
    els.attachmentPreview.classList.add("hidden");
    els.attachmentPreview.innerHTML = "";
    return;
  }

  els.attachmentPreview.classList.remove("hidden");
  els.attachmentPreview.innerHTML = state.pendingAttachments.map((file, index) => `
    <div class="pending-attachment">
      <span class="file-dot"></span>
      <div>
        <div class="attachment-name">${escapeHtml(file.name)}</div>
        <div class="attachment-type">${escapeHtml(file.type || "File")}</div>
      </div>
      <button class="remove" type="button" data-remove-index="${index}" aria-label="Remove attachment">×</button>
    </div>
  `).join("");

  els.attachmentPreview.querySelectorAll("[data-remove-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.removeIndex);
      state.pendingAttachments.splice(idx, 1);
      renderPendingAttachments();
    });
  });
}

async function sendCurrentMessage() {
  const conv = state.activeConversation;

  if (!conv) return;

  const text = els.messageInput.value.trim();
  const files = [...state.pendingAttachments];

  if (!text && !files.length) return;

  setSendBusy(true);

  try {

    const uploadedAttachments =
      await uploadAttachments(conv.id, files);

    const convoRef =
      doc(db, "conversations", conv.id);

    const messageRef =
      doc(
        collection(
          db,
          "conversations",
          conv.id,
          "messages"
        )
      );

    await runTransaction(db, async (tx) => {

      const convoSnap =
        await tx.get(convoRef);

      if (!convoSnap.exists()) {
        throw new Error(
          "Conversation not found"
        );
      }

      const data =
        convoSnap.data();

      const participantIds =
        Array.isArray(data.participantIds)
          ? data.participantIds
          : [];

      const unreadCounts = {
        ...(data.unreadCounts || {})
      };

      const messageText =
        text ||
        summarizeAttachments(
          uploadedAttachments
        );

      participantIds.forEach((id) => {

        unreadCounts[id] =
          id === state.user.uid
            ? 0
            : Number(
                unreadCounts[id] || 0
              ) + 1;

      });

      tx.set(messageRef, {

        senderId:
          state.user.uid,

        senderName:
          getDisplayName(
            state.profile
          ),

        text:
          messageText,

        attachments:
          uploadedAttachments,

        createdAt:
          serverTimestamp(),

      });

      const archivedBy =
        (data.archivedBy || [])
          .filter(
            id =>
              id !== state.user.uid
          );

      tx.update(convoRef, {

        archivedBy,

        lastSenderId:
          state.user.uid,

        lastSenderName:
          getDisplayName(
            state.profile
          ),

        lastMessageText:
          messageText,

        lastMessageAt:
          serverTimestamp(),

        unreadCounts,

        updatedAt:
          serverTimestamp(),

      });

    });

    state.pendingAttachments = [];

    renderPendingAttachments();

    els.messageInput.value = "";

    autosizeTextarea(
      els.messageInput
    );

    await markConversationRead(
      conv.id
    );

  }
  catch (error) {

    console.error(
      "Failed to send message:",
      error
    );

    alert(
      error.message ||
      "Unable to send message."
    );

  }
  finally {

    setSendBusy(false);

  }
}

async function uploadAttachments(conversationId, files) {
  if (!files.length) return [];

  const uploaded = [];

  for (const file of files) {
    const safeName = file.name.replace(/\s+/g, "_");
    const path = `message-attachments/${conversationId}/${Date.now()}_${safeName}`;
    const ref = storageRef(storage, path);

    await uploadBytes(ref, file);
    const url = await getDownloadURL(ref);

    uploaded.push({
      name: file.name,
      url,
      type: file.type || file.name.split(".").pop()?.toUpperCase() || "File",
      storagePath: path,
    });
  }

  return uploaded;
}

function summarizeAttachments(attachments) {
  if (!attachments.length) return "";
  if (attachments.length === 1) return `Shared ${attachments[0].name}`;
  return `Shared ${attachments.length} attachments`;
}

async function toggleArchiveCurrentConversation() {
  const conv = state.activeConversation;
  if (!conv) return;

  const uid = state.user.uid;
  const archived = isArchivedForMe(conv);

  try {
    await updateDoc(doc(db, "conversations", conv.id), {
      archivedBy: archived ? arrayRemove(uid) : arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });

    if (!archived && state.filter !== "archived") {
      state.activeConversation = null;
      state.activeId = null;
      state.messages = [];
      showConversationList();
    }
  } catch (error) {
    console.error("Failed to archive/unarchive conversation:", error);
    alert("Unable to update chat archive state.");
  }
}

function isArchivedForMe(conv) {
  if (!conv) return false;
  return Array.isArray(conv.archivedBy) && conv.archivedBy.includes(state.user?.uid);
}

function setSendBusy(isBusy) {
  if (!els.sendBtn) return;
  els.sendBtn.disabled = isBusy;
  els.sendBtn.textContent = isBusy ? "Sending..." : "Send";
}

function showConversationList() {
  els.conversationView.classList.remove("hidden");
  els.chatView.classList.add("hidden");
  els.backToListTop.hidden = true;
}

function showChatView() {
  els.conversationView.classList.add("hidden");
  els.chatView.classList.remove("hidden");
  els.backToListTop.hidden = false;
}

function closeConversationIfMobile() {
  if (isMobileView()) {
    showConversationList();
  }
}

function isMobileView() {
  return window.matchMedia("(max-width: 920px)").matches;
}

function setSidebar(open) {
  els.sidebar.classList.toggle("open", open);
  els.backdrop.hidden = !open;
}

function closeModalOverlays() {
  els.attachmentPreview?.classList.remove("hidden");
}

function autosizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

function getUnreadCount(conv, uid) {
  if (!conv || !uid) return 0;
  const counts = conv.unreadCounts || {};
  return Number(counts[uid] || 0);
}

function getProjectTitle(project) {
  return project?.title || project?.name || "Untitled project";
}

function getUser(userId) {
  if (!userId) return null;

  return state.users.find(user => user.id === userId) || null;
}

function getProjectClientName(project) {
  const client = getUser(project?.clientId);

  return client
    ? getDisplayName(client)
    : "Unknown Client";
}

function normalizeConversation(conv) {
  return {
    ...conv,
    type: normalizeRole(conv.type || "project"),
    participantIds: Array.isArray(conv.participantIds) ? conv.participantIds : [],
    unreadCounts: conv.unreadCounts || {},
    archivedBy: Array.isArray(conv.archivedBy) ? conv.archivedBy : [],
  };
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function humanizeRole(role) {
  return String(role || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function isActiveUser(user) {
  return user?.active !== false;
}

function getDisplayName(user) {
  if (!user) return "";
  return user.name || user.fullName || user.displayName || user.email?.split("@")[0] || "";
}

function isOutgoingMessage(message, currentUid) {
  if (!message) return false;
  if (message.senderId && currentUid) return message.senderId === currentUid;
  return false;
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

function toMillis(value) {
  const d = toDate(value);
  return d ? d.getTime() : 0;
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function mapDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function handleListenerError(label) {
  return (error) => {
    console.error(`Firestore listener error (${label}):`, error);
  };
}

function resolveInitialConversationId() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("conversationId") ||
    params.get("conversation") ||
    sessionStorage.getItem("ews:selectedConversationId") ||
    null
  );
}

function setSelectedConversationId(id) {
  try {
    sessionStorage.setItem("ews:selectedConversationId", id);
  } catch {
    // ignore
  }
}

function directConversationId(a, b) {
  return `direct_${[a, b].sort().join("__")}`;
}

function projectConversationId(projectId) {
  return `project_${projectId}`;
}

function getConversationSortKeyFromId(id) {
  const conv = state.conversationMap.get(id);
  return toMillis(conv?.lastMessageAt || conv?.updatedAt || conv?.createdAt);
}

function formatContactPreview(contact) {
  const conv = state.conversationMap.get(contact.id);
  return conv?.lastMessageText || (contact.kind === "project" ? "Project chat ready." : "Tap to start chat.");
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