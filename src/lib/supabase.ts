import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lctqnonziqrfqkltrggp.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdHFub256aXFyZnFrbHRyZ2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjEzMzMsImV4cCI6MjA5NzAzNzMzM30.bcbECadfh8BIZArI1xfxLfiVfuGFzCgGJsBHsCYQgyk').trim();

// Clean Supabase URL to strip any trailing slashes or /rest/v1 pathing, or auto-format if only a project ID is provided
const cleanUrl = (url: string): string => {
  let cleaned = url.trim();
  if (!cleaned) return '';

  // If the user pasted just the Project ID (e.g. "lctqnonziqrfqkltrggp"), build the full URL
  if (!cleaned.includes('.') && !cleaned.includes('://') && cleaned.length >= 10 && cleaned.length <= 40) {
    return `https://${cleaned}.supabase.co`;
  }

  cleaned = cleaned.replace(/\/+$/, ''); // Remove trailing slashes
  if (cleaned.endsWith('/rest/v1')) {
    cleaned = cleaned.slice(0, -8); // Remove /rest/v1
  }
  return cleaned.replace(/\/+$/, '');
};

const supabaseUrl = cleanUrl(rawSupabaseUrl);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check if credentials are valid format
export const hasValidCredentials = () => {
  if (!isSupabaseConfigured) return false;
  return supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;
};

export const SUPABASE_SQL_SETUP = `-- 1. CREATE PROFILES/CLIENTS TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff')),
  points INTEGER NOT NULL DEFAULT 0,
  qr_code TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT '1234',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS (Optional - for simple loyalty apps we can allow read/write or add basic policies)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write access" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. CREATE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem')),
  description TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  staff_name TEXT
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write access" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- 3. CREATE VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS vouchers (
  code TEXT PRIMARY KEY,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write access" ON vouchers FOR ALL USING (true) WITH CHECK (true);

-- 4. CREATE APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  stamp_symbol TEXT NOT NULL DEFAULT '🥐',
  brand_brown TEXT NOT NULL DEFAULT '#2D241E',
  brand_gold TEXT NOT NULL DEFAULT '#C5A059',
  brand_bg TEXT NOT NULL DEFAULT '#FAF7F2',
  settings_pin TEXT NOT NULL DEFAULT '1234',
  logo_url TEXT DEFAULT '',
  logo_height INTEGER DEFAULT 40,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write access" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. INSERT SEED DATA FOR TESTING
INSERT INTO profiles (id, name, email, role, points, qr_code, password)
VALUES 
  ('c1', 'Sofía Martínez', 'sofia.polanco@gmail.com', 'client', 6, 'BUTTERY-CLIENT-SOFIA', '1234'),
  ('s1', 'Carlos (Barista)', 'staff@buttery.mx', 'staff', 0, 'BUTTERY-STAFF-CARLOS', '1234'),
  ('c2', 'Mateo Obregón', 'mateo@hotmail.com', 'client', 9, 'BUTTERY-CLIENT-MATEO', '1234'),
  ('c3', 'Andrea Ruiz', 'andrea.ruiz@outlook.com', 'client', 2, 'BUTTERY-CLIENT-ANDREA', '1234')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vouchers (code, points, description, is_used)
VALUES
  ('BUTTERY-VOUCHER-POLANCO-1', 1, 'Boleto cortesía: 1 Sello', FALSE),
  ('BUTTERY-VOUCHER-DESAYUNO-2', 2, 'Boleto especial: 2 Sellos', FALSE),
  ('BUTTERY-VOUCHER-BIENVENIDA-1', 1, 'Sello de Bienvenida', FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO app_settings (id, stamp_symbol, brand_brown, brand_gold, brand_bg, settings_pin)
VALUES ('default', '🥐', '#2D241E', '#C5A059', '#FAF7F2', '1234')
ON CONFLICT (id) DO NOTHING;
`;
