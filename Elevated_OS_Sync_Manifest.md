# Elevated OS — Sync Manifest

This file is the rebuild contract for the portal. Use the names in here exactly; do not invent new routes, helper names, DOM ids, or Firebase collections unless this manifest is updated first.

## Canonical sources

- `js/firebase.js` — Firebase client, auth, Firestore, and storage initialization.
- `js/utils/permissions.js` — role constants, route map, and capability matrix.
- `project-manager/utils.js` — shared formatting, status, and project helpers used across the multi-role portal.
- `FIREBASEDATA.md` — Firestore schema spec.
- `SEED_DATA.md` — demo data and role routing reference.

## Reconciliation notes

- The codebase is Firebase-first, but `shared/js/auth.js` is still Supabase-based. Treat it as legacy and do not wire new code to it.
- The live code currently uses `cold_caller`, `conversations`, `leads`, and `callLogs`. Some of these are not present in `FIREBASEDATA.md` yet.
- `FIREBASEDATA.md` still documents some collections that are not used by the current scripts (`announcements`, `projectMembers`, `projectNotes`).
- Several files contain the malformed path fragment `..../../index/index.html`. Normalize that before any rebuild.
- `projects.priority` is used in seed data and page logic, but it is not part of the current `projects` schema in `FIREBASEDATA.md`.

## Canonical roles and dashboard routes

| Firestore role | Dashboard route | UI label |
|---|---|---|
| `admin` | `/admin/dashboard/index.html` | `Admin` |
| `manager` | `/project-manager/dashboard/index.html` | `Project Manager` |
| `developer` | `/team/dashboard/index.html` | `Programmer` |
| `cold_caller` | `/cold-caller/dashboard/index.html` | `Cold Caller` |
| `client` | `/client/dashboard/index.html` | `Client` |

## Firebase collections

| Collection | In FIREBASEDATA | In SEED_DATA | Used in code | Notes |
|---|---:|---:|---:|---|
| `activityLogs` | no | no | yes | live code only |
| `callLogs` | no | yes | yes | live code only |
| `conversations` | no | no | yes | live code only |
| `files` | no | no | yes | live code only |
| `invoices` | no | no | yes | live code only |
| `leads` | no | yes | yes | live code only |
| `messages` | no | no | yes | live code only |
| `notifications` | no | no | yes | live code only |
| `payments` | no | no | yes | live code only |
| `projectMembers` | no | yes | no | seed/spec only |
| `projectNotes` | no | yes | no | seed/spec only |
| `projects` | no | yes | yes | live code only |
| `tasks` | no | yes | yes | live code only |
| `users` | no | yes | yes | live code only |

### Live code collection inventory
- `activityLogs` — referenced in 11 file(s)
- `callLogs` — referenced in 2 file(s)
- `conversations` — referenced in 6 file(s)
- `files` — referenced in 5 file(s)
- `invoices` — referenced in 6 file(s)
- `leads` — referenced in 3 file(s)
- `messages` — referenced in 4 file(s)
- `notifications` — referenced in 10 file(s)
- `payments` — referenced in 4 file(s)
- `projects` — referenced in 11 file(s)
- `tasks` — referenced in 2 file(s)
- `users` — referenced in 15 file(s)

## Shared function inventory by file

### `Elevated os/admin/dashboard/script.js`

