import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keeps local UI development possible while making missing config obvious.
  console.warn('Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect .Iterate.');
}

export const supabase = createClient<Database>(supabaseUrl ?? 'http://localhost:54321', supabaseAnonKey ?? 'local-anon-key');
