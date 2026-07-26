import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('cms_content')
      .select('*')
      .eq('section', 'value_props')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Storefront API] Value props error:', error);
      return NextResponse.json({ error: 'Failed to fetch value props' }, { status: 500 });
    }

    return NextResponse.json(data || [], {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    });
  } catch (err: any) {
    console.error('[Storefront API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
