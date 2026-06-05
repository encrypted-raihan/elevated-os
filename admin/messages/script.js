
"use strict";

const conversations = [
  {
    id: 1,
    type: "project",
    category: "projects",
    name: "Luxury Villa Website",
    projectName: "Luxury Villa Website",
    participants: ["ABC Builders", "Rahul", "Akash"],
    lastSender: "ABC Builders",
    lastMessage: "Can we make the hero section larger?",
    timestamp: "2m ago",
    unread: 3,
    archived: false,
    messages: [
      {
        side: "left",
        sender: "ABC Builders",
        time: "10:32 AM",
        text: "Can we make the hero section larger?",
        attachments: []
      },
      {
        side: "right",
        sender: "Admin",
        time: "10:35 AM",
        text: "Yes, we will push the revision today.",
        attachments: []
      },
      {
        side: "left",
        sender: "Rahul",
        time: "10:41 AM",
        text: "Homepage changes completed and ready for review.",
        attachments: ["Brand Guidelines.pdf"]
      }
    ]
  },
  {
    id: 2,
    type: "project",
    category: "projects",
    name: "Restaurant Website",
    projectName: "Restaurant Website",
    participants: ["Spice Route", "Akash"],
    lastSender: "Admin",
    lastMessage: "Drafting the menu section now.",
    timestamp: "18m ago",
    unread: 0,
    archived: false,
    messages: [
      {
        side: "left",
        sender: "Spice Route",
        time: "9:58 AM",
        text: "Can we use warmer colors for the landing page?",
        attachments: []
      },
      {
        side: "right",
        sender: "Admin",
        time: "10:04 AM",
        text: "Absolutely. I will align the palette with the brand reference.",
        attachments: []
      },
      {
        side: "left",
        sender: "Akash",
        time: "10:20 AM",
        text: "Drafting the menu section now.",
        attachments: ["menu-assets.zip"]
      }
    ]
  },
  {
    id: 3,
    type: "project",
    category: "projects",
    name: "Ecommerce Store",
    projectName: "Ecommerce Store",
    participants: ["Nova Retail", "Rahul", "Sam"],
    lastSender: "Nova Retail",
    lastMessage: "Do we have the mobile mockups?",
    timestamp: "41m ago",
    unread: 2,
    archived: false,
    messages: [
      {
        side: "left",
        sender: "Nova Retail",
        time: "9:12 AM",
        text: "Do we have the mobile mockups?",
        attachments: []
      },
      {
        side: "right",
        sender: "Admin",
        time: "9:19 AM",
        text: "Yes. I will share the revised version shortly.",
        attachments: ["mobile-mockup.png"]
      }
    ]
  },
  {
    id: 4,
    type: "client",
    category: "clients",
    name: "ABC Builders",
    projectName: "ABC Builders",
    participants: ["ABC Builders", "Admin"],
    lastSender: "ABC Builders",
    lastMessage: "Please share the latest estimate.",
    timestamp: "1h ago",
    unread: 1,
    archived: false,
    messages: [
      {
        side: "left",
        sender: "ABC Builders",
        time: "9:05 AM",
        text: "Please share the latest estimate.",
        attachments: []
      },
      {
        side: "right",
        sender: "Admin",
        time: "9:11 AM",
        text: "Shared in the project update file. I will resend it here as well.",
        attachments: ["estimate.pdf"]
      }
    ]
  },
  {
    id: 5,
    type: "client",
    category: "clients",
    name: "Luxury Villa Owner",
    projectName: "Luxury Villa Website",
    participants: ["Client", "Admin"],
    lastSender: "Admin",
    lastMessage: "The header spacing has been updated.",
    timestamp: "2h ago",
    unread: 0,
    archived: false,
    messages: [
      {
        side: "left",
        sender: "Client",
        time: "8:20 AM",
        text: "Could you reduce the spacing below the hero text?",
        attachments: []
      },
      {
        side: "right",
        sender: "Admin",
        time: "8:28 AM",
        text: "The header spacing has been updated.",
        attachments: []
      }
    ]
  },
  {
    id: 6,
    type: "team",
    category: "team",
    name: "Rahul",
    projectName: "Internal Team",
    participants: ["Admin", "Rahul"],
    lastSender: "Rahul",
    lastMessage: "Homepage changes completed and ready for review.",
    timestamp: "15m ago",
    unread: 4,
    archived: false,
    messages: [
      {
        side: "left",
        sender: "Rahul",
        time: "10:14 AM",
        text: "Homepage changes completed and ready for review.",
        attachments: ["homepage-v3.png"]
      },
      {
        side: "right",
        sender: "Admin",
        time: "10:18 AM",
        text: "Perfect. Send it to the client channel after I approve it.",
        attachments: []
      }
    ]
  },
  {
    id: 7,
    type: "team",
    category: "team",
    name: "Akash",
    projectName: "Internal Team",
    participants: ["Admin", "Akash"],
    lastSender: "Admin",
    lastMessage: "Please finalize the responsive spacing.",
    timestamp: "58m ago",
    unread: 0,
    archived: false,
    messages: [
      {
        side: "left",
        sender: "Akash",
        time: "9:40 AM",
        text: "I have fixed the banner layout on tablet screens.",
        attachments: []
      },
      {
        side: "right",
        sender: "Admin",
        time: "9:45 AM",
        text: "Please finalize the responsive spacing.",
        attachments: []
      }
    ]
  },
  {
    id: 8,
    type: "client",
    category: "clients",
    name: "Nova Retail",
    projectName: "Ecommerce Store",
    participants: ["Nova Retail", "Admin"],
    lastSender: "Nova Retail",
    lastMessage: "Can we add a wishlist icon in the header?",
    timestamp: "3h ago",
    unread: 0,
    archived: true,
    messages: [
      {
        side: "left",
        sender: "Nova Retail",
        time: "6:01 PM",
        text: "Can we add a wishlist icon in the header?",
        attachments: []
      },
      {
        side: "right",
        sender: "Admin",
        time: "6:08 PM",
        text: "Yes, we can add it without affecting the layout.",
        attachments: []
      }
    ]
  }
];

