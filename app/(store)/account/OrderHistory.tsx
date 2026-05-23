'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: {
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
  }[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

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
            date: order.created_at,
            status: order.status,
            total: order.total,
            items: order.order_items.map((item: any) => ({
              id: item.id,
              name: item.product_name,
              image: item.metadata?.image || 'https://via.placeholder.com/150',
              quantity: item.quantity,
              price: item.unit_price
            }))
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

  const handleReorder = (order: Order) => {
    console.log('Reordering:', order);
    alert('Reorder feature coming soon!');
  };

  const handleDownloadInvoice = (orderId: string) => {
    console.log('Downloading invoice for order:', orderId);
    alert('Invoice download coming soon!');
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
        {orders.map((order) => (
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
                    <p className="text-sm font-serif text-[#050505]">GH₵{order.total.toFixed(2)}</p>
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
                        <p className="text-sm font-medium text-[#050505]">GH₵{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap gap-3">
                <Link
                  href={`/order-tracking?order=${order.orderNumber}`}
                  className="px-6 py-2.5 bg-[#050505] text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors"
                >
                  Track Order
                </Link>
                <button
                  onClick={() => handleReorder(order)}
                  className="px-6 py-2.5 border border-neutral-200 text-[#050505] rounded-full text-sm font-bold uppercase tracking-wider hover:border-[#050505] transition-colors"
                >
                  Buy Again
                </button>
                <button
                  onClick={() => handleDownloadInvoice(order.id)}
                  className="px-6 py-2.5 text-neutral-500 hover:text-[#050505] text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  Invoice
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
