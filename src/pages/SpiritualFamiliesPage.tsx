import { Palette, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSpiritualFamilies, useMembers } from '../hooks/useData';
import { PageHeader, Card, EmptyState, Skeleton, Badge, Avatar } from '../components/ui';

export function SpiritualFamiliesPage() {
  const { activeChurch } = useAuth();
  const { data: families, isLoading: isLoadingFamilies } = useSpiritualFamilies(activeChurch?.id);
  const { data: members, isLoading: isLoadingMembers } = useMembers(activeChurch?.id);

  const isLoading = isLoadingFamilies || isLoadingMembers;

  return (
    <div>
      <PageHeader
        title="Familles spirituelles"
        subtitle={`${families?.length ?? 0} famille(s) spirituelle(s) · ${activeChurch?.short_name ?? ''}`}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !families?.length ? (
        <Card>
          <EmptyState
            icon={<Palette className="h-12 w-12" />}
            title="Aucune famille spirituelle"
            description="Les familles spirituelles permettent d'organiser les membres par groupes fraternels colorés dans votre assemblée."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {families.map((f) => {
            const familyMembers = members?.filter((m) => m.spiritual_family_id === f.id) ?? [];
            const leader = members?.find((m) => m.id === f.leader_member_id);

            // Dynamically assign styling classes depending on the color name
            const borderColors: Record<string, string> = {
              blanc: 'border-t-4 border-t-ink-300 dark:border-t-ink-600',
              jaune: 'border-t-4 border-t-gold-500',
              orange: 'border-t-4 border-t-orange-500',
              vert: 'border-t-4 border-t-emerald-500',
              rouge: 'border-t-4 border-t-red-500',
              bleu: 'border-t-4 border-t-blue-500',
            };

            const bgColors: Record<string, string> = {
              blanc: 'bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800',
              jaune: 'bg-gold-50/20 dark:bg-gold-950/10',
              orange: 'bg-orange-50/20 dark:bg-orange-950/10',
              vert: 'bg-emerald-50/20 dark:bg-emerald-950/10',
              rouge: 'bg-red-50/20 dark:bg-red-950/10',
              bleu: 'bg-blue-50/20 dark:bg-blue-950/10',
            };

            const badgeStyles: Record<string, string> = {
              blanc: 'bg-ink-100 text-ink-800 border border-ink-300 dark:bg-ink-800 dark:text-ink-200 dark:border-ink-700',
              jaune: 'bg-gold-100 text-gold-800 dark:bg-gold-900/40 dark:text-gold-300',
              orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
              vert: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
              rouge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
              bleu: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            };

            return (
              <Card key={f.id} className={`${bgColors[f.color_name] ?? 'bg-white'} ${borderColors[f.color_name] ?? ''} shadow-card hover:shadow-card-lg transition-all duration-200 overflow-hidden flex flex-col justify-between p-5`}>
                <div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="font-display text-lg font-bold text-ink-900 dark:text-ink-100">{f.name}</h3>
                    <Badge className={badgeStyles[f.color_name] ?? 'bg-ink-100 text-ink-700'}>
                      Famille {f.color_name}
                    </Badge>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div>
                      <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wider">Responsable</p>
                      {leader ? (
                        <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 mt-0.5">
                          {leader.last_name} {leader.first_name}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-400 italic mt-0.5">Aucun responsable assigné</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wider flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Effectif
                      </p>
                      <p className="text-xl font-bold font-display text-ink-900 dark:text-ink-100 mt-0.5">
                        {familyMembers.length} <span className="text-xs font-sans font-normal text-ink-500">membre(s)</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-ink-200/50 dark:border-ink-800/40 flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {familyMembers.slice(0, 4).map((m) => (
                      <div key={m.id} title={`${m.last_name} ${m.first_name}`} className="ring-2 ring-white dark:ring-ink-900 rounded-full">
                        <Avatar
                          firstName={m.first_name}
                          lastName={m.last_name}
                          src={m.photo_url ?? undefined}
                          size="sm"
                        />
                      </div>
                    ))}
                    {familyMembers.length > 4 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-200 text-xs font-semibold text-ink-700 dark:bg-ink-700 dark:text-ink-300 ring-2 ring-white dark:ring-ink-900 shrink-0">
                        +{familyMembers.length - 4}
                      </div>
                    )}
                    {familyMembers.length === 0 && (
                      <span className="text-xs text-ink-400 italic">Aucun membre</span>
                    )}
                  </div>
                  
                  {familyMembers.length > 0 && (
                    <a
                      href={`#/members?family=${f.id}`}
                      className="text-xs font-semibold text-bordeaux-700 dark:text-bordeaux-400 flex items-center gap-1 hover:underline"
                    >
                      Membres <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
