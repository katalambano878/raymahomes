import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_number, email } = body;
    if (!order_number || !email) {
      return NextResponse.json({ error: 'Order number and email required' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        status,
        payment_status,
        total,
        created_at,
        shipping_address,
        metadata,
        order_items (
          id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          total_price,
          metadata,
          products (
            product_images (url)
          )
        )
      `)
      .eq('order_number', String(order_number).trim())
      .ilike('email', String(email).trim().toLowerCase())
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const items = (order.order_items || []).map((oi: {
      id: number;
      product_name?: string | null;
      variant_name?: string | null;
      unit_price?: number | string | null;
      total_price?: number | string | null;
      quantity?: number | null;
    }) => ({
      id: oi.id,
      name: oi.product_name || oi.variant_name || 'Item',
      price: parseFloat(String(oi.unit_price || oi.total_price || 0)),
      quantity: oi.quantity,
      image: null,
      returnable: true,
    }));

    return NextResponse.json({
      id: order.order_number,
      date: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : '',
      items,
      order,
    });
  } catch (err: any) {
    console.error('[Orders lookup]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
