import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Member, Visitor, EventItem, Sermon, Department, Cell, Family, SpiritualFamily } from '../types';
import { logAudit } from '../lib/audit';

// ===== Members =====
export function useMembers(churchId: string | undefined, filters?: { search?: string; status?: string; sex?: string }) {
  return useQuery({
    queryKey: ['members', churchId, filters],
    queryFn: async () => {
      if (!churchId) return [];
      let q = supabase.from('members').select('*').eq('church_id', churchId).is('archived_at', null).order('last_name');
      if (filters?.search) {
        q = q.or(`last_name.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,phone_main.ilike.%${filters.search}%,matricule.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters?.sex && filters.sex !== 'all') q = q.eq('sex', filters.sex);
      const { data, error } = await q;
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!churchId,
  });
}

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as Member | null;
    },
    enabled: !!id,
  });
}

export function useCreateMember(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Member>) => {
      const { data, error } = await supabase.from('members').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'members', entityType: 'member', entityId: data.id, churchId, newValue: data as Record<string, unknown> });
      return data as Member;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Member> }) => {
      const { data: old } = await supabase.from('members').select('*').eq('id', id).maybeSingle();
      const { data, error } = await supabase.from('members').update(input).eq('id', id).select().single();
      if (error) throw error;
      await logAudit({ action: 'update', module: 'members', entityType: 'member', entityId: id, churchId: (data as Member).church_id, oldValue: old as Record<string, unknown>, newValue: data as Record<string, unknown> });
      return data as Member;
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['member', vars.id] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useArchiveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, churchId }: { id: string; churchId: string }) => {
      const { error } = await supabase.from('members').update({ archived_at: new Date().toISOString(), status: 'archived' }).eq('id', id);
      if (error) throw error;
      await logAudit({ action: 'archive', module: 'members', entityType: 'member', entityId: id, churchId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

// ===== Visitors =====
export function useVisitors(churchId: string | undefined, filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['visitors', churchId, filters],
    queryFn: async () => {
      if (!churchId) return [];
      let q = supabase.from('visitors').select('*').eq('church_id', churchId).is('archived_at', null).order('first_visit_date', { ascending: false });
      if (filters?.search) {
        q = q.or(`last_name.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }
      if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return data as Visitor[];
    },
    enabled: !!churchId,
  });
}

export function useCreateVisitor(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Visitor>) => {
      const { data, error } = await supabase.from('visitors').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'visitors', entityType: 'visitor', entityId: data.id, churchId, newValue: data as Record<string, unknown> });
      return data as Visitor;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdateVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Visitor> }) => {
      const { data, error } = await supabase.from('visitors').update(input).eq('id', id).select().single();
      if (error) throw error;
      await logAudit({ action: 'update', module: 'visitors', entityType: 'visitor', entityId: id, churchId: (data as Visitor).church_id, newValue: data as Record<string, unknown> });
      return data as Visitor;
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['visitors'] }); qc.invalidateQueries({ queryKey: ['visitor', vars.id] }); },
  });
}

// ===== Events =====
export function useEvents(churchId: string | undefined, filters?: { type?: string; status?: string; upcoming?: boolean }) {
  return useQuery({
    queryKey: ['events', churchId, filters],
    queryFn: async () => {
      if (!churchId) return [];
      let q = supabase.from('events').select('*').eq('church_id', churchId).is('archived_at', null).order('event_date', { ascending: filters?.upcoming ?? false });
      if (filters?.type && filters.type !== 'all') q = q.eq('type', filters.type);
      if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters?.upcoming) q = q.gte('event_date', new Date().toISOString().slice(0, 10));
      const { data, error } = await q;
      if (error) throw error;
      return data as EventItem[];
    },
    enabled: !!churchId,
  });
}

export function useCreateEvent(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EventItem>) => {
      const { data, error } = await supabase.from('events').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'events', entityType: 'event', entityId: data.id, churchId, newValue: data as Record<string, unknown> });
      return data as EventItem;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<EventItem> }) => {
      const { data, error } = await supabase.from('events').update(input).eq('id', id).select().single();
      if (error) throw error;
      await logAudit({ action: 'update', module: 'events', entityType: 'event', entityId: id, churchId: (data as EventItem).church_id, newValue: data as Record<string, unknown> });
      return data as EventItem;
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['event', vars.id] }); },
  });
}

// ===== Sermons =====
export function useSermons(churchId: string | undefined, filters?: { search?: string }) {
  return useQuery({
    queryKey: ['sermons', churchId, filters],
    queryFn: async () => {
      if (!churchId) return [];
      let q = supabase.from('sermons').select('*').eq('church_id', churchId).is('archived_at', null).order('sermon_date', { ascending: false });
      if (filters?.search) {
        q = q.or(`theme.ilike.%${filters.search}%,preacher.ilike.%${filters.search}%,main_verse.ilike.%${filters.search}%,keywords.ilike.%${filters.search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Sermon[];
    },
    enabled: !!churchId,
  });
}

export function useCreateSermon(churchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Sermon>) => {
      const { data, error } = await supabase.from('sermons').insert({ ...input, church_id: churchId }).select().single();
      if (error) throw error;
      await logAudit({ action: 'create', module: 'sermons', entityType: 'sermon', entityId: data.id, churchId, newValue: data as Record<string, unknown> });
      return data as Sermon;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sermons'] }),
  });
}

// ===== Departments =====
export function useDepartments(churchId: string | undefined) {
  return useQuery({
    queryKey: ['departments', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase.from('departments').select('*').eq('church_id', churchId).is('archived_at', null).order('name');
      if (error) throw error;
      return data as Department[];
    },
    enabled: !!churchId,
  });
}

// ===== Cells =====
export function useCells(churchId: string | undefined) {
  return useQuery({
    queryKey: ['cells', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase.from('cells').select('*').eq('church_id', churchId).is('archived_at', null).order('name');
      if (error) throw error;
      return data as Cell[];
    },
    enabled: !!churchId,
  });
}

// ===== Families =====
export function useFamilies(churchId: string | undefined) {
  return useQuery({
    queryKey: ['families', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase.from('families').select('*').eq('church_id', churchId).is('archived_at', null).order('name');
      if (error) throw error;
      return data as Family[];
    },
    enabled: !!churchId,
  });
}

// ===== Spiritual Families =====
export function useSpiritualFamilies(churchId: string | undefined) {
  return useQuery({
    queryKey: ['spiritual_families', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase.from('spiritual_families').select('*').eq('church_id', churchId).is('archived_at', null).order('name');
      if (error) throw error;
      return data as SpiritualFamily[];
    },
    enabled: !!churchId,
  });
}

// ===== Churches =====
export function useChurches() {
  return useQuery({
    queryKey: ['churches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('churches').select('*').order('is_headquarters', { ascending: false }).order('name');
      if (error) throw error;
      return data;
    },
  });
}
