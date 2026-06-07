# Database Contract - Elevated Web Solutions Portal V1

## Overview

This document defines the core data models used throughout the Elevated Web Solutions Portal.

The portal follows a project-centric architecture where all communication, files, updates, invoices, and team collaboration are linked to a project.

---

# Profiles

Represents all portal users.

Used for:

* Admins
* Team Members
* Clients

## Fields

| Field      | Type      | Required |
| ---------- | --------- | -------- |
| id         | UUID      | Yes      |
| full_name  | TEXT      | Yes      |
| username   | TEXT      | Yes      |
| email      | TEXT      | Optional |
| role       | TEXT      | Yes      |
| status     | TEXT      | Yes      |
| avatar_url | TEXT      | Optional |
| created_at | TIMESTAMP | Yes      |

## Roles

* admin
* team
* client

## Status

* active
* inactive

## Example

```json
{
  "id": "uuid",
  "full_name": "Raihan",
  "username": "raihan",
  "email": "raihan@example.com",
  "role": "admin",
  "status": "active",
  "avatar_url": "",
  "created_at": "timestamp"
}
```

---

# Projects

Primary entity of the system.

Everything revolves around a project.

## Fields

| Field        | Type      |
| ------------ | --------- |
| id           | UUID      |
| project_code | TEXT      |
| name         | TEXT      |
| description  | TEXT      |
| client_id    | UUID      |
| budget       | DECIMAL   |
| status       | TEXT      |
| progress     | INTEGER   |
| start_date   | DATE      |
| due_date     | DATE      |
| created_at   | TIMESTAMP |

## Status Values

* planning
* design
* development
* testing
* review
* completed
* on_hold

## Example

```json
{
  "id": "uuid",
  "project_code": "EWS-001",
  "name": "Luxury Villa Website",
  "description": "Premium real estate website",
  "client_id": "uuid",
  "budget": 50000,
  "status": "development",
  "progress": 72,
  "start_date": "2026-06-05",
  "due_date": "2026-08-01",
  "created_at": "timestamp"
}
```

---

# Project Members

Links team members to projects.

## Fields

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| project_id | UUID      |
| user_id    | UUID      |
| role       | TEXT      |
| created_at | TIMESTAMP |

## Team Roles

* developer
* designer
* project_manager
* content_writer
* seo_specialist

## Example

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "role": "developer",
  "created_at": "timestamp"
}
```

---

# Project Updates

Used for timeline tracking and activity updates.

## Fields

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| project_id  | UUID      |
| title       | TEXT      |
| description | TEXT      |
| phase       | TEXT      |
| created_by  | UUID      |
| created_at  | TIMESTAMP |

## Phases

* planning
* design
* development
* testing
* launch

## Example

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "Homepage Design Completed",
  "description": "Client approved homepage design",
  "phase": "design",
  "created_by": "uuid",
  "created_at": "timestamp"
}
```

---

# Messages

Project-specific communication.

## Fields

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| project_id     | UUID      |
| sender_id      | UUID      |
| message        | TEXT      |
| attachment_url | TEXT      |
| created_at     | TIMESTAMP |

## Example

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "sender_id": "uuid",
  "message": "Homepage approved. Proceeding to development.",
  "attachment_url": "",
  "created_at": "timestamp"
}
```

---

# Files

Stores project documents and deliverables.

## Fields

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| project_id  | UUID      |
| uploaded_by | UUID      |
| category    | TEXT      |
| file_name   | TEXT      |
| file_url    | TEXT      |
| created_at  | TIMESTAMP |

## Categories

* designs
* documents
* deliverables
* payments

## Example

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "uploaded_by": "uuid",
  "category": "designs",
  "file_name": "homepage-v2.png",
  "file_url": "",
  "created_at": "timestamp"
}
```

---

# Invoices

Milestone-based project payments.

## Fields

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| project_id     | UUID      |
| invoice_number | TEXT      |
| milestone      | INTEGER   |
| amount         | DECIMAL   |
| status         | TEXT      |
| due_date       | DATE      |
| created_at     | TIMESTAMP |

## Milestones

* 1 = 50% Advance
* 2 = 30% Approval Stage
* 3 = 20% Final Delivery

## Status

* paid
* pending
* overdue

## Example

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "invoice_number": "INV-EWS001-01",
  "milestone": 1,
  "amount": 25000,
  "status": "paid",
  "due_date": "2026-06-10",
  "created_at": "timestamp"
}
```

---

# Notifications

Used for portal alerts.

## Fields

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| title      | TEXT      |
| is_read    | BOOLEAN   |
| created_at | TIMESTAMP |

## Example

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "New file uploaded",
  "is_read": false,
  "created_at": "timestamp"
}
```

---

# Relationships

```text
Profiles
│
├── Projects (Client Owner)
│
├── Messages (Sender)
│
├── Files (Uploader)
│
└── Notifications

Projects
│
├── Project Members
├── Project Updates
├── Messages
├── Files
└── Invoices
```

---

# Final Tables

* profiles
* projects
* project_members
* project_updates
* messages
* files
* invoices
* notifications

Total Tables: 8

---

# V1 Scope

Included:

* Authentication
* Projects
* Project Workspace
* Timeline
* Messages
* Files
* Revenue
* Invoices
* Notifications

Not Included:

* CRM
* Ticket System
* Payroll
* Accounting
* GST Engine
* AI Features
* Hosting Management
* Contracts
* Automation
* Self Registration
* Email Verification
