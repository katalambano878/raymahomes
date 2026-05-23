'use client';

import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useState } from 'react';

export default function Header() {
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="bg-[#2C3E50] text-white text-center py-2 text-sm">
        Free shipping on orders over $150 | Use code WELCOME10 for 10% off your first order
      </div>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center">
              <img 
                src="https://public.readdy.ai/ai/img_res/8ba17951-a11c-45f6-b28c-8db98f61d94b.png" 
                alt="Logo" 
                className="h-12 w-auto"
              />
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-[#B87333] transition-colors whitespace-nowrap">
                Home
              </Link>
              <Link href="/shop" className="text-gray-700 hover:text-[#B87333] transition-colors whitespace-nowrap">
                Shop
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-[#B87333] transition-colors whitespace-nowrap">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-[#B87333] transition-colors whitespace-nowrap">
                Contact
              </Link>
            </nav>

            <div className="flex items-center space-x-6">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-gray-700 hover:text-[#B87333] transition-colors w-6 h-6 flex items-center justify-center"
              >
                <i className="ri-search-line text-xl"></i>
              </button>

              <Link
                href="/wishlist"
                className="text-gray-700 hover:text-[#B87333] transition-colors relative w-6 h-6 flex items-center justify-center"
              >
                <i className="ri-heart-line text-xl"></i>
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#B87333] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="text-gray-700 hover:text-[#B87333] transition-colors relative w-6 h-6 flex items-center justify-center"
              >
                <i className="ri-shopping-cart-line text-xl"></i>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#B87333] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B87333] text-base"
                  autoFocus
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 flex items-center justify-center">
                  <i className="ri-search-line text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
