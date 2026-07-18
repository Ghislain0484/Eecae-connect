import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Moon, Sun, LogOut, ChevronDown, User, Settings, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../ui';
import { cn } from '../../lib/utils';
import { ROLE_LABELS } from '../../types/constants';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile, activeChurch, accessibleChurches, setActiveChurchId, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [churchOpen, setChurchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const churchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (churchRef.current && !churchRef.current.contains(e.target as Node)) setChurchOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/members?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/80 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/80">
      <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre, visiteur..."
          className="w-full rounded-lg border border-ink-200 bg-ink-50 py-2 pl-9 pr-3 text-sm focus:border-bordeaux-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bordeaux-500/20 dark:border-ink-700 dark:bg-ink-800 dark:focus:bg-ink-900"
        />
      </form>

      <div className="flex-1 sm:hidden" />

      {/* Church switcher */}
      <div ref={churchRef} className="relative">
        <button
          onClick={() => setChurchOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors max-w-[200px]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bordeaux-100 text-xs font-bold text-bordeaux-700 dark:bg-bordeaux-900/40 dark:text-bordeaux-300 shrink-0">
            {activeChurch?.short_name?.charAt(0) ?? 'EE'}
          </div>
          <span className="truncate hidden md:block">{activeChurch?.short_name ?? 'Sélectionner'}</span>
          <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
        </button>
        {churchOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-ink-200 bg-white py-2 shadow-card-lg animate-scale-in dark:border-ink-800 dark:bg-ink-900 z-50">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Assemblées</p>
            {accessibleChurches.map((c) => (
              <button
                key={c.id}
                onClick={() => { setActiveChurchId(c.id); setChurchOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors',
                  activeChurch?.id === c.id && 'bg-bordeaux-50 dark:bg-bordeaux-900/20',
                )}
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate font-medium text-ink-800 dark:text-ink-200">{c.short_name ?? c.name}</p>
                  <p className="text-xs text-ink-400 truncate">{c.city}</p>
                </div>
                {activeChurch?.id === c.id && <Check className="h-4 w-4 text-bordeaux-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button onClick={() => setNotifOpen((o) => !o)} className="btn-ghost p-2 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold-500" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-ink-200 bg-white py-2 shadow-card-lg animate-scale-in dark:border-ink-800 dark:bg-ink-900 z-50">
            <p className="px-4 py-2 text-sm font-semibold border-b border-ink-100 dark:border-ink-800">Notifications</p>
            <div className="py-2">
              <p className="px-4 py-3 text-sm text-ink-500">Aucune nouvelle notification.</p>
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} className="btn-ghost p-2">
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* User menu */}
      <div ref={userRef} className="relative">
        <button onClick={() => setUserOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
          <Avatar firstName={profile?.full_name} size="sm" />
          <ChevronDown className="h-4 w-4 text-ink-400 hidden sm:block" />
        </button>
        {userOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-ink-200 bg-white py-2 shadow-card-lg animate-scale-in dark:border-ink-800 dark:bg-ink-900 z-50">
            <div className="px-4 py-2 border-b border-ink-100 dark:border-ink-800">
              <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
              <p className="text-xs text-ink-400 truncate">{profile?.email}</p>
              <p className="text-xs text-bordeaux-600 mt-0.5">{profile ? ROLE_LABELS[profile.role] : ''}</p>
            </div>
            <button onClick={() => { setUserOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
              <User className="h-4 w-4" /> Mon profil
            </button>
            <button onClick={() => { setUserOpen(false); navigate('/admin/settings'); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
              <Settings className="h-4 w-4" /> Paramètres
            </button>
            <button onClick={() => signOut()} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
