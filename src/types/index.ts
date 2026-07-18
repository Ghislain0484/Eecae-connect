export type Role =
  | 'super_admin'
  | 'hq_admin'
  | 'senior_pastor'
  | 'assembly_pastor'
  | 'secretary'
  | 'treasurer'
  | 'department_head'
  | 'cell_leader'
  | 'pastoral_care'
  | 'data_entry'
  | 'member';

export type MemberStatus =
  | 'visitor'
  | 'new_visitor'
  | 'new_convert'
  | 'integrating'
  | 'active'
  | 'irregular'
  | 'inactive'
  | 'transferred'
  | 'left'
  | 'deceased'
  | 'archived';

export type VisitorStatus =
  | 'first_visit'
  | 'second_visit'
  | 'regular'
  | 'integrating'
  | 'converted'
  | 'became_member'
  | 'no_contact'
  | 'lost';

export type EventStatus = 'planned' | 'ongoing' | 'done' | 'cancelled' | 'postponed';

export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'bank_transfer'
  | 'orange_money'
  | 'mtn_money'
  | 'moov_money'
  | 'wave'
  | 'card'
  | 'other';

export interface Church {
  id: string;
  name: string;
  short_name: string | null;
  is_headquarters: boolean;
  parent_church_id: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  senior_pastor: string | null;
  status: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  default_church_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserChurchAccess {
  id: string;
  user_id: string;
  church_id: string;
  role: string;
  can_view_finance: boolean;
  can_view_pastoral: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  church_id: string;
  matricule: string | null;
  photo_url: string | null;
  last_name: string;
  first_name: string;
  sex: 'M' | 'F' | null;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  marital_status: string | null;
  profession: string | null;
  education_level: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  country: string | null;
  phone_main: string | null;
  phone_whatsapp: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_phone: string | null;
  first_visit_date: string | null;
  integration_date: string | null;
  conversion_date: string | null;
  water_baptism_date: string | null;
  holy_spirit_baptized: boolean | null;
  holy_spirit_baptism_date: string | null;
  status: MemberStatus;
  department_id: string | null;
  sub_department: string | null;
  cell_id: string | null;
  spiritual_family_id: string | null;
  pastoral_responsible: string | null;
  training_class: string | null;
  spiritual_gift: string | null;
  ministry: string | null;
  function: string | null;
  available_for_service: boolean | null;
  pastoral_notes: string | null;
  notes_confidential: boolean;
  visitor_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Visitor {
  id: string;
  church_id: string;
  last_name: string;
  first_name: string;
  sex: 'M' | 'F' | null;
  age_range: string | null;
  phone: string | null;
  phone_whatsapp: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  profession: string | null;
  origin_church: string | null;
  invited_by: string | null;
  first_visit_date: string;
  event_id: string | null;
  prayer_subject: string | null;
  wants_contact: boolean | null;
  wants_to_join: boolean | null;
  wants_pastoral_visit: boolean | null;
  visit_count: number;
  status: VisitorStatus;
  observations: string | null;
  converted_member_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface EventItem {
  id: string;
  church_id: string;
  title: string;
  type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  theme: string | null;
  sub_theme: string | null;
  main_verse: string | null;
  preacher: string | null;
  moderator: string | null;
  prayer_leader: string | null;
  program_responsible: string | null;
  choir: string | null;
  worship_team: string | null;
  intercession_team: string | null;
  protocol_team: string | null;
  security_team: string | null;
  media_team: string | null;
  children_teachers: string | null;
  technicians: string | null;
  other_workers: string | null;
  seats_available: number | null;
  poster_url: string | null;
  description: string | null;
  observations: string | null;
  status: EventStatus;
  closure_validated: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Sermon {
  id: string;
  church_id: string;
  event_id: string | null;
  theme: string;
  sub_theme: string | null;
  preacher: string;
  sermon_date: string;
  program_type: string | null;
  main_verse: string | null;
  other_references: string | null;
  summary: string | null;
  main_points: string | null;
  recommendation: string | null;
  video_url: string | null;
  audio_url: string | null;
  pdf_url: string | null;
  poster_url: string | null;
  transcript: string | null;
  keywords: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface AttendanceTotal {
  id: string;
  session_id: string;
  church_id: string;
  men: number;
  women: number;
  children: number;
  teens: number;
  youth_12_40: number;
  adults: number;
  seniors: number;
  identified_members: number;
  visitors: number;
  new_visitors: number;
  returned_after_absence: number;
  total_participants: number;
  children_service_count: number;
  outside_count: number;
  online_count: number;
  decisions_for_christ: number;
  testimonies: number;
  baptisms_announced: number;
}

export interface Department {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  head_member_id: string | null;
  status: string;
  created_at: string;
  archived_at: string | null;
}

export interface Cell {
  id: string;
  church_id: string;
  name: string;
  code: string | null;
  zone: string | null;
  neighborhood: string | null;
  address: string | null;
  leader_member_id: string | null;
  phone: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  capacity: number | null;
  status: string;
  created_at: string;
  archived_at: string | null;
}

export interface Family {
  id: string;
  church_id: string;
  name: string;
  head_member_id: string | null;
  spouse_member_id: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  cell_id: string | null;
  main_contact_phone: string | null;
  household_status: string;
  observations: string | null;
  created_at: string;
  archived_at: string | null;
}

export interface SpiritualFamily {
  id: string;
  church_id: string;
  name: string;
  color_name: string;
  color_hex: string;
  leader_member_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Contribution {
  id: string;
  church_id: string;
  event_id: string | null;
  contribution_date: string;
  category: string;
  amount: number;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  received_by: string | null;
  counted_by: string | null;
  validated_by: string | null;
  comment: string | null;
  receipt_url: string | null;
  is_validated: boolean;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Expense {
  id: string;
  church_id: string;
  event_id: string | null;
  department_id: string | null;
  expense_date: string;
  category: string;
  supplier: string | null;
  motive: string | null;
  amount: number;
  payment_method: PaymentMethod | null;
  requested_by: string | null;
  validated_by: string | null;
  paid_by: string | null;
  receipt_url: string | null;
  piece_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Tithe {
  id: string;
  church_id: string;
  event_id: string | null;
  member_id: string | null;
  contributor_name: string | null;
  period: string | null;
  amount: number;
  tithe_date: string;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  is_anonymous: boolean;
  comment: string | null;
  is_validated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pledge {
  id: string;
  church_id: string;
  pledge_type: string | null;
  member_id: string | null;
  donor_name: string | null;
  amount_promised: number;
  amount_paid: number;
  due_date: string | null;
  frequency: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AbsenceFollowup {
  id: string;
  church_id: string;
  member_id: string;
  assigned_to: string | null;
  reason: string | null;
  call_done: boolean | null;
  message_sent: boolean | null;
  visit_done: boolean | null;
  reason_detail: string | null;
  report: string | null;
  next_action: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  module: string | null;
  entity_type: string | null;
  entity_id: string | null;
  church_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}
