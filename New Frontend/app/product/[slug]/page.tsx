import { getProduct } from '@/lib/services/products';
import { products } from '@/data/products';
import ProductDetailContent from './ProductDetailContent';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailContent product={product} />;
}
