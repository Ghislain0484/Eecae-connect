import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Church, Users, UserPlus, CalendarCheck, CalendarDays,
  BookOpen, Building2, Home, HeartHandshake, GraduationCap, Wallet,
  Megaphone, FolderOpen, BarChart3, Settings, ShieldCheck, X, Palette, Radio,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
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
  const { branding } = useBranding();
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
        { to: '/live-worship', label: 'Culte en Direct', icon: Radio, permission: hasPermission(role, 'attendance.view') },
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
        <div className="flex items-center gap-3 px-5 h-16 border-b border-ink-200/80 dark:border-ink-800/80 shrink-0 bg-gradient-to-r from-brand-primary-light/50 to-transparent dark:from-brand-primary/10">
          <img
            src={branding.logoUrl || '/Logo_CAE.png'}
            alt={branding.shortName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/Logo_CAE.png';
            }}
            className="h-10 w-10 rounded-xl object-contain shadow-xs bg-white dark:bg-ink-800 p-0.5 border border-ink-100 dark:border-ink-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-base font-bold tracking-tight text-ink-900 dark:text-white leading-tight truncate">
              {branding.shortName}
            </p>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 font-medium truncate">
              {branding.tagline}
            </p>
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
                  <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">{group.title}</p>
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
                          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-brand-primary/10 text-brand-primary font-semibold dark:bg-brand-primary/20 dark:text-white shadow-xs border-l-[3px] border-brand-primary pl-[9px]'
                            : 'text-ink-600 hover:bg-ink-100/80 hover:text-ink-950 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-ink-100',
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-ink-200/80 dark:border-ink-800/80 px-5 py-3 shrink-0 flex items-center justify-between text-[11px] text-ink-400">
          <span className="font-semibold text-ink-600 dark:text-ink-300">{branding.shortName}</span>
          <span>v2.0 Pro</span>
        </div>
      </aside>
    </>
  );
}