- Functions (48): `initDashboard`, `bindStaticUi`, `startRealtimeListeners`, `teardownListeners`, `renderDashboard`, `renderStats`, `renderTopbarSubtitle`, `renderProjects`, `renderMessages`, `renderActivity`, `renderNotifications`, `createProjectHeadRow`, `createProjectRow`, `createMessageItem`, `createActivityItem`, `createNotificationItem`, `createCell`, `createStateBlock`, `renderLeadStats`, `showLoadingState`, `setStatLoading`, `setStatCard`, `renderProjectState`, `renderListState`, `renderNotificationState`, `setWelcomeName`, `setTopbarSubtitle`, `setSidebar`, `closeNotifications`, `handleListenerError`, `buildMap`, `mapDoc`, `getDisplayName`, `getProjectTitle`, `buildActivityDescription`, `isActiveUser`, `isRead`, `normalizeText`, `humanize`, `truncateText`, `formatNumber`, `formatCurrency`, `formatDateOrDash`, `formatRelativeTime`, `toDate`, `getTimeMs`, `clampNumber`, `isCurrentMonth`
- Top-level variables/constants (8): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_PROJECT_STATUSES`, `TEAM_ROLES`, `currencyFormatter`, `shortDateFormatter`, `els`, `state`
- Firebase collections (7): `activityLogs`, `invoices`, `leads`, `messages`, `notifications`, `projects`, `users`

### `Elevated os/admin/messages/script.js`

- Functions (50): `init`, `pruneUnsupportedFilters`, `bindStaticUi`, `startUserListener`, `shouldShowUser`, `startConversationListener`, `teardownListeners`, `loadUserProfile`, `setFilter`, `normalizeFilter`, `filterLabel`, `buildEligibleContacts`, `getVisibleContacts`, `renderConversationList`, `formatContactPreview`, `formatContactType`, `renderConversationHeader`, `buildParticipantsText`, `renderMessages`, `renderPendingAttachments`, `summarizeAttachments`, `isArchivedForMe`, `setSendBusy`, `showConversationList`, `showChatView`, `closeConversationIfMobile`, `isMobileView`, `setSidebar`, `closeModalOverlays`, `autosizeTextarea`, `getUnreadCount`, `getUser`, `normalizeConversation`, `normalizeRole`, `humanizeRole`, `isActiveUser`, `getDisplayName`, `isOutgoingMessage`, `formatRelativeTime`, `toDate`, `toMillis`, `initials`, `mapDoc`, `handleListenerError`, `resolveInitialConversationId`, `setSelectedConversationId`, `directConversationId`, `getConversationSortKeyFromId`, `escapeHtml`, `escapeAttr`
- Top-level variables/constants (5): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `INTERNAL_ROLES`, `state`, `els`
- Firebase collections (2): `conversations`, `users`

### `Elevated os/admin/people/script.js`

- Functions (36): `init`, `bindUi`, `startListeners`, `teardownListeners`, `renderAll`, `renderStats`, `syncPageState`, `syncTabsOnly`, `renderGrid`, `openDetails`, `renderDetails`, `renderRelatedProjects`, `openForm`, `fillForm`, `clearForm`, `openArchive`, `getVisibleUsers`, `getUsersByTab`, `getRelatedProjectsForUser`, `isActiveProject`, `isActiveUser`, `normalizeRole`, `humanizeRole`, `formatDate`, `getTimeMs`, `toDate`, `mapDoc`, `handleListenerError`, `setSidebar`, `openModal`, `closeModal`, `setText`, `setButtonLoading`, `showLoadingState`, `friendlyError`, `escapeHtml`
- Top-level variables/constants (6): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `TEAM_ROLES`, `ACTIVE_PROJECT_STATUSES`, `state`, `els`
- Firebase collections (2): `projects`, `users`

### `Elevated os/admin/project-workspace/script.js`

- Functions (58): `init`, `bindStaticUi`, `startListeners`, `teardownListeners`, `resolveProjectId`, `canAccessProject`, `updatePermissions`, `renderAll`, `renderActionStates`, `renderTabs`, `renderHeader`, `renderOverview`, `renderPhaseSelect`, `renderTimeline`, `renderFiles`, `renderUpdates`, `renderTeam`, `chipMarkup`, `showLoadingState`, `normalizeProject`, `normalizeStatus`, `phaseFromStatus`, `getCurrentPhase`, `getProjectProgress`, `humanizeStatus`, `normalizeRole`, `humanizeRole`, `getUser`, `getUserName`, `clampNumber`, `formatCurrency`, `toDate`, `formatDate`, `formatRelativeTime`, `timestampFromInput`, `addDaysToInput`, `resolvePhaseStatus`, `resolvePhaseProgress`, `resolveProjectIdForDelete`, `openDeleteModal`, `closeDeleteModal`, `openPromptModal`, `closePromptModal`, `showModal`, `hideModal`, `setSidebar`, `toggleVisible`, `openFile`, `getProjectRecipientIds`, `projectConversationId`, `openInvoicePrintWindow`, `openFileIfPresent`, `formatInputDate`, `handleListenerError`, `mapDoc`, `escapeHtml`, `escapeAttr`, `el`
- Top-level variables/constants (10): `LOGIN_ROUTE`, `PROJECTS_ROUTE`, `ROLE_REDIRECTS`, `PHASES`, `PHASE_TO_STATUS`, `PHASE_PROGRESS`, `STATUS_TO_LABEL`, `state`, `el`, `els`
- Firebase collections (6): `activityLogs`, `files`, `invoices`, `notifications`, `payments`, `users`

### `Elevated os/admin/projects/script.js`

- Functions (38): `init`, `bindUi`, `startListeners`, `teardownListeners`, `showLoadingState`, `renderFormControls`, `renderProjects`, `renderNotifications`, `getFilteredProjects`, `openProjectModal`, `openClientModal`, `openProjectWorkspace`, `openModal`, `closeModal`, `closeNotifications`, `setSidebar`, `setButtonLoading`, `getUsersByRole`, `getUsersByRoles`, `getProjectTitle`, `getUserDisplayName`, `normalizeRole`, `humanizeRole`, `isRead`, `formatCurrency`, `formatDate`, `formatRelativeTime`, `toDate`, `getTimeMs`, `clampNumber`, `unique`, `todayInputValue`, `tomorrowInputValue`, `mapDoc`, `handleListenerError`, `friendlyError`, `escapeHtml`, `escapeAttr`
- Top-level variables/constants (6): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_STATUSES`, `TEAM_ROLES`, `state`, `els`
- Firebase collections (5): `activityLogs`, `conversations`, `notifications`, `projects`, `users`

### `Elevated os/admin/revenue/script.js`

