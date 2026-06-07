"use strict";

/*
==================================================
ELEVATED OS — ADMIN DASHBOARD
Supabase-powered dashboard with no hardcoded demo data
==================================================
*/

(() => {
  const db = window.supabaseClient;

  if (!db) {
    console.error("Supabase client is not initialized. Check shared/js/supabase.js and the Supabase SDK script order.");
    return;
  }

  // -------------------------------------------------
  // Element references
  // -------------------------------------------------
  const els = {
    projectsTable: document.getElementById("projectsTable"),
    messageList: document.getElementById("messageList"),
    activityList: document.getElementById("activityList"),
    notificationList: document.getElementById("notificationList"),
    notificationBtn: document.getElementById("notificationBtn"),
    notificationDropdown: document.getElementById("notificationDropdown"),
    notificationCount: document.getElementById("notificationCount"),
    openSidebarBtn: document.getElementById("openSidebar"),
    sidebar: document.getElementById("sidebar"),
    backdrop: document.getElementById("backdrop"),
    logoutBtn: document.querySelector(".logout-btn"),
    welcomeHeading: document.querySelector(".topbar h1"),
    statCards: Array.from(document.querySelectorAll(".stat-card")),
  };

  const ACTIVE_PROJECT_STATUSES = ["planning", "design", "development", "testing", "review"];
  const ROLE_REDIRECTS = {
    admin: "/admin/dashboard/index.html",
    team: "/team/dashboard/index.html",
    client: "/client/dashboard/index.html",
  };

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // -------------------------------------------------
  // Boot
  // -------------------------------------------------
  document.addEventListener("DOMContentLoaded", initDashboard);

  async function initDashboard() {
    bindStaticUi();

    const profile = await requireAdminSession();
    if (!profile) return;

    setWelcomeName(profile.full_name || "Admin");
    setAllLoadingStates();

    await Promise.all([
      loadStats(),
      loadProjects(),
      loadMessages(),
      loadNotifications(),
      loadActivity(),
    ]);
  }

  // -------------------------------------------------
  // Auth / access control
  // -------------------------------------------------
  async function requireAdminSession() {
    try {
      const { data: authData, error: authError } = await db.auth.getUser();

      if (authError || !authData?.user) {
        window.location.href = "/index/index.html";
        return null;
      }

      const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("id, full_name, role, status")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        await safeSignOut();
        window.location.href = "/index/index.html";
        return null;
      }

      if (profile.status && profile.status !== "active") {
        await safeSignOut();
        window.location.href = "/index/index.html";
        return null;
      }

      if (profile.role !== "admin") {
        window.location.href = ROLE_REDIRECTS[profile.role] || "/index/index.html";
        return null;
      }

      return profile;
    } catch (error) {
      console.error("Session validation failed:", error);
      window.location.href = "/index/index.html";
      return null;
    }
  }

  async function safeSignOut() {
    try {
      await db.auth.signOut();
    } catch {
      // Ignore sign-out errors during redirect fallback.
    }
  }

  function setWelcomeName(fullName) {
    if (!els.welcomeHeading) return;
    els.welcomeHeading.textContent = `Welcome Back, ${fullName}`;
  }

  // -------------------------------------------------
  // UI wiring
  // -------------------------------------------------
  function bindStaticUi() {
    if (els.logoutBtn) {
      els.logoutBtn.addEventListener("click", async () => {
        if (typeof window.logout === "function") {
          await window.logout();
          return;
        }
        await safeSignOut();
        window.location.href = "/index/index.html";
      });
    }

    if (els.notificationBtn && els.notificationDropdown) {
      els.notificationBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = els.notificationDropdown.hidden;
        els.notificationDropdown.hidden = !willOpen;
        els.notificationBtn.setAttribute("aria-expanded", String(willOpen));
      });
    }

    if (els.openSidebarBtn && els.sidebar && els.backdrop) {
      els.openSidebarBtn.addEventListener("click", () => setSidebar(true));
      els.backdrop.addEventListener("click", () => {
        setSidebar(false);
        closeNotifications();
      });
    }

    document.addEventListener("click", (event) => {
      if (!els.notificationDropdown || els.notificationDropdown.hidden) return;
      if (!event.target.closest(".notification-wrap")) {
        closeNotifications();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setSidebar(false);
        closeNotifications();
      }
    });
  }

  function setSidebar(open) {
    if (!els.sidebar || !els.backdrop) return;
    els.sidebar.classList.toggle("open", open);
    els.backdrop.hidden = !open;
  }

  function closeNotifications() {
    if (!els.notificationDropdown || !els.notificationBtn) return;
    els.notificationDropdown.hidden = true;
    els.notificationBtn.setAttribute("aria-expanded", "false");
  }

  // -------------------------------------------------
  // Loading states
  // -------------------------------------------------
  function setAllLoadingStates() {
    setStatLoading();
    renderProjectTableState("Loading recent projects…");
    renderListState(els.messageList, "Loading recent messages…");
    renderListState(els.activityList, "Loading recent activity…");
    renderNotificationsState("Loading notifications…");
  }

  function setStatLoading() {
    els.statCards.forEach((card) => {
      const value = card.querySelector("h2");
      const sub = card.querySelector(".stat-sub");
      if (value) value.textContent = "—";
      if (sub) sub.textContent = "Loading…";
    });
  }

  function setStatCard(index, value, subtitle) {
    const card = els.statCards[index];
    if (!card) return;

    const valueEl = card.querySelector("h2");
    const subEl = card.querySelector(".stat-sub");

    if (valueEl) valueEl.textContent = value;
    if (subEl) subEl.textContent = subtitle;
  }

  // -------------------------------------------------
  // Dashboard loaders
  // -------------------------------------------------
  async function loadStats() {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const activeProjectsPromise = countRows("projects", (query) =>
        query.in("status", ACTIVE_PROJECT_STATUSES)
      );

      const pendingPaymentsPromise = countRows("invoices", (query) =>
        query.eq("status", "pending")
      );

      const pendingReviewsPromise = countRows("projects", (query) =>
        query.eq("status", "review")
      );

      const revenuePromise = db
        .from("invoices")
        .select("amount, created_at")
        .eq("status", "paid")
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", monthEnd.toISOString())
        .order("created_at", { ascending: false });

      const [
        activeProjectsResult,
        pendingPaymentsResult,
        pendingReviewsResult,
        revenueResult,
      ] = await Promise.allSettled([
        activeProjectsPromise,
        pendingPaymentsPromise,
        pendingReviewsPromise,
        revenuePromise,
      ]);

      const activeProjects =
        activeProjectsResult.status === "fulfilled" ? activeProjectsResult.value : null;
      const pendingPayments =
        pendingPaymentsResult.status === "fulfilled" ? pendingPaymentsResult.value : null;
      const pendingReviews =
        pendingReviewsResult.status === "fulfilled" ? pendingReviewsResult.value : null;

      let revenueThisMonth = null;
      if (revenueResult.status === "fulfilled") {
        const { data, error } = revenueResult.value;
        if (!error) {
          revenueThisMonth = (data || []).reduce((sum, row) => {
            return sum + Number(row.amount || 0);
          }, 0);
        }
      }

      setStatCard(
        0,
        activeProjects === null ? "—" : formatNumber(activeProjects),
        activeProjects === null ? "Unable to load metric" : "Currently running projects"
      );

      setStatCard(
        1,
        revenueThisMonth === null ? "—" : formatCurrency(revenueThisMonth),
        revenueThisMonth === null ? "Unable to load metric" : "Collected revenue"
      );

      setStatCard(
        2, 
        pendingPayments === null ? "—" : formatNumber(pendingPayments),
        pendingPayments === null ? "Unable to load metric" : "Invoices awaiting payment"
      );

      setStatCard(
        3,
        pendingReviews === null ? "—" : formatNumber(pendingReviews),
        pendingReviews === null ? "Unable to load metric" : "Waiting for client approval"
      );
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      // Keep the rest of the dashboard alive even if stats fail.
      setStatCard(0, "—", "Unable to load metric");
      setStatCard(1, "—", "Unable to load metric");
      setStatCard(2, "—", "Unable to load metric");
      setStatCard(3, "—", "Unable to load metric");
    }
  }

  async function loadProjects() {
    try {
      const { data: projects, error } = await db
        .from("projects")
        .select("id, project_code, name, client_id, status, progress, due_date, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      const projectRows = projects || [];
      if (projectRows.length === 0) {
        renderProjectTableState("No projects available");
        return;
      }

      const clientIds = unique(
        projectRows.map((project) => project.client_id).filter(Boolean)
      );

      const clientMap = await fetchProfileMap(clientIds);

      renderProjectsTable(projectRows, clientMap);
    } catch (error) {
      console.error("Failed to load projects:", error);
      renderProjectTableState("Unable to load projects");
    }
  }

  async function loadMessages() {
    try {
      const { data: messages, error } = await db
        .from("messages")
        .select("id, project_id, sender_id, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const messageRows = messages || [];
      if (messageRows.length === 0) {
        renderListState(els.messageList, "No messages available");
        return;
      }

      const senderIds = unique(messageRows.map((message) => message.sender_id).filter(Boolean));
      const projectIds = unique(messageRows.map((message) => message.project_id).filter(Boolean));

      const [senderMap, projectMap] = await Promise.all([
        fetchProfileMap(senderIds),
        fetchProjectMap(projectIds),
      ]);

      renderMessages(messageRows, senderMap, projectMap);
    } catch (error) {
      console.error("Failed to load messages:", error);
      renderListState(els.messageList, "Unable to load messages");
    }
  }

  async function loadNotifications() {
    try {
      const currentUser = await getCurrentUserId();
      if (!currentUser) {
        renderNotificationsState("No notifications");
        return;
      }

      const { data: notifications, error } = await db
        .from("notifications")
        .select("id, title, is_read, created_at")
        .eq("user_id", currentUser)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const rows = notifications || [];
      const unreadCount = rows.filter((item) => !item.is_read).length;

      if (els.notificationCount) {
        els.notificationCount.textContent = String(unreadCount);
      }

      if (rows.length === 0) {
        renderNotificationsState("No notifications");
        return;
      }

      renderNotifications(rows);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      if (els.notificationCount) {
        els.notificationCount.textContent = "0";
      }
      renderNotificationsState("Unable to load notifications");
    }
  }

  async function loadActivity() {
    try {
      const { data: updates, error } = await db
        .from("project_updates")
        .select("id, project_id, title, description, phase, created_by, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const rows = updates || [];
      if (rows.length === 0) {
        renderListState(els.activityList, "No recent activity");
        return;
      }

      const projectIds = unique(rows.map((item) => item.project_id).filter(Boolean));
      const creatorIds = unique(rows.map((item) => item.created_by).filter(Boolean));

      const [projectMap, creatorMap] = await Promise.all([
        fetchProjectMap(projectIds),
        fetchProfileMap(creatorIds),
      ]);

      renderActivity(rows, projectMap, creatorMap);
    } catch (error) {
      console.error("Failed to load activity:", error);
      renderListState(els.activityList, "Unable to load activity");
    }
  }

  // -------------------------------------------------
  // Query helpers
  // -------------------------------------------------
  async function countRows(table, queryBuilder) {
    let query = db.from(table).select("id", { count: "exact", head: true });
    if (typeof queryBuilder === "function") {
      query = queryBuilder(query);
    }

    const { count, error } = await query;
    if (error) throw error;

    return count || 0;
  }

  async function getCurrentUserId() {
    const { data, error } = await db.auth.getUser();
    if (error || !data?.user?.id) return null;
    return data.user.id;
  }

  async function fetchProfileMap(ids) {
    if (!ids || ids.length === 0) return new Map();

    const { data, error } = await db
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .in("id", ids);

    if (error) throw error;

    return new Map((data || []).map((item) => [item.id, item]));
  }

  async function fetchProjectMap(ids) {
    if (!ids || ids.length === 0) return new Map();

    const { data, error } = await db
      .from("projects")
      .select("id, name, project_code, status, progress, due_date, client_id")
      .in("id", ids);

    if (error) throw error;

    return new Map((data || []).map((item) => [item.id, item]));
  }

  // -------------------------------------------------
  // Render helpers
  // -------------------------------------------------
  function renderProjectsTable(projects, clientMap) {
    if (!els.projectsTable) return;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(createProjectHeadRow());

    projects.forEach((project) => {
      const client = clientMap.get(project.client_id);
      fragment.appendChild(
        createProjectRow(project, client?.full_name || "Unknown client")
      );
    });

    els.projectsTable.replaceChildren(fragment);
  }

  function renderProjectTableState(message) {
    if (!els.projectsTable) return;
    const fragment = document.createDocumentFragment();
    fragment.appendChild(createProjectHeadRow());
    fragment.appendChild(createStateBlock(message));
    els.projectsTable.replaceChildren(fragment);
  }

  function createProjectHeadRow() {
    const row = document.createElement("div");
    row.className = "project-head-row";

    const headers = ["Project", "Client", "Progress", "Phase", "Due Date", ""];
    headers.forEach((label) => {
      const cell = document.createElement("div");
      cell.textContent = label;
      row.appendChild(cell);
    });

    return row;
  }

  function createProjectRow(project, clientName) {
    const row = document.createElement("div");
    row.className = "project-row";
    row.tabIndex = 0;
    row.setAttribute("role", "link");
    row.setAttribute("aria-label", `Open ${project.name}`);

    const projectName = createCell("div", "project-name", project.name || "Untitled project");
    const clientCell = createCell("div", "project-client", clientName || "Unknown client");
    const progressCell = document.createElement("div");
    progressCell.className = "project-progress";

    const progressWrap = document.createElement("div");
    progressWrap.className = "progress-wrap";

    const progressLabel = document.createElement("span");
    const progressValue = clampNumber(project.progress, 0, 100);
    progressLabel.textContent = `${progressValue}%`;

    const progressTrack = document.createElement("div");
    progressTrack.className = "progress-track";
    progressTrack.setAttribute("aria-hidden", "true");

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.style.width = `${progressValue}%`;

    progressTrack.appendChild(progressFill);
    progressWrap.append(progressLabel, progressTrack);
    progressCell.appendChild(progressWrap);

    const statusCell = createCell("div", "project-phase", humanize(project.status));
    const dueCell = createCell("div", "project-due", formatDateOrDash(project.due_date));

    const linkCell = document.createElement("div");
    linkCell.className = "project-link";
    linkCell.setAttribute("aria-hidden", "true");
    linkCell.textContent = "↗";

    row.append(projectName, clientCell, progressCell, statusCell, dueCell, linkCell);

    const openWorkspace = () => {
      try {
        sessionStorage.setItem("ews:selectedProjectId", project.id);
      } catch {
        // Storage can fail in hardened browser settings. Navigation still works.
      }
      window.location.href = "../project-workspace/index.html";
    };

    row.addEventListener("click", openWorkspace);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openWorkspace();
      }
    });

    return row;
  }

  function renderMessages(messages, senderMap, projectMap) {
    if (!els.messageList) return;
    const fragment = document.createDocumentFragment();

    messages.forEach((message) => {
      const sender = senderMap.get(message.sender_id);
      const project = projectMap.get(message.project_id);

      fragment.appendChild(
        createMessageItem({
          projectName: project?.name || "Unknown project",
          senderName: sender?.full_name || "Unknown sender",
          preview: truncateText(message.message, 120),
          time: formatRelativeTime(message.created_at),
        })
      );
    });

    els.messageList.replaceChildren(fragment);
  }

  function renderActivity(updates, projectMap, creatorMap) {
    if (!els.activityList) return;
    const fragment = document.createDocumentFragment();

    updates.forEach((update) => {
      const project = projectMap.get(update.project_id);
      const creator = creatorMap.get(update.created_by);

      fragment.appendChild(
        createActivityItem({
          title: update.title || "Update",
          text: update.description || `${humanize(update.phase)} update`,
          projectName: project?.name || "Unknown project",
          creatorName: creator?.full_name || "System",
          time: formatRelativeTime(update.created_at),
        })
      );
    });

    els.activityList.replaceChildren(fragment);
  }

  function renderNotifications(notifications) {
    if (!els.notificationList) return;
    const fragment = document.createDocumentFragment();

    notifications.forEach((notification) => {
      fragment.appendChild(
        createNotificationItem({
          title: notification.title || "Notification",
          time: formatRelativeTime(notification.created_at),
          read: Boolean(notification.is_read),
        })
      );
    });

    els.notificationList.replaceChildren(fragment);
  }

  function renderNotificationsState(message) {
    if (!els.notificationList) return;
    els.notificationList.replaceChildren(createStateBlock(message));
  }

  function renderListState(container, message) {
    if (!container) return;
    container.replaceChildren(createStateBlock(message));
  }

  function createStateBlock(message) {
    const block = document.createElement("div");
    block.style.padding = "18px 16px";
    block.style.color = "var(--muted)";
    block.style.lineHeight = "1.6";
    block.style.border = "1px dashed rgba(255,255,255,0.10)";
    block.style.borderRadius = "16px";
    block.style.background = "rgba(255,255,255,0.02)";
    block.textContent = message;
    return block;
  }

  function createCell(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function createMessageItem({ projectName, senderName, preview, time }) {
    const item = document.createElement("article");
    item.className = "message-item";

    const top = document.createElement("div");
    top.className = "message-top";

    const left = document.createElement("div");
    const project = createCell("div", "message-project", projectName);
    const sender = createCell("div", "message-sender", senderName);
    left.append(project, sender);

    const timeEl = createCell("div", "message-time", time);

    top.append(left, timeEl);

    const previewEl = document.createElement("p");
    previewEl.className = "message-preview";
    previewEl.textContent = preview || "No message text";

    item.append(top, previewEl);
    return item;
  }

  function createActivityItem({ title, text, projectName, creatorName, time }) {
    const item = document.createElement("article");
    item.className = "activity-item";

    const marker = document.createElement("span");
    marker.className = "activity-marker";
    marker.setAttribute("aria-hidden", "true");

    const meta = document.createElement("div");
    meta.className = "activity-meta";

    const top = document.createElement("div");
    top.className = "activity-top";

    const left = document.createElement("div");
    const activityTitle = createCell("div", "activity-title", title);
    const activityText = createCell("div", "activity-text", text);
    left.append(activityTitle, activityText);

    const timeEl = createCell("div", "activity-time", time);

    top.append(left, timeEl);

    const projectLine = document.createElement("div");
    projectLine.className = "activity-text";
    projectLine.textContent = `${projectName} · ${creatorName}`;

    meta.append(top, projectLine);
    item.append(marker, meta);
    return item;
  }

  function createNotificationItem({ title, time, read }) {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.style.opacity = read ? "0.72" : "1";

    const strong = document.createElement("strong");
    strong.textContent = title;

    const span = document.createElement("span");
    span.textContent = time;

    item.append(strong, span);
    return item;
  }

  // -------------------------------------------------
  // Formatting helpers
  // -------------------------------------------------
  function unique(values) {
    return Array.from(new Set(values));
  }

  function clampNumber(value, min, max) {
    const n = Number(value);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function humanize(value) {
    if (!value) return "Unknown";
    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
  }

  function formatCurrency(value) {
    return currencyFormatter.format(Number(value) || 0);
  }

  function formatDateOrDash(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return shortDateFormatter.format(date);
  }

  function truncateText(text, maxLength) {
    const str = String(text || "");
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength - 1).trimEnd()}…`;
  }

  function formatRelativeTime(value) {
    if (!value) return "Just now";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return shortDateFormatter.format(date);
  }
})();