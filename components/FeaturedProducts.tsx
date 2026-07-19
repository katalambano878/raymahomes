'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard, { getColorHex, type ColorVariant } from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';

function formatProduct(p: any) {
  const variants = p.product_variants || [];
  const hasVariants = variants.length > 0;
  const minVariantPrice = hasVariants ? Math.min(...variants.map((v: any) => v.price ?? p.price)) : undefined;
  const totalVariantStock = hasVariants ? variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) : 0;
  const effectiveStock = hasVariants ? totalVariantStock : p.quantity;

  const colorVariants: ColorVariant[] = [];
  const seenColors = new Set<string>();
  for (const v of variants) {
    const colorName = v.option2;
    if (colorName && !seenColors.has(colorName.toLowerCase().trim())) {
      const hex = getColorHex(colorName);
      if (hex) {
        seenColors.add(colorName.toLowerCase().trim());
        colorVariants.push({ name: colorName.trim(), hex });
      }
    }
  }

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    originalPrice: p.compare_at_price,
    image: (() => {
      const images = Array.isArray(p.product_images)
        ? [...p.product_images].sort((a: any, b: any) => (a?.position ?? 0) - (b?.position ?? 0))
        : [];
      return images[0]?.url || '/placeholder-product.svg';
    })(),
    rating: p.rating_avg || 0,
    reviewCount: 0,
    badge: p.featured ? 'Featured' : (p.compare_at_price && p.compare_at_price > p.price ? 'Sale' : undefined),
    inStock: effectiveStock > 0,
    maxStock: effectiveStock || 50,
    moq: p.moq || 1,
    hasVariants,
    minVariantPrice,
    colorVariants,
  };
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/storefront/products?featured=true&limit=12', {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProducts(data.map(formatProduct));
          }
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-serif">Featured Products</h2>
            <p className="text-base text-gray-500 font-light max-w-xl">Handpicked favorites from our collection.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-serif">Featured Products</h2>
            <p className="text-base text-gray-500 font-light max-w-xl">
              Handpicked favorites from our collection.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 text-brand text-sm font-bold uppercase tracking-widest hover:text-brand-dark transition-colors"
          >
            View All Products <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-gray-500">
              <p className="text-lg">No featured products at the moment.</p>
              <Link href="/shop" className="inline-flex items-center gap-2 text-brand font-semibold mt-4 hover:underline">
                Browse all products <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 md:hidden text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-brand font-bold uppercase tracking-widest hover:text-brand-dark transition-colors"
          >
            View All Products <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
