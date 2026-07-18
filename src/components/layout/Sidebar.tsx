import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Church, Users, UserPlus, CalendarCheck, CalendarDays,
  BookOpen, Building2, Home, HeartHandshake, GraduationCap, Wallet,
  Megaphone, FolderOpen, BarChart3, Settings, ShieldCheck, X, Palette,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, canViewFinance, canManageUsers } from '../../lib/permissions';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: boolean;
  children?: { to: string; label: string }[];
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const role = profile?.role;
  const location = useLocation();

  const navGroups: { title: string; items: NavItem[] }[] = [
    {
      title: '',
      items: [
        { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Assemblées',
      items: [
        { to: '/churches', label: 'Assemblées', icon: Church, permission: hasPermission(role, 'churches.view') },
      ],
    },
    {
      title: 'Personnes',
      items: [
        { to: '/members', label: 'Membres', icon: Users, permission: hasPermission(role, 'members.view') },
        { to: '/visitors', label: 'Visiteurs', icon: UserPlus, permission: hasPermission(role, 'visitors.view') },
      ],
    },
    {
      title: 'Cultes & Présences',
      items: [
        { to: '/attendance', label: 'Présences', icon: CalendarCheck, permission: hasPermission(role, 'attendance.view') },
        { to: '/absences', label: 'Absences', icon: CalendarCheck, permission: hasPermission(role, 'absences.view') },
        { to: '/events', label: 'Programmes', icon: CalendarDays, permission: hasPermission(role, 'events.view') },
        { to: '/sermons', label: 'Prédications', icon: BookOpen, permission: hasPermission(role, 'sermons.view') },
      ],
    },
    {
      title: 'Organisation',
      items: [
        { to: '/departments', label: 'Départements', icon: Building2, permission: hasPermission(role, 'departments.view') },
        { to: '/cells', label: 'Cellules', icon: Home, permission: hasPermission(role, 'cells.view') },
        { to: '/spiritual-families', label: 'Familles spirituelles', icon: Palette, permission: hasPermission(role, 'members.view') },
        { to: '/pastoral', label: 'Suivi pastoral', icon: HeartHandshake, permission: hasPermission(role, 'pastoral.view') },
        { to: '/training', label: 'Formations', icon: GraduationCap, permission: hasPermission(role, 'members.view') },
      ],
    },
    {
      title: 'Finances',
      items: [
        { to: '/finance', label: 'Finances', icon: Wallet, permission: canViewFinance(role) },
      ],
    },
    {
      title: 'Outils',
      items: [
        { to: '/communication', label: 'Communication', icon: Megaphone, permission: hasPermission(role, 'members.view') },
        { to: '/documents', label: 'Documents', icon: FolderOpen, permission: hasPermission(role, 'members.view') },
        { to: '/stats', label: 'Statistiques', icon: BarChart3, permission: hasPermission(role, 'stats.view') },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/admin/users', label: 'Utilisateurs', icon: ShieldCheck, permission: canManageUsers(role) },
        { to: '/admin/audit', label: "Journal d'audit", icon: ShieldCheck, permission: hasPermission(role, 'audit.view') },
        { to: '/admin/settings', label: 'Paramètres', icon: Settings, permission: hasPermission(role, 'settings.manage') },
      ],
    },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-ink-200 dark:bg-ink-900 dark:border-ink-800 transition-transform duration-200 lg:translate-x-0 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-ink-200 dark:border-ink-800 shrink-0">
          <img src="/Logo_CAE.png" alt="EECAE" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-bold text-bordeaux-800 dark:text-bordeaux-300 leading-tight">EECAE</p>
            <p className="text-[11px] text-ink-400 truncate">Centre d'Adoration de l'Éternel</p>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {navGroups.map((group, gi) => {
            const visibleItems = group.items.filter((i) => i.permission !== false);
            if (!visibleItems.length) return null;
            return (
              <div key={gi}>
                {group.title && (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{group.title}</p>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname.startsWith(item.to);
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => onClose()}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-bordeaux-50 text-bordeaux-700 dark:bg-bordeaux-900/30 dark:text-bordeaux-300'
                            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100',
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-ink-200 dark:border-ink-800 px-5 py-3 shrink-0">
          <p className="text-[11px] text-ink-400 text-center">EECAE · v1.0 — Phase 1</p>
        </div>
      </aside>
    </>
  );
}
