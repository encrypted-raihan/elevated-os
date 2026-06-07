-- =====================================================
-- ELEVATED WEB SOLUTIONS PORTAL
-- SCHEMA V1 (EMAIL + PASSWORD AUTH)
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- UPDATED_AT HELPER
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- PROFILES
-- =====================================================

create table if not exists public.profiles (
    id uuid primary key,
    full_name text not null,
    username text not null unique,
    email text not null unique,
    role text not null check (role in ('admin', 'team', 'client')),
    status text not null default 'active' check (status in ('active', 'inactive')),
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Auto-create profile when a Supabase Auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    insert into public.profiles (
        id,
        full_name,
        username,
        email,
        role,
        status,
        avatar_url
    )
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'client'),
        coalesce(new.raw_user_meta_data->>'status', 'active'),
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do update
    set
        full_name = excluded.full_name,
        username = excluded.username,
        email = excluded.email,
        role = excluded.role,
        status = excluded.status,
        avatar_url = excluded.avatar_url,
        updated_at = now();

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =====================================================
-- PROJECTS
-- =====================================================

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    project_code text not null unique,
    name text not null,
    description text,
    client_id uuid not null,
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
    progress integer not null default 0 check (progress >= 0 and progress <= 100),
    start_date date,
    due_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================

create table if not exists public.project_members (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null,
    user_id uuid not null,
    role text not null check (
        role in ('developer', 'designer', 'project_manager', 'content_writer', 'seo_specialist')
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
    project_id uuid not null,
    title text not null,
    description text,
    phase text check (phase in ('planning', 'design', 'development', 'testing', 'launch')),
    created_by uuid,
    created_at timestamptz not null default now()
);

create index if not exists idx_project_updates_project_id on public.project_updates(project_id);

-- =====================================================
-- MESSAGES
-- =====================================================

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null,
    sender_id uuid not null,
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
    project_id uuid not null,
    uploaded_by uuid,
    category text not null check (
        category in ('designs', 'documents', 'deliverables', 'payments')
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
    project_id uuid not null,
    invoice_number text not null unique,
    milestone integer not null check (milestone in (1, 2, 3)),
    amount numeric(12,2) not null,
    status text not null default 'pending' check (status in ('paid', 'pending', 'overdue')),
    due_date date,
    created_at timestamptz not null default now()
);

create unique index if not exists idx_invoices_project_milestone
on public.invoices(project_id, milestone);

create index if not exists idx_invoices_project_id on public.invoices(project_id);
create index if not exists idx_invoices_status on public.invoices(status);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    title text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);