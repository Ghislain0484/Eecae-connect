import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, Church, UserChurchAccess } from '../types';
import type { Role } from '../types';
import { ROLE_LABELS } from '../types/constants';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  accesses: UserChurchAccess[];
  accessibleChurches: Church[];
  activeChurch: Church | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  setActiveChurchId: (churchId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LAST_CHURCH_KEY = 'eecae_last_church';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accesses, setAccesses] = useState<UserChurchAccess[]>([]);
  const [accessibleChurches, setAccessibleChurches] = useState<Church[]>([]);
  const [activeChurch, setActiveChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfileAndChurches = async (userId: string) => {
    const { data: prof } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(prof as UserProfile | null);

    const { data: acc } = await supabase
      .from('user_church_access')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    setAccesses((acc as UserChurchAccess[]) || []);

    const accessibleIds = ((acc as UserChurchAccess[]) || [])
      .map((a) => a.church_id)
      .concat(prof?.default_church_id ? [prof.default_church_id] : []);
    const uniqueIds = [...new Set(accessibleIds)];

    if (uniqueIds.length) {
      const { data: churches } = await supabase
        .from('churches')
        .select('*')
        .in('id', uniqueIds)
        .eq('status', 'active')
        .order('is_headquarters', { ascending: false })
        .order('name', { ascending: true });
      const churchesList = (churches as Church[]) || [];
      setAccessibleChurches(churchesList);

      const lastChurchId = localStorage.getItem(LAST_CHURCH_KEY);
      const found = churchesList.find((c) => c.id === lastChurchId);
      if (found) {
        setActiveChurch(found);
      } else if (churchesList.length > 0) {
        setActiveChurch(churchesList[0]);
      } else {
        setActiveChurch(null);
      }
    } else {
      setAccessibleChurches([]);
      setActiveChurch(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfileAndChurches(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfileAndChurches(s.user.id);
        } else {
          setProfile(null);
          setAccesses([]);
          setAccessibleChurches([]);
          setActiveChurch(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Inactivity auto-logout
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      supabase.auth.signOut();
    }, INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!session) return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'member' as Role,
        is_active: true,
      });
    }
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(LAST_CHURCH_KEY);
    await supabase.auth.signOut();
    setProfile(null);
    setAccesses([]);
    setAccessibleChurches([]);
    setActiveChurch(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const setActiveChurchId = (churchId: string) => {
    const church = accessibleChurches.find((c) => c.id === churchId);
    if (church) {
      setActiveChurch(church);
      localStorage.setItem(LAST_CHURCH_KEY, churchId);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndChurches(user.id);
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      accesses,
      accessibleChurches,
      activeChurch,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      setActiveChurchId,
      refreshProfile,
    }),
    [session, user, profile, accesses, accessibleChurches, activeChurch, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoleLabel(role: Role | undefined): string {
  if (!role) return '';
  return ROLE_LABELS[role] || role;
}
