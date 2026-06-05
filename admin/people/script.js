'use strict';

const state = {
  activeTab: 'clients',
  filter: 'all',
  search: '',
  deleteTarget: null
};

const clients = [
  {
    id: 1,
    name: 'ABC Builders',
    username: 'abcbuilders',
    password: 'Temp@1234',
    phone: '+91 98765 43210',
    email: 'contact@abcbuilders.com',
    projects: 3,
    revenue: 450000,
    messages: 32,
    createdAt: '12 Jun 2026',
    status: 'Active',
    projectsList: [
  {
    id: 'ews-001',
    name: 'Luxury Villa Website',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-010',
    name: 'Portfolio Website',
    status: 'Past',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-011',
    name: 'Client Dashboard',
    status: 'Active',
    role: 'Frontend Developer'
  }
]
  },
  {
    id: 2,
    name: 'XYZ Foods',
    username: 'xyzfoods',
    password: 'Food@1234',
    phone: '+91 99887 66554',
    email: 'hello@xyzfoods.in',
    projects: 2,
    revenue: 210000,
    messages: 18,
    createdAt: '08 Jun 2026',
    status: 'Active',
    projectsList: [
  {
    id: 'ews-004',
    name: 'Restaurant Website',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-005',
    name: 'Menu Ordering Portal',
    status: 'Active',
    role: 'Frontend Developer'
  }
]
  },
  {
    id: 3,
    name: 'Nova Retail',
    username: 'novaretail',
    password: 'Nova@1234',
    phone: '+91 91234 56789',
    email: 'team@novaretail.co',
    projects: 1,
    revenue: 120000,
    messages: 9,
    createdAt: '25 May 2026',
    status: 'Inactive',
    projectsList: [
  {
    id: 'ews-001',
    name: 'Luxury Villa Website',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-010',
    name: 'Portfolio Website',
    status: 'Past',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-011',
    name: 'Client Dashboard',
    status: 'Active',
    role: 'Frontend Developer'
  }
]
  },
  {
    id: 4,
    name: 'Prime Dentals',
    username: 'primedentals',
    password: 'Prime@1234',
    phone: '+91 90000 11223',
    email: 'contact@primedentals.in',
    projects: 4,
    revenue: 680000,
    messages: 41,
    createdAt: '02 Jun 2026',
    status: 'Active',
    projectsList: [
  {
    id: 'ews-007',
    name: 'Clinic Booking Site',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-008',
    name: 'SEO Campaign',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-009',
    name: 'Landing Page Upgrade',
    status: 'Active',
    role: 'Frontend Developer'
  }
]
  }
];

const team = [
  {
    id: 1,
    name: 'Rahul',
    username: 'rahuldev',
    password: 'Rahul@1234',
    role: 'Frontend Developer',
    phone: '+91 88441 22334',
    email: 'rahul@elevatedweb.in',
    projects: 4,
    activeProjects: 3,
    messages: 25,
    createdAt: '02 Apr 2026',
    status: 'Active',
    projectsList: [
      {
        id: 'ews-001',
        name: 'Luxury Villa Website',
        status: 'Active',
        role: 'Frontend Developer'
      },
      {
        id: 'ews-010',
        name: 'Portfolio Website',
        status: 'Past',
        role: 'Frontend Developer'
      },
      {
        id: 'ews-011',
        name: 'Client Dashboard',
        status: 'Active',
        role: 'Frontend Developer'
      }
    ]
  },
  {
    id: 2,
    name: 'Akash',
    username: 'akashbuilds',
    password: 'Akash@1234',
    role: 'Backend Developer',
    phone: '+91 88772 33445',
    email: 'akash@elevatedweb.in',
    projects: 2,
    activeProjects: 2,
    messages: 14,
    createdAt: '18 Apr 2026',
    status: 'Active',
    projectsList: [
  {
    id: 'ews-001',
    name: 'Luxury Villa Website',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-010',
    name: 'Portfolio Website',
    status: 'Past',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-011',
    name: 'Client Dashboard',
    status: 'Active',
    role: 'Frontend Developer'
  }
]
  },
  {
    id: 3,
    name: 'Arjun',
    username: 'arjundesign',
    password: 'Arjun@1234',
    role: 'UI Designer',
    phone: '+91 99001 22334',
    email: 'arjun@elevatedweb.in',
    projects: 3,
    activeProjects: 2,
    messages: 19,
    createdAt: '12 May 2026',
    status: 'Active',
    projectsList: [
  {
    id: 'ews-001',
    name: 'Luxury Villa Website',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-010',
    name: 'Portfolio Website',
    status: 'Past',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-011',
    name: 'Client Dashboard',
    status: 'Active',
    role: 'Frontend Developer'
  }
]
  },
  {
    id: 4,
    name: 'Sarah',
    username: 'sarahseo',
    password: 'Sarah@1234',
    role: 'SEO Specialist',
    phone: '+91 99880 77665',
    email: 'sarah@elevatedweb.in',
    projects: 1,
    activeProjects: 1,
    messages: 8,
    createdAt: '22 May 2026',
    status: 'Inactive',
    projectsList: [
  {
    id: 'ews-001',
    name: 'Luxury Villa Website',
    status: 'Active',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-010',
    name: 'Portfolio Website',
    status: 'Past',
    role: 'Frontend Developer'
  },
  {
    id: 'ews-011',
    name: 'Client Dashboard',
    status: 'Active',
    role: 'Frontend Developer'
  }
]
  }
];

