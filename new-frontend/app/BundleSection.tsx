import Link from 'next/link';
import Image from 'next/image';

export default function BundleSection() {
  return (
    <section className="relative py-24 bg-[#faf9f6] overflow-hidden">
      {/* Background Texture/Gradient */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Content */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8860B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B8860B]"></span>
              </span>
              <span className="text-[#B8860B] text-xs font-bold tracking-[0.2em] uppercase">Limited Edition Bundle</span>
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-neutral-900 leading-[1.1] mb-6">
                The Ultimate <span className="text-[#B8860B] italic">Chef's Collection</span>
              </h2>

              <p className="text-lg text-neutral-600 leading-relaxed max-w-xl font-light">
                Elevate your culinary craft with our masterfully curated 12-piece set. Engineered with professional tri-ply stainless steel for precision heat control and finished with our signature elegant accents.
              </p>
            </div>

            <div className="space-y-5">
              {[
                "Professional-grade tri-ply construction",
                "12 essential pieces for diverse cooking styles",
                "Compatible with induction, gas, and electric",
                "Lifetime durability warranty included"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#B8860B]/10 flex items-center justify-center group-hover:bg-[#B8860B]/20 transition-all duration-300 border border-[#B8860B]/20 group-hover:border-[#B8860B]/30">
                    <i className="ri-check-line text-[#B8860B] text-xl" />
                  </div>
                  <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors font-light text-lg">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 flex flex-wrap gap-5">
              <Link
                href="/shop"
                className="px-10 py-5 bg-[#B8860B] text-white rounded-full font-bold hover:bg-[#8B6914] transition-all shadow-[0_0_20px_-5px_rgba(184,134,11,0.3)] hover:shadow-[0_0_30px_-5px_rgba(184,134,11,0.5)] flex items-center gap-3 group"
              >
                Shop the Collection <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="px-10 py-5 bg-transparent border border-neutral-300 text-neutral-800 rounded-full font-bold hover:bg-neutral-100 transition-all hover:border-neutral-400"
              >
                View Details
              </Link>
            </div>
          </div>

          {/* Image Composition */}
          <div className="relative isolate group">
            {/* Decorative Background Glow */}
            <div className="absolute -inset-4 bg-[#B8860B]/10 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />

            <div className="relative aspect-square rounded-3xl overflow-hidden border border-neutral-200 shadow-2xl bg-white">
              <Image
                src="/hero-2.jpeg"
                alt="Premium Cookware Set"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Floating Overlay Card */}
              <div className="absolute bottom-8 right-8 bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl transform transition-transform duration-500 group-hover:-translate-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-[#B8860B] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Save 25%</span>
                  <span className="text-neutral-400 text-sm line-through decoration-neutral-400 decoration-1">GH₵599.00</span>
                </div>
                <p className="text-4xl font-serif text-neutral-900 font-bold">GH₵299<span className="text-lg text-neutral-500 font-sans font-normal">.00</span></p>
                <p className="text-neutral-500 text-xs mt-2 font-light">Free Shipping Included</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
