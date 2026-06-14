# Elevated OS — Seed Data Reference

Run these records in Firebase Console → Firestore to get a working demo with all roles active.

---

## Collection: `users`

### Admin
```
Document ID: (auto or any uid from Firebase Auth)
{
  uid:       "<admin-uid>",
  name:      "Sachin Admin",
  email:     "admin@elevated.com",
  role:      "admin",
  company:   "Elevated Web Solutions",
  avatarUrl: "",
  active:    true,
  createdAt: <timestamp>,
  lastLogin: <timestamp>
}
```

### Project Manager
```
{
  uid:       "<manager-uid>",
  name:      "Priya Manager",
  email:     "pm@elevated.com",
  role:      "manager",
  company:   "Elevated Web Solutions",
  avatarUrl: "",
  active:    true,
  createdAt: <timestamp>,
  lastLogin: <timestamp>
}
```

### Programmer / Developer
```
{
  uid:       "<dev-uid>",
  name:      "Rahul Developer",
  email:     "dev@elevated.com",
  role:      "developer",
  company:   "Elevated Web Solutions",
  avatarUrl: "",
  active:    true,
  createdAt: <timestamp>,
  lastLogin: <timestamp>
}
```

### Cold Caller
```
{
  uid:       "<caller-uid>",
  name:      "Raihan Caller",
  email:     "caller@elevated.com",
  role:      "cold_caller",
  company:   "Elevated Web Solutions",
  avatarUrl: "",
  active:    true,
  createdAt: <timestamp>,
  lastLogin: <timestamp>
}
```

### Client
```
{
  uid:       "<client-uid>",
  name:      "Acme Corp",
  email:     "client@acmecorp.com",
  role:      "client",
  company:   "Acme Corp",
  avatarUrl: "",
  active:    true,
  createdAt: <timestamp>,
  lastLogin: <timestamp>
}
```

---

## Collection: `projects`

```
{
  title:            "Acme Corp Website Redesign",
  description:      "Full website overhaul with new brand identity.",
  clientId:         "<client-uid>",
  projectManagerId: "<manager-uid>",
  assignedDevelopers: ["<dev-uid>"],
  status:           "active",
  priority:         "high",
  progress:         35,
  startDate:        <timestamp>,
  dueDate:          <timestamp — 60 days from now>,
  budget:           150000,
  createdAt:        <timestamp>,
  updatedAt:        <timestamp>
}
```

---

## Collection: `projectMembers`

```
{
  projectId:   "<project-id from above>",
  userId:      "<dev-uid>",
  role:        "developer",
  assignedBy:  "<manager-uid>",
  assignedAt:  <timestamp>
}
```

---

## Collection: `tasks`

```
{
  projectId:   "<project-id>",
  title:       "Build Homepage Layout",
  description: "Responsive hero, nav, and footer sections.",
  assignedTo:  "<dev-uid>",
  priority:    "high",
  status:      "in_progress",
  dueDate:     <timestamp — 2 weeks from now>,
  createdBy:   "<manager-uid>",
  createdAt:   <timestamp>,
  updatedAt:   <timestamp>
}
```

---

## Collection: `leads`

```
{
  name:             "John Smith",
  businessName:     "Smith Retail Ltd",
  phone:            "+91 98765 43210",
  email:            "john@smithretail.com",
  serviceInterest:  "E-commerce website",
  source:           "Cold call list",
  status:           "interested",
  assignedCallerId: "<caller-uid>",
  notes:            "Interested in a full e-commerce build. Budget ₹80k. Call again next Tuesday.",
  followUpDate:     <timestamp — next Tuesday>,
  createdAt:        <timestamp>,
  updatedAt:        <timestamp>,
  createdBy:        "<caller-uid>"
}
```

---

## Collection: `callLogs`

```
{
  leadId:       "<lead-id from above>",
  callerId:     "<caller-uid>",
  outcome:      "interested",
  notes:        "Called at 10am. Very interested. Wants a proposal by Friday.",
  callDate:     <timestamp>,
  nextFollowUp: <timestamp — next Tuesday>,
  createdAt:    <timestamp>
}
```

---

## Collection: `projectNotes`

```
{
  projectId: "<project-id>",
  message:   "Homepage layout is 70% done. Waiting on final brand colors from client before completing header.",
  createdBy: "<manager-uid>",
  createdAt: <timestamp>
}
```

---

## Firebase Authentication

Create matching Auth accounts in Firebase Console → Authentication → Users:

| Email                   | Password    | Role         |
|-------------------------|-------------|--------------|
| admin@elevated.com      | Admin@1234  | admin        |
| pm@elevated.com         | Pm@1234     | manager      |
| dev@elevated.com        | Dev@1234    | developer    |
| caller@elevated.com     | Call@1234   | cold_caller  |
| client@acmecorp.com     | Client@1234 | client       |

After creating each Auth user, copy its UID and use it as the Firestore document ID in the `users` collection.

---

## Login → Dashboard Routing

| Role         | Dashboard                                     |
|--------------|-----------------------------------------------|
| admin        | /admin/dashboard/index.html                   |
| manager      | /project-manager/dashboard/index.html         |
| developer    | /team/dashboard/index.html                    |
| cold_caller  | /cold-caller/dashboard/index.html             |
| client       | /client/dashboard/index.html                  |
