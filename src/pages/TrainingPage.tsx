import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Award, BookOpen, User, Calendar, CheckCircle, Flame, Droplets } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select, EmptyState, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import { logAudit } from '../lib/audit';

type TrainingClassType = 'none' | 'bapteme' | 'affermissement' | 'ouvriers';

export function TrainingPage() {
  const { activeChurch } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Selected member for editing training details
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [trainingClass, setTrainingClass] = useState<TrainingClassType>('none');
  const [waterBaptismDate, setWaterBaptismDate] = useState('');
  const [holySpiritBaptismDate, setHolySpiritBaptismDate] = useState('');
  const [integrationDate, setIntegrationDate] = useState('');

  // Fetch all members of the active church with training fields
  const { data: members, isLoading } = useQuery({
    queryKey: ['members-training', activeChurch?.id],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, training_class, water_baptism_date, holy_spirit_baptism_date, integration_date')
        .eq('church_id', activeChurch.id)
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!activeChurch?.id,
  });

  // Group members locally
  const grouped = {
    none: (members || []).filter((m) => !m.training_class || m.training_class === 'none'),
    bapteme: (members || []).filter((m) => m.training_class === 'bapteme'),
    affermissement: (members || []).filter((m) => m.training_class === 'affermissement'),
    ouvriers: (members || []).filter((m) => m.training_class === 'ouvriers'),
  };

  const updateTrainingMutation = useMutation({
    mutationFn: async (vars: {
      id: string;
      trainingClass: TrainingClassType;
      waterBaptismDate: string | null;
      holySpiritBaptismDate: string | null;
      integrationDate: string | null;
    }) => {
      const { error } = await supabase
        .from('members')
        .update({
          training_class: vars.trainingClass,
          water_baptism_date: vars.waterBaptismDate || null,
          holy_spirit_baptism_date: vars.holySpiritBaptismDate || null,
          integration_date: vars.integrationDate || null,
        })
        .eq('id', vars.id);

      if (error) throw error;

      await logAudit({
        action: 'update',
        module: 'members',
        entityType: 'members_training',
        entityId: vars.id,
        churchId: activeChurch?.id || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-training'] });
      toast.success('Parcours de formation mis à jour');
      setSelectedMember(null);
    },
    onError: (err) => {
      toast.error('Erreur de mise à jour', err.message);
    },
  });

  const getStatusLabel = (key: TrainingClassType) => {
    switch (key) {
      case 'bapteme':
        return 'Classe de Baptême';
      case 'affermissement':
        return 'Classe d\'Affermissement';
      case 'ouvriers':
        return 'Formation des Ouvriers';
      default:
        return 'Non inscrit (Nouveau)';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formations & Discipulat"
        subtitle="Suivi théologique des fidèles, préparation au baptême et intégration des ministères"
      />

      {/* Grid of Progression cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<User className="h-5 w-5 text-ink-500" />}
          label="Nouveaux Convertis (Non inscrits)"
          value={grouped.none.length}
          color="bg-ink-50 text-ink-700 dark:bg-ink-900/30 dark:text-ink-300"
        />
        <StatCard
          icon={<Droplets className="h-5 w-5 text-blue-500" />}
          label="Classe de Baptême"
          value={grouped.bapteme.length}
          color="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-amber-500" />}
          label="Classe d'Affermissement"
          value={grouped.affermissement.length}
          color="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <StatCard
          icon={<Award className="h-5 w-5 text-emerald-500" />}
          label="Formation des Ouvriers"
          value={grouped.ouvriers.length}
          color="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        />
      </div>

      {/* Grid of Columns for Class Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column Bapteme */}
        <ClassColumn
          title="Classe de Baptême"
          count={grouped.bapteme.length}
          members={grouped.bapteme}
          icon={<Droplets className="h-4 w-4 text-blue-500" />}
          onSelect={(m) => {
            setSelectedMember(m);
            setTrainingClass('bapteme');
            setWaterBaptismDate(m.water_baptism_date || '');
            setHolySpiritBaptismDate(m.holy_spirit_baptism_date || '');
            setIntegrationDate(m.integration_date || '');
          }}
        />

        {/* Column Affermissement */}
        <ClassColumn
          title="Classe d'Affermissement"
          count={grouped.affermissement.length}
          members={grouped.affermissement}
          icon={<BookOpen className="h-4 w-4 text-amber-500" />}
          onSelect={(m) => {
            setSelectedMember(m);
            setTrainingClass('affermissement');
            setWaterBaptismDate(m.water_baptism_date || '');
            setHolySpiritBaptismDate(m.holy_spirit_baptism_date || '');
            setIntegrationDate(m.integration_date || '');
          }}
        />

        {/* Column Ouvriers */}
        <ClassColumn
          title="Formation des Ouvriers"
          count={grouped.ouvriers.length}
          members={grouped.ouvriers}
          icon={<Award className="h-4 w-4 text-emerald-500" />}
          onSelect={(m) => {
            setSelectedMember(m);
            setTrainingClass('ouvriers');
            setWaterBaptismDate(m.water_baptism_date || '');
            setHolySpiritBaptismDate(m.holy_spirit_baptism_date || '');
            setIntegrationDate(m.integration_date || '');
          }}
        />
      </div>

      {/* Grid of Non-enrolled members (Nouveaux) to enroll */}
      <Card className="p-6">
        <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-bordeaux-600" />
          Membres à inscrire dans un parcours
        </h3>

        {isLoading ? (
          <div className="h-8 bg-ink-100 dark:bg-ink-800 rounded animate-pulse" />
        ) : grouped.none.length === 0 ? (
          <p className="text-sm text-ink-500">Tous les membres enregistrés sont déjà affectés à un parcours.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {grouped.none.map((m) => (
              <div
                key={m.id}
                className="p-3 border border-ink-100 dark:border-ink-800 rounded-lg hover:bg-ink-50/50 dark:hover:bg-ink-850/50 flex flex-col justify-between"
              >
                <div>
                  <p className="font-semibold text-sm text-ink-900 dark:text-ink-100">
                    {m.last_name} {m.first_name}
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">{m.phone || 'Pas de numéro'}</p>
                </div>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-center text-xs"
                    onClick={() => {
                      setSelectedMember(m);
                      setTrainingClass('none');
                      setWaterBaptismDate(m.water_baptism_date || '');
                      setHolySpiritBaptismDate(m.holy_spirit_baptism_date || '');
                      setIntegrationDate(m.integration_date || '');
                    }}
                  >
                    Lancer le suivi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Edit Training details */}
      {selectedMember && (
        <Modal
          open
          onClose={() => setSelectedMember(null)}
          title={`Parcours de discipulat : ${selectedMember.last_name} ${selectedMember.first_name}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedMember(null)}>
                Annuler
              </Button>
              <Button
                loading={updateTrainingMutation.isPending}
                onClick={() =>
                  updateTrainingMutation.mutate({
                    id: selectedMember.id,
                    trainingClass,
                    waterBaptismDate,
                    holySpiritBaptismDate,
                    integrationDate,
                  })
                }
              >
                Enregistrer les détails
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Select
              label="Parcours doctrinal"
              value={trainingClass}
              onChange={(e) => setTrainingClass(e.target.value as TrainingClassType)}
            >
              <option value="none">Aucun (Nouveau croyant)</option>
              <option value="bapteme">Classe de Baptême d'eau</option>
              <option value="affermissement">Classe d'Affermissement doctrinal</option>
              <option value="ouvriers">Formation d'ouvrier ou de leader</option>
            </Select>

            <Input
              label="Date du Baptême d'Eau"
              type="date"
              value={waterBaptismDate}
              onChange={(e) => setWaterBaptismDate(e.target.value)}
              icon={<Droplets className="h-4 w-4 text-blue-500" />}
            />

            <Input
              label="Date du Baptême du Saint-Esprit"
              type="date"
              value={holySpiritBaptismDate}
              onChange={(e) => setHolySpiritBaptismDate(e.target.value)}
              icon={<Flame className="h-4 w-4 text-amber-500" />}
            />

            <Input
              label="Date d'intégration officielle (Accueil)"
              type="date"
              value={integrationDate}
              onChange={(e) => setIntegrationDate(e.target.value)}
              icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`p-4 rounded-xl border border-ink-100 dark:border-ink-800 ${color} flex items-center gap-3`}>
      <div className="p-2.5 rounded-lg bg-white dark:bg-ink-950 shrink-0 shadow-sm">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="font-display text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

interface ClassColumnProps {
  title: string;
  count: number;
  members: any[];
  icon: React.ReactNode;
  onSelect: (m: any) => void;
}

function ClassColumn({ title, count, members, icon, onSelect }: ClassColumnProps) {
  return (
    <Card className="flex flex-col h-[400px] border border-ink-100 dark:border-ink-800">
      <div className="p-4 border-b border-ink-100 dark:border-ink-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-display text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</h4>
        </div>
        <span className="text-xs bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300 font-bold px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {members.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-400 text-xs text-center p-4">
            Aucun membre dans ce parcours.
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelect(m)}
              className="p-3 border border-ink-50 dark:border-ink-800 bg-ink-50/20 dark:bg-ink-900/10 rounded-lg hover:border-bordeaux-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <p className="font-medium text-xs text-ink-800 dark:text-ink-200">
                  {m.last_name} {m.first_name}
                </p>
                <p className="text-[10px] text-ink-400 mt-0.5">{m.phone || 'Pas de numéro'}</p>
              </div>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ink-100 dark:border-ink-800 text-[10px] text-ink-400">
                {m.water_baptism_date && (
                  <span className="flex items-center gap-0.5 text-blue-600" title="Baptisé d'eau">
                    <Droplets className="h-3 w-3" /> Baptême
                  </span>
                )}
                {m.holy_spirit_baptism_date && (
                  <span className="flex items-center gap-0.5 text-amber-600" title="Baptisé du St Esprit">
                    <Flame className="h-3 w-3" /> St Esprit
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
