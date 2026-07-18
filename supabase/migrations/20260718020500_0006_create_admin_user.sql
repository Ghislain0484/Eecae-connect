-- MIGRATION: 20260718020500_0006_create_admin_user.sql
-- Description: Enregistrement de l'administrateur avec colonnes standards d'authentification pour éviter les erreurs de colonnes manquantes

-- Activer l'extension pgcrypto
create extension if not exists pgcrypto;

-- 1. Insérer ou mettre à jour l'utilisateur dans la table d'authentification (auth.users)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  aud,
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  'e1111111-0000-0000-0000-000000000001', -- UUID fixe
  '00000000-0000-0000-0000-000000000000',
  'gagohi06@gmail.com', -- E-mail
  crypt('EECAE2026!', gen_salt('bf')), -- Mot de passe
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Super Administrateur"}',
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '', -- confirmation_token
  '', -- recovery_token
  '', -- email_change_token_new
  ''  -- email_change
)
on conflict (id) do update set 
  email = excluded.email, 
  encrypted_password = excluded.encrypted_password,
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '';

-- 2. Insérer ou mettre à jour le profil associé avec le rôle 'super_admin'
insert into public.user_profiles (
  id,
  email,
  full_name,
  role,
  default_church_id,
  is_active
)
values (
  'e1111111-0000-0000-0000-000000000001',
  'gagohi06@gmail.com',
  'Super Administrateur',
  'super_admin',
  'a1111111-0000-0000-0000-000000000001',
  true
)
on conflict (id) do update set email = excluded.email;

-- 3. Accorder l'accès d'administration aux assemblées principales dans user_church_access
insert into public.user_church_access (user_id, church_id, role, can_view_finance, can_view_pastoral, is_active)
values 
  ('e1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'super_admin', true, true, true),
  ('e1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000002', 'super_admin', true, true, true),
  ('e1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000003', 'super_admin', true, true, true)
on conflict do nothing;
