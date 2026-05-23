import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_number, email } = body;
    if (!order_number || !email) {
      return NextResponse.json({ error: 'Order number and email required' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        status,
        total,
        created_at,
        order_items (
          id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('order_number', String(order_number).trim())
      .ilike('email', String(email).trim().toLowerCase())
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const items = (order.order_items || []).map((oi: any) => ({
      id: oi.id,
      name: oi.product_name || oi.variant_name || 'Item',
      price: parseFloat(oi.unit_price || oi.total_price || 0),
      quantity: oi.quantity,
      image: null,
      returnable: true,
    }));

    return NextResponse.json({
      id: order.order_number,
      date: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : '',
      items,
    });
  } catch (err: any) {
    console.error('[Orders lookup]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
