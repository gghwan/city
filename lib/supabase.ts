import { createClient } from '@supabase/supabase-js';

function pickNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

const supabaseUrl = pickNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = pickNonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.SUPABASE_SECRET_KEY);

export const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'campaign-files';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
