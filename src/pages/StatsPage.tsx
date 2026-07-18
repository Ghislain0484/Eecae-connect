import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, CardHeader, StatCard, EmptyState } from '../components/ui';
import { Users, UserPlus, TrendingUp, Calendar, Download } from 'lucide-react';
import { formatNumber, formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell as RechartsCell } from 'recharts';
import { Button } from '../components/ui';
import { exportToCsv } from '../lib/utils';
import { useToast } from '../components/ui/Toast';

const COLORS = ['#7a1e30', '#d4a82f', '#3b82f6', '#10b981', '#f59e0b'];

export function StatsPage() {
  const { activeChurch } = useAuth();
  const { data: stats, isLoading } = useDashboardStats(activeChurch?.id);
  const toast = useToast();

  const { data: churchComparison } = useQuery({
    queryKey: ['church-comparison'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('count_members_by_church');
      if (error) throw error;
      const churches = await supabase.from('churches').select('id, short_name, name').order('is_headquarters', { ascending: false });
      return ((data as { church_id: string; count: number }[]) || []).map((d) => {
        const church = (churches.data || []).find((c) => c.id === d.church_id);
        return { name: church?.short_name ?? church?.name ?? '—', membres: d.count };
      });
    },
  });

  const ageData = stats ? [
    { name: 'Enfants', value: stats.children },
    { name: 'Adolescents', value: stats.teens },
    { name: 'Jeunes adultes', value: stats.youngAdults },
    { name: 'Adultes', value: stats.adults },
    { name: 'Seniors', value: stats.seniors },
  ] : [];

  const handleExport = () => {
    if (!stats) return;
    exportToCsv(`statistiques-${activeChurch?.short_name ?? 'eecae'}.csv`, [
      { Indicateur: 'Total membres', Valeur: stats.totalMembers },
      { Indicateur: 'Membres actifs', Valeur: stats.activeMembers },
      { Indicateur: 'Hommes', Valeur: stats.men },
      { Indicateur: 'Femmes', Valeur: stats.women },
      { Indicateur: 'Enfants', Valeur: stats.children },
      { Indicateur: 'Jeunes (12-40)', Valeur: stats.youth12to40 },
      { Indicateur: 'Nouveaux convertis', Valeur: stats.newConverts },
      { Indicateur: 'Visiteurs ce mois', Valeur: stats.visitorsThisMonth },
      { Indicateur: 'Fréquentation moyenne', Valeur: stats.avgAttendance },
      { Indicateur: 'Total recettes', Valeur: stats.totalIncome },
      { Indicateur: 'Total dépenses', Valeur: stats.totalExpense },
      { Indicateur: 'Solde', Valeur: stats.balance },
    ]);
    toast.success('Statistiques exportées');
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <PageHeader title="Statistiques" subtitle={activeChurch?.short_name ?? ''} action={<Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Exporter</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total membres" value={formatNumber(stats?.totalMembers ?? 0)} icon={<Users className="h-5 w-5" />} color="bordeaux" />
        <StatCard label="Membres actifs" value={formatNumber(stats?.activeMembers ?? 0)} icon={<TrendingUp className="h-5 w-5" />} color="emerald" />
        <StatCard label="Visiteurs (mois)" value={formatNumber(stats?.visitorsThisMonth ?? 0)} icon={<UserPlus className="h-5 w-5" />} color="blue" />
        <StatCard label="Fréquentation moy." value={formatNumber(stats?.avgAttendance ?? 0)} icon={<Calendar className="h-5 w-5" />} color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Répartition par âge" />
          <div className="p-5">
            {ageData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{ageData.map((_, i) => <RechartsCell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="Aucune donnée" />}
          </div>
        </Card>

        <Card>
          <CardHeader title="Membres par assemblée" />
          <div className="p-5">
            {churchComparison?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={churchComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="membres" fill="#7a1e30" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="Aucune donnée" />}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Indicateurs de croissance" subtitle="Calculés à partir des données réelles" />
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <GrowthIndicator label="Croissance nette" value={formatNumber((stats?.newConverts ?? 0))} positive />
          <GrowthIndicator label="Nouveaux convertis" value={formatNumber(stats?.newConverts ?? 0)} positive />
          <GrowthIndicator label="Visiteurs devenus membres" value="—" />
          <GrowthIndicator label="Taux de rétention" value="—" />
          <GrowthIndicator label="Membres inactifs" value={formatNumber(stats?.inactiveMembers ?? 0)} />
          <GrowthIndicator label="Suivis d'absence" value={formatNumber(stats?.absenceFollowups ?? 0)} />
          <GrowthIndicator label="Recettes" value={formatCurrency(stats?.totalIncome ?? 0)} positive />
          <GrowthIndicator label="Solde" value={formatCurrency(stats?.balance ?? 0)} positive={(stats?.balance ?? 0) >= 0} />
        </div>
      </Card>
    </div>
  );
}

function GrowthIndicator({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-4">
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`font-display text-lg font-bold mt-1 ${positive ? 'text-emerald-600' : 'text-ink-800 dark:text-ink-200'}`}>{value}</p>
    </div>
  );
}
