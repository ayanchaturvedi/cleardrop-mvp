import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[Supabase Client Init] URL:', supabaseUrl ? 'Found' : 'Undefined/Empty');
console.log('[Supabase Client Init] Key:', supabaseAnonKey ? 'Found' : 'Undefined/Empty');

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[Supabase Client Init] Client created successfully.');
  } catch (error) {
    console.error('[Supabase Client Init] Failed to initialize client:', error);
  }
} else {
  console.warn('[Supabase Client Init] Supabase client could not be initialized due to missing variables.');
}

export { supabase };
