import { Building2, Plus, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDepartments, useMembers } from '../hooks/useData';
import { PageHeader, Card, EmptyState, Skeleton, Button } from '../components/ui';
import { Badge } from '../components/ui';

export function DepartmentsPage() {
  const { activeChurch } = useAuth();
  const { data: departments, isLoading } = useDepartments(activeChurch?.id);
  const { data: members } = useMembers(activeChurch?.id);

  return (
    <div>
      <PageHeader title="Départements & Ministères" subtitle={`${departments?.length ?? 0} département(s)`} action={<Button icon={<Plus className="h-4 w-4" />}>Ajouter</Button>} />

      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div> : !departments?.length ? (
        <Card><EmptyState icon={<Building2 className="h-12 w-12" />} title="Aucun département" /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const deptMembers = members?.filter((m) => m.department_id === d.id) ?? [];
            return (
              <Card key={d.id} className="p-5 hover:shadow-card-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bordeaux-100 dark:bg-bordeaux-900/40">
                    <Building2 className="h-5 w-5 text-bordeaux-700 dark:text-bordeaux-300" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{d.status}</Badge>
                </div>
                <h3 className="font-display text-lg font-semibold">{d.name}</h3>
                {d.description && <p className="text-sm text-ink-500 mt-1 line-clamp-2">{d.description}</p>}
                <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-400">
                  <Users className="h-3.5 w-3.5" /> {deptMembers.length} membre(s)
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
