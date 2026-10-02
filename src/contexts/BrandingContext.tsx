import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentHover: string;
  accentLight: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'eecae-bordeaux-gold',
    name: 'EECAE Bordeaux Royal & Or Divin',
    primary: '#7a1e30',
    primaryHover: '#5e1624',
    primaryLight: '#fbf3f4',
    accent: '#d4a82f',
    accentHover: '#bd8a23',
    accentLight: '#fdfbf3',
  },
  {
    id: 'royal-blue-gold',
    name: 'Bleu Majesté & Or Céleste',
    primary: '#1e3a8a',
    primaryHover: '#172554',
    primaryLight: '#eff6ff',
    accent: '#d97706',
    accentHover: '#b45309',
    accentLight: '#fffbeb',
  },
  {
    id: 'emerald-bronze',
    name: 'Vert Émeraude & Bronze d\'Espoir',
    primary: '#065f46',
    primaryHover: '#022c22',
    primaryLight: '#ecfdf5',
    accent: '#d97706',
    accentHover: '#92400e',
    accentLight: '#fef3c7',
  },
  {
    id: 'imperial-purple',
    name: 'Pourpre Impérial & Saphir',
    primary: '#581c87',
    primaryHover: '#3b0764',
    primaryLight: '#faf5ff',
    accent: '#0284c7',
    accentHover: '#0369a1',
    accentLight: '#f0f9ff',
  },
  {
    id: 'deep-sapphire-copper',
    name: 'Saphir Nocturne & Or Cuivré',
    primary: '#0f172a',
    primaryHover: '#020617',
    primaryLight: '#f8fafc',
    accent: '#ea580c',
    accentHover: '#c2410c',
    accentLight: '#fff7ed',
  },
  {
    id: 'ruby-gold',
    name: 'Rubis Ardent & Or Pur',
    primary: '#991b1b',
    primaryHover: '#7f1d1d',
    primaryLight: '#fef2f2',
    accent: '#eab308',
    accentHover: '#ca8a04',
    accentLight: '#fefce8',
  },
];

export interface ChurchBranding {
  churchName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  presetId: string;
  primaryColor: string;
  primaryHover: string;
  primaryLight: string;
  accentColor: string;
  accentHover: string;
  accentLight: string;
  currency: string;
}

const DEFAULT_BRANDING: ChurchBranding = {
  churchName: 'Église Évangélique Centre d\'Adoration de l\'Éternel',
  shortName: 'EECAE',
  tagline: 'Centre d\'Adoration de l\'Éternel',
  logoUrl: '/Logo_CAE.png',
  presetId: 'eecae-bordeaux-gold',
  primaryColor: '#7a1e30',
  primaryHover: '#5e1624',
  primaryLight: '#fbf3f4',
  accentColor: '#d4a82f',
  accentHover: '#bd8a23',
  accentLight: '#fdfbf3',
  currency: 'FCFA',
};

const STORAGE_KEY = 'eecae_custom_branding';

interface BrandingContextType {
  branding: ChurchBranding;
  updateBranding: (newBranding: Partial<ChurchBranding>) => Promise<void>;
  applyPreset: (presetId: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { activeChurch } = useAuth();
  const [branding, setBranding] = useState<ChurchBranding>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error loading local branding', e);
    }
    return DEFAULT_BRANDING;
  });

  // Apply CSS variables to root dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-primary-hover', branding.primaryHover);
    root.style.setProperty('--brand-primary-light', branding.primaryLight);
    root.style.setProperty('--brand-accent', branding.accentColor);
    root.style.setProperty('--brand-accent-hover', branding.accentHover);
    root.style.setProperty('--brand-accent-light', branding.accentLight);
  }, [branding]);

  // Sync with database settings if available
  useEffect(() => {
    if (!activeChurch?.id) return;

    const fetchDbBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('application_settings')
          .select('key, value')
          .eq('church_id', activeChurch.id);

        if (error || !data) return;

        const dbSettings: Record<string, string> = {};
        data.forEach((item) => {
          dbSettings[item.key] = item.value;
        });

        if (dbSettings.brand_customization) {
          try {
            const parsed = JSON.parse(dbSettings.brand_customization);
            setBranding((prev) => ({ ...prev, ...parsed }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (err) {
            console.error('Failed to parse brand_customization JSON', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch DB branding', err);
      }
    };

    fetchDbBranding();
  }, [activeChurch?.id]);

  const updateBranding = async (updates: Partial<ChurchBranding>) => {
    const merged = { ...branding, ...updates };
    setBranding(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    if (activeChurch?.id) {
      try {
        const payload = {
          church_id: activeChurch.id,
          key: 'brand_customization',
          value: JSON.stringify(merged),
        };

        const { data: existing } = await supabase
          .from('application_settings')
          .select('id')
          .eq('church_id', activeChurch.id)
          .eq('key', 'brand_customization')
          .maybeSingle();

        if (existing) {
          await supabase.from('application_settings').update({ value: payload.value }).eq('id', existing.id);
        } else {
          await supabase.from('application_settings').insert(payload);
        }
      } catch (err) {
        console.error('Error saving branding to DB', err);
      }
    }
  };

  const applyPreset = async (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    await updateBranding({
      presetId: preset.id,
      primaryColor: preset.primary,
      primaryHover: preset.primaryHover,
      primaryLight: preset.primaryLight,
      accentColor: preset.accent,
      accentHover: preset.accentHover,
      accentLight: preset.accentLight,
    });
  };

  const resetToDefault = async () => {
    setBranding(DEFAULT_BRANDING);
    localStorage.removeItem(STORAGE_KEY);
    if (activeChurch?.id) {
      await supabase
        .from('application_settings')
        .delete()
        .eq('church_id', activeChurch.id)
        .eq('key', 'brand_customization');
    }
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, applyPreset, resetToDefault }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
