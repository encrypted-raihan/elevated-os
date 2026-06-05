'use strict';

const conversations = [
  {
    id: 1,
    type: 'project',
    name: 'Luxury Villa Website',
    projectName: 'Luxury Villa Website',
    participants: ['ABC Builders', 'Rahul', 'Akash'],
    lastSender: 'ABC Builders',
    preview: 'Can we make the hero section larger and move the CTA above the fold?',
    time: '2m ago',
    unread: 3,
    archived: false,
    messages: [
      {
        side: 'left',
        sender: 'ABC Builders',
        time: '10:32 AM',
        text: 'Can we make the hero section larger and move the CTA above the fold?',
        attachments: []
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '10:35 AM',
        text: 'Yes, we will push the revision today and keep the spacing balanced.',
        attachments: []
      },
      {
        side: 'left',
        sender: 'Rahul',
        time: '10:41 AM',
        text: 'Homepage changes completed and ready for review.',
        attachments: ['Brand Guidelines.pdf']
      }
    ]
  },
  {
    id: 2,
    type: 'project',
    name: 'Restaurant Website',
    projectName: 'Restaurant Website',
    participants: ['XYZ Foods', 'Akash'],
    lastSender: 'XYZ Foods',
    preview: 'We have uploaded the menu files and updated the brand notes.',
    time: '15m ago',
    unread: 0,
    archived: false,
    messages: [
      {
        side: 'left',
        sender: 'XYZ Foods',
        time: '9:58 AM',
        text: 'We have uploaded the menu files and updated the brand notes.',
        attachments: []
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '10:04 AM',
        text: 'Perfect. I will align the palette and spacing to the new notes.',
        attachments: ['menu-assets.zip']
      }
    ]
  },
  {
    id: 3,
    type: 'project',
    name: 'Ecommerce Store',
    projectName: 'Ecommerce Store',
    participants: ['Nova Retail', 'Rahul', 'Sam'],
    lastSender: 'Nova Retail',
    preview: 'The checkout flow looks good. Please share the mobile preview.',
    time: '1h ago',
    unread: 2,
    archived: false,
    messages: [
      {
        side: 'left',
        sender: 'Nova Retail',
        time: '9:12 AM',
        text: 'The checkout flow looks good. Please share the mobile preview.',
        attachments: []
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '9:19 AM',
        text: 'Yes, the revised mobile preview is ready and I will send it shortly.',
        attachments: ['mobile-mockup.png']
      }
    ]
  },
  {
    id: 4,
    type: 'client',
    name: 'ABC Builders',
    projectName: 'Client Conversation',
    participants: ['ABC Builders', 'Admin'],
    lastSender: 'ABC Builders',
    preview: 'Please share the latest estimate and any timeline changes.',
    time: '1h ago',
    unread: 1,
    archived: false,
    messages: [
      {
        side: 'left',
        sender: 'ABC Builders',
        time: '9:05 AM',
        text: 'Please share the latest estimate and any timeline changes.',
        attachments: []
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '9:11 AM',
        text: 'Shared in the project update file. I will resend it here as well.',
        attachments: ['estimate.pdf']
      }
    ]
  },
  {
    id: 5,
    type: 'client',
    name: 'Prime Dentals',
    projectName: 'SEO Campaign',
    participants: ['Prime Dentals', 'Admin'],
    lastSender: 'Prime Dentals',
    preview: 'Please send the latest ranking report before this evening.',
    time: '3h ago',
    unread: 0,
    archived: false,
    messages: [
      {
        side: 'left',
        sender: 'Prime Dentals',
        time: '8:20 AM',
        text: 'Please send the latest ranking report before this evening.',
        attachments: []
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '8:28 AM',
        text: 'I will share the report after final verification.',
        attachments: []
      }
    ]
  },
  {
    id: 6,
    type: 'team',
    name: 'Rahul',
    projectName: 'Internal Team',
    participants: ['Admin', 'Rahul'],
    lastSender: 'Rahul',
    preview: 'Homepage changes completed and ready for review.',
    time: '15m ago',
    unread: 4,
    archived: false,
    messages: [
      {
        side: 'left',
        sender: 'Rahul',
        time: '10:14 AM',
        text: 'Homepage changes completed and ready for review.',
        attachments: ['homepage-v3.png']
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '10:18 AM',
        text: 'Perfect. Send it to the client channel after I approve it.',
        attachments: []
      }
    ]
  },
  {
    id: 7,
    type: 'team',
    name: 'Akash',
    projectName: 'Internal Team',
    participants: ['Admin', 'Akash'],
    lastSender: 'Admin',
    preview: 'Please finalize the responsive spacing before deployment.',
    time: '58m ago',
    unread: 0,
    archived: false,
    messages: [
      {
        side: 'left',
        sender: 'Akash',
        time: '9:40 AM',
        text: 'I have fixed the banner layout on tablet screens.',
        attachments: []
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '9:45 AM',
        text: 'Please finalize the responsive spacing before deployment.',
        attachments: []
      }
    ]
  },
  {
    id: 8,
    type: 'client',
    name: 'Nova Retail',
    projectName: 'Ecommerce Store',
    participants: ['Nova Retail', 'Admin'],
    lastSender: 'Nova Retail',
    preview: 'Can we add a wishlist icon in the header without cluttering it?',
    time: '3h ago',
    unread: 0,
    archived: true,
    messages: [
      {
        side: 'left',
        sender: 'Nova Retail',
        time: '6:01 PM',
        text: 'Can we add a wishlist icon in the header without cluttering it?',
        attachments: []
      },
      {
        side: 'right',
        sender: 'Admin',
        time: '6:08 PM',
        text: 'Yes, we can add it without affecting the layout.',
        attachments: []
      }
    ]
  }
];

