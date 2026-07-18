/*
# EECAE — Schéma central multi-assemblées (Phase 1)

## Description
Crée le socle de l'application de gestion de l'Église Évangélique Centre
d'Adoration de l'Éternel (EECAE). Cette migration pose les tables fondamentales
multi-assemblées, l'authentification, les rôles, les membres, les familles,
les visiteurs, les programmes/cultes, les prédications, les présences et les
absences.

## Nouvelles tables
- `churches`, `church_locations` — assemblées et localisations.
- `application_settings` — configuration générale.
- `user_profiles`, `user_church_access` — profils et accès multi-assemblées.
- `audit_logs` — journal d'audit.
- `departments`, `department_members` — départements et ministères.
- `cells`, `cell_members` — cellules de maison.
- `members`, `member_status_history` — registre central des membres.
- `families`, `family_members` — foyers.
- `visitors`, `visitor_followups`, `visitor_status_history` — visiteurs et suivi.
- `event_types`, `events`, `sermons` — programmes, cultes, prédications.
- `attendance_sessions`, `attendance_records`, `attendance_totals` — présences.
- `absence_followups` — suivis d'absence.

## Sécurité (RLS)
- RLS activée sur toutes les tables.
- Fonctions d'aide : `is_super_admin()`, `user_church_ids()`, `user_can_access_church(uuid)`.
- Politiques limitent l'accès aux assemblées autorisées ; super admin voit tout.
- audit_logs : insertion pour tout authentifié, lecture réservée au super admin.

## Notes
- `archived_at` pour l'archivage logiciel au lieu de suppression définitive.
- `created_by` / `updated_by` référencent auth.users pour la traçabilité.
- Index sur church_id, clés étrangères et colonnes de recherche.
*/

create extension if not exists pgcrypto;

-- ============================================================
-- ASSEMBLÉES & LOCALISATIONS
-- ============================================================
create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  is_headquarters boolean not null default false,
  parent_church_id uuid references public.churches(id) on delete set null,
  address text,
  neighborhood text,
  city text,
  country text not null default 'Côte d''Ivoire',
  phone text,
  email text,
  senior_pastor text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_churches_status on public.churches(status);
create index if not exists idx_churches_parent on public.churches(parent_church_id);

create table if not exists public.church_locations (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  label text not null,
  address text,
  neighborhood text,
  city text,
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_church_locations_church on public.church_locations(church_id);

create table if not exists public.application_settings (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  key text not null,
  value jsonb,
  is_global boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, key)
);

-- ============================================================
-- PROFILS UTILISATEURS & ACCÈS
-- ============================================================
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'member' check (role in (
    'super_admin','hq_admin','senior_pastor','assembly_pastor',
    'secretary','treasurer','department_head','cell_leader',
    'pastoral_care','data_entry','member'
  )),
  default_church_id uuid references public.churches(id) on delete set null,
  avatar_url text,
  is_active boolean not null default true,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_user_profiles_role on public.user_profiles(role);
create index if not exists idx_user_profiles_church on public.user_profiles(default_church_id);

create table if not exists public.user_church_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  role text not null default 'member',
  can_view_finance boolean not null default false,
  can_view_pastoral boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, church_id)
);
create index if not exists idx_user_church_access_user on public.user_church_access(user_id);
create index if not exists idx_user_church_access_church on public.user_church_access(church_id);

