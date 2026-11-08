import { Product, Review } from '@/lib/types';

function mapProduct(p: any): Product {
  const variants = p.product_variants || [];
  const hasVariants = variants.length > 0;
  const minVariantPrice = hasVariants ? Math.min(...variants.map((v: any) => v.price ?? p.price)) : undefined;
  const cat = p.categories;
  const categoryName = Array.isArray(cat) ? (cat[0]?.name || '') : (cat?.name || '');
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: categoryName,
    price: p.price,
    originalPrice: p.compare_at_price,
    rating: p.rating_avg || 0,
    reviewCount: p.review_count || 0,
    image: p.product_images?.[0]?.url || 'https://via.placeholder.com/800x800?text=No+Image',
    images: (p.product_images || []).map((i: any) => i.url),
    description: p.description || '',
    inStock: (p.quantity || 0) > 0,
    badge: p.featured ? 'Featured' : (p.compare_at_price && p.compare_at_price > p.price ? 'Sale' : undefined),
  };
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch('/api/storefront/products?limit=100');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map(mapProduct) : [];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const res = await fetch('/api/storefront/products?limit=200');
  if (!res.ok) return null;
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  const found = arr.find((p: any) => p.slug === slug);
  return found ? mapProduct(found) : null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const res = await fetch('/api/storefront/products?featured=true&limit=8');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map(mapProduct) : [];
}

export async function getBestSellers(): Promise<Product[]> {
  const res = await fetch('/api/storefront/products?limit=8');
  if (!res.ok) return [];
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  const sorted = [...arr].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0));
  return sorted.slice(0, 8).map(mapProduct);
}

export async function getNewArrivals(): Promise<Product[]> {
  const res = await fetch('/api/storefront/products?limit=8');
  if (!res.ok) return [];
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  return arr.slice(0, 8).map(mapProduct);
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  const res = await fetch(`/api/storefront/reviews?limit=20&productId=${encodeURIComponent(productId)}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((r: any) => ({
    id: r.id,
    productId: r.productId || productId,
    author: r.author || r.name || 'Customer',
    rating: r.rating || 5,
    date: r.created_at || new Date().toISOString(),
    title: r.title || '',
    content: r.content || '',
    verified: true,
  }));
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch('/api/storefront/categories');
  if (!res.ok) return [];
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  return arr.map((c: any) => c.name).filter(Boolean);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const res = await fetch('/api/storefront/products?limit=50');
  if (!res.ok) return [];
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  const q = query.toLowerCase();
  const filtered = arr.filter(
    (p: any) =>
      (p.name || '').toLowerCase().includes(q) ||
      ((p.categories?.[0]?.name || p.categories?.name || '')).toLowerCase().includes(q)
  );
  return filtered.map(mapProduct);
}
