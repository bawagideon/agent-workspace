import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tunfhlthcmznagmtawcx.supabase.co';

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bmZobHRoY216bmFnbXRhd2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDA2NjMsImV4cCI6MjEwMzk3NjY2M30.fX0gZk0y2FfAN3Mz6HF6INaYp6beJrWZOZ0SambIJxw';

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bmZobHRoY216bmFnbXRhd2N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQwMDY2MywiZXhwIjoyMTAzOTc2NjYzfQ.pTREuwsOlsWfUPzeivS7dOgf99dMA0OTYgzCE4dYcNM';

export const supabase: SupabaseClient = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getSupabase(): SupabaseClient {
  return supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  return supabaseAdmin;
}
