import { useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * Subscribe to realtime changes on a single Supabase table.
 * Calls `onChange` whenever an INSERT, UPDATE, or DELETE occurs.
 */
export function useRealtime({
  table,
  onChange



}: {table: string;onChange: () => void;}) {
  useEffect(() => {
    const channel = supabase.channel(`realtime-${table}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table
    }, () => {
      onChange();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange]);
}

/**
 * Subscribe to realtime changes on multiple Supabase tables.
 * Calls `onChange` whenever any of the listed tables receive an INSERT, UPDATE, or DELETE.
 */
export function useRealtimeMulti(tables: string[], onChange: () => void) {
  useEffect(() => {
    const channels = tables.map((table) => supabase.channel(`realtime-multi-${table}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table
    }, () => {
      onChange();
    }).subscribe());
    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [tables.join(','), onChange]);
}