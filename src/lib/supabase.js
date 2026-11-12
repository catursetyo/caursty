import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
export const isSupabaseConfigured = Boolean(url && publishableKey);
export const isTurnstileConfigured = Boolean(turnstileSiteKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
