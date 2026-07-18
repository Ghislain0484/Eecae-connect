import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Building2, Bell, Shield, Info, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { logAudit } from '../lib/audit';

export function SettingsPage() {
  const { activeChurch, refreshProfile } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'church' | 'system'>('church');

  // Church local states
  const [churchName, setChurchName] = useState('');
  const [shortName, setShortName] = useState('');
  const [pastor, setPastor] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [savingChurch, setSavingChurch] = useState(false);

  // Sync church local states when activeChurch changes
  useEffect(() => {
    if (activeChurch) {
      setChurchName(activeChurch.name || '');
      setShortName(activeChurch.short_name || '');
      setPastor(activeChurch.senior_pastor || '');
      setNeighborhood(activeChurch.neighborhood || '');
      setCity(activeChurch.city || '');
    }
  }, [activeChurch]);

  // Fetch application settings for the active church
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
      toast.success('Paroisse mise à jour');
      await refreshProfile();
      setSavingChurch(false);
    },
    onError: (err) => {
      toast.error('Erreur lors de la mise à jour', err.message);
      setSavingChurch(false);
    },
  });

  // Local state for system settings editing
  const [currency, setCurrency] = useState('FCFA');
  const [timeout, setTimeoutVal] = useState('30');

  useEffect(() => {
    if (settings && settings.length > 0) {
      const curr = settings.find(s => s.key === 'currency')?.value || 'FCFA';
      const time = settings.find(s => s.key === 'inactivity_timeout_minutes')?.value || '30';
      setCurrency(curr);
      setTimeoutVal(time);
    }
  }, [settings]);

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!activeChurch?.id) return;
      
      const keys = [
        { key: 'currency', value: currency },
        { key: 'inactivity_timeout_minutes', value: timeout }
      ];

      for (const item of keys) {
        // Upsert setting key
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
      toast.success('Paramètres système mis à jour');
    },
    onError: (err) => {
      toast.error('Erreur', err.message);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres Généraux"
        subtitle="Configuration de la paroisse courante, des valeurs comptables et des délais de déconnexion"
      />

      {/* Tabs */}
      <div className="flex border-b border-ink-200 dark:border-ink-800">
        <button
          onClick={() => setActiveTab('church')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'church'
              ? 'border-bordeaux-500 text-bordeaux-600 dark:text-bordeaux-400'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          Fiche de la Paroisse
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'system'
              ? 'border-bordeaux-500 text-bordeaux-600 dark:text-bordeaux-400'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          Préférences du Système
        </button>
      </div>

      {activeTab === 'church' && (
        <Card className="p-6">
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-bordeaux-600" />
            Fiche descriptive d'assemblée
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
              label="Pasteur Principal Responsable"
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
                Enregistrer les détails
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'system' && (
        <Card className="p-6">
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-bordeaux-600" />
            Préférences système & Finances
          </h3>

          {isLoadingSettings ? (
            <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded animate-pulse" />
          ) : (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="label mb-1">Devise comptable par défaut</label>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="FCFA">Franc CFA (XOF / FCFA)</option>
                  <option value="EUR">Euro (€ / EUR)</option>
                  <option value="USD">Dollar US ($ / USD)</option>
                </Select>
              </div>

              <div>
                <label className="label mb-1">Déconnexion automatique pour inactivité</label>
                <Select value={timeout} onChange={(e) => setTimeoutVal(e.target.value)}>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes (Conseillé)</option>
                  <option value="60">60 Minutes</option>
                  <option value="120">2 Heures</option>
                </Select>
                <p className="text-[10px] text-ink-400 mt-1 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Déconnecte automatiquement la session du secrétaire en cas d'inactivité de l'écran.
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
