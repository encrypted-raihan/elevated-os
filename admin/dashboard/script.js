const projects = [
  {
    name: "Luxury Villa Website",
    client: "ABC Builders",
    progress: 72,
    phase: "Development",
    due: "15 Jul 2026"
  },
  {
    name: "Restaurant Website",
    client: "XYZ Foods",
    progress: 48,
    phase: "Content Integration",
    due: "21 Jul 2026"
  },
  {
    name: "Ecommerce Store",
    client: "Nova Retail",
    progress: 83,
    phase: "Testing",
    due: "29 Jul 2026"
  },
  {
    name: "SEO Campaign",
    client: "Prime Dentals",
    progress: 61,
    phase: "Optimization",
    due: "05 Aug 2026"
  },
  {
    name: "Law Firm Portfolio",
    client: "Justice & Co.",
    progress: 36,
    phase: "Planning",
    due: "11 Aug 2026"
  },
  {
    name: "Real Estate CRM",
    client: "Sunrise Properties",
    progress: 54,
    phase: "Development",
    due: "18 Aug 2026"
  }
];

const messages = [
  {
    project: "Luxury Villa Website",
    sender: "ABC Builders",
    preview: "Can we change the hero section and make the contact button more prominent?",
    time: "2m ago"
  },
  {
    project: "Restaurant Website",
    sender: "XYZ Foods",
    preview: "We have uploaded the menu files and updated the brand notes.",
    time: "15m ago"
  },
  {
    project: "Ecommerce Store",
    sender: "Nova Retail",
    preview: "The checkout flow looks good. Please share the mobile preview.",
    time: "1h ago"
  },
  {
    project: "SEO Campaign",
    sender: "Prime Dentals",
    preview: "Please send the latest ranking report before today evening.",
    time: "3h ago"
  }
];

const notifications = [
  "Client approved Homepage Design",
  "Invoice INV-EWS001-02 marked paid",
  "New message in Luxury Villa Website"
];

const activity = [
  {
    title: "Homepage Design Approved",
    text: "ABC Builders approved the first version of the hero section.",
    time: "09:32 AM"
  },
  {
    title: "Invoice Marked Paid",
    text: "Invoice INV-EWS001-02 was marked as paid and synced locally.",
    time: "08:15 AM"
  },
  {
    title: "New Project Created",
    text: "Luxury Villa Website was added to the active portfolio.",
    time: "Yesterday"
  },
  {
    title: "New Message Received",
    text: "A new message arrived in Restaurant Website.",
    time: "2 Days Ago"
  }
];

const projectsTable = document.getElementById("projectsTable");
const messageList = document.getElementById("messageList");
const activityList = document.getElementById("activityList");
const notificationList = document.getElementById("notificationList");
const notificationBtn = document.getElementById("notificationBtn");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationCount = document.getElementById("notificationCount");
const openSidebarBtn = document.getElementById("openSidebar");
const closeSidebarBtn = document.getElementById("closeSidebar");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");

function projectRow(project) {
  const row = document.createElement("div");
  row.className = "project-row";
  row.tabIndex = 0;
  row.setAttribute("role", "link");
  row.setAttribute("aria-label", `Open ${project.name}`);

  row.innerHTML = `
    <div class="project-name">${project.name}</div>
    <div class="project-client">${project.client}</div>
    <div class="project-progress">
      <div class="progress-wrap">
        <span>${project.progress}%</span>
        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" style="width:${project.progress}%"></div>
        </div>
      </div>
    </div>
    <div class="project-phase">${project.phase}</div>
    <div class="project-due">${project.due}</div>
    <div class="project-link" aria-hidden="true">↗</div>
  `;

  const go = () => {
    window.location.href = "../project-workspace/index.html";
  };

  row.addEventListener("click", go);
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      go();
    }
  });

  return row;
}

function messageItem(message) {
  const item = document.createElement("article");
  item.className = "message-item";
  item.innerHTML = `
    <div class="message-top">
      <div>
        <div class="message-project">${message.project}</div>
        <div class="message-sender">${message.sender}</div>
      </div>
      <div class="message-time">${message.time}</div>
    </div>
    <p class="message-preview">${message.preview}</p>
  `;
  return item;
}

function activityItem(entry) {
  const item = document.createElement("article");
  item.className = "activity-item";
  item.innerHTML = `
    <span class="activity-marker" aria-hidden="true"></span>
    <div class="activity-meta">
      <div class="activity-top">
        <div class="activity-title">${entry.title}</div>
        <div class="activity-time">${entry.time}</div>
      </div>
      <div class="activity-text">${entry.text}</div>
    </div>
  `;
  return item;
}

function notificationItem(text) {
  const item = document.createElement("div");
  item.className = "dropdown-item";
  item.innerHTML = `<strong>${text}</strong><span>Just now</span>`;
  return item;
}

function drawRevenueChart() {
  const line = document.getElementById("chartLine");
  const area = document.getElementById("chartArea");

  if (!line || !area) return;

  const values = [40, 75, 52, 88, 60, 86];
  const width = 340;
  const height = 160;
  const padding = 16;
  const maxValue = 100;
  const step = (width - padding * 2) / (values.length - 1);

  const points = values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / maxValue) * (height - padding * 2);
    return [x, y];
  });

  const linePath = "M " + points.map(([x, y]) => `${x} ${y}`).join(" L ");
  const areaPath = `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  line.setAttribute("d", linePath);
  area.setAttribute("d", areaPath);
}

function setSidebar(open) {
  sidebar.classList.toggle("open", open);
  backdrop.hidden = !open;
}

projectsTable.innerHTML = "";
const header = document.createElement("div");
header.className = "project-head-row";
header.innerHTML = `
  <div>Project</div>
  <div>Client</div>
  <div>Progress</div>
  <div>Phase</div>
  <div>Due Date</div>
  <div></div>
`;
projectsTable.appendChild(header);

projects.forEach((project) => {
  projectsTable.appendChild(projectRow(project));
});

messageList.innerHTML = "";
messages.forEach((message) => messageList.appendChild(messageItem(message)));

activityList.innerHTML = "";
activity.forEach((entry) => activityList.appendChild(activityItem(entry)));

notificationList.innerHTML = "";
notifications.forEach((note) => notificationList.appendChild(notificationItem(note)));
notificationCount.textContent = notifications.length;

drawRevenueChart();

notificationBtn.addEventListener("click", () => {
  const isOpen = !notificationDropdown.hidden;
  notificationDropdown.hidden = isOpen;
  notificationBtn.setAttribute("aria-expanded", String(!isOpen));
});

openSidebarBtn.addEventListener("click", () => setSidebar(true));
closeSidebarBtn.addEventListener("click", () => setSidebar(false));
backdrop.addEventListener("click", () => {
  setSidebar(false);
  notificationDropdown.hidden = true;
  notificationBtn.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (event) => {
  if (!notificationDropdown.hidden && !event.target.closest(".notification-wrap")) {
    notificationDropdown.hidden = true;
    notificationBtn.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSidebar(false);
    notificationDropdown.hidden = true;
    notificationBtn.setAttribute("aria-expanded", "false");
  }
});