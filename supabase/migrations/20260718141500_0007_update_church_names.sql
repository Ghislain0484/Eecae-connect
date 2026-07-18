-- MIGRATION: 20260718141500_0007_update_church_names.sql
-- Description: Mise à jour des noms officiels des assemblées locales du réseau EECAE

-- 1. Mise à jour de l'église Bonoua - Quartier Résidentiel
update public.churches 
set name = 'Temple Grâces et Merveilles', 
    short_name = 'Grâces & Merveilles' 
where id = 'a1111111-0000-0000-0000-000000000001';

-- 2. Mise à jour de l'église Bonoua - Bégnéri Extension
update public.churches 
set name = 'La maison d''adoration', 
    short_name = 'Maison d''Adoration' 
where id = 'a1111111-0000-0000-0000-000000000002';

-- 3. Mise à jour de l'église Abidjan - Koumassi
update public.churches 
set name = 'Temple de la Bénédiction', 
    short_name = 'Bénédiction' 
where id = 'a1111111-0000-0000-0000-000000000003';

-- 4. Mise à jour de l'église Agnibilékrou
update public.churches 
set name = 'Temple de la Gloire', 
    short_name = 'Gloire' 
where id = 'a1111111-0000-0000-0000-000000000004';
