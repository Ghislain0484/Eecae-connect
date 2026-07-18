import type { Role, MemberStatus, VisitorStatus, PaymentMethod } from './index';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Administrateur',
  hq_admin: 'Administrateur du Siège',
  senior_pastor: 'Pasteur Principal',
  assembly_pastor: "Pasteur d'Assemblée",
  secretary: 'Secrétaire',
  treasurer: 'Trésorier / Comptable',
  department_head: 'Responsable de Département',
  cell_leader: 'Responsable de Cellule',
  pastoral_care: 'Responsable Suivi Pastoral',
  data_entry: 'Agent de Saisie',
  member: 'Membre',
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  visitor: 'Visiteur',
  new_visitor: 'Nouveau visiteur',
  new_convert: 'Nouveau converti',
  integrating: 'Membre en intégration',
  active: 'Membre actif',
  irregular: 'Membre irrégulier',
  inactive: 'Membre inactif',
  transferred: 'Membre transféré',
  left: 'Membre parti',
  deceased: 'Membre décédé',
  archived: 'Membre archivé',
};

export const MEMBER_STATUS_COLORS: Record<MemberStatus, string> = {
  visitor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  new_visitor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  new_convert: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  integrating: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  irregular: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  inactive: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  transferred: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  left: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  deceased: 'bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-300',
  archived: 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400',
};

export const VISITOR_STATUS_LABELS: Record<VisitorStatus, string> = {
  first_visit: 'Première visite',
  second_visit: 'Deuxième visite',
  regular: 'Visiteur régulier',
  integrating: 'En intégration',
  converted: 'Converti',
  became_member: 'Devenu membre',
  no_contact: 'Ne souhaite plus être contacté',
  lost: 'Perdu de vue',
};

export const VISITOR_STATUS_COLORS: Record<VisitorStatus, string> = {
  first_visit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  second_visit: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  regular: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  integrating: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  became_member: 'bg-bordeaux-100 text-bordeaux-700 dark:bg-bordeaux-900/40 dark:text-bordeaux-300',
  no_contact: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const EVENT_TYPES = [
  'Culte du dimanche',
  'Mercredi de miracles',
  'Étude biblique',
  'Réunion de prière',
  'Veillée',
  'Sainte-Cène',
  'Croisade',
  'Convention',
  'Conférence',
  'Séminaire',
  'Programme de jeunesse',
  'Programme des femmes',
  'Programme des hommes',
  'Programme des enfants',
  'Mariage',
  'Baptême',
  "Présentation d'enfant",
  'Programme spécial',
  'Réunion administrative',
  'Formation',
  'Autre',
] as const;

export const EVENT_STATUS_LABELS: Record<string, string> = {
  planned: 'Prévu',
  ongoing: 'En cours',
  done: 'Terminé',
  cancelled: 'Annulé',
  postponed: 'Reporté',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  check: 'Chèque',
  bank_transfer: 'Virement bancaire',
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  moov_money: 'Moov Money',
  wave: 'Wave',
  card: 'Carte bancaire',
  other: 'Autre',
};

export const CONTRIBUTION_CATEGORIES = [
  'Offrande générale',
  'Dîme',
  'Offrande spéciale',
  'Action de grâce',
  'Don',
  'Offrande de construction',
  'Offrande missionnaire',
  'Contribution à un programme',
  'Cotisation',
  'Offrande de cellule',
  'Offrande des enfants',
  'Offrande de jeunesse',
  'Vente de documents',
  'Promesse',
  'Autre recette',
] as const;

export const EXPENSE_CATEGORIES = [
  'Loyer',
  'Électricité',
  'Eau',
  'Internet',
  'Transport',
  'Missions',
  'Aide sociale',
  'Entretien',
  'Construction',
  'Équipement',
  'Communication',
  'Restauration',
  'Hébergement',
  'Honoraires',
  'Salaire ou gratification',
  'Fournitures',
  'Évènement',
  'Autre',
] as const;

export const DEPARTMENT_NAMES = [
  'Pastorale',
  'Secrétariat',
  'Trésorerie',
  'Chorale',
  'Louange et adoration',
  'Intercession',
  'Évangélisation',
  'Jeunesse',
  'Femmes',
  'Hommes',
  'Enfants',
  'Accueil et protocole',
  'Sécurité',
  'Technique',
  'Sonorisation',
  'Média et communication',
  'Action sociale',
  'Suivi des nouveaux',
  'Formation',
  'Entretien et logistique',
  'Missions',
  'Cellule de prière',
  'Autres',
] as const;

export const VISITOR_FOLLOWUP_STEPS = [
  { key: 'welcome_message', label: 'Message de bienvenue' },
  { key: 'phone_call', label: 'Appel téléphonique' },
  { key: 'pastoral_visit', label: 'Visite pastorale' },
  { key: 'second_attendance', label: 'Deuxième participation' },
  { key: 'cell_orientation', label: 'Orientation vers une cellule' },
  { key: 'integration_class', label: 'Classe dintégration' },
  { key: 'conversion', label: 'Conversion' },
  { key: 'baptism', label: 'Baptême' },
  { key: 'membership', label: 'Intégration comme membre' },
] as const;

export const ABSENCE_REASONS: Record<string, string> = {
  illness: 'Maladie',
  travel: 'Voyage',
  relocation: 'Déménagement',
  family: 'Difficulté familiale',
  financial: 'Problème financier',
  conflict: 'Conflit',
  church_change: "Changement d'église",
  work: 'Indisponibilité professionnelle',
  other: 'Autre raison',
};