const els = {
  sidebar: document.getElementById('sidebar'),
  backdrop: document.getElementById('backdrop'),
  openSidebar: document.getElementById('openSidebar'),
  clientsCount: document.getElementById('clientsCount'),
  teamCount: document.getElementById('teamCount'),
  activeCount: document.getElementById('activeCount'),
  inactiveCount: document.getElementById('inactiveCount'),
  searchInput: document.getElementById('searchInput'),
  tabs: [...document.querySelectorAll('.tab')],
  segBtns: [...document.querySelectorAll('.seg-btn')],
  grid: document.getElementById('grid'),
  sectionKicker: document.getElementById('sectionKicker'),
  sectionTitle: document.getElementById('sectionTitle'),
  sectionNote: document.getElementById('sectionNote'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyText: document.getElementById('emptyText'),
  emptyActionBtn: document.getElementById('emptyActionBtn'),
  newClientBtn: document.getElementById('newClientBtn'),
  newTeamBtn: document.getElementById('newTeamBtn'),
  detailsModal: document.getElementById('detailsModal'),
  detailsEyebrow: document.getElementById('detailsEyebrow'),
  detailsTitle: document.getElementById('detailsTitle'),
  detailsBody: document.getElementById('detailsBody'),
  relatedTitle: document.getElementById('relatedTitle'),
  relatedList: document.getElementById('relatedList'),
  formModal: document.getElementById('formModal'),
  formEyebrow: document.getElementById('formEyebrow'),
  formTitle: document.getElementById('formTitle'),
  formMode: document.getElementById('formMode'),
  editId: document.getElementById('editId'),
  nameInput: document.getElementById('nameInput'),
  usernameInput: document.getElementById('usernameInput'),
  passwordInput: document.getElementById('passwordInput'),
  phoneInput: document.getElementById('phoneInput'),
  emailInput: document.getElementById('emailInput'),
  roleFieldWrap: document.getElementById('roleFieldWrap'),
  roleInput: document.getElementById('roleInput'),
  submitBtn: document.getElementById('submitBtn'),
  entityForm: document.getElementById('entityForm'),
  deleteModal: document.getElementById('deleteModal'),
  deleteEyebrow: document.getElementById('deleteEyebrow'),
  deleteTitle: document.getElementById('deleteTitle'),
  deleteMessage: document.getElementById('deleteMessage'),
  deleteWarning: document.getElementById('deleteWarning'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn')
};

function money(n) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function getCollection() {
  return state.activeTab === 'clients' ? clients : team;
}

function getFilteredItems() {
  return getCollection().filter(item => {
    const haystack = [
      item.name,
      item.username,
      item.role || '',
      item.status || '',
      ...(item.projectsList || []).map(p => p.name)
    ].join(' ').toLowerCase();

    const matchesSearch = haystack.includes(state.search.toLowerCase());
    const matchesFilter = state.filter === 'all' || item.status.toLowerCase() === state.filter;
    return matchesSearch && matchesFilter;
  });
}

function updateStats() {
  const activePeople = [...clients, ...team].filter(item => item.status === 'Active').length;
  const inactivePeople = [...clients, ...team].filter(item => item.status === 'Inactive').length;

  els.clientsCount.textContent = clients.length;
  els.teamCount.textContent = team.length;
  els.activeCount.textContent = activePeople;
  els.inactiveCount.textContent = inactivePeople;
}

function syncHeaderAndTabs() {
  const isClients = state.activeTab === 'clients';

  els.sectionKicker.textContent = isClients ? 'Clients' : 'Team';
  els.sectionTitle.textContent = isClients ? 'Client Directory' : 'Team Directory';
  els.sectionNote.textContent = isClients
    ? 'View and manage every client linked to projects.'
    : 'Track team members assigned across client work.';
  els.emptyTitle.textContent = isClients ? 'No Clients Yet' : 'No Team Members Yet';
  els.emptyText.textContent = isClients
    ? 'Create your first client to start assigning projects.'
    : 'Add your first team member to begin building the team.';
  els.emptyActionBtn.textContent = isClients ? 'Create Client' : 'Add Member';
  els.formEyebrow.textContent = isClients ? 'New Client' : 'New Team Member';
  els.formTitle.textContent = isClients ? 'Create Client' : 'Add Team Member';
  els.submitBtn.textContent = isClients ? 'Create Client' : 'Add Member';
  els.roleFieldWrap.style.display = isClients ? 'none' : 'block';

  els.tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === state.activeTab));
}

