# Elevated OS — Upgrade Changelog

## Summary of Changes

This document describes every file changed or added in the multi-role expansion.

---

## New Roles Added

| Role         | Firestore value | Portal                                        |
|--------------|-----------------|-----------------------------------------------|
| Project Manager | `manager`    | `/project-manager/dashboard/index.html`       |
| Cold Caller  | `cold_caller`   | `/cold-caller/dashboard/index.html`           |

Both roles are fully enforced by `roleGuard.js` — accessing the wrong portal redirects to the correct one.

---

## New Files

### `js/utils/permissions.js`
- Central capability matrix for all roles
- `can(role, capability)` — check what a role can do
- `homeFor(role)` — returns the correct dashboard URL
- `labelForRole(role)` — human-friendly role label (e.g. `cold_caller` → `"Cold Caller"`)
- Scalable: add new roles here without touching any page code

### `cold-caller/dashboard/index.html` + `style.css` + `script.js`
- Stat cards: Total Leads, Calls Today, Interested, Confirmed Clients
- Follow-ups Due panel with overdue highlighting
- Recent Call Logs panel
- Real-time Firestore listeners on `leads` and `callLogs`

### `cold-caller/leads/index.html` + `style.css` + `script.js`
- Full CRM lead list with search + status filter
- Stats: Total, Follow-up Needed, Interested %, Confirmed %
- Add Lead modal with duplicate phone detection
- Log Call modal: saves to `callLogs`, updates `leads.status` in one transaction
- Statuses: `not_answered`, `interested`, `follow_up`, `confirmed_client`, `rejected`

### `project-manager/dashboard/index.html` + `style.css` + `script.js`
- Stat cards: Managed Projects, Team Members, Open Tasks, Avg. Completion
- Projects table with status + priority badges and progress bars
- **Project Workspace modal** with 3 tabs:
  - **Team tab**: Add/remove members from `projectMembers` collection; only shows developers and cold callers
  - **Tasks tab**: Create tasks with title, assignee, priority, due date; update status inline; delete tasks
  - **Notes tab**: Update project status + completion %, add timestamped notes to `projectNotes`
- All changes are real-time via Firestore listeners

### `SEED_DATA.md`
- Sample records for all 5 roles
- Firebase Auth credentials table
- Routing table

---

## Modified Files

### `js/utils/permissions.js` (was empty)
- Fully written from scratch (see above)

### `js/guards/roleGuard.js`
- Now imports from `permissions.js` instead of hard-coding role → path mapping
- Correctly routes `manager` → `/project-manager/dashboard/`
- Correctly routes `cold_caller` → `/cold-caller/dashboard/`

### `index/script.js` (login page)
- `ROLE_ROUTES` updated: `manager` → project-manager portal, `cold_caller` → cold-caller portal
- Cleaner error message table
- Preserves existing logic fully

### `admin/dashboard/index.html`
- Added second stats row: Total Leads, Interested, Confirmed Clients, Conversion Rate
- Added "View all →" link on projects panel

### `admin/dashboard/script.js`
- `ROLE_REDIRECTS` + `TEAM_ROLES` updated for new roles
- `state.leads` array added
- `startRealtimeListeners`: added `leads` collection listener
- `renderLeadStats()` function added — populates CRM stats row
- `renderDashboard()` now calls `renderLeadStats()`

### `admin/people/index.html`
- Role dropdown now includes `Cold Caller / Sales` option (`cold_caller`)
- Label updated: `Manager` → `Project Manager`, `Developer` → `Programmer / Developer`

### `admin/people/script.js`
- `ROLE_REDIRECTS` + `TEAM_ROLES` updated to include `cold_caller`
- `humanizeRole()` already handles underscores so `cold_caller` renders as `Cold Caller`

### `admin/projects/script.js`
- `ROLE_REDIRECTS` + `TEAM_ROLES` updated
- Manager no longer redirected to team portal

### `admin/revenue/script.js`
- `ROLE_REDIRECTS` updated

### `admin/messages/script.js`
- `ROLE_REDIRECTS` updated

### `admin/project-workspace/script.js`
- `ROLE_REDIRECTS` updated

### `team/dashboard/script.js`
- `ROLE_REDIRECTS` updated; manager redirected to project-manager portal
- `TEAM_ROLES` narrowed to developers only (manager/cold_caller have own portals)

### `team/projects/script.js`
- `ROLE_REDIRECTS` updated

### `team/messages/script.js`
- `ROLE_REDIRECTS` updated

### `team/projects/workspace/script.js`
- `ROLE_REDIRECTS` updated

### `FIREBASEDATA.md`
- Roles section updated: added `cold_caller`
- Added `projectMembers` collection spec
- Added `leads` collection spec with all statuses
- Added `callLogs` collection spec
- Added `projectNotes` collection spec
- Dashboard metrics section updated for all roles
- Relationships section updated for new collections

---

## Database Schema Additions

| Collection       | Purpose                                                              |
|------------------|----------------------------------------------------------------------|
| `projectMembers` | Many-to-many join between projects and team members                  |
| `leads`          | CRM leads managed by cold callers                                    |
| `callLogs`       | Individual call records linked to a lead and caller                  |
| `projectNotes`   | Timestamped progress notes added by project managers                 |

---

## Access Control

| Role         | Can see/do                                                           |
|--------------|----------------------------------------------------------------------|
| Admin        | Everything — all projects, all leads, all people, all call logs      |
| Manager      | Only projects where `projectManagerId == uid`; assign/remove members |
| Developer    | Only own tasks (via existing team portal)                            |
| Cold Caller  | Only leads where `assignedCallerId == uid`; own call logs            |
| Client       | Only own project (existing client portal, unchanged)                 |

---

## What Was NOT Changed

- Client portal (`/client/`) — untouched
- Admin revenue page logic — only routing patched
- Admin messages page logic — only routing patched  
- Team projects / workspace pages — only routing patched
- Login page HTML — untouched
- Firebase configuration (`js/firebase.js`) — untouched
- All CSS design tokens — untouched (new pages import the base stylesheet)
- All existing Firestore collections (`users`, `projects`, `tasks`, `messages`, `notifications`, `invoices`, `payments`, `files`, `announcements`, `activityLogs`) — untouched