-- ============================================================
-- JOURNAL D'AUDIT
-- ============================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null,
  module text,
  entity_type text,
  entity_id uuid,
  church_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_church on public.audit_logs(church_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_action on public.audit_logs(action);

-- ============================================================
-- DÉPARTEMENTS & CELLULES
-- ============================================================
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  description text,
  head_member_id uuid,
  deputy_member_id uuid,
  secretary_member_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_departments_church on public.departments(church_id);

create table if not exists public.department_members (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  member_id uuid not null,
  role text default 'member',
  joined_at date default current_date,
  created_at timestamptz not null default now(),
  unique (department_id, member_id)
);
create index if not exists idx_dept_members_dept on public.department_members(department_id);
create index if not exists idx_dept_members_member on public.department_members(member_id);

create table if not exists public.cells (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  code text,
  zone text,
  neighborhood text,
  address text,
  leader_member_id uuid,
  deputy_member_id uuid,
  host_member_id uuid,
  phone text,
  meeting_day text,
  meeting_time text,
  capacity integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_cells_church on public.cells(church_id);

create table if not exists public.cell_members (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.cells(id) on delete cascade,
  member_id uuid not null,
  joined_at date default current_date,
  created_at timestamptz not null default now(),
  unique (cell_id, member_id)
);
create index if not exists idx_cell_members_cell on public.cell_members(cell_id);
create index if not exists idx_cell_members_member on public.cell_members(member_id);

-- ============================================================
-- MEMBRES
-- ============================================================
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  matricule text unique,
  photo_url text,
  last_name text not null,
  first_name text not null,
  sex text check (sex in ('M','F')),
  birth_date date,
  birth_place text,
  nationality text default 'Côte d''Ivoire',
  marital_status text check (marital_status in ('single','married','divorced','widowed','separated','unknown')),
  profession text,
  education_level text,
  address text,
  neighborhood text,
  city text,
  country text default 'Côte d''Ivoire',
  phone_main text,
  phone_whatsapp text,
  email text,
  emergency_contact_name text,
  emergency_contact_relation text,
  emergency_contact_phone text,
  first_visit_date date,
  integration_date date,
  conversion_date date,
  water_baptism_date date,
  holy_spirit_baptized boolean default false,
  holy_spirit_baptism_date date,
  status text not null default 'visitor' check (status in (
    'visitor','new_visitor','new_convert','integrating','active','irregular',
    'inactive','transferred','left','deceased','archived'
  )),
  department_id uuid references public.departments(id) on delete set null,
  sub_department text,
  cell_id uuid references public.cells(id) on delete set null,
  pastoral_responsible text,
  training_class text,
  spiritual_gift text,
  ministry text,
  function text,
  available_for_service boolean default true,
  pastoral_notes text,
  notes_confidential boolean not null default false,
  visitor_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_members_church on public.members(church_id);
create index if not exists idx_members_status on public.members(status);
create index if not exists idx_members_name on public.members(last_name, first_name);
create index if not exists idx_members_phone on public.members(phone_main);
create index if not exists idx_members_email on public.members(email);
create index if not exists idx_members_matricule on public.members(matricule);
create index if not exists idx_members_dept on public.members(department_id);
create index if not exists idx_members_cell on public.members(cell_id);
create index if not exists idx_members_archived on public.members(archived_at);

create table if not exists public.member_status_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  previous_status text,
  new_status text not null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_by_name text,
  changed_at timestamptz not null default now()
);
create index if not exists idx_member_status_member on public.member_status_history(member_id);
create index if not exists idx_member_status_changed on public.member_status_history(changed_at desc);

-- ============================================================
-- FAMILLES
-- ============================================================
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  head_member_id uuid,
  spouse_member_id uuid,
  address text,
  neighborhood text,
  city text,
  cell_id uuid references public.cells(id) on delete set null,
  main_contact_phone text,
  household_status text default 'active' check (household_status in ('active','inactive','separated','relocated','archived')),
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_families_church on public.families(church_id);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null,
  role_in_family text not null check (role_in_family in ('head','spouse','child','dependent','other')),
  created_at timestamptz not null default now(),
  unique (family_id, member_id)
);
create index if not exists idx_family_members_family on public.family_members(family_id);
create index if not exists idx_family_members_member on public.family_members(member_id);

