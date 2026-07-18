import { useState } from 'react';
import { CalendarDays, Plus, MapPin, Clock, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents, useCreateEvent } from '../hooks/useData';
import { PageHeader, Card, Button, Input, Select, Table, TableRow, TableCell, Badge, EmptyState, Skeleton, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { EVENT_TYPES, EVENT_STATUS_LABELS } from '../types/constants';
import type { EventItem } from '../types';
import { formatNumber, formatDate, exportToCsv } from '../lib/utils';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ongoing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  postponed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export function EventsPage() {
  const { activeChurch } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();
  const { data: events, isLoading } = useEvents(activeChurch?.id, { status: statusFilter, type: typeFilter });
  const createEvent = useCreateEvent(activeChurch?.id ?? '');

  const handleExport = () => {
    if (!events?.length) return;
    exportToCsv(`programmes-${activeChurch?.short_name ?? 'eecae'}.csv`, events.map((e) => ({ Titre: e.title, Type: e.type, Date: formatDate(e.event_date), Thème: e.theme ?? '', Prédicateur: e.preacher ?? '', Statut: EVENT_STATUS_LABELS[e.status] })));
    toast.success('Export généré');
  };

  return (
    <div>
      <PageHeader title="Programmes & Cultes" subtitle={`${formatNumber(events?.length ?? 0)} programme(s)`} action={<><Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Exporter</Button><Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Nouveau</Button></>} />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">Tous les types</option>{EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Tous les statuts</option>{Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </div>
      </Card>

      <Card>
        {isLoading ? <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> : events?.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-12 w-12" />} title="Aucun programme" description="Créez un premier culte ou programme." action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Nouveau programme</Button>} />
        ) : (
          <Table headers={['Programme', 'Date', 'Lieu', 'Prédicateur', 'Statut']}>
            {events?.map((e) => (
              <TableRow key={e.id}>
                <TableCell><div><p className="font-medium">{e.title}</p><p className="text-xs text-ink-400">{e.type}</p></div></TableCell>
                <TableCell><div className="text-sm"><p>{formatDate(e.event_date)}</p>{e.start_time && <p className="text-xs text-ink-400 flex items-center gap-1"><Clock className="h-3 w-3" />{e.start_time}</p>}</div></TableCell>
                <TableCell className="text-sm text-ink-500"><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{e.location ?? '—'}</span></TableCell>
                <TableCell className="text-sm">{e.preacher ?? '—'}</TableCell>
                <TableCell><Badge className={statusColors[e.status]}>{EVENT_STATUS_LABELS[e.status]}</Badge></TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onCreate={createEvent.mutateAsync} />}
    </div>
  );
}

function AddEventModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: Partial<EventItem>) => Promise<EventItem> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'Culte du dimanche', event_date: new Date().toISOString().slice(0, 10),
    start_time: '09:00', end_time: '11:30', location: '', theme: '', main_verse: '',
    preacher: '', moderator: '', prayer_leader: '', description: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Titre requis'); return; }
    setSaving(true);
    try {
      await onCreate({ ...form, status: 'planned' });
      toast.success('Programme créé', form.title);
      onClose();
    } catch (e) { toast.error('Erreur', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Nouveau programme" size="lg" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Créer</Button></div>}>
      <div className="space-y-4">
        <Input label="Titre *" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Culte du dimanche" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)}>{EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
          <Input label="Lieu" value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Date" type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} />
          <Input label="Début" type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} />
          <Input label="Fin" type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} />
        </div>
        <Input label="Thème" value={form.theme} onChange={(e) => set('theme', e.target.value)} />
        <Input label="Verset principal" value={form.main_verse} onChange={(e) => set('main_verse', e.target.value)} placeholder="Jean 3:16" />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Prédicateur" value={form.preacher} onChange={(e) => set('preacher', e.target.value)} />
          <Input label="Modérateur" value={form.moderator} onChange={(e) => set('moderator', e.target.value)} />
          <Input label="Conducteur de prière" value={form.prayer_leader} onChange={(e) => set('prayer_leader', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
