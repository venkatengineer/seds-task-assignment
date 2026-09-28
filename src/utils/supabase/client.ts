import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://liwxpqmpofjrlvggzhrk.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_M8J1Q_19BC80MSskMjdZGg_WPM_b9HR';

export const createClient = () =>
  createBrowserClient(
    SUPABASE_URL,
    SUPABASE_KEY,
  );
