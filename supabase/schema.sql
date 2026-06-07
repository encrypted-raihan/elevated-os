-- =====================================================
-- ELEVATED WEB SOLUTIONS PORTAL
-- SUPABASE SCHEMA V1
-- Run this first.
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- PROFILES
-- =====================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    full_name text not null,
    username text not null unique,
    email text unique,

    role text not null check (
        role in ('admin', 'team', 'client')
    ),

    status text not null default 'active' check (
        status in ('active', 'inactive')
    ),

    avatar_url text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================
-- PROJECTS
-- =====================================================

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),

    project_code text not null unique,
    name text not null,
    description text,

    client_id uuid not null references public.profiles(id) on delete restrict,

    budget numeric(12,2) not null default 0,

    status text not null default 'planning' check (
        status in (
            'planning',
            'design',
            'development',
            'testing',
            'review',
            'completed',
            'on_hold'
        )
    ),

    progress integer not null default 0 check (
        progress >= 0 and progress <= 100
    ),

    start_date date,
    due_date date,

    created_at timestamptz not null default now()
);

create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================

create table if not exists public.project_members (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references public.projects(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,

    role text not null check (
        role in (
            'developer',
            'designer',
            'project_manager',
            'content_writer',
            'seo_specialist'
        )
    ),

    created_at timestamptz not null default now(),

    unique (project_id, user_id)
);

create index if not exists idx_project_members_project_id on public.project_members(project_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);

-- =====================================================
-- PROJECT UPDATES
-- =====================================================

create table if not exists public.project_updates (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references public.projects(id) on delete cascade,

    title text not null,
    description text,

    phase text check (
        phase in (
            'planning',
            'design',
            'development',
            'testing',
            'launch'
        )
    ),

    created_by uuid references public.profiles(id) on delete set null,

    created_at timestamptz not null default now()
);

create index if not exists idx_project_updates_project_id on public.project_updates(project_id);

-- =====================================================
-- MESSAGES
-- =====================================================

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references public.projects(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,

    message text not null,
    attachment_url text,

    created_at timestamptz not null default now()
);

create index if not exists idx_messages_project_id on public.messages(project_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);

-- =====================================================
-- FILES
-- =====================================================

create table if not exists public.files (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references public.projects(id) on delete cascade,
    uploaded_by uuid references public.profiles(id) on delete set null,

    category text not null check (
        category in (
            'designs',
            'documents',
            'deliverables',
            'invoices',
            'assets'
        )
    ),

    file_name text not null,
    file_url text not null,

    created_at timestamptz not null default now()
);

create index if not exists idx_files_project_id on public.files(project_id);

-- =====================================================
-- INVOICES
-- =====================================================

create table if not exists public.invoices (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references public.projects(id) on delete cascade,

    invoice_number text not null unique,
    milestone integer not null check (milestone in (1, 2, 3)),

    amount numeric(12,2) not null,

    status text not null default 'pending' check (
        status in ('paid', 'pending', 'overdue')
    ),

    due_date date,

    created_at timestamptz not null default now()
);

create index if not exists idx_invoices_project_id on public.invoices(project_id);
create index if not exists idx_invoices_status on public.invoices(status);

-- one invoice per project per milestone
create unique index if not exists idx_invoices_project_milestone
on public.invoices(project_id, milestone);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    is_read boolean not null default false,

    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
