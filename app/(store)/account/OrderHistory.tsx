'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { money, asNumber } from '@/lib/format-money';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';

interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  image: string;
  quantity: number;
  price: number;
  variant?: string | null;
  slug?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const { addToCart, setIsCartOpen } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        if (session.user.email) setUserEmail(session.user.email);

        const { data, error } = await supabase
          .from('orders')
          .select(`*, order_items (*)`)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedOrders = data.map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number,
            email: order.email || session.user.email || '',
            date: order.created_at,
            status: order.status,
            total: asNumber(order.total),
            items: order.order_items.map((item: any) => ({
              id: item.id,
              productId: item.product_id || null,
              name: item.product_name,
              image: item.metadata?.image || '/placeholder-product.svg',
              quantity: item.quantity,
              price: asNumber(item.unit_price),
              variant: item.variant_name || null,
              slug: item.metadata?.slug || '',
            })),
          }));
          setOrders(formattedOrders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  const handleReorder = async (order: Order) => {
    setReorderingId(order.id);
    try {
      let added = 0;
      for (const item of order.items) {
        if (!item.productId) continue;
        const { data: product, error } = await supabase
          .from('products')
          .select('id, slug, name, price, quantity, moq, status, product_images(url)')
          .eq('id', item.productId)
          .single();
        if (error || !product) continue;
        if (product.status === 'archived' || product.status === 'draft') continue;

        const stock = asNumber(product.quantity);
        const images = (product as { product_images?: { url: string }[] }).product_images;
        const image =
          images?.[0]?.url ||
          item.image ||
          '/placeholder-product.svg';

        addToCart({
          id: product.id,
          name: product.name || item.name,
          price: asNumber(product.price, item.price),
          image,
          quantity: Math.max(1, item.quantity),
          variant: item.variant || undefined,
          slug: product.slug || item.slug || product.id,
          maxStock: Math.max(1, stock || item.quantity || 1),
          moq: asNumber(product.moq, 1) || 1,
        });
        added += 1;
      }

      if (added === 0) {
        window.alert('None of the items from this order are available to reorder right now.');
        return;
      }
      setIsCartOpen(true);
      router.push('/cart');
    } finally {
      setReorderingId(null);
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    router.push(`/account/invoice/${orderId}?print=true`);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <i className="ri-loader-4-line animate-spin text-3xl text-[#B8860B]" />
        <p className="mt-2 text-neutral-400">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-neutral-200 rounded-2xl">
        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-shopping-bag-3-line text-3xl text-neutral-300" />
        </div>
        <h3 className="text-xl font-serif text-[#050505] mb-2">No orders yet</h3>
        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
          Start building your collection of premium appliances.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-[#050505] text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-[#B8860B] transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl text-[#050505] mb-1">Order History</h2>
          <p className="text-neutral-500">Track and manage your recent purchases.</p>
        </div>
        <div className="text-sm font-bold uppercase tracking-widest text-[#B8860B]">
          {orders.length} Orders
        </div>
      </div>

      <div className="space-y-8">
        {orders.map((order) => {
          const trackEmail = order.email || userEmail;
          const trackHref = `/order-tracking?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(trackEmail)}`;
          const helpHref = `/contact?order=${encodeURIComponent(order.orderNumber)}&subject=${encodeURIComponent(`Help with order ${order.orderNumber}`)}`;

          return (
          <div key={order.id} className="border border-neutral-200 rounded-2xl overflow-hidden hover:border-[#B8860B]/30 transition-colors">
            {/* Order Header */}
            <div className="bg-neutral-50/50 px-6 py-4 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Order Placed</p>
                    <p className="text-sm font-semibold text-[#050505]">
                      {new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Total</p>
                    <p className="text-sm font-serif text-[#050505]">GH₵ {money(order.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Order #</p>
                    <p className="text-sm font-mono text-neutral-600">{order.orderNumber}</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                    {order.status === 'shipped' ? 'Packaged' : order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <div className="space-y-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-24 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif text-lg text-[#050505] mb-1">{item.name}</h4>
                          <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-[#050505]">GH₵ {money(item.price)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap gap-3">
                <Link
                  href={trackHref}
                  className="px-6 py-2.5 bg-[#050505] text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors"
                >
                  Track Order
                </Link>
                <button
                  type="button"
                  onClick={() => handleReorder(order)}
                  disabled={reorderingId === order.id}
                  className="px-6 py-2.5 border border-neutral-200 text-[#050505] rounded-full text-sm font-bold uppercase tracking-wider hover:border-[#050505] transition-colors disabled:opacity-50"
                >
                  {reorderingId === order.id ? 'Adding…' : 'Buy Again'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(order.id)}
                  className="px-6 py-2.5 text-neutral-500 hover:text-[#050505] text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  Invoice
                </button>
                <Link
                  href={helpHref}
                  className="px-6 py-2.5 border border-neutral-200 text-[#050505] rounded-full text-sm font-bold uppercase tracking-wider hover:border-[#050505] transition-colors"
                >
                  Get Help
                </Link>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
