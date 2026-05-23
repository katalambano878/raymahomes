import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const DEFAULT_ADMIN_EMAIL = 'admin@raymakitchenware.com';
const DEFAULT_ADMIN_PASSWORD = 'AdminTest123!';

function checkSecret(request: Request): boolean {
  const secret = process.env.CREATE_ADMIN_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('secret') === secret) return true;
  } catch {}
  return false;
}

/**
 * GET: create admin by visiting with ?secret=YOUR_CREATE_ADMIN_SECRET
 * POST: same with Authorization: Bearer <secret> and optional JSON body { email, password }
 */
export async function GET(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return createAdmin(
    process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  );
}

export async function POST(request: Request) {
  try {
    if (!checkSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { email?: string; password?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const email = body.email || process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
    const password = body.password || process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password. Send JSON body: { "email", "password" }.' },
        { status: 400 }
      );
    }

    return createAdmin(email, password);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

async function createAdmin(
  email: string,
  password: string
): Promise<NextResponse> {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const user = list?.users?.find((u) => u.email === email);
      if (user) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);
        if (profileError) {
          return NextResponse.json(
            { error: 'User exists but failed to set admin role: ' + profileError.message },
            { status: 500 }
          );
        }
        return NextResponse.json({
          message: 'User already exists; profile updated to admin.',
          email,
          loginUrl: '/admin/login',
        });
      }
    }
    return NextResponse.json(
      { error: 'Auth error: ' + authError.message },
      { status: 400 }
    );
  }

  const userId = authData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User created but no id returned' }, { status: 500 });
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (profileError) {
    return NextResponse.json(
      { error: 'Profile update failed: ' + profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Admin user created.',
    email,
    loginUrl: '/admin/login',
  });
}
