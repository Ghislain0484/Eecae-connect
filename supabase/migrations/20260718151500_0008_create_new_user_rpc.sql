-- MIGRATION: 20260718151500_0008_create_new_user_rpc.sql
-- Description: Fonction stockée RPC pour créer un nouvel utilisateur dans auth.users et user_profiles

create or replace function public.create_new_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_church_id uuid
)
returns uuid
language plpgsql
security definer -- Permet d'exécuter la création avec les privilèges admin
as $$
declare
  v_user_id uuid;
begin
  -- 1. Sécurité : Vérifier que l'appelant est bien un super_admin
  if not exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'super_admin'
  ) then
    raise exception 'Non autorisé : Seul un super administrateur peut créer des utilisateurs.';
  end if;

  -- 2. Générer un identifiant unique (UUID)
  v_user_id := gen_random_uuid();

  -- 3. Insérer l'utilisateur dans la table d'authentification Supabase (auth.users)
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
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    false,
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

  -- 4. Insérer le profil associé dans public.user_profiles
  insert into public.user_profiles (
    id,
    email,
    full_name,
    role,
    default_church_id,
    is_active
  )
  values (
    v_user_id,
    p_email,
    p_full_name,
    p_role,
    p_church_id,
    true
  );

  -- 5. Assigner l'accès par défaut à l'église spécifiée
  if p_church_id is not null then
    insert into public.user_church_access (
      user_id,
      church_id,
      role,
      can_view_finance,
      can_view_pastoral,
      is_active
    )
    values (
      v_user_id,
      p_church_id,
      p_role,
      true,
      true,
      true
    );
  end if;

  return v_user_id;
end;
$$;
