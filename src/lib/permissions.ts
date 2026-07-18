import type { Role } from '../types';

export type Permission =
  | 'churches.manage'
  | 'churches.view'
  | 'users.manage'
  | 'audit.view'
  | 'settings.manage'
  | 'members.view'
  | 'members.manage'
  | 'members.archive'
  | 'visitors.view'
  | 'visitors.manage'
  | 'events.view'
  | 'events.manage'
  | 'attendance.view'
  | 'attendance.manage'
  | 'absences.view'
  | 'absences.manage'
  | 'departments.view'
  | 'departments.manage'
  | 'cells.view'
  | 'cells.manage'
  | 'sermons.view'
  | 'sermons.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'finance.validate'
  | 'pastoral.view'
  | 'pastoral.manage'
  | 'reports.view'
  | 'stats.view'
  | 'stats.view_all'
  | 'backups.manage';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'churches.manage', 'churches.view', 'users.manage', 'audit.view', 'settings.manage',
    'members.view', 'members.manage', 'members.archive',
    'visitors.view', 'visitors.manage',
    'events.view', 'events.manage',
    'attendance.view', 'attendance.manage',
    'absences.view', 'absences.manage',
    'departments.view', 'departments.manage',
    'cells.view', 'cells.manage',
    'sermons.view', 'sermons.manage',
    'finance.view', 'finance.manage', 'finance.validate',
    'pastoral.view', 'pastoral.manage',
    'reports.view', 'stats.view', 'stats.view_all', 'backups.manage',
  ],
  hq_admin: [
    'churches.view', 'members.view', 'members.manage',
    'visitors.view', 'visitors.manage',
    'events.view', 'events.manage',
    'attendance.view', 'attendance.manage',
    'absences.view', 'absences.manage',
    'departments.view', 'departments.manage',
    'cells.view', 'cells.manage',
    'sermons.view', 'sermons.manage',
    'finance.view', 'finance.manage', 'finance.validate',
    'pastoral.view', 'pastoral.manage',
    'reports.view', 'stats.view', 'stats.view_all',
  ],
  senior_pastor: [
    'members.view', 'members.manage',
    'visitors.view', 'visitors.manage',
    'events.view', 'events.manage',
    'attendance.view', 'attendance.manage',
    'absences.view', 'absences.manage',
    'departments.view', 'departments.manage',
    'cells.view', 'cells.manage',
    'sermons.view', 'sermons.manage',
    'finance.view',
    'pastoral.view', 'pastoral.manage',
    'reports.view', 'stats.view', 'stats.view_all',
  ],
  assembly_pastor: [
    'members.view', 'members.manage',
    'visitors.view', 'visitors.manage',
    'events.view', 'events.manage',
    'attendance.view', 'attendance.manage',
    'absences.view', 'absences.manage',
    'departments.view', 'departments.manage',
    'cells.view', 'cells.manage',
    'sermons.view', 'sermons.manage',
    'finance.view',
    'pastoral.view', 'pastoral.manage',
    'reports.view', 'stats.view',
  ],
  secretary: [
    'members.view', 'members.manage',
    'visitors.view', 'visitors.manage',
    'events.view', 'events.manage',
    'attendance.view', 'attendance.manage',
    'absences.view', 'absences.manage',
    'departments.view',
    'cells.view',
    'sermons.view', 'sermons.manage',
    'reports.view', 'stats.view',
  ],
  treasurer: [
    'members.view',
    'events.view',
    'attendance.view',
    'departments.view',
    'finance.view', 'finance.manage', 'finance.validate',
    'reports.view', 'stats.view',
  ],
  department_head: [
    'members.view',
    'events.view',
    'attendance.view',
    'departments.view', 'departments.manage',
    'stats.view',
  ],
  cell_leader: [
    'members.view',
    'cells.view',
    'attendance.view',
    'absences.view', 'absences.manage',
    'stats.view',
  ],
  pastoral_care: [
    'members.view',
    'visitors.view', 'visitors.manage',
    'absences.view', 'absences.manage',
    'pastoral.view', 'pastoral.manage',
    'stats.view',
  ],
  data_entry: [
    'members.view', 'members.manage',
    'visitors.view', 'visitors.manage',
    'attendance.view', 'attendance.manage',
    'events.view',
  ],
  member: [
    'stats.view',
  ],
};

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

export function canManageChurches(role: Role | undefined): boolean {
  return hasPermission(role, 'churches.manage');
}

export function canViewFinance(role: Role | undefined): boolean {
  return hasPermission(role, 'finance.view');
}

export function canViewAllStats(role: Role | undefined): boolean {
  return hasPermission(role, 'stats.view_all');
}

export function canViewPastoral(role: Role | undefined): boolean {
  return hasPermission(role, 'pastoral.view');
}

export function canManageUsers(role: Role | undefined): boolean {
  return hasPermission(role, 'users.manage');
}
