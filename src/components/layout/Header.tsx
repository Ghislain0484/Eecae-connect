import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Moon, Sun, LogOut, ChevronDown, User, Settings, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../ui';
import { cn } from '../../lib/utils';
import { ROLE_LABELS } from '../../types/constants';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile, activeChurch, accessibleChurches, setActiveChurchId, signOut } = useAuth();
  const { branding } = useBranding();
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200/80 bg-white/85 px-4 lg:px-6 backdrop-blur-xl dark:border-ink-800/80 dark:bg-ink-900/85">
      <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2 rounded-xl">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre, visiteur, prédication..."
          className="w-full rounded-xl border border-ink-200/90 bg-ink-50/80 py-2 pl-9.5 pr-3 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:border-ink-700/80 dark:bg-ink-800/70 dark:focus:bg-ink-900 shadow-xs transition-all"
        />
      </form>

      <div className="flex-1 sm:hidden" />

      {/* Church switcher */}
      <div ref={churchRef} className="relative">
        <button
          onClick={() => setChurchOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm font-medium hover:bg-ink-100/80 dark:hover:bg-ink-800/80 transition-all max-w-[220px] border border-ink-200/60 dark:border-ink-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs shrink-0" style={{ backgroundColor: branding.primaryColor }}>
            {activeChurch?.short_name?.charAt(0) ?? branding.shortName?.charAt(0) ?? 'E'}
          </div>
          <span className="truncate hidden md:block font-medium text-ink-800 dark:text-ink-200">
            {activeChurch?.short_name ?? activeChurch?.name ?? 'Sélectionner'}
          </span>
          <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
        </button>
        {churchOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-ink-200/90 bg-white/95 backdrop-blur-xl py-2 shadow-card-lg animate-scale-in dark:border-ink-800 dark:bg-ink-900/95 z-50">
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-ink-100 dark:border-ink-800 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Assemblées du Réseau</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                {accessibleChurches.length} temples
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {accessibleChurches.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveChurchId(c.id); setChurchOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-ink-100/80 dark:hover:bg-ink-800/80 transition-colors',
                    activeChurch?.id === c.id && 'bg-brand-primary/10 font-semibold',
                  )}
                >
                  <div className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: branding.primaryColor }}>
                    {c.short_name?.charAt(0) || c.name?.charAt(0) || 'T'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="truncate font-medium text-ink-900 dark:text-ink-100">{c.name}</p>
                    <p className="text-[11px] text-ink-400 truncate">{c.city} — {c.neighborhood || 'Paroisse'}</p>
                  </div>
                  {activeChurch?.id === c.id && <Check className="h-4 w-4 text-brand-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button onClick={() => setNotifOpen((o) => !o)} className="btn-ghost p-2 rounded-xl relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full" style={{ backgroundColor: branding.accentColor }} />
        </button>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-ink-200/90 bg-white/95 backdrop-blur-xl py-2 shadow-card-lg animate-scale-in dark:border-ink-800 dark:bg-ink-900/95 z-50">
            <p className="px-4 py-2 text-sm font-semibold border-b border-ink-100 dark:border-ink-800">Notifications</p>
            <div className="py-2">
              <p className="px-4 py-4 text-xs text-center text-ink-500">Aucune nouvelle notification pour le moment.</p>
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl" title="Basculer le mode Sombre / Clair">
        {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-ink-600" />}
      </button>

      {/* User menu */}
      <div ref={userRef} className="relative">
        <button onClick={() => setUserOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 hover:bg-ink-100/80 dark:hover:bg-ink-800/80 transition-all border border-transparent hover:border-ink-200 dark:hover:border-ink-700">
          <Avatar firstName={profile?.full_name} size="sm" />
          <ChevronDown className="h-4 w-4 text-ink-400 hidden sm:block" />
        </button>
        {userOpen && (
          <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-ink-200/90 bg-white/95 backdrop-blur-xl py-2 shadow-card-lg animate-scale-in dark:border-ink-800 dark:bg-ink-900/95 z-50">
            <div className="px-4 py-2.5 border-b border-ink-100 dark:border-ink-800">
              <p className="text-sm font-bold text-ink-900 dark:text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-ink-400 truncate">{profile?.email}</p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5" style={{ backgroundColor: `${branding.primaryColor}15`, color: branding.primaryColor }}>
                {profile ? ROLE_LABELS[profile.role] : ''}
              </span>
            </div>
            <div className="p-1 space-y-0.5">
              <button onClick={() => { setUserOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-ink-100/80 dark:hover:bg-ink-800/80 transition-colors text-ink-700 dark:text-ink-300">
                <User className="h-4 w-4 text-ink-400" /> Mon profil
              </button>
              <button onClick={() => { setUserOpen(false); navigate('/admin/settings'); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-ink-100/80 dark:hover:bg-ink-800/80 transition-colors text-ink-700 dark:text-ink-300">
                <Settings className="h-4 w-4 text-ink-400" /> Personnalisation & Réglages
              </button>
              <button onClick={() => signOut()} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
