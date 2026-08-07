import { supabase } from '../supabase';

interface AuditPayload {
  action: string;
  module: string;
  description: string;
  entity_id?: string;
  entity_name?: string;
  metadata?: Record<string, any>;
}

export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    const stored = localStorage.getItem('user');
    let userName = 'Sistema';
    let userEmail = '';
    let userRole = '';

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        userName = parsed.name || 'Sistema';
        userEmail = parsed.email || '';
        userRole = parsed.role || '';
      } catch {

        // keep defaults
      }}

    await supabase.from('audit_logs').insert([
    {
      user_name: userName,
      user_email: userEmail,
      user_role: userRole,
      action: payload.action,
      module: payload.module,
      description: payload.description,
      entity_id: payload.entity_id || null,
      entity_name: payload.entity_name || null,
      metadata: payload.metadata || {}
    }]
    );
  } catch (err) {
    console.error('[useAudit] Error logging audit:', err);
  }
}