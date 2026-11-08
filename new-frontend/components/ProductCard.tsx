'use client';

import Link from 'next/link';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showToast, setShowToast] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <>
      <Link href={`/product/${product.slug}`} className="group block" data-product-shop>
        <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
          {product.badge && (
            <div className="absolute top-3 left-3 bg-[#B87333] text-white px-3 py-1 rounded-full text-xs font-medium z-10 whitespace-nowrap">
              {product.badge}
            </div>
          )}

          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors z-10"
          >
            <i className={`${inWishlist ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'} text-lg`}></i>
          </button>

          <div className="aspect-square overflow-hidden bg-gray-50">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`${
                      i < Math.floor(product.rating)
                        ? 'ri-star-fill text-yellow-400'
                        : 'ri-star-line text-gray-300'
                    } text-sm`}
                  ></i>
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-2">({product.reviewCount})</span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#B87333] transition-colors">
              {product.name}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                className="w-9 h-9 bg-[#2C3E50] text-white rounded-full flex items-center justify-center hover:bg-[#B87333] transition-colors whitespace-nowrap"
              >
                <i className="ri-shopping-cart-line text-base"></i>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#2C3E50] text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <i className="ri-check-line text-xl"></i>
          <span>Added to cart</span>
        </div>
      )}
    </>
  );
}
