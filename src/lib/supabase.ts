// src/lib/supabase.ts
// Supabase client + auth helpers for the Buttery loyalty app.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole } from '../types';

// Prefer .env values; fall back to the project's known values so the app
// still connects if the env file is missing.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ||
  'https://lctqnonziqrfqkltrggp.supabase.co').trim();

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdHFub256aXFyZnFrbHRyZ2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjEzMzMsImV4cCI6MjA5NzAzNzMzM30.bcbECadfh8BIZArI1xfxLfiVfuGFzCgGJsBHsCYQgyk').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // needed so password-reset links resolve
      },
    })
  : null;

// ---- helpers -------------------------------------------------

// Map a DB profile row to our app User shape.
export function profileToUser(p: any): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as UserRole,
    isSupervisor: p.is_supervisor ?? false,
    points: p.points ?? 0,
    qrCode: p.qr_code,
    createdAt: p.created_at,
  };
}

// Fetch the profile row for a given auth user id.
export async function fetchProfile(userId: string): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return profileToUser(data);
}

// A random loyalty QR code for a new client / staff member.
export function makeClientQr(): string {
  return `BUTTERY-CLIENT-${Math.floor(1000 + Math.random() * 9000)}`;
}
export function makeStaffQr(): string {
  return `BUTTERY-STAFF-${Math.floor(1000 + Math.random() * 9000)}`;
}