- Functions (62): `init`, `bindStaticUi`, `startListeners`, `teardownListeners`, `normalizeRole`, `hasInvoicePermission`, `hasRevenueControlPermission`, `openSidebar`, `openModal`, `closeModal`, `closeAllModals`, `closeNotifications`, `showLoadingState`, `renderAll`, `renderNotifications`, `updateStats`, `renderProjectRevenue`, `renderInvoiceControls`, `invoiceCountForProject`, `filteredInvoices`, `renderInvoices`, `renderInvoiceAction`, `openInvoiceModal`, `renderProjectRowLabel`, `projectLabel`, `statusClassName`, `matchesFilter`, `filteredInvoicesData`, `updateInvoiceAmountPreview`, `syncGenerateFormDefaults`, `generateInvoiceNumber`, `normalizeProject`, `normalizeInvoice`, `normalizeInvoiceStatus`, `invoiceStatusLabel`, `getProjectName`, `getClientName`, `getUser`, `getCollectedRevenueTotal`, `buildProjectRevenueSummary`, `renderRevenueChartData`, `drawChart`, `buildYAxisTicks`, `formatCompactCurrencyTick`, `getLastTwelveMonths`, `monthKey`, `toDate`, `formatRelativeTime`, `formatDisplayDate`, `formatInputDate`, `timestampFromDateInput`, `addDaysToDate`, `addDaysToDateInput`, `mapDoc`, `escapeHtml`, `escapeAttr`, `currency`, `openFile`, `formatInvoiceNumberForPdf`, `buildInvoicePdfDoc`, `handleListenerError`, `$`
- Top-level variables/constants (5): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ALLOWED_ROLES`, `state`, `els`
- Firebase collections (5): `invoices`, `notifications`, `payments`, `projects`, `users`

### `Elevated os/client/dashboard/script.js`

- Functions (43): `init`, `bindUi`, `startGlobalListeners`, `teardownAllListeners`, `teardownProjectListeners`, `setHeaderUserName`, `selectActiveProject`, `projectPriorityScore`, `openProject`, `renderDashboard`, `renderOpenProjectButton`, `renderStats`, `renderSummary`, `renderLatestUpdates`, `renderProjectsTable`, `renderMessages`, `getRenderableMessages`, `renderNotifications`, `toggleNotificationDropdown`, `closeNotificationDropdown`, `toggleSidebar`, `showLoadingState`, `normalizeProject`, `normalizeStatus`, `humanizeStatus`, `statusClass`, `getProjectProgress`, `getDaysLeft`, `getUserName`, `normalizeRole`, `clampNumber`, `setText`, `setWidth`, `toDate`, `toMillis`, `formatDate`, `formatRelativeTime`, `escapeHtml`, `escapeAttr`, `projectConversationId`, `mapDoc`, `handleListenerError`, `el`
- Top-level variables/constants (6): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `PHASE_PROGRESS`, `state`, `el`, `els`
- Firebase collections (6): `activityLogs`, `files`, `invoices`, `messages`, `notifications`, `projects`

### `Elevated os/client/project/script.js`

- Functions (37): `init`, `bindUi`, `startListeners`, `syncProjectUserListeners`, `teardownListeners`, `normalizeRole`, `normalizeProject`, `normalizeStatus`, `phaseFromStatus`, `getCurrentPhase`, `getProjectProgress`, `humanizeStatus`, `humanizeRole`, `clampNumber`, `toDate`, `toMillis`, `formatDate`, `formatRelativeTime`, `formatCurrency`, `getUser`, `getUserName`, `renderAll`, `renderTabs`, `renderHeader`, `renderOverview`, `renderTimeline`, `renderFiles`, `renderUpdates`, `renderTeam`, `chipMarkup`, `showLoadingState`, `setSidebar`, `handleListenerError`, `escapeHtml`, `escapeAttr`, `openFile`, `el`
- Top-level variables/constants (9): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `PHASES`, `PHASE_TO_STATUS`, `PHASE_PROGRESS`, `STATUS_TO_LABEL`, `state`, `el`, `els`
- Firebase collections (3): `activityLogs`, `files`, `projects`

### `Elevated os/client/shared/ui.js`

- Functions (4): `setupShell`, `renderNotificationDropdown`, `setActiveNav`, `formatMoney`
- Top-level variables/constants (1): `data`
- Firebase collections (0): _none_

### `Elevated os/cold-caller/dashboard/script.js`

- Functions (12): `init`, `bindStaticUi`, `startListeners`, `teardown`, `render`, `renderStats`, `renderFollowUps`, `renderRecentCalls`, `toDate`, `setText`, `formatStatus`, `escapeHtml`
- Top-level variables/constants (4): `LOGIN_ROUTE`, `els`, `state`, `dateFormatter`
- Firebase collections (2): `callLogs`, `leads`

### `Elevated os/cold-caller/leads/script.js`

- Functions (17): `init`, `startListeners`, `teardown`, `bindUi`, `render`, `renderStats`, `renderRows`, `openLeadModal`, `closeLeadModal`, `openCallModal`, `closeCallModal`, `toDate`, `toInputDate`, `setText`, `showError`, `formatStatus`, `escapeHtml`
- Top-level variables/constants (4): `LOGIN_ROUTE`, `els`, `state`, `dateFormatter`
- Firebase collections (2): `callLogs`, `leads`

### `Elevated os/index/script.js`

- Functions (4): `bindEvents`, `routeForRole`, `clearErrors`, `setLoading`
- Top-level variables/constants (11): `form`, `emailInput`, `passwordInput`, `emailError`, `passwordError`, `loginError`, `togglePassword`, `eyeIcon`, `loginBtn`, `ROLE_ROUTES`, `isRedirecting`
- Firebase collections (0): _none_

### `Elevated os/js/firebase.js`

- Functions (0): _none_
- Top-level variables/constants (5): `firebaseConfig`, `app`, `auth`, `db`, `storage`
- Firebase collections (0): _none_

### `Elevated os/js/guards/authGuard.js`

- Functions (1): `requireAuth`
- Top-level variables/constants (0): _none_
- Firebase collections (0): _none_

### `Elevated os/js/guards/roleGuard.js`

- Functions (0): _none_
- Top-level variables/constants (0): _none_
- Firebase collections (0): _none_

### `Elevated os/js/utils/permissions.js`

- Functions (5): `can`, `normalizeRole`, `homeFor`, `isValidRole`, `labelForRole`
- Top-level variables/constants (4): `ROLES`, `ROLE_HOME`, `CAPABILITIES`, `ROLE_LABELS`
- Firebase collections (0): _none_

### `Elevated os/project-manager/dashboard/script.js`

- Functions (38): `init`, `bindUi`, `startListeners`, `teardown`, `render`, `renderStats`, `renderTopbarSubtitle`, `renderProjects`, `renderMessages`, `renderActivity`, `createProjectHeadRow`, `createProjectRow`, `createMessageItem`, `createActivityItem`, `createCell`, `createStateBlock`, `renderLoadingState`, `openProject`, `isRelevantMessage`, `isRelevantActivity`, `getProjectForActivity`, `buildActivityDescription`, `countUniqueTeamMembers`, `setText`, `handleListenerError`, `buildMap`, `mapDoc`, `getDisplayName`, `getProjectTitle`, `humanize`, `formatDateOrDash`, `formatRelativeTime`, `truncateText`, `normalizeText`, `clampNumber`, `getTimeMs`, `toDate`, `isCurrentMonth`
- Top-level variables/constants (7): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_PROJECT_STATUSES`, `currencyFormatter`, `shortDateFormatter`, `els`, `state`
- Firebase collections (5): `activityLogs`, `messages`, `projects`, `tasks`, `users`

### `Elevated os/project-manager/messages/script.js`

- Functions (50): `init`, `pruneUnsupportedFilters`, `bindStaticUi`, `startUserListener`, `shouldShowUser`, `startConversationListener`, `teardownListeners`, `loadUserProfile`, `setFilter`, `normalizeFilter`, `filterLabel`, `buildEligibleContacts`, `getVisibleContacts`, `renderConversationList`, `formatContactPreview`, `formatContactType`, `renderConversationHeader`, `buildParticipantsText`, `renderMessages`, `renderPendingAttachments`, `summarizeAttachments`, `isArchivedForMe`, `setSendBusy`, `showConversationList`, `showChatView`, `closeConversationIfMobile`, `isMobileView`, `setSidebar`, `closeModalOverlays`, `autosizeTextarea`, `getUnreadCount`, `getUser`, `normalizeConversation`, `normalizeRole`, `humanizeRole`, `isActiveUser`, `getDisplayName`, `isOutgoingMessage`, `formatRelativeTime`, `toDate`, `toMillis`, `initials`, `mapDoc`, `handleListenerError`, `resolveInitialConversationId`, `setSelectedConversationId`, `directConversationId`, `getConversationSortKeyFromId`, `escapeHtml`, `escapeAttr`
- Top-level variables/constants (5): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `INTERNAL_ROLES`, `state`, `els`
- Firebase collections (2): `conversations`, `users`

