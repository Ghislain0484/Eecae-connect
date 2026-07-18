import { supabase } from './supabase';

export async function logAudit(params: {
  action: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  churchId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      action: params.action,
      module: params.module ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      church_id: params.churchId ?? null,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
    });
  } catch {
    // Silent fail — audit logging should not break user flows
  }
}