-- ============================================================
-- VISITEURS
-- ============================================================
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  last_name text not null,
  first_name text not null,
  sex text check (sex in ('M','F')),
  age_range text check (age_range in ('child','teen','young_adult','adult','senior','unknown')),
  phone text,
  phone_whatsapp text,
  address text,
  neighborhood text,
  city text,
  profession text,
  origin_church text,
  invited_by text,
  first_visit_date date not null default current_date,
  event_id uuid,
  prayer_subject text,
  wants_contact boolean default false,
  wants_to_join boolean default false,
  wants_pastoral_visit boolean default false,
  visit_count integer not null default 1,
  status text not null default 'first_visit' check (status in (
    'first_visit','second_visit','regular','integrating','converted',
    'became_member','no_contact','lost'
  )),
  observations text,
  converted_member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_visitors_church on public.visitors(church_id);
create index if not exists idx_visitors_status on public.visitors(status);
create index if not exists idx_visitors_name on public.visitors(last_name, first_name);
create index if not exists idx_visitors_phone on public.visitors(phone);
create index if not exists idx_visitors_first_visit on public.visitors(first_visit_date);

create table if not exists public.visitor_followups (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  step text not null check (step in (
    'welcome_message','phone_call','pastoral_visit','second_attendance',
    'cell_orientation','integration_class','conversion','baptism','membership'
  )),
  responsible text,
  status text not null default 'pending' check (status in ('pending','done','skipped','cancelled')),
  scheduled_date date,
  completed_date date,
  report text,
  next_action text,
  next_date date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_visitor_followups_visitor on public.visitor_followups(visitor_id);
create index if not exists idx_visitor_followups_status on public.visitor_followups(status);
create index if not exists idx_visitor_followups_scheduled on public.visitor_followups(scheduled_date);

create table if not exists public.visitor_status_history (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  previous_status text,
  new_status text not null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index if not exists idx_visitor_status_visitor on public.visitor_status_history(visitor_id);

-- ============================================================
-- PROGRAMMES, CULTES & PRÉDICATIONS
-- ============================================================
create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_event_types_church on public.event_types(church_id);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  title text not null,
  type text not null,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  theme text,
  sub_theme text,
  main_verse text,
  preacher text,
  moderator text,
  prayer_leader text,
  program_responsible text,
  choir text,
  worship_team text,
  intercession_team text,
  protocol_team text,
  security_team text,
  media_team text,
  children_teachers text,
  technicians text,
  other_workers text,
  seats_available integer,
  poster_url text,
  description text,
  observations text,
  status text not null default 'planned' check (status in ('planned','ongoing','done','cancelled','postponed')),
  closure_validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_events_church on public.events(church_id);
create index if not exists idx_events_date on public.events(event_date);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_type on public.events(type);

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  theme text not null,
  sub_theme text,
  preacher text not null,
  sermon_date date not null,
  program_type text,
  main_verse text,
  other_references text,
  summary text,
  main_points text,
  recommendation text,
  video_url text,
  audio_url text,
  pdf_url text,
  poster_url text,
  transcript text,
  keywords text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_sermons_church on public.sermons(church_id);
create index if not exists idx_sermons_date on public.sermons(sermon_date);
create index if not exists idx_sermons_preacher on public.sermons(preacher);

-- ============================================================
-- PRÉSENCES & ABSENCES
-- ============================================================
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  session_date date not null,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_attendance_sessions_event on public.attendance_sessions(event_id);
create index if not exists idx_attendance_sessions_church on public.attendance_sessions(church_id);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  member_id uuid not null,
  is_visitor boolean not null default false,
  visitor_id uuid,
  created_at timestamptz not null default now(),
  unique (session_id, member_id)
);
create index if not exists idx_attendance_records_session on public.attendance_records(session_id);
create index if not exists idx_attendance_records_member on public.attendance_records(member_id);

create table if not exists public.attendance_totals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.attendance_sessions(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  men integer not null default 0,
  women integer not null default 0,
  children integer not null default 0,
  teens integer not null default 0,
  youth_12_40 integer not null default 0,
  adults integer not null default 0,
  seniors integer not null default 0,
  identified_members integer not null default 0,
  visitors integer not null default 0,
  new_visitors integer not null default 0,
  returned_after_absence integer not null default 0,
  total_participants integer not null default 0,
  children_service_count integer not null default 0,
  outside_count integer not null default 0,
  online_count integer not null default 0,
  decisions_for_christ integer not null default 0,
  testimonies integer not null default 0,
  baptisms_announced integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_attendance_totals_session on public.attendance_totals(session_id);
create index if not exists idx_attendance_totals_church on public.attendance_totals(church_id);

create table if not exists public.absence_followups (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  member_id uuid not null,
  assigned_to text,
  reason text check (reason in ('illness','travel','relocation','family','financial','conflict','church_change','work','other')),
  call_done boolean default false,
  message_sent boolean default false,
  visit_done boolean default false,
  reason_detail text,
  report text,
  next_action text,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_absence_followups_member on public.absence_followups(member_id);
create index if not exists idx_absence_followups_church on public.absence_followups(church_id);
create index if not exists idx_absence_followups_status on public.absence_followups(status);

-- ============================================================
-- FONCTIONS D'AIDE (après création de user_profiles)
-- ============================================================
create or replace function public.is_super_admin()
returns boolean language sql stable security invoker as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.user_church_ids()
returns uuid[] language sql stable security invoker as $$
  select coalesce(array_agg(distinct church_id), array[]::uuid[]) from (
    select uca.church_id from public.user_church_access uca
    where uca.user_id = auth.uid() and uca.is_active
    union
    select up.default_church_id from public.user_profiles up
    where up.id = auth.uid() and up.default_church_id is not null
  ) s;
$$;

create or replace function public.user_can_access_church(p_church_id uuid)
returns boolean language sql stable security invoker as $$
  select public.is_super_admin() or p_church_id = any(public.user_church_ids());
$$;

-- ============================================================
-- ACTIVATION RLS
-- ============================================================
alter table public.churches enable row level security;
alter table public.church_locations enable row level security;
alter table public.application_settings enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_church_access enable row level security;
alter table public.audit_logs enable row level security;
alter table public.departments enable row level security;
alter table public.department_members enable row level security;
alter table public.cells enable row level security;
alter table public.cell_members enable row level security;
alter table public.members enable row level security;
alter table public.member_status_history enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.visitors enable row level security;
alter table public.visitor_followups enable row level security;
alter table public.visitor_status_history enable row level security;
alter table public.event_types enable row level security;
alter table public.events enable row level security;
alter table public.sermons enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_totals enable row level security;
alter table public.absence_followups enable row level security;

-- ============================================================
-- POLITIQUES RLS
-- ============================================================
-- CHURCHES
drop policy if exists "select_churches" on public.churches;
create policy "select_churches" on public.churches for select to authenticated
  using (public.is_super_admin() or id = any(public.user_church_ids()));
drop policy if exists "insert_churches" on public.churches;
create policy "insert_churches" on public.churches for insert to authenticated with check (public.is_super_admin());
drop policy if exists "update_churches" on public.churches;
create policy "update_churches" on public.churches for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "delete_churches" on public.churches;
create policy "delete_churches" on public.churches for delete to authenticated using (public.is_super_admin());

-- CHURCH_LOCATIONS
drop policy if exists "select_church_locations" on public.church_locations;
create policy "select_church_locations" on public.church_locations for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_church_locations" on public.church_locations;
create policy "insert_church_locations" on public.church_locations for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_church_locations" on public.church_locations;
create policy "update_church_locations" on public.church_locations for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_church_locations" on public.church_locations;
create policy "delete_church_locations" on public.church_locations for delete to authenticated using (public.user_can_access_church(church_id));

-- APPLICATION_SETTINGS
drop policy if exists "select_settings" on public.application_settings;
create policy "select_settings" on public.application_settings for select to authenticated using (is_global or public.user_can_access_church(church_id));
drop policy if exists "insert_settings" on public.application_settings;
create policy "insert_settings" on public.application_settings for insert to authenticated with check (public.is_super_admin() or public.user_can_access_church(church_id));
drop policy if exists "update_settings" on public.application_settings;
create policy "update_settings" on public.application_settings for update to authenticated using (public.is_super_admin() or public.user_can_access_church(church_id)) with check (public.is_super_admin() or public.user_can_access_church(church_id));
drop policy if exists "delete_settings" on public.application_settings;
create policy "delete_settings" on public.application_settings for delete to authenticated using (public.is_super_admin());

-- USER_PROFILES
drop policy if exists "select_own_profile" on public.user_profiles;
create policy "select_own_profile" on public.user_profiles for select to authenticated using (id = auth.uid() or public.is_super_admin());
drop policy if exists "insert_own_profile" on public.user_profiles;
create policy "insert_own_profile" on public.user_profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "update_own_profile" on public.user_profiles;
create policy "update_own_profile" on public.user_profiles for update to authenticated using (id = auth.uid() or public.is_super_admin()) with check (id = auth.uid() or public.is_super_admin());
drop policy if exists "delete_profile" on public.user_profiles;
create policy "delete_profile" on public.user_profiles for delete to authenticated using (public.is_super_admin());

-- USER_CHURCH_ACCESS
drop policy if exists "select_own_access" on public.user_church_access;
create policy "select_own_access" on public.user_church_access for select to authenticated using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "insert_access" on public.user_church_access;
create policy "insert_access" on public.user_church_access for insert to authenticated with check (public.is_super_admin() or user_id = auth.uid());
drop policy if exists "update_access" on public.user_church_access;
create policy "update_access" on public.user_church_access for update to authenticated using (public.is_super_admin() or user_id = auth.uid()) with check (public.is_super_admin() or user_id = auth.uid());
drop policy if exists "delete_access" on public.user_church_access;
create policy "delete_access" on public.user_church_access for delete to authenticated using (public.is_super_admin() or user_id = auth.uid());

-- AUDIT_LOGS
drop policy if exists "insert_audit" on public.audit_logs;
create policy "insert_audit" on public.audit_logs for insert to authenticated with check (true);
drop policy if exists "select_audit" on public.audit_logs;
create policy "select_audit" on public.audit_logs for select to authenticated using (public.is_super_admin());

-- DEPARTMENTS
drop policy if exists "select_departments" on public.departments;
create policy "select_departments" on public.departments for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_departments" on public.departments;
create policy "insert_departments" on public.departments for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_departments" on public.departments;
create policy "update_departments" on public.departments for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_departments" on public.departments;
create policy "delete_departments" on public.departments for delete to authenticated using (public.user_can_access_church(church_id));

-- DEPARTMENT_MEMBERS
drop policy if exists "select_dept_members" on public.department_members;
create policy "select_dept_members" on public.department_members for select to authenticated using (exists (select 1 from public.departments d where d.id = department_id and public.user_can_access_church(d.church_id)));
drop policy if exists "insert_dept_members" on public.department_members;
create policy "insert_dept_members" on public.department_members for insert to authenticated with check (exists (select 1 from public.departments d where d.id = department_id and public.user_can_access_church(d.church_id)));
drop policy if exists "delete_dept_members" on public.department_members;
create policy "delete_dept_members" on public.department_members for delete to authenticated using (exists (select 1 from public.departments d where d.id = department_id and public.user_can_access_church(d.church_id)));

-- CELLS
drop policy if exists "select_cells" on public.cells;
create policy "select_cells" on public.cells for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_cells" on public.cells;
create policy "insert_cells" on public.cells for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_cells" on public.cells;
create policy "update_cells" on public.cells for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_cells" on public.cells;
create policy "delete_cells" on public.cells for delete to authenticated using (public.user_can_access_church(church_id));

-- CELL_MEMBERS
drop policy if exists "select_cell_members" on public.cell_members;
create policy "select_cell_members" on public.cell_members for select to authenticated using (exists (select 1 from public.cells c where c.id = cell_id and public.user_can_access_church(c.church_id)));
drop policy if exists "insert_cell_members" on public.cell_members;
create policy "insert_cell_members" on public.cell_members for insert to authenticated with check (exists (select 1 from public.cells c where c.id = cell_id and public.user_can_access_church(c.church_id)));
drop policy if exists "delete_cell_members" on public.cell_members;
create policy "delete_cell_members" on public.cell_members for delete to authenticated using (exists (select 1 from public.cells c where c.id = cell_id and public.user_can_access_church(c.church_id)));

-- MEMBERS
drop policy if exists "select_members" on public.members;
create policy "select_members" on public.members for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_members" on public.members;
create policy "insert_members" on public.members for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_members" on public.members;
create policy "update_members" on public.members for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_members" on public.members;
create policy "delete_members" on public.members for delete to authenticated using (public.user_can_access_church(church_id));

-- MEMBER_STATUS_HISTORY
drop policy if exists "select_member_status" on public.member_status_history;
create policy "select_member_status" on public.member_status_history for select to authenticated using (exists (select 1 from public.members m where m.id = member_id and public.user_can_access_church(m.church_id)));
drop policy if exists "insert_member_status" on public.member_status_history;
create policy "insert_member_status" on public.member_status_history for insert to authenticated with check (exists (select 1 from public.members m where m.id = member_id and public.user_can_access_church(m.church_id)));

-- FAMILIES
drop policy if exists "select_families" on public.families;
create policy "select_families" on public.families for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_families" on public.families;
create policy "insert_families" on public.families for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_families" on public.families;
create policy "update_families" on public.families for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_families" on public.families;
create policy "delete_families" on public.families for delete to authenticated using (public.user_can_access_church(church_id));

-- FAMILY_MEMBERS
drop policy if exists "select_family_members" on public.family_members;
create policy "select_family_members" on public.family_members for select to authenticated using (exists (select 1 from public.families f where f.id = family_id and public.user_can_access_church(f.church_id)));
drop policy if exists "insert_family_members" on public.family_members;
create policy "insert_family_members" on public.family_members for insert to authenticated with check (exists (select 1 from public.families f where f.id = family_id and public.user_can_access_church(f.church_id)));
drop policy if exists "delete_family_members" on public.family_members;
create policy "delete_family_members" on public.family_members for delete to authenticated using (exists (select 1 from public.families f where f.id = family_id and public.user_can_access_church(f.church_id)));

-- VISITORS
drop policy if exists "select_visitors" on public.visitors;
create policy "select_visitors" on public.visitors for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_visitors" on public.visitors;
create policy "insert_visitors" on public.visitors for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_visitors" on public.visitors;
create policy "update_visitors" on public.visitors for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_visitors" on public.visitors;
create policy "delete_visitors" on public.visitors for delete to authenticated using (public.user_can_access_church(church_id));

-- VISITOR_FOLLOWUPS
drop policy if exists "select_visitor_followups" on public.visitor_followups;
create policy "select_visitor_followups" on public.visitor_followups for select to authenticated using (exists (select 1 from public.visitors v where v.id = visitor_id and public.user_can_access_church(v.church_id)));
drop policy if exists "insert_visitor_followups" on public.visitor_followups;
create policy "insert_visitor_followups" on public.visitor_followups for insert to authenticated with check (exists (select 1 from public.visitors v where v.id = visitor_id and public.user_can_access_church(v.church_id)));
drop policy if exists "update_visitor_followups" on public.visitor_followups;
create policy "update_visitor_followups" on public.visitor_followups for update to authenticated using (exists (select 1 from public.visitors v where v.id = visitor_id and public.user_can_access_church(v.church_id))) with check (exists (select 1 from public.visitors v where v.id = visitor_id and public.user_can_access_church(v.church_id)));

-- VISITOR_STATUS_HISTORY
drop policy if exists "select_visitor_status" on public.visitor_status_history;
create policy "select_visitor_status" on public.visitor_status_history for select to authenticated using (exists (select 1 from public.visitors v where v.id = visitor_id and public.user_can_access_church(v.church_id)));
drop policy if exists "insert_visitor_status" on public.visitor_status_history;
create policy "insert_visitor_status" on public.visitor_status_history for insert to authenticated with check (exists (select 1 from public.visitors v where v.id = visitor_id and public.user_can_access_church(v.church_id)));

-- EVENT_TYPES
drop policy if exists "select_event_types" on public.event_types;
create policy "select_event_types" on public.event_types for select to authenticated using (church_id is null or public.user_can_access_church(church_id));
drop policy if exists "insert_event_types" on public.event_types;
create policy "insert_event_types" on public.event_types for insert to authenticated with check (public.is_super_admin() or public.user_can_access_church(church_id));

-- EVENTS
drop policy if exists "select_events" on public.events;
create policy "select_events" on public.events for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_events" on public.events;
create policy "insert_events" on public.events for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_events" on public.events;
create policy "update_events" on public.events for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_events" on public.events;
create policy "delete_events" on public.events for delete to authenticated using (public.user_can_access_church(church_id));

-- SERMONS
drop policy if exists "select_sermons" on public.sermons;
create policy "select_sermons" on public.sermons for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_sermons" on public.sermons;
create policy "insert_sermons" on public.sermons for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_sermons" on public.sermons;
create policy "update_sermons" on public.sermons for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_sermons" on public.sermons;
create policy "delete_sermons" on public.sermons for delete to authenticated using (public.user_can_access_church(church_id));

-- ATTENDANCE_SESSIONS
drop policy if exists "select_attendance_sessions" on public.attendance_sessions;
create policy "select_attendance_sessions" on public.attendance_sessions for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_attendance_sessions" on public.attendance_sessions;
create policy "insert_attendance_sessions" on public.attendance_sessions for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "delete_attendance_sessions" on public.attendance_sessions;
create policy "delete_attendance_sessions" on public.attendance_sessions for delete to authenticated using (public.user_can_access_church(church_id));

-- ATTENDANCE_RECORDS
drop policy if exists "select_attendance_records" on public.attendance_records;
create policy "select_attendance_records" on public.attendance_records for select to authenticated using (exists (select 1 from public.attendance_sessions s where s.id = session_id and public.user_can_access_church(s.church_id)));
drop policy if exists "insert_attendance_records" on public.attendance_records;
create policy "insert_attendance_records" on public.attendance_records for insert to authenticated with check (exists (select 1 from public.attendance_sessions s where s.id = session_id and public.user_can_access_church(s.church_id)));
drop policy if exists "delete_attendance_records" on public.attendance_records;
create policy "delete_attendance_records" on public.attendance_records for delete to authenticated using (exists (select 1 from public.attendance_sessions s where s.id = session_id and public.user_can_access_church(s.church_id)));

-- ATTENDANCE_TOTALS
drop policy if exists "select_attendance_totals" on public.attendance_totals;
create policy "select_attendance_totals" on public.attendance_totals for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_attendance_totals" on public.attendance_totals;
create policy "insert_attendance_totals" on public.attendance_totals for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_attendance_totals" on public.attendance_totals;
create policy "update_attendance_totals" on public.attendance_totals for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_attendance_totals" on public.attendance_totals;
create policy "delete_attendance_totals" on public.attendance_totals for delete to authenticated using (public.user_can_access_church(church_id));

-- ABSENCE_FOLLOWUPS
drop policy if exists "select_absence_followups" on public.absence_followups;
create policy "select_absence_followups" on public.absence_followups for select to authenticated using (public.user_can_access_church(church_id));
drop policy if exists "insert_absence_followups" on public.absence_followups;
create policy "insert_absence_followups" on public.absence_followups for insert to authenticated with check (public.user_can_access_church(church_id));
drop policy if exists "update_absence_followups" on public.absence_followups;
create policy "update_absence_followups" on public.absence_followups for update to authenticated using (public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));
drop policy if exists "delete_absence_followups" on public.absence_followups;
create policy "delete_absence_followups" on public.absence_followups for delete to authenticated using (public.user_can_access_church(church_id));

-- ============================================================
-- TRIGGER updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'churches','church_locations','application_settings','user_profiles',
    'user_church_access','departments','cells','members','families',
    'visitors','events','sermons','attendance_totals','absence_followups'
  ])
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
