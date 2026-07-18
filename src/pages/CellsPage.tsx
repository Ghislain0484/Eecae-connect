import { Home, Plus, MapPin, Clock, Phone, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCells, useMembers } from '../hooks/useData';
import { PageHeader, Card, EmptyState, Skeleton, Button, Badge } from '../components/ui';

export function CellsPage() {
  const { activeChurch } = useAuth();
  const { data: cells, isLoading } = useCells(activeChurch?.id);
  const { data: members } = useMembers(activeChurch?.id);

  return (
    <div>
      <PageHeader title="Cellules de maison" subtitle={`${cells?.length ?? 0} cellule(s)`} action={<Button icon={<Plus className="h-4 w-4" />}>Ajouter</Button>} />

      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div> : !cells?.length ? (
        <Card><EmptyState icon={<Home className="h-12 w-12" />} title="Aucune cellule" description="Créez des cellules de maison pour organiser les membres par zone." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cells.map((c) => {
            const cellMembers = members?.filter((m) => m.cell_id === c.id) ?? [];
            return (
              <Card key={c.id} className="p-5 hover:shadow-card-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 dark:bg-gold-900/40">
                    <Home className="h-5 w-5 text-gold-700 dark:text-gold-300" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{c.status}</Badge>
                </div>
                <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                {c.code && <p className="text-xs text-ink-400">{c.code}</p>}
                <div className="mt-3 space-y-1 text-sm text-ink-500">
                  {c.zone && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{c.zone}</p>}
                  {c.meeting_day && <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{c.meeting_day} {c.meeting_time ?? ''}</p>}
                  {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{c.phone}</p>}
                  <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{cellMembers.length} membre(s)</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
