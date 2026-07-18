import { useState } from 'react';
import { UserPlus, Search, Phone, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVisitors, useCreateVisitor } from '../hooks/useData';
import { PageHeader, Card, Button, Input, Select, Table, TableRow, TableCell, Badge, Avatar, EmptyState, Skeleton, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { VISITOR_STATUS_LABELS, VISITOR_STATUS_COLORS } from '../types/constants';
import type { Visitor, VisitorStatus } from '../types';
import { formatNumber, formatDate, exportToCsv } from '../lib/utils';

export function VisitorsPage() {
  const { activeChurch } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();
  const { data: visitors, isLoading } = useVisitors(activeChurch?.id, { search, status: statusFilter });
  const createVisitor = useCreateVisitor(activeChurch?.id ?? '');

  const handleExport = () => {
    if (!visitors?.length) return;
    exportToCsv(`visiteurs-${activeChurch?.short_name ?? 'eecae'}.csv`, visitors.map((v) => ({
      Nom: v.last_name, Prénoms: v.first_name, Téléphone: v.phone ?? '',
      'Première visite': formatDate(v.first_visit_date),
      'Nombre de visites': v.visit_count,
      Statut: VISITOR_STATUS_LABELS[v.status],
    })));
    toast.success('Export généré');
  };

  return (
    <div>
      <PageHeader
        title="Visiteurs"
        subtitle={`${formatNumber(visitors?.length ?? 0)} visiteur(s) · ${activeChurch?.short_name ?? ''}`}
        action={
          <>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Exporter</Button>
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Ajouter</Button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, téléphone..." className="input pl-9" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(VISITOR_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : visitors?.length === 0 ? (
          <EmptyState icon={<UserPlus className="h-12 w-12" />} title="Aucun visiteur" description="Ajoutez un premier visiteur." action={<Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Ajouter</Button>} />
        ) : (
          <Table headers={['Visiteur', 'Contact', 'Visites', 'Statut', '1ère visite']}>
            {visitors?.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar firstName={v.first_name} lastName={v.last_name} size="sm" />
                    <div><p className="font-medium">{v.last_name} {v.first_name}</p><p className="text-xs text-ink-400">{v.profession ?? '—'}</p></div>
                  </div>
                </TableCell>
                <TableCell>{v.phone ? <span className="text-xs flex items-center gap-1.5 text-ink-500"><Phone className="h-3 w-3" />{v.phone}</span> : '—'}</TableCell>
                <TableCell><span className="font-semibold">{v.visit_count}</span></TableCell>
                <TableCell><Badge className={VISITOR_STATUS_COLORS[v.status]}>{VISITOR_STATUS_LABELS[v.status]}</Badge></TableCell>
                <TableCell className="text-sm text-ink-500">{formatDate(v.first_visit_date)}</TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {showAdd && <AddVisitorModal onClose={() => setShowAdd(false)} onCreate={createVisitor.mutateAsync} />}
    </div>
  );
}

function AddVisitorModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: Partial<Visitor>) => Promise<Visitor> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    last_name: '', first_name: '', sex: 'M', age_range: 'young_adult', phone: '', phone_whatsapp: '',
    address: '', neighborhood: '', city: '', profession: '', origin_church: '', invited_by: '',
    prayer_subject: '', wants_contact: true, wants_to_join: false, wants_pastoral_visit: false,
    first_visit_date: new Date().toISOString().slice(0, 10), observations: '',
  });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.last_name.trim() || !form.first_name.trim()) { toast.error('Champs requis', 'Nom et prénoms obligatoires'); return; }
    setSaving(true);
    try {
      await onCreate({ ...form, sex: form.sex as 'M' | 'F', status: 'first_visit' as VisitorStatus });
      toast.success('Visiteur ajouté', `${form.last_name} ${form.first_name}`);
      onClose();
    } catch (e) { toast.error('Erreur', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Ajouter un visiteur" size="lg" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Enregistrer</Button></div>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nom *" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
          <Input label="Prénoms *" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Sexe" value={form.sex} onChange={(e) => set('sex', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></Select>
          <Select label="Tranche d'âge" value={form.age_range} onChange={(e) => set('age_range', e.target.value)}>
            <option value="child">Enfant</option><option value="teen">Adolescent</option><option value="young_adult">Jeune adulte</option><option value="adult">Adulte</option><option value="senior">Senior</option><option value="unknown">Inconnu</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Téléphone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+225 ..." />
          <Input label="WhatsApp" value={form.phone_whatsapp} onChange={(e) => set('phone_whatsapp', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quartier" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
          <Input label="Ville" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Profession" value={form.profession} onChange={(e) => set('profession', e.target.value)} />
          <Input label="Invité par" value={form.invited_by} onChange={(e) => set('invited_by', e.target.value)} />
        </div>
        <Input label="Église d'origine" value={form.origin_church} onChange={(e) => set('origin_church', e.target.value)} />
        <Input label="Sujet de prière" value={form.prayer_subject} onChange={(e) => set('prayer_subject', e.target.value)} />
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.wants_contact} onChange={(e) => set('wants_contact', e.target.checked)} /> Souhaite être recontacté</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.wants_to_join} onChange={(e) => set('wants_to_join', e.target.checked)} /> Souhaite rejoindre</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.wants_pastoral_visit} onChange={(e) => set('wants_pastoral_visit', e.target.checked)} /> Visite pastorale</label>
        </div>
        <Input label="Date de première visite" type="date" value={form.first_visit_date} onChange={(e) => set('first_visit_date', e.target.value)} />
      </div>
    </Modal>
  );
}
