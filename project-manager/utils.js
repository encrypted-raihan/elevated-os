export const LOGIN_ROUTE = "../../index/index.html";

export const ROLE_REDIRECTS = {
  admin: "../../admin/dashboard/index.html",
  manager: "../dashboard/index.html",
  developer: "../../team/dashboard/index.html",
  client: "../../client/dashboard/index.html",
};

export const ACTIVE_PROJECT_STATUSES = new Set(["planning", "active", "review", "paused"]);
export const TASK_STATUSES = new Set(["todo", "in_progress", "review", "completed"]);

export const PHASES = ["Planning", "Design", "Development", "Testing", "Launch"];

export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

export function humanize(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function humanizeStatus(status) {
  return humanize(normalizeRole(status));
}

export function getDisplayName(user) {
  if (!user) return "";
  return user.fullName || user.name || user.displayName || user.username || user.email?.split("@")[0] || "";
}

export function getProjectTitle(project) {
  if (!project) return "Untitled project";
  return project.title || project.name || project.projectName || "Untitled project";
}

export function canAccessManagerPortal(role) {
  return ["admin", "manager"].includes(normalizeRole(role));
}

export function phaseFromStatus(status) {
  const s = normalizeRole(status);
  if (s === "planning") return "Planning";
  if (s === "active") return "Development";
  if (s === "review") return "Testing";
  if (s === "completed") return "Launch";
  if (s === "paused") return "Paused";
  if (s === "cancelled") return "Cancelled";
  return "Planning";
}

export function statusFromPhase(phase) {
  const p = String(phase || "").trim().toLowerCase();
  if (p === "planning") return "planning";
  if (p === "design") return "active";
  if (p === "development") return "active";
  if (p === "testing") return "review";
  if (p === "launch") return "completed";
  return "planning";
}

export function getProjectStatusBadge(status) {
  const normalized = normalizeRole(status);
  if (normalized === "planning") return "status-planning";
  if (normalized === "active") return "status-active";
  if (normalized === "review") return "status-review";
  if (normalized === "completed") return "status-completed";
  if (normalized === "paused") return "status-paused";
  if (normalized === "cancelled") return "status-cancelled";
  return "status-planning";
}

export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? shortDateFormatter.format(date) : "—";
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "Just now";
}

export function formatRelativeTime(value) {
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
  return shortDateFormatter.format(date);
}

export function clampNumber(value, min, max) {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

export function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, "&#96;");
}

export function buildProjectSearchText(project, clientName, managerName) {
  return [
    project?.id,
    getProjectTitle(project),
    clientName,
    managerName,
    project?.status,
    project?.progress,
    project?.dueDate ? formatDate(project.dueDate) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function projectMemberIds(project) {
  const ids = new Set();
  if (project?.projectManagerId) ids.add(project.projectManagerId);
  (project?.assignedDevelopers || []).forEach((uid) => ids.add(uid));
  return [...ids];
}

export function isProjectVisibleToRole(project, role, uid) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return true;
  if (normalized === "manager") return String(project?.projectManagerId || "") === String(uid || "");
  if (normalized === "developer") return (project?.assignedDevelopers || []).includes(uid);
  if (normalized === "client") return String(project?.clientId || "") === String(uid || "");
  return false;
}

export function getProjectPhaseLabel(status) {
  return phaseFromStatus(status);
}