### `Elevated os/project-manager/projects/script.js`

- Functions (39): `init`, `bindUi`, `startListeners`, `teardownListeners`, `showLoadingState`, `renderFormControls`, `renderProjects`, `renderNotifications`, `canAccessProject`, `getFilteredProjects`, `openProjectModal`, `openClientModal`, `openProjectWorkspace`, `openModal`, `closeModal`, `closeNotifications`, `setSidebar`, `setButtonLoading`, `getUsersByRole`, `getUsersByRoles`, `getProjectTitle`, `getUserDisplayName`, `normalizeRole`, `humanizeRole`, `isRead`, `formatCurrency`, `formatDate`, `formatRelativeTime`, `toDate`, `getTimeMs`, `clampNumber`, `unique`, `todayInputValue`, `tomorrowInputValue`, `mapDoc`, `handleListenerError`, `friendlyError`, `escapeHtml`, `escapeAttr`
- Top-level variables/constants (6): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_STATUSES`, `TEAM_ROLES`, `state`, `els`
- Firebase collections (5): `activityLogs`, `conversations`, `notifications`, `projects`, `users`

### `Elevated os/project-manager/projects/workspace/script.js`

- Functions (58): `init`, `bindStaticUi`, `startListeners`, `teardownListeners`, `resolveProjectId`, `canAccessProject`, `updatePermissions`, `renderAll`, `renderActionStates`, `renderTabs`, `renderHeader`, `renderOverview`, `renderPhaseSelect`, `renderTimeline`, `renderFiles`, `renderUpdates`, `renderTeam`, `chipMarkup`, `showLoadingState`, `normalizeProject`, `normalizeStatus`, `phaseFromStatus`, `getCurrentPhase`, `getProjectProgress`, `humanizeStatus`, `normalizeRole`, `humanizeRole`, `getUser`, `getUserName`, `clampNumber`, `formatCurrency`, `toDate`, `formatDate`, `formatRelativeTime`, `timestampFromInput`, `addDaysToInput`, `resolvePhaseStatus`, `resolvePhaseProgress`, `resolveProjectIdForDelete`, `openDeleteModal`, `closeDeleteModal`, `openPromptModal`, `closePromptModal`, `showModal`, `hideModal`, `setSidebar`, `toggleVisible`, `openFile`, `getProjectRecipientIds`, `projectConversationId`, `openInvoicePrintWindow`, `openFileIfPresent`, `formatInputDate`, `handleListenerError`, `mapDoc`, `escapeHtml`, `escapeAttr`, `el`
- Top-level variables/constants (10): `LOGIN_ROUTE`, `PROJECTS_ROUTE`, `ROLE_REDIRECTS`, `PHASES`, `PHASE_TO_STATUS`, `PHASE_PROGRESS`, `STATUS_TO_LABEL`, `state`, `el`, `els`
- Firebase collections (6): `activityLogs`, `files`, `invoices`, `notifications`, `payments`, `users`

### `Elevated os/project-manager/tasks/script.js`

- Functions (16): `init`, `bindUi`, `startListeners`, `renderAll`, `getVisibleProjects`, `renderStats`, `renderFormControls`, `renderBoard`, `renderTaskCards`, `showError`, `showLoadingState`, `setSidebar`, `setText`, `teardownListeners`, `mapDoc`, `handleListenerError`
- Top-level variables/constants (2): `els`, `state`
- Firebase collections (3): `projects`, `tasks`, `users`

### `Elevated os/project-manager/utils.js`

- Functions (21): `normalizeRole`, `humanize`, `humanizeStatus`, `getDisplayName`, `getProjectTitle`, `canAccessManagerPortal`, `phaseFromStatus`, `statusFromPhase`, `getProjectStatusBadge`, `toDate`, `formatDate`, `formatDateTime`, `formatRelativeTime`, `clampNumber`, `unique`, `escapeHtml`, `escapeAttr`, `buildProjectSearchText`, `projectMemberIds`, `isProjectVisibleToRole`, `getProjectPhaseLabel`
- Top-level variables/constants (8): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_PROJECT_STATUSES`, `TASK_STATUSES`, `PHASES`, `currencyFormatter`, `shortDateFormatter`, `dateTimeFormatter`
- Firebase collections (0): _none_

### `Elevated os/shared/js/auth.js`

- Functions (0): _none_
- Top-level variables/constants (1): `db`
- Firebase collections (0): _none_

### `Elevated os/team/dashboard/script.js`

