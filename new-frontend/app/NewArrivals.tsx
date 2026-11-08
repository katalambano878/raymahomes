'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';
import { getNewArrivals } from '@/lib/services/products';
import Link from 'next/link';

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getNewArrivals().then(setProducts);
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">New Arrivals</h2>
            <p className="text-lg text-gray-600">Discover our latest additions</p>
          </div>
          <Link 
            href="/shop" 
            className="text-[#B87333] hover:text-[#2C3E50] font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            View All
            <i className="ri-arrow-right-line w-5 h-5 flex items-center justify-center"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
