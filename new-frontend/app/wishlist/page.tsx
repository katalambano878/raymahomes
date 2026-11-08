'use client';

import Link from 'next/link';
import { useWishlist } from '@/lib/context/WishlistContext';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <i className="ri-heart-line text-6xl text-gray-300 mb-4 w-16 h-16 flex items-center justify-center mx-auto"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save your favorite items for later</p>
            <Link
              href="/shop"
              className="inline-block bg-[#2C3E50] text-white px-8 py-3 rounded-lg hover:bg-[#B87333] transition-colors whitespace-nowrap"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600 mb-8">{items.length} items</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
