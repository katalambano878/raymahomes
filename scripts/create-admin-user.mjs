/**
 * One-off script to create an admin user for the Rayma Kitchenware admin dashboard.
 *
 * Uses Supabase Auth Admin API to create the user, then sets role to 'admin' in profiles.
 * The handle_new_user trigger creates a profile with role 'customer'; we update it to 'admin'.
 *
 * Usage:
 *   Set env vars (from .env.local or export):
 *     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *     ADMIN_EMAIL=admin@example.com
 *     ADMIN_PASSWORD=your-secure-password
 *
 *   Then run:
 *     node scripts/create-admin-user.mjs
 *
 *   Or with inline env (Windows PowerShell):
 *     $env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="YourPassword123!"; node scripts/create-admin-user.mjs
 *
 *   Or (Unix):
 *     ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="YourPassword123!" node scripts/create-admin-user.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env.local if present (simple key=value parser, no quotes handling for values with =)
function loadEnvLocal() {
  const path = resolve(root, '.env.local');
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@raymakitchenware.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'AdminTest123!';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local or the environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Creating admin user:', adminEmail);

  // 1) Create auth user (trigger will create profile with role 'customer')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message && authError.message.includes('already been registered')) {
      console.log('User already exists. Updating profile to admin...');
      const { data: existing } = await supabase.auth.admin.listUsers();
      const user = existing?.users?.find((u) => u.email === adminEmail);
      if (!user) {
        console.error('Could not find existing user by email.');
        process.exit(1);
      }
      await setProfileAdmin(supabase, user.id);
      console.log('Done. Profile role set to admin. You can log in at /admin/login with:', adminEmail);
      return;
    }
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  const userId = authData?.user?.id;
  if (!userId) {
    console.error('No user id returned');
    process.exit(1);
  }

  // 2) Set profile role to admin (trigger created profile with 'customer')
  await setProfileAdmin(supabase, userId);

  console.log('Admin user created successfully.');
  console.log('  Email:', adminEmail);
  console.log('  Password: (the one you set in ADMIN_PASSWORD or default)');
  console.log('  Log in at: /admin/login');
}

async function setProfileAdmin(supabase, userId) {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (profileError) {
    console.error('Failed to set profile role:', profileError.message);
    process.exit(1);
  }
}

main();
