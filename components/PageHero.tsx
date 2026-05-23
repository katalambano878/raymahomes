import React from 'react';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
}

export default function PageHero({ title, subtitle, backgroundImage }: PageHeroProps) {
  return (
    <div className="relative bg-[#0c0c0c] overflow-hidden min-h-[400px] flex items-center justify-center">
      {backgroundImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] animate-fade-in"
            style={{ backgroundImage: `url('${backgroundImage}')` }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          </div>
          <div className="absolute inset-0 bg-brand/5" />
        </>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center z-10">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
