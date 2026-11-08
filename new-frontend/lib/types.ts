export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  description: string;
  features?: string[];
  material?: string;
  size?: string;
  heatSource?: string[];
  inStock: boolean;
  badge?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  size: string;
  price: number;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
}

export interface WishlistItem {
  product: Product;
}
