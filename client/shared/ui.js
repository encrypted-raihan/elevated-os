export const data = {
  notifications: [
    { title: "Project approved", text: "Client confirmed the latest UI direction.", time: "2m ago", unread: true },
    { title: "Invoice overdue", text: "A payment reminder is pending for PR-02.", time: "1h ago", unread: false },
    { title: "New message", text: "Sara shared homepage copy updates.", time: "3h ago", unread: true },
  ],
  people: [
    { name: "Raihan", role: "Admin", initials: "R" },
    { name: "Ayaan", role: "Developer", initials: "A" },
    { name: "Mira", role: "Client", initials: "M" },
  ],
};

export function setupShell() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const openSidebarBtn = document.getElementById("openSidebar");
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationDropdown = document.getElementById("notificationDropdown");

  if (openSidebarBtn && sidebar && backdrop) {
    openSidebarBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
      backdrop.hidden = false;
    });
  }

  if (backdrop && sidebar) {
    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      backdrop.hidden = true;
      if (notificationDropdown) {
        notificationDropdown.hidden = true;
        notificationBtn?.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      sidebar?.classList.remove("open");
      if (backdrop) backdrop.hidden = true;
      if (notificationDropdown) {
        notificationDropdown.hidden = true;
        notificationBtn?.setAttribute("aria-expanded", "false");
      }
    }
  });

  if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = notificationDropdown.hidden;
      notificationDropdown.hidden = !open;
      notificationBtn.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", (event) => {
      if (!notificationDropdown.hidden && !event.target.closest(".notification-wrap")) {
        notificationDropdown.hidden = true;
        notificationBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar?.classList.remove("open");
      if (backdrop) backdrop.hidden = true;
    });
  });
}

export function renderNotificationDropdown() {
  const dropdown = document.getElementById("notificationList");
  const count = document.getElementById("notificationCount");
  if (!dropdown || !count) return;

  const unread = data.notifications.filter((n) => n.unread).length;
  count.textContent = String(unread);

  dropdown.innerHTML = data.notifications.map((item) => `
    <div class="dropdown-item" style="opacity:${item.unread ? 1 : .72}">
      <strong>${item.title}</strong>
      <span>${item.text}</span>
      <span>${item.time}</span>
    </div>
  `).join("");
}

export function setActiveNav(page) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  const active = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (active) active.classList.add("active");
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}