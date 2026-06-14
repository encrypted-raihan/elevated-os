/*
=========================================
ELEVATED WEB SOLUTIONS — PERMISSIONS
=========================================
Single source of truth for roles, home routes,
and capability checks across the portal.
*/

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  DEVELOPER: "developer",
  COLD_CALLER: "cold_caller",
  CLIENT: "client",
};

// Where each role lands after login.
export const ROLE_HOME = {
  [ROLES.ADMIN]: "/admin/dashboard/index.html",
  [ROLES.MANAGER]: "/project-manager/dashboard/index.html",
  [ROLES.DEVELOPER]: "/team/dashboard/index.html",
  [ROLES.COLD_CALLER]: "/cold-caller/dashboard/index.html",
  [ROLES.CLIENT]: "/client/dashboard/index.html",
};

// Capability matrix. Keep additive — new roles can be slotted in
// without touching existing role definitions.
const CAPABILITIES = {
  [ROLES.ADMIN]: new Set([
    "view_all_projects",
    "manage_projects",
    "manage_users",
    "view_all_people",
    "view_all_leads",
    "view_all_calls",
    "view_activity_log",
    "manage_roles",
  ]),
  [ROLES.MANAGER]: new Set([
    "view_assigned_projects",
    "manage_assigned_projects",
    "assign_team_members",
    "manage_tasks",
    "view_team_leads",
  ]),
  [ROLES.DEVELOPER]: new Set([
    "view_own_tasks",
    "update_own_tasks",
  ]),
  [ROLES.COLD_CALLER]: new Set([
    "view_own_leads",
    "manage_own_leads",
    "log_calls",
    "view_own_performance",
  ]),
  [ROLES.CLIENT]: new Set([
    "view_own_project",
  ]),
};

export function can(role, capability) {
  const set = CAPABILITIES[normalizeRole(role)];
  return set ? set.has(capability) : false;
}

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function homeFor(role) {
  return ROLE_HOME[normalizeRole(role)] || "..../../index/index.html";
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(normalizeRole(role));
}

// Human-friendly labels for UI (admin people page, badges, etc.)
export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGER]: "Project Manager",
  [ROLES.DEVELOPER]: "Programmer",
  [ROLES.COLD_CALLER]: "Cold Caller",
  [ROLES.CLIENT]: "Client",
};

export function labelForRole(role) {
  return ROLE_LABELS[normalizeRole(role)] || role;
}