const state = {
  filter: "all",
  search: "",
  activeId: null,
  pendingAttachments: []
};

const els = {
  conversationList: document.getElementById("conversationList"),
  searchInput: document.getElementById("searchInput"),
  filters: document.getElementById("typeFilters"),
  emptyState: document.getElementById("emptyState"),
  chatShell: document.getElementById("chatShell"),
  chatTitle: document.getElementById("chatTitle"),
  chatType: document.getElementById("chatType"),
  chatParticipants: document.getElementById("chatParticipants"),
  messagesArea: document.getElementById("messagesArea"),
  archiveBtn: document.getElementById("archiveBtn"),
  fileInput: document.getElementById("fileInput"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  attachmentPreview: document.getElementById("attachmentPreview"),
  statUnread: document.getElementById("statUnread"),
  statActiveConv: document.getElementById("statActiveConv"),
  statClients: document.getElementById("statClients"),
  statTeam: document.getElementById("statTeam"),
  mobileNavToggle: document.getElementById("mobileNavToggle"),
  sidebar: document.querySelector(".sidebar"),
  collapseListBtn: document.getElementById("collapseListBtn"),
  conversationPanel: document.getElementById("conversationPanel")
};

function getConversation(id) {
  return conversations.find(c => c.id === id) || null;
}

function formatType(type) {
  if (type === "project") return "Project Chat";
  if (type === "client") return "Client Chat";
  return "Team Chat";
}

function getFilteredConversations() {
  const q = state.search.trim().toLowerCase();

  return conversations.filter(conv => {
    if (state.filter === "archived" && !conv.archived) return false;
    if (state.filter !== "archived" && conv.archived) return false;

    if (state.filter === "unread" && conv.unread <= 0) return false;
    if (state.filter === "clients" && conv.type !== "client") return false;
    if (state.filter === "team" && conv.type !== "team") return false;
    if (state.filter === "projects" && conv.type !== "project") return false;

    if (!q) return true;

    const haystack = [
      conv.name,
      conv.projectName,
      conv.lastSender,
      conv.lastMessage,
      conv.participants.join(" ")
    ].join(" ").toLowerCase();

    return haystack.includes(q);
  });
}

function updateStats() {
  const unread = conversations.reduce((sum, c) => sum + c.unread, 0);
  const active = conversations.filter(c => !c.archived).length;
  const clientCount = conversations.filter(c => !c.archived && c.type === "client").length;
  const teamCount = conversations.filter(c => !c.archived && c.type === "team").length;

  els.statUnread.textContent = unread;
  els.statActiveConv.textContent = active;
  els.statClients.textContent = clientCount;
  els.statTeam.textContent = teamCount;
}

function renderConversationList() {
  const filtered = getFilteredConversations();

  els.conversationList.innerHTML = "";

  if (!filtered.length) {
    els.conversationList.innerHTML = `
      <div class="empty-state" style="position:static; min-height:260px;">
        <div class="empty-icon">⌁</div>
        <h3>No conversations found</h3>
        <p>Try another filter or search term.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(conv => {
    const item = document.createElement("article");
    item.className = `conversation-item ${conv.id === state.activeId ? "active" : ""}`;
    item.dataset.id = String(conv.id);

    item.innerHTML = `
      <div class="conv-main">
        <div class="conv-title-row">
          <h3 class="conv-name">${conv.name}</h3>
          <span class="conv-type">${conv.type}</span>
        </div>
        <p class="conv-sub">${conv.lastSender}</p>
        <p class="conv-preview">${conv.lastMessage}</p>
      </div>
      <div class="conv-meta">
        <span class="conv-time">${conv.timestamp}</span>
        <span class="badge ${conv.unread ? "" : "hidden"}">${conv.unread}</span>
        ${conv.archived ? `<span class="muted-tag">Archived</span>` : ""}
      </div>
    `;

    item.addEventListener("click", () => openConversation(conv.id, { markRead: true }));
    els.conversationList.appendChild(item);
  });
}

function renderAttachmentPreview() {
  const files = state.pendingAttachments;

  if (!files.length) {
    els.attachmentPreview.classList.add("hidden");
    els.attachmentPreview.innerHTML = "";
    return;
  }

  els.attachmentPreview.classList.remove("hidden");
  els.attachmentPreview.innerHTML = files.map((file, index) => `
    <div class="pending-attachment">
      <span class="file-dot"></span>
      <div>
        <div class="attachment-name">${file.name}</div>
        <div class="attachment-type">${file.type || "File"}</div>
      </div>
      <button class="remove" type="button" data-remove-index="${index}" aria-label="Remove attachment">×</button>
    </div>
  `).join("");

  els.attachmentPreview.querySelectorAll("[data-remove-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.removeIndex);
      state.pendingAttachments.splice(idx, 1);
      renderAttachmentPreview();
    });
  });
}

function scrollMessagesToBottom() {
  requestAnimationFrame(() => {
    els.messagesArea.scrollTop = els.messagesArea.scrollHeight;
  });
}

function renderMessages(conv) {
  els.messagesArea.innerHTML = conv.messages.map(msg => {
    const sideClass = msg.side === "right" ? "right" : "left";
    const attachments = (msg.attachments || []).map(name => `
      <div class="attachment-card">
        <span class="file-dot"></span>
        <div>
          <div class="attachment-name">${name}</div>
          <div class="attachment-type">Attachment</div>
        </div>
      </div>
    `).join("");

    return `
      <div class="message-row ${sideClass}">
        <div class="message ${sideClass}">
          <div class="message-header">
            <span class="message-sender">${msg.sender}</span>
            <span class="message-time">${msg.time}</span>
          </div>
          <div class="message-body">${msg.text}</div>
          ${attachments ? `<div class="message-attach">${attachments}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function openConversation(id, { markRead = false } = {}) {
  const conv = getConversation(id);
  if (!conv) return;

  state.activeId = id;
  conv.archived = false;

  if (markRead) {
    conv.unread = 0;
  }

  els.emptyState.classList.add("hidden");
  els.chatShell.classList.remove("hidden");

  els.chatTitle.textContent = conv.name;
  els.chatType.textContent = formatType(conv.type);
  els.chatParticipants.textContent = conv.participants.join(" · ");
  els.archiveBtn.textContent = conv.archived ? "Unarchive Chat" : "Archive Chat";

  renderMessages(conv);
  renderConversationList();
  updateStats();
  scrollMessagesToBottom();

  if (window.innerWidth <= 980) {
    els.conversationPanel.classList.add("hidden");
    els.chatPanel?.classList.add?.("full");
  }
}

function archiveActiveConversation() {
  const conv = getConversation(state.activeId);
  if (!conv) return;
  conv.archived = !conv.archived;
  renderConversationList();
  updateStats();

  if (conv.archived && state.filter !== "archived") {
    state.activeId = null;
    els.chatShell.classList.add("hidden");
    els.emptyState.classList.remove("hidden");
  } else {
    openConversation(conv.id, { markRead: false });
  }
}

function sendMessage() {
  const conv = getConversation(state.activeId);
  if (!conv) return;

  const text = els.messageInput.value.trim();
  const attachmentNames = state.pendingAttachments.map(f => f.name);

  if (!text && !attachmentNames.length) return;

  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  conv.messages.push({
    side: "right",
    sender: "Admin",
    time,
    text: text || "Shared an attachment.",
    attachments: attachmentNames
  });

  conv.lastSender = "Admin";
  conv.lastMessage = text || attachmentNames.join(", ");
  conv.timestamp = "Just now";
  conv.unread = 0;
  state.pendingAttachments = [];

  els.messageInput.value = "";
  renderAttachmentPreview();
  renderMessages(conv);
  renderConversationList();
  updateStats();
  scrollMessagesToBottom();
}

function applyFilter(filter) {
  state.filter = filter;
  [...els.filters.querySelectorAll(".pill")].forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  renderConversationList();
}

els.filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill");
  if (!btn) return;
  applyFilter(btn.dataset.filter);
});

els.searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  renderConversationList();
});

els.sendBtn.addEventListener("click", sendMessage);
els.archiveBtn.addEventListener("click", archiveActiveConversation);

els.messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

els.fileInput.addEventListener("change", (e) => {
  const selected = [...e.target.files || []].map(file => ({
    name: file.name,
    type: file.type || file.name.split(".").pop().toUpperCase()
  }));

  if (!selected.length) return;
  state.pendingAttachments.push(...selected);
  renderAttachmentPreview();
  e.target.value = "";
});

els.mobileNavToggle.addEventListener("click", () => {
  els.sidebar.classList.toggle("open");
});

els.collapseListBtn.addEventListener("click", () => {
  els.conversationPanel.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (window.innerWidth <= 980 && els.sidebar.classList.contains("open")) {
    const insideSidebar = e.target.closest(".sidebar");
    const isToggle = e.target.closest("#mobileNavToggle");
    if (!insideSidebar && !isToggle) {
      els.sidebar.classList.remove("open");
    }
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) {
    els.conversationPanel.classList.remove("hidden");
    els.sidebar.classList.remove("open");
  }
});

function init() {
  updateStats();
  renderConversationList();
  applyFilter("all");
  const firstVisible = getFilteredConversations()[0];
  if (firstVisible) openConversation(firstVisible.id, { markRead: false });
}

init();
