'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type Slide = {
  image: string;
  title: string;
  subtitle: string;
  alt?: string;
  button_text?: string;
  button_url?: string;
};

const DEFAULT_SLIDE: Slide = {
  image: '/hero-1.png',
  title: 'Culinary Excellence',
  subtitle: 'Equip your kitchen with tools that inspire masterpiece creations.',
  alt: 'Premium Kitchenware Collection',
};

export default function Hero() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/storefront/banners?position=hero')
      .then((res) => res.ok ? res.json() : [])
      .then((data: any[]) => {
        const mapped = data.map((b) => ({
          image: b.image_url || '/hero-1.png',
          title: b.title || 'Shop Our Collection',
          subtitle: b.subtitle || '',
          alt: b.title || 'Banner',
          button_text: b.button_text,
          button_url: b.button_url,
        }));
        setSlides(mapped.length > 0 ? mapped : [DEFAULT_SLIDE]);
      })
      .catch(() => setSlides([DEFAULT_SLIDE]))
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.max(slides.length, 1));
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (isAutoPlaying && slides.length > 0) {
      slideInterval.current = setInterval(nextSlide, 6000);
    }
    return () => { if (slideInterval.current) clearInterval(slideInterval.current); };
  }, [isAutoPlaying, slides.length]);

  const displaySlides = slides.length > 0 ? slides : [DEFAULT_SLIDE];

  if (loading) {
    return (
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#050505] text-white">
      {/* Background Slides */}
      {displaySlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          {/* Ken Burns Effect Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out will-change-transform"
            style={{
              backgroundImage: `url('${slide.image}')`,
              transform: index === currentSlide ? 'scale(1.1)' : 'scale(1)'
            }}
            aria-label={slide.alt || slide.title}
          />

          {/* Cinematic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content Container */}
      <div className="relative z-20 h-full max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col justify-center">
        {displaySlides.map((slide, index) => (
          index === currentSlide && (
            <div
              key={index}
              className="max-w-4xl mx-auto text-center space-y-8"
            >
              {/* Animated Text Block */}
              <div className="overflow-hidden">
                <span className="inline-block text-[#B8860B] font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Rayma Kitchenware
                </span>
              </div>

              <div className="overflow-hidden">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-serif leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  {slide.title}
                </h1>
              </div>

              <div className="overflow-hidden">
                <p className="text-lg md:text-2xl text-white/80 font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {slide.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-5 pt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Link
                  href={slide.button_url || '/shop'}
                  className="group relative px-10 py-5 bg-[#B8860B] text-white rounded-full font-bold overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(184,134,11,0.6)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {slide.button_text || 'Shop Collection'} <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </Link>
                <Link
                  href="/about"
                  className="group px-10 py-5 bg-white/5 backdrop-blur-sm border border-white/20 text-white rounded-full font-bold transition-all hover:bg-white/10 hover:border-white/40 flex items-center gap-2"
                >
                  Our Story
                </Link>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 left-0 right-0 z-30 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">

          {/* Scroll Indicator */}
          <div className="hidden md:flex flex-col items-center gap-2 text-white/50 text-xs tracking-widest uppercase animate-bounce-slow">
            <span>Scroll</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
          </div>

          {/* Slide Indicators */}
          <div className="flex gap-4 items-center">
            {displaySlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="group relative py-4 outline-none"
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className={`block h-[3px] transition-all duration-500 rounded-full ${index === currentSlide
                  ? 'w-12 bg-[#B8860B]'
                  : 'w-6 bg-white/30 group-hover:bg-white/60'
                  }`} />
                {index === currentSlide && (
                  <span className="absolute -top-4 left-0 text-xs font-bold text-[#B8860B] animate-fade-in">
                    0{index + 1}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Arrows */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => {
                setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
                setIsAutoPlaying(false);
              }}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              <i className="ri-arrow-left-line text-lg" />
            </button>
            <button
              onClick={() => {
                nextSlide();
                setIsAutoPlaying(false);
              }}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              <i className="ri-arrow-right-line text-lg" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
