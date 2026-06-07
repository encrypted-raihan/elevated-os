-- =====================================================
-- ELEVATED WEB SOLUTIONS PORTAL
-- SEED DATA V1
--
-- Assumptions:
-- 1) You already created Supabase Auth users in Authentication -> Users.
-- 2) The trigger in schema.sql auto-created matching rows in public.profiles.
-- 3) Usernames below exist in public.profiles.
-- =====================================================

-- Read profile ids from usernames
-- (This keeps the seed portable without hardcoding UUIDs)

-- =====================================================
-- PROJECTS
-- =====================================================

insert into public.projects (
    project_code,
    name,
    description,
    client_id,
    budget,
    status,
    progress,
    start_date,
    due_date
)
values (
    'EWS-001',
    'Luxury Villa Website',
    'Premium real estate website for luxury property marketing.',
    (select id from public.profiles where username = 'luxuryvillas' limit 1),
    50000,
    'development',
    72,
    current_date - interval '20 days',
    current_date + interval '25 days'
)
on conflict (project_code) do nothing;

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================

insert into public.project_members (
    project_id,
    user_id,
    role
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'raihan' limit 1),
    'project_manager'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'sachin' limit 1),
    'developer'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'akhil' limit 1),
    'designer'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'arjun' limit 1),
    'developer'
)
on conflict (project_id, user_id) do nothing;

-- =====================================================
-- PROJECT UPDATES
-- =====================================================

insert into public.project_updates (
    project_id,
    title,
    description,
    phase,
    created_by
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'Homepage Design Completed',
    'Client approved the homepage design.',
    'design',
    (select id from public.profiles where username = 'akhil' limit 1)
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'Development Started',
    'Frontend development phase has begun.',
    'development',
    (select id from public.profiles where username = 'arjun' limit 1)
);

-- =====================================================
-- MESSAGES
-- =====================================================

insert into public.messages (
    project_id,
    sender_id,
    message,
    attachment_url
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'luxuryvillas' limit 1),
    'Homepage looks excellent. Please continue with development.',
    null
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'raihan' limit 1),
    'Development has started. First build will be shared soon.',
    null
)
on conflict do nothing;

-- =====================================================
-- FILES
-- =====================================================

insert into public.files (
    project_id,
    uploaded_by,
    category,
    file_name,
    file_url
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'akhil' limit 1),
    'designs',
    'homepage-design-v2.png',
    '/demo/homepage-design-v2.png'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'arjun' limit 1),
    'documents',
    'project-scope.pdf',
    '/demo/project-scope.pdf'
)
on conflict do nothing;

-- =====================================================
-- INVOICES
-- =====================================================

insert into public.invoices (
    project_id,
    invoice_number,
    milestone,
    amount,
    status,
    due_date
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'INV-EWS001-01',
    1,
    25000,
    'paid',
    current_date - interval '15 days'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'INV-EWS001-02',
    2,
    15000,
    'pending',
    current_date + interval '10 days'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'INV-EWS001-03',
    3,
    10000,
    'pending',
    current_date + interval '30 days'
)
on conflict (invoice_number) do nothing;

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

insert into public.notifications (
    user_id,
    title,
    is_read
)
values
(
    (select id from public.profiles where username = 'raihan' limit 1),
    'New client message received',
    false
),
(
    (select id from public.profiles where username = 'akhil' limit 1),
    'Homepage design approved',
    false
),
(
    (select id from public.profiles where username = 'luxuryvillas' limit 1),
    'Development phase started',
    false
)
on conflict do nothing;-- =====================================================
-- ELEVATED WEB SOLUTIONS PORTAL
-- SEED DATA V1
--
-- Assumptions:
-- 1) You already created Supabase Auth users in Authentication -> Users.
-- 2) The trigger in schema.sql auto-created matching rows in public.profiles.
-- 3) Usernames below exist in public.profiles.
-- =====================================================

-- Read profile ids from usernames
-- (This keeps the seed portable without hardcoding UUIDs)

-- =====================================================
-- PROJECTS
-- =====================================================

insert into public.projects (
    project_code,
    name,
    description,
    client_id,
    budget,
    status,
    progress,
    start_date,
    due_date
)
values (
    'EWS-001',
    'Luxury Villa Website',
    'Premium real estate website for luxury property marketing.',
    (select id from public.profiles where username = 'luxuryvillas' limit 1),
    50000,
    'development',
    72,
    current_date - interval '20 days',
    current_date + interval '25 days'
)
on conflict (project_code) do nothing;

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================

insert into public.project_members (
    project_id,
    user_id,
    role
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'raihan' limit 1),
    'project_manager'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'sachin' limit 1),
    'developer'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'akhil' limit 1),
    'designer'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'arjun' limit 1),
    'developer'
)
on conflict (project_id, user_id) do nothing;

-- =====================================================
-- PROJECT UPDATES
-- =====================================================

insert into public.project_updates (
    project_id,
    title,
    description,
    phase,
    created_by
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'Homepage Design Completed',
    'Client approved the homepage design.',
    'design',
    (select id from public.profiles where username = 'akhil' limit 1)
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'Development Started',
    'Frontend development phase has begun.',
    'development',
    (select id from public.profiles where username = 'arjun' limit 1)
);

-- =====================================================
-- MESSAGES
-- =====================================================

insert into public.messages (
    project_id,
    sender_id,
    message,
    attachment_url
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'luxuryvillas' limit 1),
    'Homepage looks excellent. Please continue with development.',
    null
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'raihan' limit 1),
    'Development has started. First build will be shared soon.',
    null
)
on conflict do nothing;

-- =====================================================
-- FILES
-- =====================================================

insert into public.files (
    project_id,
    uploaded_by,
    category,
    file_name,
    file_url
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'akhil' limit 1),
    'designs',
    'homepage-design-v2.png',
    '/demo/homepage-design-v2.png'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    (select id from public.profiles where username = 'arjun' limit 1),
    'documents',
    'project-scope.pdf',
    '/demo/project-scope.pdf'
)
on conflict do nothing;

-- =====================================================
-- INVOICES
-- =====================================================

insert into public.invoices (
    project_id,
    invoice_number,
    milestone,
    amount,
    status,
    due_date
)
values
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'INV-EWS001-01',
    1,
    25000,
    'paid',
    current_date - interval '15 days'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'INV-EWS001-02',
    2,
    15000,
    'pending',
    current_date + interval '10 days'
),
(
    (select id from public.projects where project_code = 'EWS-001' limit 1),
    'INV-EWS001-03',
    3,
    10000,
    'pending',
    current_date + interval '30 days'
)
on conflict (invoice_number) do nothing;

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

insert into public.notifications (
    user_id,
    title,
    is_read
)
values
(
    (select id from public.profiles where username = 'raihan' limit 1),
    'New client message received',
    false
),
(
    (select id from public.profiles where username = 'akhil' limit 1),
    'Homepage design approved',
    false
),
(
    (select id from public.profiles where username = 'luxuryvillas' limit 1),
    'Development phase started',
    false
)
on conflict do nothing;