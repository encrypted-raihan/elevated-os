-- =====================================================
-- ELEVATED WEB SOLUTIONS PORTAL
-- RLS POLICIES V1
-- =====================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_updates enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
    );
$$;

create or replace function public.is_project_client(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists (
        select 1
        from public.projects p
        where p.id = p_project_id
          and p.client_id = auth.uid()
    );
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists (
        select 1
        from public.project_members pm
        where pm.project_id = p_project_id
          and pm.user_id = auth.uid()
    );
$$;

create or replace function public.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select public.is_admin()
        or public.is_project_client(p_project_id)
        or public.is_project_member(p_project_id);
$$;

-- =====================================================
-- PROFILES
-- =====================================================

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
    auth.uid() = id or public.is_admin()
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
    auth.uid() = id or public.is_admin()
)
with check (
    auth.uid() = id or public.is_admin()
);

drop policy if exists "profiles_insert_admin_only" on public.profiles;
create policy "profiles_insert_admin_only"
on public.profiles
for insert
to authenticated
with check (
    public.is_admin()
);

drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only"
on public.profiles
for delete
to authenticated
using (
    public.is_admin()
);

-- =====================================================
-- PROJECTS
-- =====================================================

drop policy if exists "projects_select_access" on public.projects;
create policy "projects_select_access"
on public.projects
for select
to authenticated
using (
    public.has_project_access(id)
);

drop policy if exists "projects_insert_admin_only" on public.projects;
create policy "projects_insert_admin_only"
on public.projects
for insert
to authenticated
with check (
    public.is_admin()
);

drop policy if exists "projects_update_admin_only" on public.projects;
create policy "projects_update_admin_only"
on public.projects
for update
to authenticated
using (
    public.is_admin()
)
with check (
    public.is_admin()
);

drop policy if exists "projects_delete_admin_only" on public.projects;
create policy "projects_delete_admin_only"
on public.projects
for delete
to authenticated
using (
    public.is_admin()
);

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================

drop policy if exists "project_members_select_access" on public.project_members;
create policy "project_members_select_access"
on public.project_members
for select
to authenticated
using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_project_access(project_id)
);

drop policy if exists "project_members_insert_admin_only" on public.project_members;
create policy "project_members_insert_admin_only"
on public.project_members
for insert
to authenticated
with check (
    public.is_admin()
);

drop policy if exists "project_members_update_admin_only" on public.project_members;
create policy "project_members_update_admin_only"
on public.project_members
for update
to authenticated
using (
    public.is_admin()
)
with check (
    public.is_admin()
);

drop policy if exists "project_members_delete_admin_only" on public.project_members;
create policy "project_members_delete_admin_only"
on public.project_members
for delete
to authenticated
using (
    public.is_admin()
);

-- =====================================================
-- PROJECT UPDATES
-- =====================================================

drop policy if exists "project_updates_select_access" on public.project_updates;
create policy "project_updates_select_access"
on public.project_updates
for select
to authenticated
using (
    public.has_project_access(project_id)
);

drop policy if exists "project_updates_insert_member_or_admin" on public.project_updates;
create policy "project_updates_insert_member_or_admin"
on public.project_updates
for insert
to authenticated
with check (
    public.is_admin()
    or (
        auth.uid() = created_by
        and public.has_project_access(project_id)
    )
);

drop policy if exists "project_updates_update_admin_only" on public.project_updates;
create policy "project_updates_update_admin_only"
on public.project_updates
for update
to authenticated
using (
    public.is_admin()
)
with check (
    public.is_admin()
);

drop policy if exists "project_updates_delete_admin_only" on public.project_updates;
create policy "project_updates_delete_admin_only"
on public.project_updates
for delete
to authenticated
using (
    public.is_admin()
);

-- =====================================================
-- MESSAGES
-- =====================================================

drop policy if exists "messages_select_access" on public.messages;
create policy "messages_select_access"
on public.messages
for select
to authenticated
using (
    public.has_project_access(project_id)
);

drop policy if exists "messages_insert_sender_or_admin" on public.messages;
create policy "messages_insert_sender_or_admin"
on public.messages
for insert
to authenticated
with check (
    public.is_admin()
    or (
        sender_id = auth.uid()
        and public.has_project_access(project_id)
    )
);

drop policy if exists "messages_update_sender_or_admin" on public.messages;
create policy "messages_update_sender_or_admin"
on public.messages
for update
to authenticated
using (
    public.is_admin() or sender_id = auth.uid()
)
with check (
    public.is_admin() or sender_id = auth.uid()
);

drop policy if exists "messages_delete_sender_or_admin" on public.messages;
create policy "messages_delete_sender_or_admin"
on public.messages
for delete
to authenticated
using (
    public.is_admin() or sender_id = auth.uid()
);

-- =====================================================
-- FILES
-- =====================================================

drop policy if exists "files_select_access" on public.files;
create policy "files_select_access"
on public.files
for select
to authenticated
using (
    public.has_project_access(project_id)
);

drop policy if exists "files_insert_admin_or_member" on public.files;
create policy "files_insert_admin_or_member"
on public.files
for insert
to authenticated
with check (
    public.is_admin()
    or (
        uploaded_by = auth.uid()
        and public.has_project_access(project_id)
    )
);

drop policy if exists "files_update_admin_only" on public.files;
create policy "files_update_admin_only"
on public.files
for update
to authenticated
using (
    public.is_admin()
)
with check (
    public.is_admin()
);

drop policy if exists "files_delete_admin_only" on public.files;
create policy "files_delete_admin_only"
on public.files
for delete
to authenticated
using (
    public.is_admin()
);

-- =====================================================
-- INVOICES
-- =====================================================

drop policy if exists "invoices_select_admin_or_client" on public.invoices;
create policy "invoices_select_admin_or_client"
on public.invoices
for select
to authenticated
using (
    public.is_admin()
    or public.is_project_client(project_id)
);

drop policy if exists "invoices_insert_admin_only" on public.invoices;
create policy "invoices_insert_admin_only"
on public.invoices
for insert
to authenticated
with check (
    public.is_admin()
);

drop policy if exists "invoices_update_admin_only" on public.invoices;
create policy "invoices_update_admin_only"
on public.invoices
for update
to authenticated
using (
    public.is_admin()
)
with check (
    public.is_admin()
);

drop policy if exists "invoices_delete_admin_only" on public.invoices;
create policy "invoices_delete_admin_only"
on public.invoices
for delete
to authenticated
using (
    public.is_admin()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
on public.notifications
for select
to authenticated
using (
    user_id = auth.uid() or public.is_admin()
);

drop policy if exists "notifications_update_own_or_admin" on public.notifications;
create policy "notifications_update_own_or_admin"
on public.notifications
for update
to authenticated
using (
    user_id = auth.uid() or public.is_admin()
)
with check (
    user_id = auth.uid() or public.is_admin()
);

drop policy if exists "notifications_insert_admin_only" on public.notifications;
create policy "notifications_insert_admin_only"
on public.notifications
for insert
to authenticated
with check (
    public.is_admin()
);

drop policy if exists "notifications_delete_admin_only" on public.notifications;
create policy "notifications_delete_admin_only"
on public.notifications
for delete
to authenticated
using (
    public.is_admin()
);