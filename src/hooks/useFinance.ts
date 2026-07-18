import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Contribution, Expense, Tithe, Pledge } from '../types';
import { logAudit } from '../lib/audit';

export function useContributions(churchId: string | undefined, filters?: { category?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['contributions', churchId, filters],
    queryFn: async () => {
      if (!churchId) return [];
      let q = supabase.from('contributions').select('*').eq('church_id', churchId).is('archived_at', null).order('contribution_date', { ascending: false });
      if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category);
      if (filters?.startDate) q = q.gte('contribution_date', filters.startDate);
      if (filters?.endDate) q = q.lte('contribution_date', filters.endDate);
      const { data, error } = await q;
      if (error) throw error;
      return data as Contribution[];
    },
    enabled: !!churchId,
  });
}

export function useCreateContribution(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Contribution>) => {
      const { data, error } = await supabase.from('contributions').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'finance', entityType: 'contribution', entityId: data.id, churchId, newValue: data as Record<string, unknown> });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contributions'] }); qc.invalidateQueries({ queryKey: ['finance-stats'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useTithes(churchId: string | undefined) {
  return useQuery({
    queryKey: ['tithes', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase.from('tithes').select('*').eq('church_id', churchId).order('tithe_date', { ascending: false });
      if (error) throw error;
      return data as Tithe[];
    },
    enabled: !!churchId,
  });
}

export function useCreateTithe(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Tithe>) => {
      const { data, error } = await supabase.from('tithes').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'finance', entityType: 'tithe', entityId: data.id, churchId });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tithes'] }); qc.invalidateQueries({ queryKey: ['finance-stats'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useExpenses(churchId: string | undefined, filters?: { category?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['expenses', churchId, filters],
    queryFn: async () => {
      if (!churchId) return [];
      let q = supabase.from('expenses').select('*').eq('church_id', churchId).is('archived_at', null).order('expense_date', { ascending: false });
      if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category);
      if (filters?.startDate) q = q.gte('expense_date', filters.startDate);
      if (filters?.endDate) q = q.lte('expense_date', filters.endDate);
      const { data, error } = await q;
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!churchId,
  });
}

export function useCreateExpense(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Expense>) => {
      const { data, error } = await supabase.from('expenses').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'finance', entityType: 'expense', entityId: data.id, churchId });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['finance-stats'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function usePledges(churchId: string | undefined) {
  return useQuery({
    queryKey: ['pledges', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase.from('pledges').select('*').eq('church_id', churchId).is('archived_at', null).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Pledge[];
    },
    enabled: !!churchId,
  });
}

export function useCreatePledge(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pledge>) => {
      const { data, error } = await supabase.from('pledges').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pledges'] }),
  });
}

export function useFinanceStats(churchId: string | undefined) {
  return useQuery({
    queryKey: ['finance-stats', churchId],
    queryFn: async () => {
      if (!churchId) return { totalIncome: 0, totalExpense: 0, balance: 0, byCategory: [] as { category: string; amount: number }[] };
      const { data: contribs } = await supabase.from('contributions').select('amount, category').eq('church_id', churchId).is('archived_at', null);
      const { data: expenses } = await supabase.from('expenses').select('amount').eq('church_id', churchId).is('archived_at', null);
      const { data: tithes } = await supabase.from('tithes').select('amount').eq('church_id', churchId);
      const income = ((contribs as Contribution[]) || []).reduce((s, c) => s + Number(c.amount), 0) + ((tithes as Tithe[]) || []).reduce((s, t) => s + Number(t.amount), 0);
      const expense = ((expenses as Expense[]) || []).reduce((s, e) => s + Number(e.amount), 0);
      const catMap = new Map<string, number>();
      ((contribs as Contribution[]) || []).forEach((c) => catMap.set(c.category, (catMap.get(c.category) ?? 0) + Number(c.amount)));
      return {
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        byCategory: Array.from(catMap.entries()).map(([category, amount]) => ({ category, amount })),
      };
    },
    enabled: !!churchId,
  });
}
