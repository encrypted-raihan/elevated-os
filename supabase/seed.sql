-- =====================================================
-- ELEVATED WEB SOLUTIONS PORTAL
-- SEED DATA V1
-- Run this after schema.sql.
--
-- This seed creates demo Auth users directly inside auth.users
-- and matching profile rows in public.profiles.
-- =====================================================

-- =====================================================
-- DEMO AUTH USERS
-- =====================================================

-- NOTE:
-- If your Supabase project blocks direct writes to auth.users/auth.identities,
-- create these 4 users in Authentication > Users first, then re-run the
-- public table inserts below with the same UUIDs.
--
-- Demo credentials:
-- admin@elevatedwebsolutions.com / Admin@12345
-- akhil@elevatedwebsolutions.com / Team@12345
-- arjun@elevatedwebsolutions.com / Team@12345
-- client@luxuryvillas.com / Client@12345

insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
values
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@elevatedwebsolutions.com',
    crypt('Admin@12345', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Raihan","username":"raihan","role":"admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'akhil@elevatedwebsolutions.com',
    crypt('Team@12345', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Akhil Nair","username":"akhil","role":"team"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'arjun@elevatedwebsolutions.com',
    crypt('Team@12345', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Arjun Kumar","username":"arjun","role":"team"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'client@luxuryvillas.com',
    crypt('Client@12345', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Luxury Villas Pvt Ltd","username":"luxuryvillas","role":"client"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
)
on conflict (id) do nothing;

insert into auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
)
values
(
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'email',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@elevatedwebsolutions.com"}'::jsonb,
    now(),
    now(),
    now()
),
(
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'email',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"akhil@elevatedwebsolutions.com"}'::jsonb,
    now(),
    now(),
    now()
),
(
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'email',
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"arjun@elevatedwebsolutions.com"}'::jsonb,
    now(),
    now(),
    now()
),
(
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'email',
    '{"sub":"44444444-4444-4444-4444-444444444444","email":"client@luxuryvillas.com"}'::jsonb,
    now(),
    now(),
    now()
)
on conflict (id) do nothing;

-- =====================================================
-- PUBLIC PROFILES
-- =====================================================

insert into public.profiles (
    id,
    full_name,
    username,
    email,
    role,
    status
)
values
(
    '11111111-1111-1111-1111-111111111111',
    'Raihan',
    'raihan',
    'admin@elevatedwebsolutions.com',
    'admin',
    'active'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Akhil Nair',
    'akhil',
    'akhil@elevatedwebsolutions.com',
    'team',
    'active'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Arjun Kumar',
    'arjun',
    'arjun@elevatedwebsolutions.com',
    'team',
    'active'
),
(
    '44444444-4444-4444-4444-444444444444',
    'Luxury Villas Pvt Ltd',
    'luxuryvillas',
    'client@luxuryvillas.com',
    'client',
    'active'
)
on conflict (id) do nothing;

-- =====================================================
-- PROJECTS
-- =====================================================

insert into public.projects (
    id,
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
values
(
    '55555555-5555-5555-5555-555555555555',
    'EWS-001',
    'Luxury Villa Website',
    'Premium real estate website for luxury property marketing.',
    '44444444-4444-4444-4444-444444444444',
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
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'designer'
),
(
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
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
    '55555555-5555-5555-5555-555555555555',
    'Homepage Design Completed',
    'Homepage design approved by client.',
    'design',
    '22222222-2222-2222-2222-222222222222'
),
(
    '55555555-5555-5555-5555-555555555555',
    'Development Started',
    'Frontend development phase started.',
    'development',
    '33333333-3333-3333-3333-333333333333'
);

-- =====================================================
-- MESSAGES
-- =====================================================

insert into public.messages (
    project_id,
    sender_id,
    message
)
values
(
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'Homepage looks excellent. Please continue with development.'
),
(
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Development has started and the first build will be shared soon.'
);

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
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'designs',
    'homepage-design-v2.png',
    '/demo/homepage-design-v2.png'
),
(
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'documents',
    'project-scope.pdf',
    '/demo/project-scope.pdf'
);

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
    '55555555-5555-5555-5555-555555555555',
    'INV-EWS001-01',
    1,
    25000,
    'paid',
    current_date - interval '15 days'
),
(
    '55555555-5555-5555-5555-555555555555',
    'INV-EWS001-02',
    2,
    15000,
    'pending',
    current_date + interval '10 days'
),
(
    '55555555-5555-5555-5555-555555555555',
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
    '11111111-1111-1111-1111-111111111111',
    'New client message received',
    false
),
(
    '22222222-2222-2222-2222-222222222222',
    'Homepage design approved',
    false
),
(
    '44444444-4444-4444-4444-444444444444',
    'Development phase started',
    false
);
