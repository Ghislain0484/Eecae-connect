# 📖 Guide de Déploiement & Personnalisation Commerciale (White-Label)

Ce package contient la solution complète **Church Connect Pro**, conçue pour la gestion moderne, financière, pastorale et administrative des églises, ministères et réseaux d'assemblées.

---

## 🌟 1. Fonctionnalités Clés Incluses
* **Multi-Assemblées & Siège** : Gestion centralisée ou par paroisse avec droits d'accès granulaires.
* **White-Labeling & Thème Personnalisé** : Personnalisation instantanée du Nom de l'église, du sigle, du logo et des couleurs royales (Bordeaux & Or, Bleu & Or, Vert Émeraude, Pourpre, etc.) via le menu **Paramètres**.
* **Membres & Visiteurs** : Fiches fidèles, suivis des nouveaux convertis, gestion des familles spirituelles.
* **Cultes, Présences & Absences** : Suivi des cultes du dimanche, programmes de semaine, détection des fidèles absents pour relance pastorale.
* **Finances & Dîmes** : Ventilation comptable complète (Dîmes, Panier de la foi, Offrandes spéciales, Offrandes de mission, Actions de grâces), caisses, banques, reçus et états financiers.
* **Communication & WhatsApp** : Compositeur de messages WhatsApp en masse pour les groupes, cellules et départements.
* **Documents & Certificats** : Générateur de certificats officiels (Baptême, Dédicace, Mariage, Attestation) avec prévisualisation et impression papier.
* **Sécurité & Traçabilité** : Journal d'audit complet de toutes les opérations financières et administratives.

---

## 🚀 2. Procédure d'Installation pour un Nouveau Client / Église

### Étape 1 : Création de la Base de Données Supabase
1. Créez un projet gratuit ou Pro sur [Supabase.com](https://supabase.com).
2. Rendez-vous dans le **SQL Editor** de Supabase.
3. Exécutez dans l'ordre les fichiers SQL situés dans le dossier `supabase/migrations/` :
   * `0001_eecae_core_schema.sql` (Structure principale, membres, cultes, RLS)
   * `0002_eecae_finance_schema.sql` (Système financier et catégories)
   * `0005_spiritual_families.sql` (Familles spirituelles)
   * `0008_create_new_user_rpc.sql` (Fonction de création sécurisée des utilisateurs)

### Étape 2 : Configuration des Variables d'Environnement
Copiez le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```
Renseignez les identifiants Supabase du client :
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Étape 3 : Lancement & Déploiement
* **En local** :
  ```bash
  npm install
  npm run dev
  ```
* **En production (Vercel, Netlify, VPS ou Hébergement Web)** :
  ```bash
  npm run build
  ```
  Le dossier `dist/` est prêt à être déployé sur n'importe quel hébergeur web ou serveur.

---

## 🎨 3. Personnalisation pour la Nouvelle Église
Dès la première connexion avec le compte Super-Administrateur :
1. Allez dans le menu **Paramètres** (`/admin/settings`).
2. Onglet **Identité & Couleurs (White-Label)** :
   * Saisissez le **Nom complet de l'église**.
   * Saisissez le **Sigle / Acronyme** (ex: *MEV, ICC, EPP, AD*).
   * Renseignez le lien du logo officiel ou déposez-le dans le dossier `public/`.
   * Choisissez la palette de couleurs officielle de l'église (ou sélectionnez un thème prédéfini).
3. Cliquez sur **Sauvegarder l'Identité Visuelle** : l'ensemble de l'application s'adapte immédiatement !
