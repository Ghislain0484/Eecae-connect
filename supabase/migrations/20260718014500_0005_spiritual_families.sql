-- MIGRATION: 20260718014500_0005_spiritual_families.sql
-- Description: Ajout du module des familles spirituelles

-- 1. Création de la table des familles spirituelles
create table if not exists public.spiritual_families (
    id uuid primary key default gen_random_uuid(),
    church_id uuid not null references public.churches(id) on delete cascade,
    name text not null,
    color_name text not null, -- 'blanc', 'jaune', 'orange', 'vert', 'rouge', 'bleu'
    color_hex text not null,  -- '#ffffff', '#fbbf24', '#f97316', '#22c55e', '#ef4444', '#3b82f6'
    leader_member_id uuid references public.members(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz,
    unique (church_id, name)
);

-- Index pour optimiser les performances de recherche
create index if not exists idx_spiritual_families_church on public.spiritual_families(church_id);

-- 2. Activation de la sécurité RLS sur la nouvelle table
alter table public.spiritual_families enable row level security;

-- Politiques RLS de sécurité
create policy "select_spiritual_families" on public.spiritual_families for select to authenticated using 
(public.user_can_access_church(church_id));

create policy "insert_spiritual_families" on public.spiritual_families for insert to authenticated with check 
(public.user_can_access_church(church_id));

create policy "update_spiritual_families" on public.spiritual_families for update to authenticated using 
(public.user_can_access_church(church_id)) with check (public.user_can_access_church(church_id));

create policy "delete_spiritual_families" on public.spiritual_families for delete to authenticated using 
(public.user_can_access_church(church_id));

-- Trigger pour la mise à jour automatique du champ updated_at
create trigger trg_set_updated_at_spiritual_families before update on public.spiritual_families for each row execute function public.set_updated_at();

-- 3. Ajout de la clé étrangère sur la table des membres
alter table public.members add column if not exists spiritual_family_id uuid references public.spiritual_families(id) on delete set null;
create index if not exists idx_members_spiritual_family on public.members(spiritual_family_id);

-- 4. Insertion des Familles Spirituelles par défaut
-- ÉGLISE 1: EECAE Bonoua - Quartier Résidentiel ('a1111111-0000-0000-0000-000000000001')
insert into public.spiritual_families (id, church_id, name, color_name, color_hex) values
  ('f1111111-0000-0000-0000-000000001001', 'a1111111-0000-0000-0000-000000000001', 'Bénédiction', 'blanc', '#ffffff'),
  ('f1111111-0000-0000-0000-000000001002', 'a1111111-0000-0000-0000-000000000001', 'Richesse', 'jaune', '#fbbf24'),
  ('f1111111-0000-0000-0000-000000001003', 'a1111111-0000-0000-0000-000000000001', 'Gloire', 'orange', '#f97316'),
  ('f1111111-0000-0000-0000-000000001004', 'a1111111-0000-0000-0000-000000000001', 'Surabondance', 'vert', '#22c55e'),
  ('f1111111-0000-0000-0000-000000001005', 'a1111111-0000-0000-0000-000000000001', 'Excellence', 'rouge', '#ef4444'),
  ('f1111111-0000-0000-0000-000000001006', 'a1111111-0000-0000-0000-000000000001', 'Distinction', 'bleu', '#3b82f6')
on conflict (church_id, name) do nothing;

-- ÉGLISE 3: EECAE Abidjan - Koumassi ('a1111111-0000-0000-0000-000000000003')
insert into public.spiritual_families (id, church_id, name, color_name, color_hex) values
  ('f1111111-0000-0000-0000-000000003002', 'a1111111-0000-0000-0000-000000000003', 'Richesse', 'jaune', '#fbbf24'),
  ('f1111111-0000-0000-0000-000000003003', 'a1111111-0000-0000-0000-000000000003', 'Gloire', 'orange', '#f97316'),
  ('f1111111-0000-0000-0000-000000003005', 'a1111111-0000-0000-0000-000000000003', 'Excellence', 'rouge', '#ef4444'),
  ('f1111111-0000-0000-0000-000000003006', 'a1111111-0000-0000-0000-000000000003', 'Distinction', 'bleu', '#3b82f6')
on conflict (church_id, name) do nothing;

-- 5. Attribution des responsables (Leaders) de familles
update public.spiritual_families set leader_member_id = 'cafe0000-0000-0000-0000-000000000001' where id = 'f1111111-0000-0000-0000-000000001001'; -- Bénédiction Bonoua : Pasteur Konan Elie
update public.spiritual_families set leader_member_id = 'cafe0000-0000-0000-0000-00000000000b' where id = 'f1111111-0000-0000-0000-000000003003'; -- Gloire Koumassi : Pasteur Adjoumani Jean

-- 6. Attribution des membres de démonstration existants à leurs familles respectives
-- Bonoua Siège
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000001001' where id in ('cafe0000-0000-0000-0000-000000000001', 'cafe0000-0000-0000-0000-000000000004');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000001002' where id in ('cafe0000-0000-0000-0000-000000000002');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000001003' where id in ('cafe0000-0000-0000-0000-000000000003');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000001004' where id in ('cafe0000-0000-0000-0000-000000000005', 'cafe0000-0000-0000-0000-000000000006');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000001005' where id in ('cafe0000-0000-0000-0000-000000000007', 'cafe0000-0000-0000-0000-000000000008');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000001006' where id in ('cafe0000-0000-0000-0000-000000000009', 'cafe0000-0000-0000-0000-00000000000a');

-- Koumassi
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000003002' where id in ('cafe0000-0000-0000-0000-00000000000e');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000003003' where id in ('cafe0000-0000-0000-0000-00000000000b');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000003005' where id in ('cafe0000-0000-0000-0000-00000000000c');
update public.members set spiritual_family_id = 'f1111111-0000-0000-0000-000000003006' where id in ('cafe0000-0000-0000-0000-00000000000d');
