import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const getSupabaseAdmin = () => {
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    'https://liwxpqmpofjrlvggzhrk.supabase.co';

  const serviceRoleKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SECRET_KEY || 
    process.env.SUPABASE_SERVICE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Supabase admin secret key is not configured in Vercel. Expected SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY in Vercel Environment Variables.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
