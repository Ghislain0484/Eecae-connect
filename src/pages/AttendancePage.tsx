import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { logAudit } from '../lib/audit';
import { PageHeader, Card, Button, Select, EmptyState, Modal, Input } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import type { AttendanceTotal } from '../types';

export function AttendancePage() {
  const { activeChurch } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showRecord, setShowRecord] = useState(false);
  const toast = useToast();
  const { data: events } = useEvents(activeChurch?.id, { status: 'all' });
  const doneEvents = events?.filter((e) => e.status === 'done' || e.status === 'planned') ?? [];

  const { data: totals, isLoading } = useQuery({
    queryKey: ['attendance-totals', selectedEvent],
    queryFn: async (): Promise<AttendanceTotal | null> => {
      if (!selectedEvent) return null;
      const { data: session } = await supabase.from('attendance_sessions').select('id').eq('event_id', selectedEvent).maybeSingle();
      if (!session) return null;
      const { data: t } = await supabase.from('attendance_totals').select('*').eq('session_id', session.id).maybeSingle();
      return t as AttendanceTotal | null;
    },
    enabled: !!selectedEvent,
  });

  return (
    <div>
      <PageHeader title="Présences" subtitle="Pointage des cultes et programmes" action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowRecord(true)} disabled={!activeChurch}>Nouveau pointage</Button>} />

      <Card className="mb-4 p-4">
        <Select label="Sélectionner un programme" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="">— Choisir —</option>
          {doneEvents.map((e) => <option key={e.id} value={e.id}>{e.title} — {formatDate(e.event_date)}</option>)}
        </Select>
      </Card>

      {selectedEvent ? (
        isLoading ? <Card><div className="p-5 animate-pulse">Chargement...</div></Card> : totals ? (
          <Card>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold mb-4">Récapitulatif des présences</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <StatBox label="Total participants" value={totals.total_participants} color="bordeaux" />
                <StatBox label="Hommes" value={totals.men} color="blue" />
                <StatBox label="Femmes" value={totals.women} color="gold" />
                <StatBox label="Enfants" value={totals.children} color="emerald" />
                <StatBox label="Adolescents" value={totals.teens} color="amber" />
                <StatBox label="Jeunes (12-40)" value={totals.youth_12_40} color="bordeaux" />
                <StatBox label="Membres identifiés" value={totals.identified_members} color="blue" />
                <StatBox label="Visiteurs" value={totals.visitors} color="gold" />
                <StatBox label="Nouv. visiteurs" value={totals.new_visitors} color="emerald" />
                <StatBox label="Décisions pour Christ" value={totals.decisions_for_christ} color="amber" />
              </div>
            </div>
          </Card>
        ) : (
          <Card><EmptyState icon={<CalendarCheck className="h-12 w-12" />} title="Aucune donnée de présence" description="Enregistrez les présences pour ce programme." action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowRecord(true)}>Enregistrer</Button>} /></Card>
        )
      ) : (
        <Card><EmptyState icon={<CalendarCheck className="h-12 w-12" />} title="Sélectionnez un programme" description="Choisissez un culte ou programme pour voir ou enregistrer les présences." /></Card>
      )}

      {showRecord && <RecordAttendanceModal eventId={selectedEvent} onClose={() => setShowRecord(false)} churchId={activeChurch?.id ?? ''} onSaved={() => { toast.success('Présences enregistrées'); }} />}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    bordeaux: 'bg-bordeaux-50 text-bordeaux-700 dark:bg-bordeaux-900/30 dark:text-bordeaux-300',
    gold: 'bg-gold-50 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };
  return (
    <div className={`rounded-lg p-3 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="font-display text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

function RecordAttendanceModal({ eventId, onClose, churchId, onSaved }: { eventId: string; onClose: () => void; churchId: string; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [totals, setTotals] = useState({ men: 0, women: 0, children: 0, teens: 0, visitors: 0, new_visitors: 0, decisions_for_christ: 0 });
  const set = (k: string, v: number) => setTotals((t) => ({ ...t, [k]: v }));
  const { data: events } = useEvents(churchId);
  const event = events?.find((e) => e.id === eventId);

  const submit = async () => {
    if (!event) { toast.error('Sélectionnez un programme'); return; }
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('attendance_sessions').select('id').eq('event_id', event.id).maybeSingle();
      let sessionId = existing?.id;
      if (!sessionId) {
        const { data: newSession, error } = await supabase.from('attendance_sessions').insert({ event_id: event.id, church_id: churchId, session_date: event.event_date }).select().single();
        if (error) throw error;
        sessionId = newSession.id;
      }
      const computed = { ...totals, total_participants: totals.men + totals.women + totals.children + totals.teens };
      const { data: existingTotals } = await supabase.from('attendance_totals').select('id').eq('session_id', sessionId).maybeSingle();
      if (existingTotals) {
        await supabase.from('attendance_totals').update({ ...computed, church_id: churchId }).eq('session_id', sessionId);
      } else {
        await supabase.from('attendance_totals').insert({ session_id: sessionId, church_id: churchId, ...computed });
      }
      await logAudit({ action: 'create', module: 'attendance', entityType: 'attendance_totals', entityId: sessionId, churchId });
      onSaved();
      onClose();
    } catch (e) { toast.error('Erreur', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Enregistrer les présences" size="lg" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving} disabled={!event}>Enregistrer</Button></div>}>
      {!eventId ? <p className="text-sm text-ink-500">Sélectionnez d'abord un programme dans la liste ci-dessus.</p> : (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">Programme : <strong>{event?.title}</strong> — {formatDate(event?.event_date)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Hommes" type="number" min={0} value={totals.men} onChange={(e) => set('men', parseInt(e.target.value) || 0)} />
            <Input label="Femmes" type="number" min={0} value={totals.women} onChange={(e) => set('women', parseInt(e.target.value) || 0)} />
            <Input label="Enfants" type="number" min={0} value={totals.children} onChange={(e) => set('children', parseInt(e.target.value) || 0)} />
            <Input label="Adolescents" type="number" min={0} value={totals.teens} onChange={(e) => set('teens', parseInt(e.target.value) || 0)} />
            <Input label="Visiteurs" type="number" min={0} value={totals.visitors} onChange={(e) => set('visitors', parseInt(e.target.value) || 0)} />
            <Input label="Nouv. visiteurs" type="number" min={0} value={totals.new_visitors} onChange={(e) => set('new_visitors', parseInt(e.target.value) || 0)} />
            <Input label="Décisions Christ" type="number" min={0} value={totals.decisions_for_christ} onChange={(e) => set('decisions_for_christ', parseInt(e.target.value) || 0)} />
            <div className="rounded-lg bg-bordeaux-50 p-3 dark:bg-bordeaux-900/30">
              <p className="text-xs text-bordeaux-600">Total calculé</p>
              <p className="font-display text-xl font-bold text-bordeaux-700">{totals.men + totals.women + totals.children + totals.teens}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
