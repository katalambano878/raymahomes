import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '6');
  const productId = searchParams.get('productId');

  try {
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        content,
        created_at,
        products(name)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;

    if (error) {
      console.error('[Storefront API] Reviews error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    const items = (data || []).map((r: any) => (productId ? {
      id: r.id,
      productId: r.product_id,
      name: 'Customer',
      author: 'Customer',
      role: 'Verified Buyer',
      content: r.content || r.title || '',
      title: r.title || '',
      rating: r.rating || 5,
      created_at: r.created_at,
      productName: r.products?.name,
    } : {
      id: r.id,
      name: 'Customer',
      role: 'Verified Buyer',
      content: r.content || r.title || '',
      rating: r.rating || 5,
      productName: r.products?.name,
    }));

    return NextResponse.json(items, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    });
  } catch (err: any) {
    console.error('[Storefront API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
