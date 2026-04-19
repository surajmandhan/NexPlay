import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your environment variables.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export interface CuratedMovie {
  id: string;
  tmdb_id: number;
  title: string;
  type: 'movie' | 'tv';
  youtube_link?: string;
  drive_link?: string;
  category?: string;
  is_prime?: boolean;
  created_at: string;
}
