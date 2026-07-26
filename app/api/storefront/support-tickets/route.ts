import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, ticket_number, subject, category, status, priority, created_at, updated_at')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Support tickets]', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    const tickets = (data || []).map((t: any) => ({
      id: `TKT-${String(t.ticket_number).padStart(4, '0')}`,
      ticketId: t.id,
      subject: t.subject,
      category: t.category || 'General',
      priority: t.priority || 'medium',
      status: t.status || 'open',
      created: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '',
      lastUpdate: t.updated_at ? new Date(t.updated_at).toISOString().split('T')[0] : '',
      messages: 0,
    }));

    return NextResponse.json(tickets);
  } catch (err: any) {
    console.error('[Support tickets]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
