'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';
import { getProducts, getCategories } from '@/lib/services/products';
import { Suspense } from 'react';

function ShopContentInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState('best-selling');

  useEffect(() => {
    Promise.all([getProducts(), getCategories()]).then(([productsData, categoriesData]) => {
      setProducts(productsData);
      setFilteredProducts(productsData);
      setCategories(['All', ...categoriesData]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && categories.includes(category)) {
      setSelectedCategory(category);
    }
  }, [searchParams, categories]);

  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.badge === 'New Arrival' ? 1 : 0) - (a.badge === 'New Arrival' ? 1 : 0));
        break;
      case 'top-rated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, priceRange, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 bg-white rounded-lg animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-96 bg-white rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shop All Products</h1>
          <p className="text-gray-600">{filteredProducts.length} products</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-[#B87333] text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B87333] pr-8 text-base"
              >
                <option value="best-selling">Best Selling</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="top-rated">Top Rated</option>
              </select>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <i className="ri-search-line text-6xl text-gray-300 mb-4 w-16 h-16 flex items-center justify-center mx-auto"></i>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopContent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <ShopContentInner />
    </Suspense>
  );
}
