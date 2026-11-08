'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; image_url?: string; metadata?: { subtitle?: string } }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/storefront/categories')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const featured = list.filter((c: any) => c.metadata?.featured).slice(0, 4);
        setCategories(featured.length >= 4 ? featured : list.slice(0, 4));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-serif">Shop by Category</h2>
            <p className="text-base text-gray-500 font-light max-w-xl">Loading categories...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-serif">Shop by Category</h2>
            <p className="text-base text-gray-500 font-light max-w-xl">
              Curated collections designed to elevate your culinary experience.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 text-brand text-sm font-bold uppercase tracking-widest hover:text-brand-dark transition-colors"
          >
            View All Categories <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug || category.name}`}
              className="group relative block w-full aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <div className="absolute inset-0">
                <img
                  src={category.image_url || `https://via.placeholder.com/800x800?text=${encodeURIComponent(category.name)}`}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/90" />
              </div>
              <div className="relative h-full p-6 flex flex-col justify-end z-10">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {(category.metadata?.subtitle) && (
                    <span className="inline-block px-2 py-0.5 mb-2 text-[10px] uppercase font-bold text-white bg-brand rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-y-2 group-hover:translate-y-0">
                      {category.metadata.subtitle}
                    </span>
                  )}
                  <div className="flex justify-between items-end">
                    <h3 className="text-2xl font-bold text-white font-serif tracking-wide drop-shadow-md leading-none">
                      {category.name}
                    </h3>
                    <div className="h-8 w-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 origin-bottom-right shadow-sm">
                      <i className="ri-arrow-right-up-line text-lg text-black"></i>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 md:hidden text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 text-brand font-bold uppercase tracking-widest hover:text-brand-dark transition-colors">
            View All Categories <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
