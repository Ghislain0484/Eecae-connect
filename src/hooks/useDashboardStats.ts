import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ageCategory, calculateAge, type AgeCategory } from '../lib/utils';

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newConverts: number;
  inactiveMembers: number;
  men: number;
  women: number;
  children: number;
  teens: number;
  youngAdults: number;
  adults: number;
  seniors: number;
  youth12to40: number;
  visitorsThisMonth: number;
  newVisitors: number;
  avgAttendance: number;
  lastServiceAttendance: number;
  lastServiceDate: string | null;
  upcomingEvents: { id: string; title: string; event_date: string; type: string }[];
  recentAttendance: { date: string; total: number; men: number; women: number }[];
  birthdaysThisWeek: { id: string; first_name: string; last_name: string; birth_date: string }[];
  absenceFollowups: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function useDashboardStats(churchId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', churchId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!churchId) {
        return emptyStats();
      }
      const { data: members } = await supabase.from('members').select('*').eq('church_id', churchId).is('archived_at', null);
      const memberList = members || [];
      const activeMembers = memberList.filter((m) => m.status === 'active').length;
      const newConverts = memberList.filter((m) => m.status === 'new_convert').length;
      const inactiveMembers = memberList.filter((m) => m.status === 'inactive' || m.status === 'irregular').length;
      const men = memberList.filter((m) => m.sex === 'M').length;
      const women = memberList.filter((m) => m.sex === 'F').length;

      const cats = memberList.reduce(
        (acc, m) => {
          const cat = ageCategory(m.birth_date);
          acc[cat]++;
          if (cat !== 'unknown' && cat !== 'child') {
            const age = calculateAge(m.birth_date);
            if (age !== null && age >= 12 && age <= 40) acc.youth12to40++;
          }
          return acc;
        },
        { child: 0, teen: 0, young_adult: 0, adult: 0, senior: 0, unknown: 0, youth12to40: 0 } as Record<AgeCategory | 'youth12to40', number>,
      );

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const { data: visitors } = await supabase.from('visitors').select('*').eq('church_id', churchId).is('archived_at', null).gte('first_visit_date', monthStart);
      const visitorList = visitors || [];
      const newVisitors = visitorList.filter((v) => v.status === 'first_visit').length;

      // Recent attendance totals
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id, session_date, attendance_totals(total_participants, men, women)')
        .eq('church_id', churchId)
        .order('session_date', { ascending: false })
        .limit(8);
      const sessionList = (sessions || []) as unknown as { id: string; session_date: string; attendance_totals: { total_participants: number; men: number; women: number } | null }[];
      const recentAttendance = sessionList
        .filter((s) => s.attendance_totals)
        .map((s) => ({
          date: s.session_date,
          total: s.attendance_totals!.total_participants,
          men: s.attendance_totals!.men,
          women: s.attendance_totals!.women,
        }))
        .reverse();

      const avgAttendance = recentAttendance.length
        ? Math.round(recentAttendance.reduce((s, a) => s + a.total, 0) / recentAttendance.length)
        : 0;
      const lastService = recentAttendance[recentAttendance.length - 1];
      const lastServiceAttendance = lastService?.total ?? 0;
      const lastServiceDate = lastService?.date ?? null;

      // Upcoming events
      const todayStr = now.toISOString().slice(0, 10);
      const { data: events } = await supabase
        .from('events')
        .select('id, title, event_date, type')
        .eq('church_id', churchId)
        .gte('event_date', todayStr)
        .in('status', ['planned', 'ongoing'])
        .order('event_date', { ascending: true })
        .limit(5);
      const upcomingEvents = (events || []) as { id: string; title: string; event_date: string; type: string }[];

      // Birthdays this week
      const { data: allMembers } = await supabase.from('members').select('id, first_name, last_name, birth_date').eq('church_id', churchId).not('birth_date', 'is', null).is('archived_at', null);
      const weekStart = now;
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const birthdaysThisWeek = (allMembers || [])
        .filter((m) => {
          if (!m.birth_date) return false;
          const bd = new Date(m.birth_date);
          const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
          return thisYear >= weekStart && thisYear <= weekEnd;
        })
        .map((m) => ({ id: m.id, first_name: m.first_name, last_name: m.last_name, birth_date: m.birth_date! }));

      // Absence followups
      const { count: absenceFollowups } = await supabase
        .from('absence_followups')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .in('status', ['open', 'in_progress']);

      // Finance summary
      const { data: contribs } = await supabase.from('contributions').select('amount').eq('church_id', churchId).is('archived_at', null);
      const { data: tithes } = await supabase.from('tithes').select('amount').eq('church_id', churchId);
      const { data: expenses } = await supabase.from('expenses').select('amount').eq('church_id', churchId).is('archived_at', null);
      const totalIncome = ((contribs || []) as { amount: number }[]).reduce((s, c) => s + Number(c.amount), 0) + ((tithes || []) as { amount: number }[]).reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = ((expenses || []) as { amount: number }[]).reduce((s, e) => s + Number(e.amount), 0);

      return {
        totalMembers: memberList.length,
        activeMembers,
        newConverts,
        inactiveMembers,
        men,
        women,
        children: cats.child,
        teens: cats.teen,
        youngAdults: cats.young_adult,
        adults: cats.adult,
        seniors: cats.senior,
        youth12to40: cats.youth12to40,
        visitorsThisMonth: visitorList.length,
        newVisitors,
        avgAttendance,
        lastServiceAttendance,
        lastServiceDate,
        upcomingEvents,
        recentAttendance,
        birthdaysThisWeek,
        absenceFollowups: absenceFollowups ?? 0,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      };
    },
    enabled: !!churchId,
  });
}

function emptyStats(): DashboardStats {
  return {
    totalMembers: 0, activeMembers: 0, newConverts: 0, inactiveMembers: 0,
    men: 0, women: 0, children: 0, teens: 0, youngAdults: 0, adults: 0, seniors: 0, youth12to40: 0,
    visitorsThisMonth: 0, newVisitors: 0, avgAttendance: 0, lastServiceAttendance: 0, lastServiceDate: null,
    upcomingEvents: [], recentAttendance: [], birthdaysThisWeek: [], absenceFollowups: 0,
    totalIncome: 0, totalExpense: 0, balance: 0,
  };
}
