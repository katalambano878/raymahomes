import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import PageHero from '@/components/PageHero';

export const revalidate = 0;

export default async function CategoriesPage() {
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, position')
    .eq('status', 'active')
    .order('position', { ascending: true });

  const categories = (categoriesData || []).map((c) => ({
    ...c,
    image: c.image_url || `https://via.placeholder.com/600x400?text=${encodeURIComponent(c.name)}`,
  }));

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        title="Category"
        subtitle="Premium appliances and essentials, curated for your home."
        backgroundImage="/hero-5.jpeg"
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={`group relative overflow-hidden bg-neutral-100 ${index % 4 === 0 || index % 4 === 3 ? 'md:col-span-2' : ''
                  }`}
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                {/* Border Effect */}
                <div className="absolute inset-4 border border-white/20 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500" />

                <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full">
                  <div className="overflow-hidden">
                    <span className="text-[#B8860B] font-bold text-xs uppercase tracking-[0.2em] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 block mb-2">
                      Collection
                    </span>
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl text-white mb-2 transform transition-transform duration-500 group-hover:-translate-y-1">
                    {category.name}
                  </h3>
                  <div className="w-12 h-px bg-white/50 group-hover:w-24 group-hover:bg-[#B8860B] transition-all duration-500 mb-4" />
                  <p className="text-white/70 text-sm max-w-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                    {category.description || 'Explore premium products in this collection.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-neutral-200 rounded-3xl">
            <i className="ri-search-line text-6xl text-neutral-300 mb-6" />
            <h3 className="text-2xl font-serif text-neutral-900 mb-2">No collections found</h3>
            <Link href="/shop" className="text-[#B8860B] font-semibold hover:underline">
              Browse All Products
            </Link>
          </div>
        )}
      </div>

      {/* Mini CTA */}
      <div className="bg-[#faf9f6] border-t border-neutral-200 py-16 text-center">
        <p className="text-neutral-500 text-sm uppercase tracking-widest mb-4">Need Assistance?</p>
        <Link href="/contact" className="font-serif text-3xl md:text-4xl text-[#050505] hover:text-[#B8860B] transition-colors">
          Contact Our Concierge
        </Link>
      </div>
    </div>
  );
}