const state = {
  filter: 'all',
  search: '',
  activeId: null,
  pendingAttachments: []
};

const els = {
  sidebar: document.getElementById('sidebar'),
  backdrop: document.getElementById('backdrop'),
  openSidebar: document.getElementById('openSidebar'),
  backBtn: document.getElementById('backBtn'),
  backToListTop: document.getElementById('backToListTop'),
  conversationView: document.getElementById('conversationView'),
  chatView: document.getElementById('chatView'),
  conversationList: document.getElementById('conversationList'),
  searchInput: document.getElementById('searchInput'),
  filterBar: document.getElementById('filterBar'),
  activeFilterLabel: document.getElementById('activeFilterLabel'),
  countLabel: document.getElementById('countLabel'),
  chatTitle: document.getElementById('chatTitle'),
  chatBadge: document.getElementById('chatBadge'),
  chatParticipants: document.getElementById('chatParticipants'),
  messagesArea: document.getElementById('messagesArea'),
  archiveBtn: document.getElementById('archiveBtn'),
  fileInput: document.getElementById('fileInput'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  attachmentPreview: document.getElementById('attachmentPreview')
};

function getConversation(id) {
  return conversations.find(conv => conv.id === id) || null;
}

function formatType(type) {
  if (type === 'project') return 'Project Chat';
  if (type === 'client') return 'Client Chat';
  return 'Team Chat';
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  if (!parts.length) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function filterLabel(filter) {
  return {
    all: 'All',
    unread: 'Unread',
    clients: 'Clients',
    team: 'Team',
    projects: 'Projects',
    archived: 'Archived'
  }[filter] || 'All';
}

function showConversationList() {
  els.conversationView.classList.remove('hidden');
  els.chatView.classList.add('hidden');
  els.backToListTop.hidden = true;
}

function showChatView() {
  els.conversationView.classList.add('hidden');
  els.chatView.classList.remove('hidden');
  els.backToListTop.hidden = false;
}

function getFilteredConversations() {
  const q = state.search.trim().toLowerCase();

  return conversations.filter(conv => {
    if (state.filter === 'archived' && !conv.archived) return false;
    if (state.filter !== 'archived' && conv.archived) return false;

    if (state.filter === 'unread' && conv.unread <= 0) return false;
    if (state.filter === 'clients' && conv.type !== 'client') return false;
    if (state.filter === 'team' && conv.type !== 'team') return false;
    if (state.filter === 'projects' && conv.type !== 'project') return false;

    if (!q) return true;

    const haystack = [
      conv.name,
      conv.projectName,
      conv.lastSender,
      conv.preview,
      conv.participants.join(' ')
    ].join(' ').toLowerCase();

    return haystack.includes(q);
  });
}

function renderConversationList() {
  const filtered = getFilteredConversations();
  els.conversationList.innerHTML = '';

  if (!filtered.length) {
    els.conversationList.innerHTML = `
      <div class="empty-card">
        <div class="empty-illustration">⌁</div>
        <h4>No conversations found</h4>
        <p>Try a different filter or search term.</p>
      </div>
    `;
    els.countLabel.textContent = '0 chats';
    return;
  }

  els.countLabel.textContent = `${filtered.length} chat${filtered.length === 1 ? '' : 's'}`;

  filtered.forEach(conv => {
    const card = document.createElement('article');
    card.className = `conversation-card ${conv.id === state.activeId ? 'active' : ''}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${conv.name}`);

    card.innerHTML = `
      <div class="avatar" aria-hidden="true">${initials(conv.name)}</div>
      <div class="card-body">
        <div class="card-top">
          <h4 class="card-name">${conv.name}</h4>
          <span class="card-type">${conv.type}</span>
        </div>
        <div class="card-meta">${conv.lastSender}</div>
        <p class="card-preview">${conv.preview}</p>
        <div class="card-bottom">
          <span class="card-time">${conv.time}</span>
          <span class="unread-badge ${conv.unread ? '' : 'hidden'}">${conv.unread}</span>
        </div>
      </div>
    `;

    const open = () => openConversation(conv.id, { markRead: true });

    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });

    els.conversationList.appendChild(card);
  });
}

