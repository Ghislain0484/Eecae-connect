import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, MessageSquare, Home, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMembers } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Table, TableRow, TableCell, Badge, EmptyState, Skeleton, Button, Select } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { ABSENCE_REASONS } from '../types/constants';
import { useState } from 'react';
import { Avatar } from '../components/ui';
import type { AbsenceFollowup } from '../types';

interface AbsenceWithMember extends AbsenceFollowup {
  member?: { first_name: string; last_name: string; phone_main: string | null };
}

export function AbsencesPage() {
  const { activeChurch } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();
  const qc = useQueryClient();
  const { data: members } = useMembers(activeChurch?.id);

  const { data: followups, isLoading } = useQuery({
    queryKey: ['absence-followups', activeChurch?.id, statusFilter],
    queryFn: async (): Promise<AbsenceWithMember[]> => {
      if (!activeChurch) return [];
      let q = supabase.from('absence_followups').select('*').eq('church_id', activeChurch.id);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      const list = data as AbsenceFollowup[];
      return list.map((f) => ({
        ...f,
        member: members?.find((m) => m.id === f.member_id) as { first_name: string; last_name: string; phone_main: string | null } | undefined,
      }));
    },
    enabled: !!activeChurch && !!members,
  });

  const updateFollowup = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AbsenceFollowup> }) => {
      const { error } = await supabase.from('absence_followups').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['absence-followups'] }); toast.success('Suivi mis à jour'); },
  });

  return (
    <div>
      <PageHeader title="Absences & Assiduité" subtitle="Suivi des membres absents et actions de relance" />

      <Card className="mb-4 p-4">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
          <option value="all">Tous les suivis</option>
          <option value="open">Ouverts</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolus</option>
          <option value="closed">Clôturés</option>
        </Select>
      </Card>

      <Card>
        {isLoading ? <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> : !followups?.length ? (
          <EmptyState icon={<AlertCircle className="h-12 w-12" />} title="Aucun suivi d'absence" description="Les membres absents apparaîtront ici automatiquement." />
        ) : (
          <Table headers={['Membre', 'Raison', 'Actions effectuées', 'Statut', 'Actions']}>
            {followups.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar firstName={f.member?.first_name} lastName={f.member?.last_name} size="sm" />
                    <div><p className="font-medium">{f.member?.last_name} {f.member?.first_name}</p>{f.member?.phone_main && <p className="text-xs text-ink-400">{f.member.phone_main}</p>}</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{f.reason ? ABSENCE_REASONS[f.reason] ?? f.reason : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <ActionIcon icon={<Phone className="h-3.5 w-3.5" />} done={f.call_done} onClick={() => updateFollowup.mutate({ id: f.id, input: { call_done: !f.call_done, status: 'in_progress' } })} />
                    <ActionIcon icon={<MessageSquare className="h-3.5 w-3.5" />} done={f.message_sent} onClick={() => updateFollowup.mutate({ id: f.id, input: { message_sent: !f.message_sent, status: 'in_progress' } })} />
                    <ActionIcon icon={<Home className="h-3.5 w-3.5" />} done={f.visit_done} onClick={() => updateFollowup.mutate({ id: f.id, input: { visit_done: !f.visit_done, status: 'in_progress' } })} />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={f.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : f.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                    {f.status === 'open' ? 'Ouvert' : f.status === 'in_progress' ? 'En cours' : f.status === 'resolved' ? 'Résolu' : 'Clôturé'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => updateFollowup.mutate({ id: f.id, input: { status: 'resolved' } })}>Résoudre</Button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function ActionIcon({ icon, done, onClick }: { icon: React.ReactNode; done: boolean | null; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-ink-100 text-ink-400 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-500'}`}>
      {icon}
    </button>
  );
}
