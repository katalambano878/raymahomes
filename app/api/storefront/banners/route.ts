import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('position') || 'hero';

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .eq('position', position)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Storefront API] Banners error:', error);
      return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }

    return NextResponse.json(data || [], {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err: any) {
    console.error('[Storefront API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
