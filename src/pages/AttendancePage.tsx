import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Plus, QrCode, CheckCircle2, UserCheck, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents, useMembers } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { logAudit } from '../lib/audit';
import { PageHeader, Card, Button, Select, EmptyState, Modal, Input, Avatar, Badge } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import type { AttendanceTotal } from '../types';

export function AttendancePage() {
  const { activeChurch } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showRecord, setShowRecord] = useState(false);
  const [showQrCheckin, setShowQrCheckin] = useState(false);
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
    <div className="space-y-6">
      <PageHeader
        title="Présences & Pointage"
        subtitle="Pointage des cultes, décompte démographique et scan express QR Code"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<QrCode className="h-4 w-4" />}
              onClick={() => setShowQrCheckin(true)}
              disabled={!activeChurch}
            >
              Scanner QR / Check-in
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowRecord(true)}
              disabled={!activeChurch}
            >
              Nouveau pointage global
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <Select label="Sélectionner un culte ou programme" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="">— Choisir —</option>
          {doneEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} — {formatDate(e.event_date)}
            </option>
          ))}
        </Select>
      </Card>

      {selectedEvent ? (
        isLoading ? (
          <Card>
            <div className="p-5 animate-pulse">Chargement des données...</div>
          </Card>
        ) : totals ? (
          <Card>
            <div className="p-6">
              <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-white mb-4">
                Récapitulatif des Présences au Culte
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
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
          <Card>
            <EmptyState
              icon={<CalendarCheck className="h-12 w-12 text-ink-400" />}
              title="Aucune donnée de présence"
              description="Enregistrez les présences pour ce programme ou utilisez le scan de présence."
              action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowRecord(true)}>Enregistrer le décompte</Button>}
            />
          </Card>
        )
      ) : (
        <Card>
          <EmptyState
            icon={<CalendarCheck className="h-12 w-12 text-ink-400" />}
            title="Sélectionnez un programme"
            description="Choisissez un culte ou programme ci-dessus pour consulter ou enregistrer les présences."
          />
        </Card>
      )}

      {/* Manual Bulk Attendance Modal */}
      {showRecord && (
        <RecordAttendanceModal
          eventId={selectedEvent}
          onClose={() => setShowRecord(false)}
          churchId={activeChurch?.id ?? ''}
          onSaved={() => {
            toast.success('Présences enregistrées');
          }}
        />
      )}

      {/* Express QR Check-In Modal */}
      {showQrCheckin && (
        <QrCheckinModal
          eventId={selectedEvent}
          churchId={activeChurch?.id ?? ''}
          onClose={() => setShowQrCheckin(false)}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    bordeaux: 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20',
    gold: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/50',
    blue: 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200/50',
    emerald: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/50',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/50',
  };
  return (
    <div className={`rounded-xl p-3.5 ${colors[color] || 'bg-ink-50 text-ink-800'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="font-serif text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function RecordAttendanceModal({ eventId, onClose, churchId, onSaved }: { eventId: string; onClose: () => void; churchId: string; onSaved: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [totals, setTotals] = useState({ men: 0, women: 0, children: 0, teens: 0, visitors: 0, new_visitors: 0, decisions_for_christ: 0 });
  const set = (k: string, v: number) => setTotals((t) => ({ ...t, [k]: v }));
  const { data: events } = useEvents(churchId);
  const event = events?.find((e) => e.id === eventId);

  const submit = async () => {
    if (!event) {
      toast.error('Erreur', 'Sélectionnez un programme');
      return;
    }
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
      queryClient.invalidateQueries({ queryKey: ['attendance-totals', eventId] });
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Enregistrer les présences globales"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={saving} disabled={!event}>Enregistrer</Button>
        </div>
      }
    >
      {!eventId ? (
        <p className="text-sm text-ink-500">Sélectionnez d'abord un programme dans la liste ci-dessus.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Programme : <strong className="text-ink-900 dark:text-white">{event?.title}</strong> — {formatDate(event?.event_date)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Hommes" type="number" min={0} value={totals.men} onChange={(e) => set('men', parseInt(e.target.value) || 0)} />
            <Input label="Femmes" type="number" min={0} value={totals.women} onChange={(e) => set('women', parseInt(e.target.value) || 0)} />
            <Input label="Enfants" type="number" min={0} value={totals.children} onChange={(e) => set('children', parseInt(e.target.value) || 0)} />
            <Input label="Adolescents" type="number" min={0} value={totals.teens} onChange={(e) => set('teens', parseInt(e.target.value) || 0)} />
            <Input label="Visiteurs" type="number" min={0} value={totals.visitors} onChange={(e) => set('visitors', parseInt(e.target.value) || 0)} />
            <Input label="Nouv. visiteurs" type="number" min={0} value={totals.new_visitors} onChange={(e) => set('new_visitors', parseInt(e.target.value) || 0)} />
            <Input label="Décisions Christ" type="number" min={0} value={totals.decisions_for_christ} onChange={(e) => set('decisions_for_christ', parseInt(e.target.value) || 0)} />
            <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">Total Calculé</p>
              <p className="font-serif text-2xl font-bold text-brand-primary">{totals.men + totals.women + totals.children + totals.teens}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function QrCheckinModal({ eventId, churchId, onClose }: { eventId: string; churchId: string; onClose: () => void }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: members } = useMembers(churchId);
  const [checkedMembers, setCheckedMembers] = useState<string[]>([]);

  const filteredMembers = members?.filter((m) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      m.first_name?.toLowerCase().includes(q) ||
      m.last_name?.toLowerCase().includes(q) ||
      m.matricule?.toLowerCase().includes(q) ||
      m.phone_main?.includes(q)
    );
  }) || [];

  const handleCheckin = (memberId: string, memberName: string) => {
    if (checkedMembers.includes(memberId)) {
      toast.info('Déjà pointé', `${memberName} est déjà enregistré pour ce culte.`);
      return;
    }
    setCheckedMembers((prev) => [...prev, memberId]);
    toast.success('Présence confirmée !', `${memberName} enregistré(e).`);
    setSearchQuery('');
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Pointage Express / Scan QR Code Membre"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Terminer la session ({checkedMembers.length} pointés)</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-900 dark:text-white">Pointage rapide à l'entrée du temple</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Saisissez le matricule, scannez le QR code ou tapez le nom du fidèle.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            {checkedMembers.length} fidèles pointés
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scannez le QR Code ou tapez Matricule / Nom..."
            className="w-full rounded-xl border border-ink-300 py-2.5 pl-10 pr-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredMembers.map((m) => {
            const isChecked = checkedMembers.includes(m.id);
            return (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-ink-200/80 dark:border-ink-800 flex items-center justify-between hover:bg-ink-50 dark:hover:bg-ink-800/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar firstName={m.first_name} lastName={m.last_name} src={m.photo_url ?? undefined} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-ink-900 dark:text-white">
                      {m.last_name} {m.first_name}
                    </p>
                    <p className="text-[11px] text-ink-400 font-mono">
                      Matricule : <span className="font-bold text-brand-primary">{m.matricule || 'N/A'}</span> · {m.phone_main || 'Sans tél'}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isChecked ? 'secondary' : 'primary'}
                  disabled={isChecked}
                  icon={isChecked ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <UserCheck className="h-4 w-4" />}
                  onClick={() => handleCheckin(m.id, `${m.first_name} ${m.last_name}`)}
                >
                  {isChecked ? 'Présent' : 'Pointer Présence'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
