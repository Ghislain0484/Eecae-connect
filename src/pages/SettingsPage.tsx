import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Building2, Palette, Sparkles, RotateCcw, Check, Info, Shield, Image, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBranding, THEME_PRESETS } from '../contexts/BrandingContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { logAudit } from '../lib/audit';

export function SettingsPage() {
  const { activeChurch, refreshProfile } = useAuth();
  const { branding, updateBranding, applyPreset, resetToDefault } = useBranding();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'branding' | 'church' | 'system'>('branding');

  // Branding local states
  const [churchNameBranding, setChurchNameBranding] = useState(branding.churchName);
  const [shortNameBranding, setShortNameBranding] = useState(branding.shortName);
  const [taglineBranding, setTaglineBranding] = useState(branding.tagline);
  const [logoUrlBranding, setLogoUrlBranding] = useState(branding.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [accentColor, setAccentColor] = useState(branding.accentColor);
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    setChurchNameBranding(branding.churchName);
    setShortNameBranding(branding.shortName);
    setTaglineBranding(branding.tagline);
    setLogoUrlBranding(branding.logoUrl);
    setPrimaryColor(branding.primaryColor);
    setAccentColor(branding.accentColor);
  }, [branding]);

  // Church local states
  const [churchName, setChurchName] = useState('');
  const [shortName, setShortName] = useState('');
  const [pastor, setPastor] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [savingChurch, setSavingChurch] = useState(false);

  useEffect(() => {
    if (activeChurch) {
      setChurchName(activeChurch.name || '');
      setShortName(activeChurch.short_name || '');
      setPastor(activeChurch.senior_pastor || '');
      setNeighborhood(activeChurch.neighborhood || '');
      setCity(activeChurch.city || '');
    }
  }, [activeChurch]);

  // System settings state
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['app-settings', activeChurch?.id],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .eq('church_id', activeChurch.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeChurch?.id,
  });

  const [currency, setCurrency] = useState('FCFA');
  const [timeout, setTimeoutVal] = useState('30');

  useEffect(() => {
    if (settings && settings.length > 0) {
      const curr = settings.find((s) => s.key === 'currency')?.value || 'FCFA';
      const time = settings.find((s) => s.key === 'inactivity_timeout_minutes')?.value || '30';
      setCurrency(curr);
      setTimeoutVal(time);
    }
  }, [settings]);

  // Save branding mutation
  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      await updateBranding({
        churchName: churchNameBranding,
        shortName: shortNameBranding,
        tagline: taglineBranding,
        logoUrl: logoUrlBranding,
        primaryColor,
        primaryHover: primaryColor,
        accentColor,
        accentHover: accentColor,
      });
      toast.success('Identité visuelle & thème enregistrés avec succès');
    } catch (err: any) {
      toast.error('Erreur', err?.message || 'Échec de sauvegarde');
    } finally {
      setSavingBranding(false);
    }
  };

  // Save church mutation
  const updateChurchMutation = useMutation({
    mutationFn: async () => {
      if (!activeChurch?.id) return;
      setSavingChurch(true);
      const { error } = await supabase
        .from('churches')
        .update({
          name: churchName,
          short_name: shortName,
          senior_pastor: pastor,
          neighborhood,
          city,
        })
        .eq('id', activeChurch.id);

      if (error) throw error;

      await logAudit({
        action: 'update',
        module: 'settings',
        entityType: 'churches',
        entityId: activeChurch.id,
        churchId: activeChurch.id,
      });
    },
    onSuccess: async () => {
      toast.success('Fiche de la paroisse mise à jour');
      await refreshProfile();
      setSavingChurch(false);
    },
    onError: (err: any) => {
      toast.error('Erreur lors de la mise à jour', err.message);
      setSavingChurch(false);
    },
  });

  // Save system settings mutation
  const updateSystemSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!activeChurch?.id) return;

      const keys = [
        { key: 'currency', value: currency },
        { key: 'inactivity_timeout_minutes', value: timeout },
      ];

      for (const item of keys) {
        const { data: existing } = await supabase
          .from('application_settings')
          .select('id')
          .eq('church_id', activeChurch.id)
          .eq('key', item.key)
          .maybeSingle();

        if (existing) {
          await supabase.from('application_settings').update({ value: item.value }).eq('id', existing.id);
        } else {
          await supabase.from('application_settings').insert({ church_id: activeChurch.id, key: item.key, value: item.value });
        }
      }

      await logAudit({
        action: 'update',
        module: 'settings',
        entityType: 'application_settings',
        entityId: activeChurch.id,
        churchId: activeChurch.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Préférences système mises à jour');
    },
    onError: (err: any) => {
      toast.error('Erreur', err.message);
    },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Paramètres & Personnalisation"
        subtitle="Identité visuelle de la marque, logo, couleurs, fiche descriptive et préférences système"
      />

      {/* Tabs */}
      <div className="flex border-b border-ink-200/80 dark:border-ink-800/80 gap-2">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
            activeTab === 'branding'
              ? 'border-brand-primary text-brand-primary dark:text-white'
              : 'border-transparent text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Identité & Couleurs (White-Label)</span>
        </button>

        <button
          onClick={() => setActiveTab('church')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
            activeTab === 'church'
              ? 'border-brand-primary text-brand-primary dark:text-white'
              : 'border-transparent text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Fiche du Temple</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
            activeTab === 'system'
              ? 'border-brand-primary text-brand-primary dark:text-white'
              : 'border-transparent text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Système & Finances</span>
        </button>
      </div>

      {/* TAB 1: BRANDING & WHITE-LABELING */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink-100 dark:border-ink-800">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Personnalisation de la Marque & de l'Église
                </h3>
                <p className="text-xs text-ink-500 mt-1">
                  Personnalisez le nom, le sigle, le logo et les couleurs de l'application pour votre église ou organisation.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={async () => {
                  await resetToDefault();
                  toast.success('Paramètres par défaut EECAE restaurés');
                }}
              >
                Réinitialiser (Défaut EECAE)
              </Button>
            </div>

            {/* Presets Grid */}
            <div className="mb-8">
              <label className="label mb-3">Thèmes Royaux Prédéfinis</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {THEME_PRESETS.map((p) => {
                  const isSelected = branding.presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-brand-primary ring-2 ring-brand-primary/20 bg-brand-primary/5 shadow-xs'
                          : 'border-ink-200 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700 bg-white dark:bg-ink-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5 shrink-0">
                          <div
                            className="h-6 w-6 rounded-full border-2 border-white dark:border-ink-900 shadow-xs"
                            style={{ backgroundColor: p.primary }}
                          />
                          <div
                            className="h-6 w-6 rounded-full border-2 border-white dark:border-ink-900 shadow-xs"
                            style={{ backgroundColor: p.accent }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink-900 dark:text-white leading-tight">{p.name}</p>
                          <p className="text-[10px] text-ink-400 font-mono mt-0.5">{p.primary} / {p.accent}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-brand-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <Input
                label="Nom Complet de l'Organisation / Église"
                value={churchNameBranding}
                onChange={(e) => setChurchNameBranding(e.target.value)}
                placeholder="ex: Église Évangélique Centre d'Adoration de l'Éternel"
              />

              <Input
                label="Sigle / Acronyme Principal"
                value={shortNameBranding}
                onChange={(e) => setShortNameBranding(e.target.value)}
                placeholder="ex: EECAE"
              />

              <Input
                label="Slogan / Sous-titre"
                value={taglineBranding}
                onChange={(e) => setTaglineBranding(e.target.value)}
                placeholder="ex: Centre d'Adoration de l'Éternel"
              />

              <Input
                label="URL ou Chemin du Logo"
                value={logoUrlBranding}
                onChange={(e) => setLogoUrlBranding(e.target.value)}
                placeholder="/Logo_CAE.png ou https://..."
              />
            </div>

            {/* Custom Color Pickers */}
            <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-100 dark:border-ink-800 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-3">
                Ajustement Personnalisé des Couleurs (Code HEX)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-12 rounded-xl cursor-pointer border border-ink-300 p-0.5 bg-white"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink-800 dark:text-ink-200">Couleur Primaire (Navigation, Boutons)</p>
                    <p className="text-[11px] font-mono text-ink-400">{primaryColor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-12 rounded-xl cursor-pointer border border-ink-300 p-0.5 bg-white"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink-800 dark:text-ink-200">Couleur d'Accent (Dorure, Badges, Alertes)</p>
                    <p className="text-[11px] font-mono text-ink-400">{accentColor}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-5 rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-xs mb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-3">Aperçu en direct du Thème</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-ink-100 dark:border-ink-800">
                  <img
                    src={logoUrlBranding || '/Logo_CAE.png'}
                    alt="Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/Logo_CAE.png';
                    }}
                    className="h-9 w-9 rounded-lg object-contain p-0.5 border"
                  />
                  <div>
                    <p className="font-serif font-bold text-sm leading-tight text-ink-900 dark:text-white">{shortNameBranding || 'EECAE'}</p>
                    <p className="text-[10px] text-ink-400">{taglineBranding || 'Gestion d\'Église'}</p>
                  </div>
                </div>

                <div
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  Bouton Principal
                </div>

                <div
                  className="px-4 py-2 rounded-xl text-ink-950 text-xs font-bold shadow-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  Accent & Or
                </div>

                <div
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  Badge Dynamique
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveBranding}
                loading={savingBranding}
                icon={<Save className="h-4 w-4" />}
              >
                Sauvegarder l'Identité Visuelle
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: CHURCH LOCAL PROFILE */}
      {activeTab === 'church' && (
        <Card className="p-6">
          <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-primary" />
            Fiche descriptive du Temple Actif
          </h3>

          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom Officiel du Temple"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="Temple Grâces et Merveilles"
              />
              <Input
                label="Nom abrégé (Affichage)"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Grâces & Merveilles"
              />
            </div>

            <Input
              label="Pasteur Principal / Responsable Local"
              value={pastor}
              onChange={(e) => setPastor(e.target.value)}
              placeholder="Pasteur Konan Élie"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Quartier / Localisation"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Quartier Résidentiel"
              />
              <Input
                label="Ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bonoua"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => updateChurchMutation.mutate()}
                loading={savingChurch}
                icon={<Save className="h-4 w-4" />}
              >
                Enregistrer les détails du Temple
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: SYSTEM & FINANCES */}
      {activeTab === 'system' && (
        <Card className="p-6">
          <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand-primary" />
            Préférences Système & Paramètres Comptables
          </h3>

          {isLoadingSettings ? (
            <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded animate-pulse" />
          ) : (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="label mb-1">Devise comptable par défaut</label>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="FCFA">Franc CFA (XOF / FCFA)</option>
                  <option value="EUR">Euro (€ / EUR)</option>
                  <option value="USD">Dollar US ($ / USD)</option>
                  <option value="CAD">Dollar Canadien (CAD $)</option>
                  <option value="GBP">Livre Sterling (GBP £)</option>
                </Select>
              </div>

              <div>
                <label className="label mb-1">Délai de déconnexion automatique pour inactivité</label>
                <Select value={timeout} onChange={(e) => setTimeoutVal(e.target.value)}>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes (Conseillé)</option>
                  <option value="60">60 Minutes</option>
                  <option value="120">2 Heures</option>
                </Select>
                <p className="text-[11px] text-ink-400 mt-1.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Déconnecte automatiquement la session du secrétaire en cas d'inactivité de l'écran pour des raisons de confidentialité.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => updateSystemSettingsMutation.mutate()}
                  loading={updateSystemSettingsMutation.isPending}
                  icon={<Save className="h-4 w-4" />}
                >
                  Sauvegarder les préférences
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
