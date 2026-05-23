'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const ICON_MAP: Record<string, string> = {
  pots: 'ri-restaurant-line', pans: 'ri-restaurant-2-line', utensils: 'ri-knife-line',
  knives: 'ri-scissors-cut-line', accessories: 'ri-tools-line', sets: 'ri-stack-line',
  cookware: 'ri-restaurant-line', bakeware: 'ri-cake-line', storage: 'ri-archive-line',
};

export default function CategoryChips() {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/storefront/categories')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category) => {
            const iconKey = (category.slug || category.name || '').toLowerCase();
            const icon = ICON_MAP[iconKey] || 'ri-apps-line';
            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug || category.name}`}
                className="flex items-center gap-2 bg-white px-6 py-3 rounded-full border border-gray-200 whitespace-nowrap shadow-sm transition-all duration-200 hover:border-brand hover:text-brand hover:-translate-y-0.5 hover:shadow-md"
              >
                <i className={`${icon} text-lg w-5 h-5 flex items-center justify-center`}></i>
                <span className="font-medium">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
