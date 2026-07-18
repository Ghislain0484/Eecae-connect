/*
# EECAE — Données de démonstration

## Description
Insère les 4 assemblées, départements, cellules, membres, familles, visiteurs,
programmes, prédications, présences, recettes, dépenses, caisses, promesses,
clôtures, suivis d'absence et budget. Tous les identifiants sont des UUID
hexadécimaux valides.

## Assemblées
1. EECAE Bonoua, Quartier Résidentiel (siège)
2. EECAE Bonoua, Bégnéri Extension
3. EECAE Abidjan, Koumassi
4. EECAE Agnibilékrou
*/

-- ============================================================
-- ASSEMBLÉES
-- ============================================================
insert into public.churches (id, name, short_name, is_headquarters, neighborhood, city, country, senior_pastor, status)
values
  ('a1111111-0000-0000-0000-000000000001', 'EECAE Bonoua — Quartier Résidentiel', 'Bonoua Siège', true, 'Quartier Résidentiel', 'Bonoua', 'Côte d''Ivoire', 'Pasteur Konan Élie', 'active'),
  ('a1111111-0000-0000-0000-000000000002', 'EECAE Bonoua — Bégnéri Extension', 'Bégnéri', false, 'Bégnéri Extension', 'Bonoua', 'Côte d''Ivoire', 'Pasteur Kouadio Bertrand', 'active'),
  ('a1111111-0000-0000-0000-000000000003', 'EECAE Abidjan — Koumassi', 'Koumassi', false, 'Koumassi', 'Abidjan', 'Côte d''Ivoire', 'Pasteur Adjoumani Jean', 'active'),
  ('a1111111-0000-0000-0000-000000000004', 'EECAE Agnibilékrou', 'Agnibilékrou', false, 'Centre', 'Agnibilékrou', 'Côte d''Ivoire', 'Pasteur N''Guessan Paul', 'active')
on conflict (id) do nothing;

-- ============================================================
-- TYPES D'ÉVÉNEMENTS (globaux, church_id null)
-- ============================================================
insert into public.event_types (church_id, name, is_default) values
  (null, 'Culte du dimanche', true),
  (null, 'Mercredi de miracles', true),
  (null, 'Étude biblique', true),
  (null, 'Réunion de prière', true),
  (null, 'Veillée', true),
  (null, 'Sainte-Cène', true),
  (null, 'Croisade', true),
  (null, 'Convention', true),
  (null, 'Conférence', true),
  (null, 'Séminaire', true),
  (null, 'Programme de jeunesse', true),
  (null, 'Programme des femmes', true),
  (null, 'Programme des hommes', true),
  (null, 'Programme des enfants', true),
  (null, 'Mariage', true),
  (null, 'Baptême', true),
  (null, 'Présentation d''enfant', true),
  (null, 'Programme spécial', true),
  (null, 'Réunion administrative', true),
  (null, 'Formation', true),
  (null, 'Autre', true)
on conflict do nothing;

