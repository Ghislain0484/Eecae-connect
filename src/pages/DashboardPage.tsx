import { Users, UserPlus, CalendarCheck, Wallet, TrendingUp, TrendingDown, Cake, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Card, CardHeader, StatCard, Skeleton, EmptyState, Badge } from '../components/ui';
import { formatCurrency, formatNumber, formatDate, formatDateLong } from '../lib/utils';
import { canViewFinance } from '../lib/permissions';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell as RechartsCell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const AGE_COLORS = ['#7a1e30', '#b94a5a', '#d4a82f', '#3b82f6', '#10b981', '#9ca3af'];

export function DashboardPage() {
  const { activeChurch, profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats(activeChurch?.id);
  const canFinance = canViewFinance(profile?.role);

  const ageData = stats
    ? [
        { name: 'Enfants', value: stats.children },
        { name: 'Adolescents', value: stats.teens },
        { name: 'Jeunes adultes', value: stats.youngAdults },
        { name: 'Adultes', value: stats.adults },
        { name: 'Seniors', value: stats.seniors },
      ]
    : [];

  const genderData = stats
    ? [
        { name: 'Hommes', value: stats.men },
        { name: 'Femmes', value: stats.women },
      ]
    : [];

  const attendanceData = stats?.recentAttendance.map((a) => ({
    date: formatDate(a.date).slice(0, 5),
    total: a.total,
    hommes: a.men,
    femmes: a.women,
  })) ?? [];

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-100">
          Bienvenue, {profile?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-ink-500 mt-0.5">
          {activeChurch?.name} — {formatDateLong(new Date())}
        </p>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total des membres" value={formatNumber(stats?.totalMembers ?? 0)} icon={<Users className="h-5 w-5" />} color="bordeaux" />
        <StatCard label="Membres actifs" value={formatNumber(stats?.activeMembers ?? 0)} icon={<Users className="h-5 w-5" />} color="emerald" trend={{ value: `${stats?.inactiveMembers ?? 0} inactifs` }} />
        <StatCard label="Visiteurs ce mois" value={formatNumber(stats?.visitorsThisMonth ?? 0)} icon={<UserPlus className="h-5 w-5" />} color="blue" trend={{ value: `${stats?.newVisitors ?? 0} nouveaux` }} />
        <StatCard label="Fréquentation moyenne" value={formatNumber(stats?.avgAttendance ?? 0)} icon={<CalendarCheck className="h-5 w-5" />} color="gold" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Attendance evolution */}
        <Card className="lg:col-span-2">
          <CardHeader title="Évolution de la fréquentation" subtitle="Derniers cultes enregistrés" />
          <div className="p-5">
            {attendanceData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7a1e30" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7a1e30" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                  <Area type="monotone" dataKey="total" name="Total" stroke="#7a1e30" strokeWidth={2} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Aucune donnée de fréquentation" description="Les présences apparaîtront ici après le premier pointage." />
            )}
          </div>
        </Card>

        {/* Gender distribution */}
        <Card>
          <CardHeader title="Répartition par sexe" />
          <div className="p-5">
            {genderData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    <RechartsCell fill="#3b82f6" />
                    <RechartsCell fill="#b94a5a" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Aucune donnée" />
            )}
          </div>
        </Card>
      </div>

      {/* Age distribution + Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Répartition par âge" subtitle="Catégories démographiques" />
          <div className="p-5">
            {ageData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                  <Bar dataKey="value" name="Membres" radius={[6, 6, 0, 0]}>
                    {ageData.map((_, i) => (
                      <RechartsCell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Aucune donnée d'âge" description="Renseignez les dates de naissance des membres." />
            )}
          </div>
        </Card>

        {canFinance ? (
          <Card>
            <CardHeader title="Aperçu financier" subtitle={activeChurch?.short_name ?? ''} />
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Recettes</span>
                  </div>
                  <p className="font-display text-xl font-bold mt-1 text-ink-900 dark:text-ink-100">{formatCurrency(stats?.totalIncome ?? 0)}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-medium">Dépenses</span>
                  </div>
                  <p className="font-display text-xl font-bold mt-1 text-ink-900 dark:text-ink-100">{formatCurrency(stats?.totalExpense ?? 0)}</p>
                </div>
              </div>
              <div className="rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-500">Solde net</span>
                  <span className={`font-display text-lg font-bold ${(stats?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(stats?.balance ?? 0)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <Wallet className="h-3.5 w-3.5" />
                <span>Données financières de l'assemblée sélectionnée</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Ministère Jeunesse" subtitle="12 à 40 ans" />
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gold-50 dark:bg-gold-900/30">
                  <span className="font-display text-2xl font-bold text-gold-700 dark:text-gold-300">{stats?.youth12to40 ?? 0}</span>
                </div>
                <div>
                  <p className="font-semibold text-ink-800 dark:text-ink-200">Jeunes (12-40 ans)</p>
                  <p className="text-sm text-ink-500 mt-0.5">Appartiennent au ministère de la jeunesse tout en étant comptés dans leur catégorie d'âge démographique.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-800">
                  <p className="text-xs text-ink-400">Adolescents</p>
                  <p className="font-semibold mt-0.5">{stats?.teens ?? 0}</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-800">
                  <p className="text-xs text-ink-400">Jeunes adultes</p>
                  <p className="font-semibold mt-0.5">{stats?.youngAdults ?? 0}</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-800">
                  <p className="text-xs text-ink-400">Nouv. convertis</p>
                  <p className="font-semibold mt-0.5">{stats?.newConverts ?? 0}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom row: upcoming events + birthdays + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Programmes à venir" />
          <div className="p-3">
            {stats?.upcomingEvents.length ? (
              <div className="space-y-1">
                {stats.upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-bordeaux-50 dark:bg-bordeaux-900/30 shrink-0">
                      <Calendar className="h-4 w-4 text-bordeaux-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-ink-800 dark:text-ink-200">{e.title}</p>
                      <p className="text-xs text-ink-400">{formatDate(e.event_date)} · {e.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Aucun programme à venir" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Anniversaires cette semaine" />
          <div className="p-3">
            {stats?.birthdaysThisWeek.length ? (
              <div className="space-y-1">
                {stats.birthdaysThisWeek.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                    <Cake className="h-5 w-5 text-gold-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-ink-800 dark:text-ink-200">{b.first_name} {b.last_name}</p>
                      <p className="text-xs text-ink-400">{formatDate(b.birth_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Aucun anniversaire" description="Aucun anniversaire cette semaine." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Alertes et suivis" />
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Suivis d'absence</span>
              </div>
              <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{stats?.absenceFollowups ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Nouveaux visiteurs</span>
              </div>
              <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{stats?.newVisitors ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Nouv. convertis</span>
              </div>
              <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{stats?.newConverts ?? 0}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
