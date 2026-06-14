# FIREBASEDATA.md

# Elevated OS - Firebase Database Specification

Version: 1.0

This document is the single source of truth for all Firebase architecture in Elevated OS.

Every AI assistant, developer, automation, or script must follow this specification exactly.

No collection names, field names, document structures, relationships, or role definitions may be changed unless this document is updated first.

---

# Firebase Stack

Services Used:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage

Services Not Used:

* Supabase
* SQL
* Edge Functions
* Custom Backend

---

# Roles

Allowed roles:

```text
admin
manager
developer
cold_caller
client
```

`manager` = Project Manager. `developer` = Programmer. `cold_caller` = Cold Caller / Sales Caller.
New roles (designer, tester, content_writer, support, etc.) may be added later — when added,
they must be appended here first and given an entry in `js/utils/permissions.js`.

---

# Authentication

Firebase Authentication stores:

```javascript
{
  uid,
  email
}
```

Firestore stores profile data.

Document Path:

users/{uid}

---

# Collection: users

Document ID:

```text
uid
```

Schema:

```javascript
{
  uid: string,
  name: string,
  email: string,

  role: "admin" | "manager" | "developer" | "client",

  company: string,

  avatarUrl: string,

  active: boolean,

  createdAt: timestamp,

  lastLogin: timestamp
}
```

---

# Collection: projects

Document ID:

```text
projectId
```

Schema:

```javascript
{
  title: string,

  description: string,

  clientId: string,

  projectManagerId: string,

  assignedDevelopers: string[],

  status: string,

  progress: number,

  startDate: timestamp,

  dueDate: timestamp,

  budget: number,

  createdAt: timestamp,

  updatedAt: timestamp
}
```

Allowed statuses:

```text
planning
active
review
completed
paused
cancelled
```

---

# Collection: tasks

Document ID:

```text
taskId
```

Schema:

```javascript
{
  projectId: string,

  title: string,

  description: string,

  assignedTo: string,

  priority: string,

  status: string,

  dueDate: timestamp,

  createdBy: string,

  createdAt: timestamp,

  updatedAt: timestamp
}
```

Allowed priorities:

```text
low
medium
high
urgent
```

Allowed statuses:

```text
todo
in_progress
review
completed
```

---

# Collection: projectMembers

Document ID:

```text
membershipId
```

Schema:

```javascript
{
  projectId: string,

  userId: string,

  role: string,        // "manager" | "developer" | "cold_caller"

  assignedBy: string,  // uid of admin/manager who made the assignment

  assignedAt: timestamp
}
```

Used so a project manager can quickly query "who is on this project"
and a developer/cold caller can query "which projects am I on" without
scanning the full `projects` collection.

---

# Collection: leads

Document ID:

```text
leadId
```

Schema:

```javascript
{
  name: string,

  businessName: string,

  phone: string,

  email: string,

  serviceInterest: string,

  source: string,

  status: string,

  assignedCallerId: string,

  notes: string,

  followUpDate: timestamp,

  createdAt: timestamp,

  updatedAt: timestamp,

  createdBy: string
}
```

Allowed statuses:

```text
not_answered
interested
follow_up
confirmed_client
rejected
```

---

# Collection: callLogs

Document ID:

```text
callLogId
```

Schema:

```javascript
{
  leadId: string,

  callerId: string,

  outcome: string,

  notes: string,

  callDate: timestamp,

  nextFollowUp: timestamp,

  createdAt: timestamp
}
```

`outcome` mirrors the lead `status` values above and is used to drive
the caller's daily report and conversion percentages.



Document ID:

```text
messageId
```

Schema:

```javascript
{
  senderId: string,

  receiverId: string,

  projectId: string,

  message: string,

  attachments: string[],

  read: boolean,

  timestamp: timestamp
}
```

Realtime collection.

Must use Firestore listeners.

---

# Collection: notifications

Document ID:

```text
notificationId
```

Schema:

```javascript
{
  userId: string,

  title: string,

  message: string,

  read: boolean,

  createdAt: timestamp
}
```

---

# Collection: announcements

Document ID:

```text
announcementId
```

Schema:

```javascript
{
  title: string,

  content: string,

  targetRoles: string[],

  createdBy: string,

  createdAt: timestamp
}
```

Example:

```javascript
["client"]
```

---

# Collection: files

Document ID:

```text
fileId
```

Schema:

```javascript
{
  fileName: string,

  fileUrl: string,

  fileType: string,

  uploadedBy: string,

  projectId: string,

  createdAt: timestamp
}
```

---

# Collection: invoices

Document ID:

```text
invoiceId
```

Schema:

```javascript
{
  invoiceNumber: string,

  projectId: string,

  clientId: string,

  amount: number,

  status: string,

  issueDate: timestamp,

  dueDate: timestamp,

  invoicePdfUrl: string,

  notes: string
}
```

Allowed statuses:

```text
pending
paid
overdue
cancelled
```

---

# Collection: payments

Document ID:

```text
paymentId
```

Schema:

```javascript
{
  invoiceId: string,

  amount: number,

  method: string,

  paymentDate: timestamp,

  notes: string
}
```

---

# Collection: activityLogs

Document ID:

```text
logId
```

Schema:

```javascript
{
  userId: string,

  action: string,

  targetType: string,

  targetId: string,

  timestamp: timestamp
}
```

Examples:

```text
Created Project
Assigned Task
Uploaded File
Generated Invoice
Updated Project Status
```

---

# Firebase Storage Structure

```text
project-files/

contracts/

invoices/

avatars/

assets/
```

Never store files directly in Firestore.

Only store metadata and URLs.

---

# Dashboard Metrics

Admin Dashboard:

* Total Projects
* Total Revenue
* Active Clients
* Active Team Members
* Recent Activity

Manager Dashboard:

* Managed Projects
* Team Progress
* Pending Tasks
* Team Members Assigned

Developer Dashboard:

* Assigned Tasks
* Deadlines
* Messages

Cold Caller Dashboard:

* Total Leads Assigned
* Calls Made Today
* Interested Leads
* Confirmed Clients
* Conversion Rate
* Follow-ups Due

Client Dashboard:

* Project Progress
* Files
* Invoices
* Timeline

---

# Naming Rules

Always use:

```text
camelCase
```

Examples:

```javascript
projectId
clientId
createdAt
updatedAt
avatarUrl
invoicePdfUrl
```

Never use:

```text
snake_case
PascalCase
kebab-case
```

---

# Relationships

Project → Client

```text
projects.clientId
→ users.uid
```

Project → Manager

```text
projects.projectManagerId
→ users.uid
```

Task → Project

```text
tasks.projectId
→ projects.id
```

Task → User

```text
tasks.assignedTo
→ users.uid
```

Invoice → Client

```text
invoices.clientId
→ users.uid
```

Payment → Invoice

```text
payments.invoiceId
→ invoices.id
```

Lead → Caller

```text
leads.assignedCallerId
→ users.uid
```

Call Log → Lead

```text
callLogs.leadId
→ leads.id
```

Call Log → Caller

```text
callLogs.callerId
→ users.uid
```

Project Member → Project

```text
projectMembers.projectId
→ projects.id
```

Project Member → User

```text
projectMembers.userId
→ users.uid
```

---

END OF SPECIFICATION

---

# Collection: projectNotes

Document ID:

```text
noteId
```

Schema:

```javascript
{
  projectId: string,

  message: string,

  createdBy: string,

  createdAt: timestamp
}
```

Used by Project Managers to log status updates, blockers, and progress notes on a project.

---

END OF SPECIFICATION (updated)