- Functions (51): `initDashboard`, `bindStaticUi`, `startRealtimeListeners`, `teardownListeners`, `renderDashboard`, `getVisibleProjects`, `getStatsData`, `renderStats`, `renderTopbarSubtitle`, `renderProjects`, `renderMessages`, `renderActivity`, `renderNotifications`, `createProjectHeadRow`, `createProjectRow`, `createMessageItem`, `createActivityItem`, `createNotificationItem`, `createCell`, `createStateBlock`, `showLoadingState`, `setStatLoading`, `setStatCard`, `renderProjectState`, `renderListState`, `renderNotificationState`, `setWelcomeName`, `setTopbarSubtitle`, `setSidebar`, `closeNotifications`, `handleListenerError`, `buildMap`, `mapDoc`, `getDisplayName`, `getProjectTitle`, `buildActivityDescription`, `isActiveUser`, `isRead`, `normalizeText`, `humanize`, `truncateText`, `formatNumber`, `formatCurrency`, `formatDateOrDash`, `formatRelativeTime`, `toDate`, `getTimeMs`, `clampNumber`, `canAccessProject`, `openProjectWorkspace`, `openPrimaryWorkspace`
- Top-level variables/constants (8): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_PROJECT_STATUSES`, `TEAM_ROLES`, `currencyFormatter`, `shortDateFormatter`, `els`, `state`
- Firebase collections (5): `activityLogs`, `messages`, `notifications`, `projects`, `users`

### `Elevated os/team/messages/script.js`

- Functions (49): `init`, `bindStaticUi`, `startUserListener`, `shouldShowUser`, `startConversationListener`, `teardownListeners`, `setFilter`, `normalizeFilter`, `filterLabel`, `buildEligibleContacts`, `getVisibleContacts`, `renderConversationList`, `formatContactPreview`, `formatContactType`, `tryOpenPendingConversation`, `renderConversationHeader`, `buildParticipantsText`, `renderMessages`, `renderPendingAttachments`, `summarizeAttachments`, `isArchivedForMe`, `setSendBusy`, `showConversationList`, `showChatView`, `closeConversationIfMobile`, `isMobileView`, `setSidebar`, `closeModalOverlays`, `autosizeTextarea`, `getUnreadCount`, `getUser`, `normalizeConversation`, `normalizeRole`, `humanizeRole`, `isActiveUser`, `getDisplayName`, `isOutgoingMessage`, `formatRelativeTime`, `toDate`, `toMillis`, `initials`, `mapDoc`, `handleListenerError`, `resolveInitialConversationId`, `setSelectedConversationId`, `directConversationId`, `getConversationSortKeyFromId`, `escapeHtml`, `escapeAttr`
- Top-level variables/constants (5): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `INTERNAL_ROLES`, `state`, `els`
- Firebase collections (2): `conversations`, `users`

### `Elevated os/team/projects/script.js`

- Functions (39): `init`, `bindUi`, `startListeners`, `teardownListeners`, `showLoadingState`, `renderFormControls`, `renderProjects`, `renderNotifications`, `canAccessProject`, `getFilteredProjects`, `openProjectModal`, `openClientModal`, `openProjectWorkspace`, `openModal`, `closeModal`, `closeNotifications`, `setSidebar`, `setButtonLoading`, `getUsersByRole`, `getUsersByRoles`, `getProjectTitle`, `getUserDisplayName`, `normalizeRole`, `humanizeRole`, `isRead`, `formatCurrency`, `formatDate`, `formatRelativeTime`, `toDate`, `getTimeMs`, `clampNumber`, `unique`, `todayInputValue`, `tomorrowInputValue`, `mapDoc`, `handleListenerError`, `friendlyError`, `escapeHtml`, `escapeAttr`
- Top-level variables/constants (6): `LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_STATUSES`, `TEAM_ROLES`, `state`, `els`
- Firebase collections (5): `activityLogs`, `conversations`, `notifications`, `projects`, `users`

### `Elevated os/team/projects/workspace/script.js`

- Functions (58): `init`, `bindStaticUi`, `startListeners`, `teardownListeners`, `resolveProjectId`, `canAccessProject`, `updatePermissions`, `renderAll`, `renderActionStates`, `renderTabs`, `renderHeader`, `renderOverview`, `renderPhaseSelect`, `renderTimeline`, `renderFiles`, `renderUpdates`, `renderTeam`, `chipMarkup`, `showLoadingState`, `normalizeProject`, `normalizeStatus`, `phaseFromStatus`, `getCurrentPhase`, `getProjectProgress`, `humanizeStatus`, `normalizeRole`, `humanizeRole`, `getUser`, `getUserName`, `clampNumber`, `formatCurrency`, `toDate`, `formatDate`, `formatRelativeTime`, `timestampFromInput`, `addDaysToInput`, `resolvePhaseStatus`, `resolvePhaseProgress`, `resolveProjectIdForDelete`, `openDeleteModal`, `closeDeleteModal`, `openPromptModal`, `closePromptModal`, `showModal`, `hideModal`, `setSidebar`, `toggleVisible`, `openFile`, `getProjectRecipientIds`, `projectConversationId`, `openInvoicePrintWindow`, `openFileIfPresent`, `formatInputDate`, `handleListenerError`, `mapDoc`, `escapeHtml`, `escapeAttr`, `el`
- Top-level variables/constants (10): `LOGIN_ROUTE`, `PROJECTS_ROUTE`, `ROLE_REDIRECTS`, `PHASES`, `PHASE_TO_STATUS`, `PHASE_PROGRESS`, `STATUS_TO_LABEL`, `state`, `el`, `els`
- Firebase collections (6): `activityLogs`, `files`, `invoices`, `notifications`, `payments`, `users`

## Unique function names across the entire codebase

`normalizeRole`, `humanize`, `humanizeStatus`, `getDisplayName`, `getProjectTitle`, `canAccessManagerPortal`, `phaseFromStatus`, `statusFromPhase`, `getProjectStatusBadge`, `toDate`, `formatDate`, `formatDateTime`
`formatRelativeTime`, `clampNumber`, `unique`, `escapeHtml`, `escapeAttr`, `buildProjectSearchText`, `projectMemberIds`, `isProjectVisibleToRole`, `getProjectPhaseLabel`, `bindEvents`, `routeForRole`, `clearErrors`
`setLoading`, `init`, `bindUi`, `startListeners`, `renderAll`, `getVisibleProjects`, `renderStats`, `renderFormControls`, `renderBoard`, `renderTaskCards`, `showError`, `showLoadingState`
`setSidebar`, `setText`, `teardownListeners`, `mapDoc`, `handleListenerError`, `pruneUnsupportedFilters`, `bindStaticUi`, `startUserListener`, `shouldShowUser`, `startConversationListener`, `loadUserProfile`, `setFilter`
`normalizeFilter`, `filterLabel`, `buildEligibleContacts`, `getVisibleContacts`, `renderConversationList`, `formatContactPreview`, `formatContactType`, `renderConversationHeader`, `buildParticipantsText`, `renderMessages`, `renderPendingAttachments`, `summarizeAttachments`
`isArchivedForMe`, `setSendBusy`, `showConversationList`, `showChatView`, `closeConversationIfMobile`, `isMobileView`, `closeModalOverlays`, `autosizeTextarea`, `getUnreadCount`, `getUser`, `normalizeConversation`, `humanizeRole`
`isActiveUser`, `isOutgoingMessage`, `toMillis`, `initials`, `resolveInitialConversationId`, `setSelectedConversationId`, `directConversationId`, `getConversationSortKeyFromId`, `renderProjects`, `renderNotifications`, `canAccessProject`, `getFilteredProjects`
`openProjectModal`, `openClientModal`, `openProjectWorkspace`, `openModal`, `closeModal`, `closeNotifications`, `setButtonLoading`, `getUsersByRole`, `getUsersByRoles`, `getUserDisplayName`, `isRead`, `formatCurrency`
`getTimeMs`, `todayInputValue`, `tomorrowInputValue`, `friendlyError`, `teardown`, `render`, `renderTopbarSubtitle`, `renderActivity`, `createProjectHeadRow`, `createProjectRow`, `createMessageItem`, `createActivityItem`
`createCell`, `createStateBlock`, `renderLoadingState`, `openProject`, `isRelevantMessage`, `isRelevantActivity`, `getProjectForActivity`, `buildActivityDescription`, `countUniqueTeamMembers`, `buildMap`, `formatDateOrDash`, `truncateText`
`normalizeText`, `isCurrentMonth`, `can`, `homeFor`, `isValidRole`, `labelForRole`, `requireAuth`, `resolveProjectId`, `updatePermissions`, `renderActionStates`, `renderTabs`, `renderHeader`
`renderOverview`, `renderPhaseSelect`, `renderTimeline`, `renderFiles`, `renderUpdates`, `renderTeam`, `chipMarkup`, `normalizeProject`, `normalizeStatus`, `getCurrentPhase`, `getProjectProgress`, `getUserName`
`timestampFromInput`, `addDaysToInput`, `resolvePhaseStatus`, `resolvePhaseProgress`, `resolveProjectIdForDelete`, `openDeleteModal`, `closeDeleteModal`, `openPromptModal`, `closePromptModal`, `showModal`, `hideModal`, `toggleVisible`
`openFile`, `getProjectRecipientIds`, `projectConversationId`, `openInvoicePrintWindow`, `openFileIfPresent`, `formatInputDate`, `el`, `initDashboard`, `startRealtimeListeners`, `renderDashboard`, `createNotificationItem`, `renderLeadStats`
`setStatLoading`, `setStatCard`, `renderProjectState`, `renderListState`, `renderNotificationState`, `setWelcomeName`, `setTopbarSubtitle`, `formatNumber`, `syncPageState`, `syncTabsOnly`, `renderGrid`, `openDetails`
`renderDetails`, `renderRelatedProjects`, `openForm`, `fillForm`, `clearForm`, `openArchive`, `getVisibleUsers`, `getUsersByTab`, `getRelatedProjectsForUser`, `isActiveProject`, `hasInvoicePermission`, `hasRevenueControlPermission`
`openSidebar`, `closeAllModals`, `updateStats`, `renderProjectRevenue`, `renderInvoiceControls`, `invoiceCountForProject`, `filteredInvoices`, `renderInvoices`, `renderInvoiceAction`, `openInvoiceModal`, `renderProjectRowLabel`, `projectLabel`
`statusClassName`, `matchesFilter`, `filteredInvoicesData`, `updateInvoiceAmountPreview`, `syncGenerateFormDefaults`, `generateInvoiceNumber`, `normalizeInvoice`, `normalizeInvoiceStatus`, `invoiceStatusLabel`, `getProjectName`, `getClientName`, `getCollectedRevenueTotal`
`buildProjectRevenueSummary`, `renderRevenueChartData`, `drawChart`, `buildYAxisTicks`, `formatCompactCurrencyTick`, `getLastTwelveMonths`, `monthKey`, `formatDisplayDate`, `timestampFromDateInput`, `addDaysToDate`, `addDaysToDateInput`, `currency`
`formatInvoiceNumberForPdf`, `buildInvoicePdfDoc`, `$`, `tryOpenPendingConversation`, `getStatsData`, `openPrimaryWorkspace`, `renderRows`, `openLeadModal`, `closeLeadModal`, `openCallModal`, `closeCallModal`, `toInputDate`
`formatStatus`, `renderFollowUps`, `renderRecentCalls`, `setupShell`, `renderNotificationDropdown`, `setActiveNav`, `formatMoney`, `syncProjectUserListeners`, `startGlobalListeners`, `teardownAllListeners`, `teardownProjectListeners`, `setHeaderUserName`
`selectActiveProject`, `projectPriorityScore`, `renderOpenProjectButton`, `renderSummary`, `renderLatestUpdates`, `renderProjectsTable`, `getRenderableMessages`, `toggleNotificationDropdown`, `closeNotificationDropdown`, `toggleSidebar`, `statusClass`, `getDaysLeft`
`setWidth`

## Unique top-level variable / constant names across the entire codebase

`LOGIN_ROUTE`, `ROLE_REDIRECTS`, `ACTIVE_PROJECT_STATUSES`, `TASK_STATUSES`, `PHASES`, `currencyFormatter`, `shortDateFormatter`, `dateTimeFormatter`, `firebaseConfig`, `app`, `auth`, `db`
`storage`, `form`, `emailInput`, `passwordInput`, `emailError`, `passwordError`, `loginError`, `togglePassword`, `eyeIcon`, `loginBtn`, `ROLE_ROUTES`, `isRedirecting`
`els`, `state`, `INTERNAL_ROLES`, `ACTIVE_STATUSES`, `TEAM_ROLES`, `ROLES`, `ROLE_HOME`, `CAPABILITIES`, `ROLE_LABELS`, `PROJECTS_ROUTE`, `PHASE_TO_STATUS`, `PHASE_PROGRESS`
`STATUS_TO_LABEL`, `el`, `ALLOWED_ROLES`, `dateFormatter`, `data`

## HTML page DOM contracts

Each page below lists every `id` present in the page HTML. These are the ids the scripts are allowed to query.

### `Elevated os/admin/dashboard/index.html`

- ID count: 11
- IDs: `sidebar`, `backdrop`, `openSidebar`, `newProjectBtn`, `statTotalLeads`, `statInterestedLeads`, `statConfirmedLeads`, `statConversionRate`, `projectsTable`, `messageList`, `activityList`

### `Elevated os/admin/messages/index.html`

- ID count: 22
- IDs: `sidebar`, `backdrop`, `openSidebar`, `backToListTop`, `conversationView`, `activeFilterLabel`, `countLabel`, `searchInput`, `filterBar`, `conversationList`, `chatView`, `backBtn`, `chatTitle`, `chatBadge`, `chatParticipants`, `searchMessagesBtn`, `archiveBtn`, `messagesArea`, `attachmentPreview`, `fileInput`, `messageInput`, `sendBtn`

### `Elevated os/admin/people/index.html`

- ID count: 46
- IDs: `sidebar`, `backdrop`, `openSidebar`, `newClientBtn`, `newTeamBtn`, `clientsCount`, `teamCount`, `activeCount`, `inactiveCount`, `searchInput`, `filterGroup`, `sectionKicker`, `sectionTitle`, `sectionNote`, `emptyState`, `emptyTitle`, `emptyText`, `emptyActionBtn`, `grid`, `detailsModal`, `detailsEyebrow`, `detailsTitle`, `detailsBody`, `relatedTitle`, `relatedList`, `formModal`, `formEyebrow`, `formTitle`, `entityForm`, `formMode`, `editUid`, `nameInput`, `emailInput`, `passwordInput`, `phoneInput`, `companyInput`, `roleFieldWrap`, `roleInput`, `statusInput`, `submitBtn`, `deleteModal`, `deleteEyebrow`, `deleteTitle`, `deleteMessage`, `deleteWarning`, `confirmDeleteBtn`

### `Elevated os/admin/project-workspace/index.html`

- ID count: 50
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `projectName`, `projectMeta`, `editBtn`, `archiveBtn`, `deleteBtn`, `summaryProgress`, `summaryPhase`, `summaryBudget`, `summaryDueDate`, `tabs`, `overview`, `detailName`, `detailDescription`, `detailClient`, `detailId`, `detailStatus`, `detailStartDate`, `detailDueDate`, `detailPhase`, `detailBudget`, `overviewTeam`, `timeline`, `phaseSelect`, `timelineList`, `files`, `uploadBtn`, `fileInput`, `fileGrid`, `updates`, `addUpdateBtn`, `updatesList`, `team`, `addMemberBtn`, `teamList`, `modalBackdrop`, `deleteModal`, `deleteTitle`, `deleteText`, `cancelDelete`, `confirmDelete`, `promptModal`, `promptTitle`, `promptText`, `promptInput`, `cancelPrompt`, `confirmPrompt`

### `Elevated os/admin/projects/index.html`

- ID count: 29
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `openProjectModalBtn`, `searchInput`, `resultsCount`, `emptyState`, `emptyNewProjectBtn`, `projectsGrid`, `projectModal`, `projectModalTitle`, `projectForm`, `projectName`, `description`, `openClientModalBtn`, `clientSelect`, `projectManagerSelect`, `budget`, `startDate`, `dueDate`, `teamList`, `clientModal`, `clientModalTitle`, `clientForm`, `clientName`, `clientEmail`, `clientPassword`, `clientCompany`

### `Elevated os/admin/revenue/index.html`

- ID count: 35
- IDs: `sidebar`, `backdrop`, `openSidebar`, `generateInvoiceBtn`, `totalRevenueValue`, `collectedRevenueValue`, `pendingRevenueValue`, `outstandingInvoicesCount`, `revenueChart`, `areaGradient`, `chartGrid`, `chartArea`, `chartLine`, `chartDots`, `chartLabels`, `collectionRateChip`, `projectRevenueList`, `invoiceSearch`, `invoiceEmpty`, `invoiceTable`, `invoiceCards`, `modalBackdrop`, `invoiceViewModal`, `viewModalTitle`, `viewModalBody`, `viewModalNotesWrap`, `viewModalNotes`, `markPaidFromModal`, `generateInvoiceModal`, `generateInvoiceForm`, `invoiceProject`, `invoiceType`, `invoiceAmount`, `invoiceDueDate`, `invoiceNotes`

### `Elevated os/client/dashboard/index.html`

- ID count: 24
- IDs: `sidebar`, `backdrop`, `openSidebar`, `clientName`, `dashboardSubtitle`, `openProjectBtn`, `projectProgressValue`, `projectProgressHint`, `filesSharedValue`, `invoicesValue`, `daysLeftValue`, `daysLeftHint`, `summaryBadge`, `activeProjectTitle`, `activeProjectStatus`, `activeProjectDescription`, `activeProjectProgressText`, `activeProjectProgressBar`, `activeProjectDueDate`, `activeProjectManager`, `activeProjectClient`, `latestUpdatesList`, `recentProjectsTable`, `recentMessagesList`

### `Elevated os/client/project/index.html`

- ID count: 29
- IDs: `sidebar`, `backdrop`, `openSidebar`, `projectName`, `projectMeta`, `summaryProgress`, `summaryPhase`, `summaryBudget`, `summaryDueDate`, `tabs`, `overview`, `detailName`, `detailDescription`, `detailClient`, `detailId`, `detailStatus`, `detailStartDate`, `detailDueDate`, `detailPhase`, `detailBudget`, `overviewTeam`, `timeline`, `timelineList`, `files`, `fileGrid`, `updates`, `updatesList`, `team`, `teamList`

### `Elevated os/cold-caller/dashboard/index.html`

- ID count: 11
- IDs: `sidebar`, `backdrop`, `openSidebar`, `statTotalLeads`, `statCallsToday`, `statInterested`, `statConfirmed`, `followUpList`, `statCallsWeek`, `statConversion`, `recentCalls`

### `Elevated os/cold-caller/leads/index.html`

- ID count: 39
- IDs: `sidebar`, `backdrop`, `openSidebar`, `addLeadBtn`, `statTotal`, `statFollowUp`, `statInterestedPct`, `statConfirmedPct`, `searchInput`, `statusFilter`, `leadsTable`, `leadsRows`, `leadModalBackdrop`, `leadModalTitle`, `closeLeadModal`, `leadForm`, `leadId`, `leadName`, `leadBusiness`, `leadPhone`, `leadEmail`, `leadService`, `leadSource`, `leadStatus`, `leadFollowUp`, `leadNotes`, `leadFormError`, `cancelLead`, `callModalBackdrop`, `callModalTitle`, `closeCallModal`, `callForm`, `callLeadId`, `callLeadName`, `callOutcome`, `callNextFollowUp`, `callNotes`, `callFormError`, `cancelCall`

### `Elevated os/index/index.html`

- ID count: 9
- IDs: `loginForm`, `email`, `emailError`, `password`, `togglePassword`, `eyeIcon`, `passwordError`, `loginBtn`, `loginError`

### `Elevated os/project-manager/dashboard/index.html`

- ID count: 12
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `openProjectsBtn`, `statProjects`, `statMembers`, `statOpenTasks`, `statProgress`, `projectsRows`, `messageList`, `activityList`

### `Elevated os/project-manager/messages/index.html`

- ID count: 22
- IDs: `sidebar`, `backdrop`, `openSidebar`, `backToListTop`, `conversationView`, `activeFilterLabel`, `countLabel`, `searchInput`, `filterBar`, `conversationList`, `chatView`, `backBtn`, `chatTitle`, `chatBadge`, `chatParticipants`, `searchMessagesBtn`, `archiveBtn`, `messagesArea`, `attachmentPreview`, `fileInput`, `messageInput`, `sendBtn`

### `Elevated os/project-manager/projects/index.html`

- ID count: 30
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `openProjectModalBtn`, `searchInput`, `resultsCount`, `emptyState`, `emptyNewProjectBtn`, `projectsGrid`, `projectModal`, `projectModalTitle`, `projectForm`, `projectName`, `description`, `openClientModalBtn`, `clientSelect`, `projectManagerSelect`, `budgetGroup`, `budget`, `startDate`, `dueDate`, `teamList`, `clientModal`, `clientModalTitle`, `clientForm`, `clientName`, `clientEmail`, `clientPassword`, `clientCompany`

### `Elevated os/project-manager/projects/workspace/index.html`

- ID count: 50
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `projectName`, `projectMeta`, `editBtn`, `archiveBtn`, `deleteBtn`, `summaryProgress`, `summaryPhase`, `summaryDueDate`, `tabs`, `overview`, `detailName`, `detailDescription`, `detailClient`, `detailId`, `detailStatus`, `detailStartDate`, `detailDueDate`, `detailPhase`, `detailBudgetCard`, `detailBudget`, `overviewTeam`, `timeline`, `phaseSelect`, `timelineList`, `files`, `uploadBtn`, `fileInput`, `fileGrid`, `updates`, `addUpdateBtn`, `updatesList`, `team`, `addMemberBtn`, `teamList`, `modalBackdrop`, `deleteModal`, `deleteTitle`, `deleteText`, `cancelDelete`, `confirmDelete`, `promptModal`, `promptTitle`, `promptText`, `promptInput`, `cancelPrompt`, `confirmPrompt`

### `Elevated os/project-manager/tasks/index.html`

- ID count: 18
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `refreshBtn`, `statTotal`, `statTodo`, `statProgress`, `statCompleted`, `taskForm`, `projectSelect`, `taskTitle`, `taskDescription`, `taskAssignee`, `taskPriority`, `taskDueDate`, `taskFormError`, `board`

### `Elevated os/team/dashboard/index.html`

- ID count: 7
- IDs: `sidebar`, `backdrop`, `openSidebar`, `openWorkspaceBtn`, `projectsTable`, `messageList`, `activityList`

### `Elevated os/team/messages/index.html`

- ID count: 22
- IDs: `sidebar`, `backdrop`, `openSidebar`, `backToListTop`, `conversationView`, `activeFilterLabel`, `countLabel`, `searchInput`, `filterBar`, `conversationList`, `chatView`, `backBtn`, `chatTitle`, `chatBadge`, `chatParticipants`, `searchMessagesBtn`, `archiveBtn`, `messagesArea`, `attachmentPreview`, `fileInput`, `messageInput`, `sendBtn`

### `Elevated os/team/projects/index.html`

- ID count: 30
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `openProjectModalBtn`, `searchInput`, `resultsCount`, `emptyState`, `emptyNewProjectBtn`, `projectsGrid`, `projectModal`, `projectModalTitle`, `projectForm`, `projectName`, `description`, `openClientModalBtn`, `clientSelect`, `projectManagerSelect`, `budgetGroup`, `budget`, `startDate`, `dueDate`, `teamList`, `clientModal`, `clientModalTitle`, `clientForm`, `clientName`, `clientEmail`, `clientPassword`, `clientCompany`

### `Elevated os/team/projects/workspace/index.html`

- ID count: 50
- IDs: `sidebar`, `closeSidebar`, `backdrop`, `openSidebar`, `projectName`, `projectMeta`, `editBtn`, `archiveBtn`, `deleteBtn`, `summaryProgress`, `summaryPhase`, `summaryDueDate`, `tabs`, `overview`, `detailName`, `detailDescription`, `detailClient`, `detailId`, `detailStatus`, `detailStartDate`, `detailDueDate`, `detailPhase`, `detailBudgetCard`, `detailBudget`, `overviewTeam`, `timeline`, `phaseSelect`, `timelineList`, `files`, `uploadBtn`, `fileInput`, `fileGrid`, `updates`, `addUpdateBtn`, `updatesList`, `team`, `addMemberBtn`, `teamList`, `modalBackdrop`, `deleteModal`, `deleteTitle`, `deleteText`, `cancelDelete`, `confirmDelete`, `promptModal`, `promptTitle`, `promptText`, `promptInput`, `cancelPrompt`, `confirmPrompt`

## Files that deserve special attention

- `shared/js/auth.js` — legacy Supabase auth layer; conflicts with the rest of the Firebase stack.
- `js/guards/authGuard.js` and `js/utils/permissions.js` — both need the route typo fixed before reuse.
- `client/shared/ui.js` — local mock data and shell helpers; not a database-backed source of truth.
- `project-manager/utils.js` — contains the shared `humanizeStatus()` helper that prevents the exact runtime error you hit.

## Handoff rules for any AI or developer

1. Use only the names listed here.
2. If a new helper, variable, DOM id, collection, role, or route is needed, add it here first.
3. Do not create new status names, role names, or collection names ad hoc.
4. Prefer shared helpers instead of duplicating logic in page scripts.
5. Treat `FIREBASEDATA.md` as the schema baseline, but apply the reconciliation notes above before generating code.

END OF MANIFEST