-- ============================================================
-- DÉPARTEMENTS
-- ============================================================
insert into public.departments (id, church_id, name, description, status) values
  ('d1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'Pastorale', 'Direction pastorale', 'active'),
  ('d1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'Louange et adoration', 'Équipe de louange', 'active'),
  ('d1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'Intercession', 'Équipe de prière', 'active'),
  ('d1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000001', 'Jeunesse', 'Ministère des jeunes 12-40 ans', 'active'),
  ('d1111111-0000-0000-0000-000000000005', 'a1111111-0000-0000-0000-000000000001', 'Accueil et protocole', 'Accueil des fidèles et visiteurs', 'active'),
  ('d1111111-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000001', 'Média et communication', 'Son, image, diffusion', 'active'),
  ('d1111111-0000-0000-0000-000000000007', 'a1111111-0000-0000-0000-000000000001', 'Évangélisation', 'Mission et évangélisation', 'active'),
  ('d1111111-0000-0000-0000-000000000008', 'a1111111-0000-0000-0000-000000000003', 'Pastorale', 'Direction pastorale Koumassi', 'active'),
  ('d1111111-0000-0000-0000-000000000009', 'a1111111-0000-0000-0000-000000000003', 'Louange et adoration', 'Équipe de louange Koumassi', 'active'),
  ('d1111111-0000-0000-0000-00000000000a', 'a1111111-0000-0000-0000-000000000003', 'Jeunesse', 'Ministère des jeunes Koumassi', 'active')
on conflict (id) do nothing;

-- ============================================================
-- CELLULES
-- ============================================================
insert into public.cells (id, church_id, name, code, zone, neighborhood, meeting_day, meeting_time, phone, status) values
  ('c1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'Cellule Lumière', 'CEL-001', 'Zone Est', 'Quartier Résidentiel', 'Vendredi', '19:00', '+225 07 00 11 22 33', 'active'),
  ('c1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'Cellule Espérance', 'CEL-002', 'Zone Ouest', 'Bégnéri', 'Samedi', '18:00', '+225 07 00 22 33 44', 'active'),
  ('c1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'Cellule Foi', 'CEL-003', 'Zone Sud', 'Bonoua Centre', 'Vendredi', '19:30', '+225 07 00 33 44 55', 'active'),
  ('c1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 'Cellule Koumassi 1', 'KMS-001', 'Zone 1', 'Koumassi', 'Vendredi', '19:00', '+225 07 11 22 33 44', 'active')
on conflict (id) do nothing;

-- ============================================================
-- MEMBRES — Siège (Bonoua Résidentiel)
-- IDs: cafe0000-...
-- ============================================================
insert into public.members (id, church_id, matricule, last_name, first_name, sex, birth_date, birth_place, marital_status, profession, neighborhood, city, phone_main, phone_whatsapp, email, first_visit_date, integration_date, conversion_date, water_baptism_date, holy_spirit_baptized, status, department_id, cell_id, function, available_for_service) values
  ('cafe0000-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2020-0001', 'Konan', 'Élie', 'M', '1975-03-15', 'Bonoua', 'married', 'Pasteur', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 01', '+225 07 00 00 00 01', 'elie.konan@eecae.ci', '2020-01-05', '2020-02-09', '2018-04-01', '2018-06-15', true, 'active', 'd1111111-0000-0000-0000-000000000001', null, 'Pasteur principal', true),
  ('cafe0000-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2020-0002', 'Aya', 'Brigitte', 'F', '1988-07-22', 'Abidjan', 'married', 'Commerçante', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 02', '+225 07 00 00 00 02', 'brigitte.aya@eecae.ci', '2020-01-12', '2020-03-15', '2019-09-10', '2019-11-20', true, 'active', 'd1111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'Choriste', true),
  ('cafe0000-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2020-0003', 'Bamba', 'Issouf', 'M', '1992-11-03', 'Bouaké', 'single', 'Informaticien', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 03', '+225 07 00 00 00 03', 'issouf.bamba@eecae.ci', '2021-05-20', '2021-07-25', '2021-06-15', '2021-08-30', true, 'active', 'd1111111-0000-0000-0000-000000000006', null, 'Technicien son', true),
  ('cafe0000-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2021-0004', 'Koffi', 'Marie', 'F', '1995-02-14', 'Bonoua', 'single', 'Étudiante', 'Bégnéri Extension', 'Bonoua', '+225 07 00 00 00 04', '+225 07 00 00 00 04', 'marie.koffi@eecae.ci', '2021-09-01', '2021-11-07', '2021-09-25', '2021-12-05', true, 'active', 'd1111111-0000-0000-0000-000000000004', 'c1111111-0000-0000-0000-000000000002', 'Membre jeunesse', true),
  ('cafe0000-0000-0000-0000-000000000005', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2021-0005', 'Tanoh', 'Kouadio', 'M', '1980-09-30', 'Agnibilékrou', 'married', 'Agriculteur', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 05', null, null, '2019-03-10', '2019-05-20', '2018-12-01', '2019-02-10', true, 'active', 'd1111111-0000-0000-0000-000000000007', 'c1111111-0000-0000-0000-000000000003', 'Évangéliste', true),
  ('cafe0000-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2022-0006', 'Adou', 'Grace', 'F', '2001-12-08', 'Abidjan', 'single', 'Coiffeuse', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 06', '+225 07 00 00 00 06', null, '2022-04-03', '2022-06-12', '2022-04-17', '2022-07-03', true, 'active', 'd1111111-0000-0000-0000-000000000005', null, 'Accueil', true),
  ('cafe0000-0000-0000-0000-000000000007', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2022-0007', 'Diabaté', 'Mamadou', 'M', '1968-05-17', 'Korhogo', 'married', 'Mécanicien', 'Bégnéri Extension', 'Bonoua', '+225 07 00 00 00 07', null, null, '2018-06-03', '2018-08-12', '2017-01-15', '2017-03-20', true, 'irregular', null, 'c1111111-0000-0000-0000-000000000002', null, true),
  ('cafe0000-0000-0000-0000-000000000008', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2023-0008', 'Yapo', 'Adèle', 'F', '1955-01-25', 'Bonoua', 'widowed', 'Retraitée', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 08', null, null, '2016-02-14', '2016-04-10', '2015-11-20', '2016-01-15', true, 'active', 'd1111111-0000-0000-0000-000000000003', null, 'Intercesseure', true),
  ('cafe0000-0000-0000-0000-000000000009', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2023-0009', 'Kouamé', 'Yves', 'M', '2003-08-19', 'Bonoua', 'single', 'Apprenti', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 09', '+225 07 00 00 00 09', null, '2023-10-01', '2023-12-10', '2023-10-15', null, false, 'new_convert', 'd1111111-0000-0000-0000-000000000004', null, 'Nouveau converti', true),
  ('cafe0000-0000-0000-0000-00000000000a', 'a1111111-0000-0000-0000-000000000001', 'EECAE-BON-2023-0010', 'Brou', 'Awa', 'F', '2010-06-12', 'Bonoua', 'single', 'Élève', 'Quartier Résidentiel', 'Bonoua', null, null, null, '2022-01-09', '2022-03-06', null, null, false, 'active', null, null, null, true)
on conflict (id) do nothing;

-- MEMBRES — Koumassi
insert into public.members (id, church_id, matricule, last_name, first_name, sex, birth_date, marital_status, profession, neighborhood, city, phone_main, first_visit_date, integration_date, conversion_date, water_baptism_date, holy_spirit_baptized, status, department_id, cell_id, function) values
  ('cafe0000-0000-0000-0000-00000000000b', 'a1111111-0000-0000-0000-000000000003', 'EECAE-KMS-2020-0001', 'Adjoumani', 'Jean', 'M', '1978-04-20', 'married', 'Pasteur', 'Koumassi', 'Abidjan', '+225 07 11 00 00 01', '2020-02-01', '2020-03-15', '2019-05-10', '2019-07-20', true, 'active', 'd1111111-0000-0000-0000-000000000008', null, 'Pasteur assemblée'),
  ('cafe0000-0000-0000-0000-00000000000c', 'a1111111-0000-0000-0000-000000000003', 'EECAE-KMS-2020-0002', 'Assemian', 'Flore', 'F', '1990-10-05', 'married', 'Infirmière', 'Koumassi', 'Abidjan', '+225 07 11 00 00 02', '2020-06-14', '2020-08-20', '2020-06-28', '2020-09-05', true, 'active', 'd1111111-0000-0000-0000-000000000009', 'c1111111-0000-0000-0000-000000000004', 'Choriste'),
  ('cafe0000-0000-0000-0000-00000000000d', 'a1111111-0000-0000-0000-000000000003', 'EECAE-KMS-2021-0003', 'Zadi', 'Roger', 'M', '1985-12-11', 'single', 'Comptable', 'Koumassi', 'Abidjan', '+225 07 11 00 00 03', '2021-01-10', '2021-03-14', '2020-11-15', '2021-01-30', true, 'active', null, 'c1111111-0000-0000-0000-000000000004', null),
  ('cafe0000-0000-0000-0000-00000000000e', 'a1111111-0000-0000-0000-000000000003', 'EECAE-KMS-2022-0004', 'Gnagne', 'Esther', 'F', '1998-03-22', 'single', 'Étudiante', 'Koumassi', 'Abidjan', '+225 07 11 00 00 04', '2022-05-07', '2022-07-10', '2022-05-21', null, false, 'integrating', 'd1111111-0000-0000-0000-00000000000a', null, null)
on conflict (id) do nothing;

-- MEMBRES — Agnibilékrou
insert into public.members (id, church_id, matricule, last_name, first_name, sex, birth_date, marital_status, profession, neighborhood, city, phone_main, first_visit_date, integration_date, conversion_date, status) values
  ('cafe0000-0000-0000-0000-00000000000f', 'a1111111-0000-0000-0000-000000000004', 'EECAE-AGN-2020-0001', 'Nguessan', 'Paul', 'M', '1972-08-30', 'married', 'Pasteur', 'Centre', 'Agnibilékrou', '+225 07 22 00 00 01', '2020-01-19', '2020-03-01', '2019-02-10', 'active'),
  ('cafe0000-0000-0000-0000-000000000010', 'a1111111-0000-0000-0000-000000000004', 'EECAE-AGN-2021-0002', 'Bamba', 'Fatou', 'F', '1993-06-14', 'single', 'Couturière', 'Centre', 'Agnibilékrou', '+225 07 22 00 00 02', '2021-02-14', '2021-04-18', '2021-03-07', 'active'),
  ('cafe0000-0000-0000-0000-000000000011', 'a1111111-0000-0000-0000-000000000004', 'EECAE-AGN-2022-0003', 'Konaté', 'Ibrahim', 'M', '2000-11-25', 'single', 'Étudiant', 'Centre', 'Agnibilékrou', '+225 07 22 00 00 03', '2022-09-04', '2022-11-13', '2022-09-18', 'active')
on conflict (id) do nothing;

-- MEMBRES — Bégnéri Extension
insert into public.members (id, church_id, matricule, last_name, first_name, sex, birth_date, marital_status, profession, neighborhood, city, phone_main, first_visit_date, integration_date, status) values
  ('cafe0000-0000-0000-0000-000000000012', 'a1111111-0000-0000-0000-000000000002', 'EECAE-BEG-2021-0001', 'Kouadio', 'Bertrand', 'M', '1983-02-18', 'married', 'Pasteur', 'Bégnéri Extension', 'Bonoua', '+225 07 33 00 00 01', '2021-01-03', '2021-02-28', 'active'),
  ('cafe0000-0000-0000-0000-000000000013', 'a1111111-0000-0000-0000-000000000002', 'EECAE-BEG-2022-0002', 'Yeboua', 'Alice', 'F', '1996-07-09', 'single', 'Vendeuse', 'Bégnéri Extension', 'Bonoua', '+225 07 33 00 00 02', '2022-03-06', '2022-05-15', 'active'),
  ('cafe0000-0000-0000-0000-000000000014', 'a1111111-0000-0000-0000-000000000002', 'EECAE-BEG-2023-0003', 'Assoi', 'Daniel', 'M', '2005-04-22', 'single', 'Élève', 'Bégnéri Extension', 'Bonoua', null, '2023-08-13', '2023-10-22', 'irregular')
on conflict (id) do nothing;

-- ============================================================
-- FAMILLES
-- ============================================================
insert into public.families (id, church_id, name, head_member_id, neighborhood, city, main_contact_phone, household_status) values
  ('f1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'Famille Konan', 'cafe0000-0000-0000-0000-000000000001', 'Quartier Résidentiel', 'Bonoua', '+225 07 00 00 00 01', 'active'),
  ('f1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'Famille Diabaté', 'cafe0000-0000-0000-0000-000000000007', 'Bégnéri Extension', 'Bonoua', '+225 07 00 00 00 07', 'active'),
  ('f1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000003', 'Famille Adjoumani', 'cafe0000-0000-0000-0000-00000000000b', 'Koumassi', 'Abidjan', '+225 07 11 00 00 01', 'active')
on conflict (id) do nothing;

insert into public.family_members (family_id, member_id, role_in_family) values
  ('f1111111-0000-0000-0000-000000000001', 'cafe0000-0000-0000-0000-000000000001', 'head'),
  ('f1111111-0000-0000-0000-000000000002', 'cafe0000-0000-0000-0000-000000000007', 'head'),
  ('f1111111-0000-0000-0000-000000000003', 'cafe0000-0000-0000-0000-00000000000b', 'head')
on conflict (family_id, member_id) do nothing;

-- ============================================================
-- VISITEURS — IDs: face0000-...
-- ============================================================
insert into public.visitors (id, church_id, last_name, first_name, sex, age_range, phone, neighborhood, city, profession, invited_by, first_visit_date, prayer_subject, wants_contact, wants_to_join, wants_pastoral_visit, visit_count, status, observations) values
  ('face0000-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'Adjé', 'Christophe', 'M', 'young_adult', '+225 07 44 00 00 01', 'Résidentiel', 'Bonoua', 'Chauffeur', 'Koffi Marie', '2026-07-05', 'Direction pour sa famille', true, true, false, 2, 'second_visit', 'Très intéressé par les études bibliques.'),
  ('face0000-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'Brou', 'Sandra', 'F', 'young_adult', '+225 07 44 00 00 02', 'Bégnéri', 'Bonoua', 'Étudiante', 'Aya Brigitte', '2026-07-12', 'Guérison de sa mère', true, false, true, 1, 'first_visit', 'Souhaite une visite pastorale.'),
  ('face0000-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000003', 'Touré', 'Moussa', 'M', 'adult', '+225 07 44 00 00 03', 'Koumassi', 'Abidjan', 'Commerçant', null, '2026-06-21', 'Paix dans son foyer', true, true, false, 3, 'regular', 'Vient régulièrement depuis 3 semaines.'),
  ('face0000-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000001', 'Kacou', 'Aya', 'F', 'teen', null, 'Résidentiel', 'Bonoua', 'Élève', 'Kouamé Yves', '2026-07-14', 'Réussite scolaire', false, false, false, 1, 'first_visit', 'Venue avec un ami jeune.')
on conflict (id) do nothing;

-- ============================================================
-- PROGRAMMES / CULTES — IDs: e1111111-...
-- ============================================================
insert into public.events (id, church_id, title, type, event_date, start_time, end_time, location, theme, main_verse, preacher, moderator, prayer_leader, status) values
  ('e1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'Culte du dimanche', 'Culte du dimanche', '2026-07-19', '09:00', '11:30', 'Temple central - Bonoua', 'La puissance de la foi', 'Hébreux 11:1', 'Pasteur Konan Élie', 'Kouadio Bertrand', 'Yapo Adèle', 'planned'),
  ('e1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'Culte du dimanche', 'Culte du dimanche', '2026-07-12', '09:00', '11:30', 'Temple central - Bonoua', 'Le Dieu qui délivre', 'Psaume 34:18', 'Pasteur N''Guessan Paul', 'Konan Élie', 'Tanoh Kouadio', 'done'),
  ('e1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'Mercredi de miracles', 'Mercredi de miracles', '2026-07-15', '18:00', '20:00', 'Temple central - Bonoua', 'Guérison et délivrance', 'Ésaïe 53:5', 'Pasteur Konan Élie', 'Bamba Issouf', 'Yapo Adèle', 'done'),
  ('e1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 'Culte du dimanche', 'Culte du dimanche', '2026-07-12', '09:30', '12:00', 'Salle Koumassi', 'Marcher dans l''amour', 'Éphésiens 5:2', 'Pasteur Adjoumani Jean', 'Zadi Roger', 'Assemian Flore', 'done'),
  ('e1111111-0000-0000-0000-000000000005', 'a1111111-0000-0000-0000-000000000001', 'Veillée de prière', 'Veillée', '2026-07-26', '22:00', '04:00', 'Temple central - Bonoua', 'La nuit de la faveur', 'Luc 18:7', 'Pasteur Konan Élie', 'Tanoh Kouadio', 'Yapo Adèle', 'planned'),
  ('e1111111-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000004', 'Culte du dimanche', 'Culte du dimanche', '2026-07-12', '10:00', '12:30', 'Temple Agnibilékrou', 'Le sang de l''alliance', 'Matthieu 26:28', 'Pasteur N''Guessan Paul', 'Konaté Ibrahim', 'Bamba Fatou', 'done'),
  ('e1111111-0000-0000-0000-000000000007', 'a1111111-0000-0000-0000-000000000002', 'Culte du dimanche', 'Culte du dimanche', '2026-07-12', '09:00', '11:30', 'Salle Bégnéri', 'Soyez remplis de l''Esprit', 'Éphésiens 5:18', 'Pasteur Kouadio Bertrand', 'Yeboua Alice', 'Assoi Daniel', 'done')
on conflict (id) do nothing;

-- ============================================================
-- PRÉDICATIONS — IDs: beef0000-...
-- ============================================================
insert into public.sermons (id, church_id, event_id, theme, sub_theme, preacher, sermon_date, program_type, main_verse, summary, keywords) values
  ('beef0000-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', 'Le Dieu qui délivre', 'Dieu est notre refuge', 'Pasteur N''Guessan Paul', '2026-07-12', 'Culte du dimanche', 'Psaume 34:18', 'L''Éternel est près de ceux qui ont le cœur brisé. Quel que soit le fardeau, Dieu délivre ceux qui crient à Lui.', 'délivrance, refuge, foi'),
  ('beef0000-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000003', 'Guérison et délivrance', 'Par ses meurtrissures nous sommes guéris', 'Pasteur Konan Élie', '2026-07-15', 'Mercredi de miracles', 'Ésaïe 53:5', 'La guérison est une provision de la croix. La foi saisit ce que Christ a déjà accompli.', 'guérison, croix, foi'),
  ('beef0000-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000003', 'e1111111-0000-0000-0000-000000000004', 'Marcher dans l''amour', 'L''amour comme style de vie', 'Pasteur Adjoumani Jean', '2026-07-12', 'Culte du dimanche', 'Éphésiens 5:2', 'L''amour de Christ doit modeler nos relations, nos pardons et notre témoignage.', 'amour, témoignage, pardon')
on conflict (id) do nothing;

-- ============================================================
-- SESSIONS DE PRÉSENCE — IDs: abed0000-...
-- ============================================================
insert into public.attendance_sessions (id, event_id, church_id, session_date) values
  ('abed0000-0000-0000-0000-000000000002', 'e1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', '2026-07-12'),
  ('abed0000-0000-0000-0000-000000000003', 'e1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', '2026-07-15'),
  ('abed0000-0000-0000-0000-000000000004', 'e1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', '2026-07-12'),
  ('abed0000-0000-0000-0000-000000000006', 'e1111111-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000004', '2026-07-12'),
  ('abed0000-0000-0000-0000-000000000007', 'e1111111-0000-0000-0000-000000000007', 'a1111111-0000-0000-0000-000000000002', '2026-07-12')
on conflict (id) do nothing;

insert into public.attendance_totals (session_id, church_id, men, women, children, teens, youth_12_40, adults, seniors, identified_members, visitors, new_visitors, total_participants, children_service_count, decisions_for_christ, testimonies) values
  ('abed0000-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 85, 110, 35, 22, 60, 70, 8, 95, 12, 5, 232, 30, 3, 2),
  ('abed0000-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 40, 65, 8, 12, 30, 35, 5, 70, 18, 10, 113, 8, 5, 4),
  ('abed0000-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 48, 72, 20, 15, 38, 42, 6, 82, 8, 3, 148, 18, 1, 1),
  ('abed0000-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000004', 30, 45, 15, 10, 22, 28, 4, 55, 5, 2, 95, 12, 2, 1),
  ('abed0000-0000-0000-0000-000000000007', 'a1111111-0000-0000-0000-000000000002', 28, 40, 12, 8, 18, 22, 3, 48, 6, 2, 80, 10, 1, 0)
on conflict (session_id) do nothing;

-- ============================================================
-- RECETTES
-- ============================================================
insert into public.contributions (church_id, event_id, contribution_date, category, amount, payment_method, received_by, counted_by, is_validated, is_anonymous) values
  ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', '2026-07-12', 'Offrande générale', 75000, 'cash', 'Bamba Issouf', 'Aya Brigitte', true, true),
  ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', '2026-07-12', 'Dîme', 120000, 'cash', 'Bamba Issouf', 'Aya Brigitte', true, true),
  ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', '2026-07-12', 'Action de grâce', 25000, 'cash', 'Bamba Issouf', 'Aya Brigitte', true, false),
  ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000003', '2026-07-15', 'Offrande spéciale', 45000, 'orange_money', 'Adou Grace', null, true, true),
  ('a1111111-0000-0000-0000-000000000003', 'e1111111-0000-0000-0000-000000000004', '2026-07-12', 'Offrande générale', 52000, 'cash', 'Zadi Roger', 'Assemian Flore', true, true),
  ('a1111111-0000-0000-0000-000000000003', 'e1111111-0000-0000-0000-000000000004', '2026-07-12', 'Dîme', 68000, 'cash', 'Zadi Roger', 'Assemian Flore', true, true),
  ('a1111111-0000-0000-0000-000000000004', 'e1111111-0000-0000-0000-000000000006', '2026-07-12', 'Offrande générale', 30000, 'cash', 'Konaté Ibrahim', 'Bamba Fatou', true, true),
  ('a1111111-0000-0000-0000-000000000002', 'e1111111-0000-0000-0000-000000000007', '2026-07-12', 'Offrande générale', 28000, 'cash', 'Yeboua Alice', 'Assoi Daniel', true, true)
on conflict (id) do nothing;

-- Dîmes nominatives
insert into public.tithes (church_id, event_id, member_id, contributor_name, period, amount, tithe_date, payment_method, is_anonymous, is_validated) values
  ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', 'cafe0000-0000-0000-0000-000000000002', 'Aya Brigitte', 'Juillet 2026', 15000, '2026-07-12', 'cash', false, true),
  ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', 'cafe0000-0000-0000-0000-000000000003', 'Bamba Issouf', 'Juillet 2026', 12000, '2026-07-12', 'cash', false, true),
  ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', null, null, 'Juillet 2026', 93000, '2026-07-12', 'cash', true, true),
  ('a1111111-0000-0000-0000-000000000003', 'e1111111-0000-0000-0000-000000000004', 'cafe0000-0000-0000-0000-00000000000c', 'Assemian Flore', 'Juillet 2026', 10000, '2026-07-12', 'cash', false, true)
on conflict (id) do nothing;

-- ============================================================
-- DÉPENSES
-- ============================================================
insert into public.expenses (church_id, expense_date, category, supplier, motive, amount, payment_method, requested_by, validated_by, status) values
  ('a1111111-0000-0000-0000-000000000001', '2026-07-10', 'Électricité', 'CIE Bonoua', 'Facture électricité juillet', 42000, 'cash', 'Bamba Issouf', 'Konan Élie', 'paid'),
  ('a1111111-0000-0000-0000-000000000001', '2026-07-12', 'Transport', 'Transport Yéo', 'Transport prédicateur invité', 15000, 'cash', 'Tanoh Kouadio', 'Konan Élie', 'paid'),
  ('a1111111-0000-0000-0000-000000000001', '2026-07-08', 'Sonorisation', 'Sono Plus', 'Réparation microphone', 25000, 'cash', 'Bamba Issouf', 'Konan Élie', 'paid'),
  ('a1111111-0000-0000-0000-000000000003', '2026-07-11', 'Loyer', 'Mme Kouassi', 'Loyer salle juillet', 60000, 'bank_transfer', 'Zadi Roger', 'Adjoumani Jean', 'paid'),
  ('a1111111-0000-0000-0000-000000000004', '2026-07-09', 'Eau', 'SODECI', 'Facture eau', 12000, 'cash', 'Konaté Ibrahim', 'N''Guessan Paul', 'paid')
on conflict (id) do nothing;

-- ============================================================
-- CAISSES
-- ============================================================
insert into public.cash_accounts (church_id, name, account_type, initial_balance) values
  ('a1111111-0000-0000-0000-000000000001', 'Caisse principale - Bonoua', 'main', 500000),
  ('a1111111-0000-0000-0000-000000000001', 'Caisse département jeunesse', 'department', 50000),
  ('a1111111-0000-0000-0000-000000000003', 'Caisse principale - Koumassi', 'main', 200000),
  ('a1111111-0000-0000-0000-000000000004', 'Caisse principale - Agnibilékrou', 'main', 150000),
  ('a1111111-0000-0000-0000-000000000002', 'Caisse principale - Bégnéri', 'main', 80000)
on conflict (id) do nothing;

-- ============================================================
-- PROMESSES
-- ============================================================
insert into public.pledges (church_id, pledge_type, member_id, donor_name, amount_promised, amount_paid, due_date, status) values
  ('a1111111-0000-0000-0000-000000000001', 'Offrande de construction', 'cafe0000-0000-0000-0000-000000000005', 'Tanoh Kouadio', 200000, 80000, '2026-12-31', 'partial'),
  ('a1111111-0000-0000-0000-000000000001', 'Offrande missionnaire', 'cafe0000-0000-0000-0000-000000000002', 'Aya Brigitte', 100000, 50000, '2026-10-15', 'partial'),
  ('a1111111-0000-0000-0000-000000000003', 'Offrande de construction', null, 'Anonyme', 150000, 0, '2026-11-30', 'open')
on conflict (id) do nothing;

-- ============================================================
-- CLÔTURES DE CULTE
-- ============================================================
insert into public.event_financial_closures (event_id, church_id, total_participants, visitors_count, total_offrandes, total_tithes, total_donations, total_other_receipts, immediate_expenses, net_amount, counted_by, treasurer, is_validated, validated_at) values
  ('e1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 232, 12, 100000, 120000, 25000, 0, 15000, 230000, 'Bamba Issouf, Aya Brigitte', 'Konan Élie', true, '2026-07-12'),
  ('e1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 113, 18, 45000, 0, 0, 0, 0, 45000, 'Adou Grace', 'Konan Élie', true, '2026-07-15'),
  ('e1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 148, 8, 52000, 68000, 0, 0, 0, 120000, 'Zadi Roger, Assemian Flore', 'Adjoumani Jean', true, '2026-07-12')
on conflict (event_id) do nothing;

-- ============================================================
-- SUIVIS D'ABSENCE
-- ============================================================
insert into public.absence_followups (church_id, member_id, assigned_to, reason, call_done, message_sent, status, created_at) values
  ('a1111111-0000-0000-0000-000000000001', 'cafe0000-0000-0000-0000-000000000007', 'Adou Grace', 'travel', true, true, 'in_progress', '2026-07-13'),
  ('a1111111-0000-0000-0000-000000000002', 'cafe0000-0000-0000-0000-000000000014', 'Yeboua Alice', null, false, false, 'open', '2026-07-13')
on conflict (id) do nothing;

-- ============================================================
-- BUDGET
-- ============================================================
insert into public.budgets (id, church_id, title, scope, period_year, total_planned, status) values
  ('b1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'Budget annuel 2026 - Bonoua', 'annual', 2026, 12000000, 'approved')
on conflict (id) do nothing;

insert into public.budget_lines (budget_id, category, planned_amount, actual_income, actual_expense) values
  ('b1111111-0000-0000-0000-000000000001', 'Offrandes et dîmes', 9000000, 4200000, 0),
  ('b1111111-0000-0000-0000-000000000001', 'Dons et actions de grâce', 2000000, 850000, 0),
  ('b1111111-0000-0000-0000-000000000001', 'Loyer et charges', 0, 0, 1200000),
  ('b1111111-0000-0000-0000-000000000001', 'Missions et évangélisation', 0, 0, 600000),
  ('b1111111-0000-0000-0000-000000000001', 'Maintenance et équipement', 0, 0, 450000)
on conflict (id) do nothing;
