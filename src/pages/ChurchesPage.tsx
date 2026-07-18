import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Church, Plus, MapPin, Users, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { logAudit } from '../lib/audit';
import { PageHeader, Card, Button, Badge, EmptyState, Skeleton, Modal, Input } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { useState } from 'react';
import type { Church as ChurchType } from '../types';
import { hasPermission } from '../lib/permissions';

export function ChurchesPage() {
  const { profile } = useAuth();
  const canManage = hasPermission(profile?.role, 'churches.manage');
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();
  const qc = useQueryClient();

  const { data: churches, isLoading } = useQuery({
    queryKey: ['all-churches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('churches').select('*').order('is_headquarters', { ascending: false }).order('name');
      if (error) throw error;
      return data as ChurchType[];
    },
  });

  const { data: memberCounts } = useQuery({
    queryKey: ['church-member-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('count_members_by_church');
      if (error) throw error;
      return data as { church_id: string; count: number }[];
    },
  });

  const createChurch = useMutation({
    mutationFn: async (input: { name: string; short_name: string; neighborhood: string; city: string; senior_pastor: string }) => {
      const { data, error } = await supabase.from('churches').insert(input).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'churches', entityType: 'church', entityId: data.id, newValue: data });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-churches'] }); toast.success('Assemblée créée'); },
  });

  return (
    <div>
      <PageHeader title="Assemblées" subtitle={`${churches?.length ?? 0} assemblée(s) de l'EECAE`} action={canManage ? <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Ajouter une assemblée</Button> : undefined} />

      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div> : !churches?.length ? (
        <Card><EmptyState icon={<Church className="h-12 w-12" />} title="Aucune assemblée" /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {churches.map((c) => {
            const count = memberCounts?.find((m) => m.church_id === c.id)?.count ?? 0;
            return (
              <Card key={c.id} className="p-5 hover:shadow-card-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bordeaux-100 dark:bg-bordeaux-900/40">
                    <Church className="h-6 w-6 text-bordeaux-700 dark:text-bordeaux-300" />
                  </div>
                  {c.is_headquarters && <Badge className="bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300"><Star className="h-3 w-3" /> Siège</Badge>}
                </div>
                <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-ink-500">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{c.neighborhood ?? '—'}, {c.city}</p>
                  <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{count} membre(s)</p>
                  {c.senior_pastor && <p className="text-xs text-ink-400">Pasteur : {c.senior_pastor}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && <AddChurchModal onClose={() => setShowAdd(false)} onCreate={createChurch.mutateAsync} />}
    </div>
  );
}

function AddChurchModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { name: string; short_name: string; neighborhood: string; city: string; senior_pastor: string }) => Promise<unknown> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', short_name: '', neighborhood: '', city: '', senior_pastor: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);
    try { await onCreate(form); onClose(); } catch (e) { toast.error('Erreur', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle assemblée" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Créer</Button></div>}>
      <div className="space-y-4">
        <Input label="Nom complet *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="EECAE ..." />
        <Input label="Nom court" value={form.short_name} onChange={(e) => set('short_name', e.target.value)} placeholder="Bonoua" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quartier" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
          <Input label="Ville" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <Input label="Pasteur principal" value={form.senior_pastor} onChange={(e) => set('senior_pastor', e.target.value)} />
      </div>
    </Modal>
  );
}