function renderAttachments(list) {
  if (!list.length) {
    els.attachmentPreview.classList.add('hidden');
    els.attachmentPreview.innerHTML = '';
    return;
  }

  els.attachmentPreview.classList.remove('hidden');
  els.attachmentPreview.innerHTML = list.map((file, index) => `
    <div class="pending-attachment">
      <span class="file-dot"></span>
      <div>
        <div class="attachment-name">${file.name}</div>
        <div class="attachment-type">${file.type}</div>
      </div>
      <button class="remove" type="button" data-remove-index="${index}" aria-label="Remove attachment">×</button>
    </div>
  `).join('');

  els.attachmentPreview.querySelectorAll('[data-remove-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.removeIndex);
      state.pendingAttachments.splice(idx, 1);
      renderAttachments(state.pendingAttachments);
    });
  });
}

function renderMessages(conv) {
  els.messagesArea.innerHTML = conv.messages.map(msg => {
    const attachments = (msg.attachments || []).map(name => `
      <div class="attachment-card">
        <span class="file-dot"></span>
        <div>
          <div class="attachment-name">${name}</div>
          <div class="attachment-type">Attachment</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="message-row ${msg.side}">
        <div class="message-bubble">
          <div class="message-head">
            <span class="message-sender">${msg.sender}</span>
            <span class="message-time">${msg.time}</span>
          </div>
          <div class="message-text">${msg.text}</div>
          ${attachments ? `<div class="attachments">${attachments}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  requestAnimationFrame(() => {
    els.messagesArea.scrollTop = els.messagesArea.scrollHeight;
  });
}

function openConversation(id, { markRead = false } = {}) {
  const conv = getConversation(id);
  if (!conv) return;

  state.activeId = id;

  if (markRead) {
    conv.unread = 0;
  }

  els.chatTitle.textContent = conv.name;
  els.chatBadge.textContent = formatType(conv.type);
  els.chatParticipants.textContent = conv.participants.join(' • ');
  els.archiveBtn.textContent = conv.archived ? 'Unarchive Chat' : 'Archive Chat';

  renderMessages(conv);
  renderConversationList();
  showChatView();
}

function toggleArchive() {
  const conv = getConversation(state.activeId);
  if (!conv) return;

  conv.archived = !conv.archived;

  if (state.filter !== 'archived' && conv.archived) {
    state.activeId = null;
    renderConversationList();
    els.chatTitle.textContent = 'Select a conversation';
    els.chatBadge.textContent = 'Project Chat';
    els.chatParticipants.textContent = 'Choose a conversation from the left to begin messaging.';
    els.messagesArea.innerHTML = '';
    showConversationList();
  } else {
    openConversation(conv.id, { markRead: false });
  }

  renderConversationList();
}

function autosizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

function sendMessage() {
  const conv = getConversation(state.activeId);
  if (!conv) return;

  const text = els.messageInput.value.trim();
  const attachments = state.pendingAttachments.map(file => file.name);

  if (!text && !attachments.length) return;

  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  conv.messages.push({
    side: 'right',
    sender: 'Admin',
    time,
    text: text || 'Shared attachments.',
    attachments
  });

  conv.lastSender = 'Admin';
  conv.preview = text || attachments.join(', ');
  conv.time = 'Just now';
  conv.unread = 0;
  state.pendingAttachments = [];

  els.messageInput.value = '';
  autosizeTextarea(els.messageInput);
  renderAttachments([]);
  renderMessages(conv);
  renderConversationList();
}

function applyFilter(filter) {
  state.filter = filter;
  els.activeFilterLabel.textContent = filterLabel(filter);

  [...els.filterBar.querySelectorAll('.filter-pill')].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  renderConversationList();
}

els.filterBar.addEventListener('click', (event) => {
  const btn = event.target.closest('.filter-pill');
  if (!btn) return;
  applyFilter(btn.dataset.filter);
});

els.searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderConversationList();
});

els.backBtn.addEventListener('click', showConversationList);
els.backToListTop.addEventListener('click', showConversationList);
els.archiveBtn.addEventListener('click', toggleArchive);

els.fileInput.addEventListener('change', (event) => {
  const selected = [...(event.target.files || [])].map(file => ({
    name: file.name,
    type: file.type || file.name.split('.').pop().toUpperCase()
  }));

  if (selected.length) {
    state.pendingAttachments.push(...selected);
    renderAttachments(state.pendingAttachments);
  }

  event.target.value = '';
});

els.messageInput.addEventListener('input', (event) => autosizeTextarea(event.target));

els.messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

els.sendBtn.addEventListener('click', sendMessage);

els.openSidebar.addEventListener('click', () => {
  els.sidebar.classList.add('open');
  els.backdrop.hidden = false;
});

els.backdrop.addEventListener('click', () => {
  els.sidebar.classList.remove('open');
  els.backdrop.hidden = true;
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.sidebar') && !event.target.closest('#openSidebar')) {
    els.sidebar.classList.remove('open');
    els.backdrop.hidden = true;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    els.sidebar.classList.remove('open');
    els.backdrop.hidden = true;
  }
});

function init() {
  renderConversationList();
  applyFilter('all');
  showConversationList();
}

init();