function renderCards() {
  const items = getFilteredItems();
  els.grid.innerHTML = '';

  if (!items.length) {
    els.emptyState.classList.remove('hidden');
    return;
  }

  els.emptyState.classList.add('hidden');

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';

    const secondaryLabel = state.activeTab === 'clients' ? 'Revenue' : 'Projects';
    const secondaryValue = state.activeTab === 'clients' ? money(item.revenue) : item.projects;

    card.innerHTML = `
      <div>
        <div class="card-top">
          <div>
            <h3 class="card-name">${item.name}</h3>
            <p class="card-username">@${item.username}</p>
          </div>
          <span class="badge ${item.status.toLowerCase()}">${item.status}</span>
        </div>

        <div class="card-stats">
          <div class="kv">
            <span>${state.activeTab === 'clients' ? 'Projects' : 'Role'}</span>
            <strong>${state.activeTab === 'clients' ? item.projects : item.role}</strong>
          </div>
          <div class="kv">
            <span>${secondaryLabel}</span>
            <strong>${secondaryValue}</strong>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <button class="pill-btn" data-action="view" type="button">View</button>
        <button class="pill-btn" data-action="edit" type="button">Edit</button>
        <button class="pill-btn" data-action="delete" type="button">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="view"]').addEventListener('click', () => openDetails(item.id));
    card.querySelector('[data-action="edit"]').addEventListener('click', () => openForm('edit', item.id));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => openDelete(item.id));

    els.grid.appendChild(card);
  });
}

function render() {
  updateStats();
  syncHeaderAndTabs();
  renderCards();
}

function openModal(modalEl) {
  modalEl.classList.remove('hidden');
}

function closeModal(modalEl) {
  modalEl.classList.add('hidden');
}

function renderProjects(projects, filter = 'all') {

  let filtered = projects || [];

  if (filter !== 'all') {
    filtered = filtered.filter(
      project =>
        project.status.toLowerCase() === filter
    );
  }

  return `
    <div class="project-list">

      ${filtered.map(project => `

        <div class="project-row">

          <div class="project-info">

            <h5>${project.name}</h5>

            <div class="project-meta">
              ${project.role || ''}
              •
              ${project.status}
            </div>

          </div>

          <a
            href="../project-workspace/index.html?id=${project.id}"
            class="project-open"
          >
            Open →
          </a>

        </div>

      `).join('')}

    </div>
  `;
}

function openDetails(id) {
  const item = getCollection().find(x => x.id === id);
  if (!item) return;

  const isClient = state.activeTab === 'clients';
  els.detailsEyebrow.textContent = isClient ? 'Client Details' : 'Team Details';
  els.detailsTitle.textContent = item.name;
  els.relatedTitle.textContent = isClient ? 'Recent Projects' : 'Projects';

  const details = isClient ? [
    ['Username', item.username],
    ['Temporary Password', item.password],
    ['Projects', item.projects],
    ['Revenue Generated', money(item.revenue)],
    ['Messages Sent', item.messages],
    ['Created Date', item.createdAt],
    ['Phone Number', item.phone],
    ['Email', item.email]
  ] : [
    ['Username', item.username],
    ['Temporary Password', item.password],
    ['Role', item.role],
    ['Assigned Projects', item.projects],
    ['Current Workload', `${item.activeProjects ?? item.projects ?? 0} Active Projects`],
    ['Messages Sent', item.messages],
    ['Date Added', item.createdAt],
    ['Phone Number', item.phone],
    ['Email', item.email]
  ];

  els.detailsBody.innerHTML = details.map(([label, value]) => `
    <div class="detail-item">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>
  `).join('');

  els.relatedList.innerHTML =
renderProjects(item.projectsList, 'all');

  openModal(els.detailsModal);
}

function openForm(mode, id = null) {
  const isClient = state.activeTab === 'clients';

  els.formMode.value = isClient ? 'client' : 'team';
  els.editId.value = id ?? '';

  if (mode === 'create') {
    els.nameInput.value = '';
    els.usernameInput.value = '';
    els.passwordInput.value = '';
    els.phoneInput.value = '';
    els.emailInput.value = '';
    els.roleInput.value = 'Frontend Developer';
    els.formEyebrow.textContent = isClient ? 'New Client' : 'New Team Member';
    els.formTitle.textContent = isClient ? 'Create Client' : 'Add Team Member';
    els.submitBtn.textContent = isClient ? 'Create Client' : 'Add Member';
  } else {
    const item = getCollection().find(x => x.id === id);
    if (!item) return;

    els.nameInput.value = item.name;
    els.usernameInput.value = item.username;
    els.passwordInput.value = item.password;
    els.phoneInput.value = item.phone;
    els.emailInput.value = item.email;
    els.roleInput.value = item.role || 'Frontend Developer';
    els.formEyebrow.textContent = isClient ? 'Edit Client' : 'Edit Team Member';
    els.formTitle.textContent = isClient ? 'Edit Client' : 'Edit Team Member';
    els.submitBtn.textContent = isClient ? 'Save Client' : 'Save Member';
  }

  openModal(els.formModal);
}

function openDelete(id) {
  state.deleteTarget = id;
  const item = getCollection().find(x => x.id === id);
  if (!item) return;

  const isClient = state.activeTab === 'clients';
  els.deleteEyebrow.textContent = isClient ? 'Delete Client' : 'Delete Team Member';
  els.deleteTitle.textContent = `${isClient ? 'Delete' : 'Remove'} ${item.name}?`;
  els.deleteMessage.textContent = isClient
    ? 'This action cannot be undone.'
    : 'Projects will remain unchanged.';
  els.deleteWarning.textContent = isClient
    ? `This client is assigned to ${item.projects} project${item.projects === 1 ? '' : 's'}.`
    : `This member is assigned to ${item.projects} project${item.projects === 1 ? '' : 's'}.`;

  openModal(els.deleteModal);
}

function submitForm(event) {
  event.preventDefault();

  const isClient = state.activeTab === 'clients';
  const id = els.editId.value ? Number(els.editId.value) : null;

  if (isClient) {
    const existing = id ? clients.find(x => x.id === id) : null;
    const payload = {
      name: els.nameInput.value.trim(),
      username: els.usernameInput.value.trim(),
      password: els.passwordInput.value.trim(),
      phone: els.phoneInput.value.trim(),
      email: els.emailInput.value.trim(),
      status: existing?.status || 'Active',
      projects: existing?.projects ?? 0,
      revenue: existing?.revenue ?? 0,
      messages: existing?.messages ?? 0,
      createdAt: existing?.createdAt ?? 'Today',
      projectsList: existing?.projectsList ?? []
    };

    if (id) {
      const index = clients.findIndex(x => x.id === id);
      clients[index] = { ...clients[index], ...payload };
    } else {
      clients.unshift({
        id: Date.now(),
        ...payload
      });
    }
  } else {
    const existing = id ? team.find(x => x.id === id) : null;
    const payload = {
      name: els.nameInput.value.trim(),
      username: els.usernameInput.value.trim(),
      password: els.passwordInput.value.trim(),
      phone: els.phoneInput.value.trim(),
      email: els.emailInput.value.trim(),
      role: els.roleInput.value,
      status: existing?.status || 'Active',
      projects: existing?.projects ?? 0,
      activeProjects: existing?.activeProjects ?? existing?.projects ?? 0,
      messages: existing?.messages ?? 0,
      createdAt: existing?.createdAt ?? 'Today',
      projectsList: existing?.projectsList ?? []
    };

    if (id) {
      const index = team.findIndex(x => x.id === id);
      team[index] = { ...team[index], ...payload };
    } else {
      team.unshift({
        id: Date.now(),
        ...payload
      });
    }
  }

  closeModal(els.formModal);
  render();
}

function confirmDelete() {
  const isClient = state.activeTab === 'clients';

  if (isClient) {
    const index = clients.findIndex(x => x.id === state.deleteTarget);
    if (index !== -1) clients.splice(index, 1);
  } else {
    const index = team.findIndex(x => x.id === state.deleteTarget);
    if (index !== -1) team.splice(index, 1);
  }

  closeModal(els.deleteModal);
  render();
}

function setSidebar(open) {
  els.sidebar.classList.toggle('open', open);
  els.backdrop.hidden = !open;
}

function setupEvents() {
  els.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      state.filter = 'all';
      els.segBtns.forEach(seg => seg.classList.toggle('active', seg.dataset.filter === 'all'));
      render();
    });
  });

  els.segBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      els.segBtns.forEach(seg => seg.classList.toggle('active', seg === btn));
      renderCards();
    });
  });

  els.searchInput.addEventListener('input', e => {
    state.search = e.target.value.trim();
    renderCards();
  });

  els.newClientBtn.addEventListener('click', () => {
    state.activeTab = 'clients';
    state.filter = 'all';
    els.segBtns.forEach(seg => seg.classList.toggle('active', seg.dataset.filter === 'all'));
    render();
    openForm('create');
  });

  els.newTeamBtn.addEventListener('click', () => {
    state.activeTab = 'team';
    state.filter = 'all';
    els.segBtns.forEach(seg => seg.classList.toggle('active', seg.dataset.filter === 'all'));
    render();
    openForm('create');
  });

  els.emptyActionBtn.addEventListener('click', () => openForm('create'));

  els.entityForm.addEventListener('submit', submitForm);
  els.confirmDeleteBtn.addEventListener('click', confirmDelete);

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.close;
      if (target === 'detailsModal') closeModal(els.detailsModal);
      if (target === 'formModal') closeModal(els.formModal);
      if (target === 'deleteModal') closeModal(els.deleteModal);
    });
  });

  [els.detailsModal, els.formModal, els.deleteModal].forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  els.openSidebar.addEventListener('click', () => setSidebar(true));
  els.backdrop.addEventListener('click', () => {
    setSidebar(false);
    closeModal(els.detailsModal);
    closeModal(els.formModal);
    closeModal(els.deleteModal);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setSidebar(false);
      closeModal(els.detailsModal);
      closeModal(els.formModal);
      closeModal(els.deleteModal);
    }
  });


  document.addEventListener('click', e => {

  const btn =
    e.target.closest('.project-filter');

  if (!btn) return;

  document
    .querySelectorAll('.project-filter')
    .forEach(filter =>
      filter.classList.remove('active')
    );

  btn.classList.add('active');

  const item =
    getCollection().find(
      x => x.name === els.detailsTitle.textContent
    );

  if (!item) return;

  els.relatedList.innerHTML =
    renderProjects(
      item.projectsList,
      btn.dataset.projectFilter
    );

});
}

setupEvents();
render();
