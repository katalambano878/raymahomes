'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import PageHero from '@/components/PageHero';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SITE_LOGO_PATH } from '@/lib/site';

export default function AboutPage() {
  usePageTitle('About Us');
  const { getSetting } = useCMS();
  const [activeTab, setActiveTab] = useState<'story' | 'mission'>('story');

  const values = [
    { icon: 'ri-verified-badge-line', title: 'Premium Quality', description: 'We stock only premium U.S. and European home electrical appliances and kitchenware. Every product is selected for durability and value.' },
    { icon: 'ri-home-heart-line', title: 'Transform Your Kitchen', description: 'From cookware and small appliances to storage and organisation — we help you create a kitchen you love.' },
    { icon: 'ri-global-line', title: 'Trusted Brands', description: 'Trusted dealers in internationally sourced kitchen appliances and kitchenware. Quality you can rely on.' },
    { icon: 'ri-map-pin-line', title: 'Visit Us in Accra', description: 'Based at Kojo Thompson Rd 8, Accra. Open Mon–Sat 8am–5pm. Come browse or reach us on WhatsApp.' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <PageHero
        title="About Rayma Kitchenware"
        subtitle="Trusted dealers in premium kitchen appliances and kitchenware. Kitchen Boss! — Kojo Thompson Rd 8, Accra, Ghana."
        backgroundImage="/hero-6.jpeg"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Tab bar — solid gold active state */}
        <div className="flex border-b-2 border-neutral-200 mb-14 justify-center gap-0">
          <button
            onClick={() => setActiveTab('story')}
            className={`px-6 py-4 font-semibold text-lg cursor-pointer border-b-4 -mb-0.5 transition-colors ${activeTab === 'story' ? 'text-brand border-brand' : 'text-neutral-500 border-transparent hover:text-neutral-800'}`}
          >
            Our Story
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-6 py-4 font-semibold text-lg cursor-pointer border-b-4 -mb-0.5 transition-colors ${activeTab === 'mission' ? 'text-brand border-brand' : 'text-neutral-500 border-transparent hover:text-neutral-800'}`}
          >
            Our Mission
          </button>
        </div>

        {activeTab === 'story' && (
          <div className="grid md:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 mb-8">How It All Started</h2>
              <div className="space-y-6 text-lg text-neutral-600 leading-relaxed">
                <p>
                  <strong className="text-neutral-900">Rayma Kitchenware</strong> is your trusted dealer in premium U.S. and European home electrical appliances, kitchen appliances, and kitchenware. We started with a simple mission: bring quality kitchen and home products to Accra and Ghana at fair prices.
                </p>
                <p>
                  What began as a small operation has grown into a go-to destination for anyone who wants to upgrade their kitchen. We offer everything from premium cookware and small appliances to storage solutions and kitchen essentials — all selected for quality and value.
                </p>
                <p>
                  Whether you are kitting out a new home, replacing old appliances, or looking for the perfect gift, <strong className="text-neutral-900">Rayma Kitchenware</strong> has you covered. Visit us at <strong className="text-neutral-900">Kojo Thompson Rd 8, Accra</strong>, or reach us on WhatsApp. We are here to help you transform your kitchen — <strong className="text-brand">Kitchen Boss!</strong>
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-200 relative flex items-center justify-center">
                <img src={SITE_LOGO_PATH} alt="Rayma Kitchenware" className="w-2/3 h-auto object-contain opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-8">
                  <p className="text-white font-bold text-xl">Rayma Kitchenware</p>
                  <p className="text-brand font-semibold">Kitchen Boss!</p>
                </div>
              </div>
              <div className="absolute -z-10 top-6 -right-6 w-full h-full border-4 border-brand rounded-2xl hidden md:block" />
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-brand/10 p-10 rounded-2xl border-2 border-brand">
              <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mb-8">
                <i className="ri-home-gear-line text-3xl text-white" />
              </div>
              <h3 className="font-serif text-3xl font-bold text-neutral-900 mb-4">Premium Kitchen & Home</h3>
              <p className="text-neutral-600 text-lg leading-relaxed">
                We focus on premium quality kitchenware and home electrical appliances. Our range includes trusted U.S. and European brands and carefully selected products that last.
              </p>
            </div>
            <div className="bg-neutral-800 p-10 rounded-2xl border-2 border-neutral-700">
              <div className="w-16 h-16 bg-neutral-700 rounded-2xl flex items-center justify-center mb-8">
                <i className="ri-hand-heart-line text-3xl text-white" />
              </div>
              <h3 className="font-serif text-3xl font-bold text-white mb-4">Customer First</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                We are here to help you choose the right products. Visit our store at Kojo Thompson Rd 8, Accra, or message us on WhatsApp. Friendly service and honest advice — that is the Kitchen Boss way.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Why us — solid blocks */}
      <div className="bg-white py-20 border-y-2 border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900 mb-3">Why Shop With Us?</h2>
            <p className="text-lg text-neutral-600 max-w-xl mx-auto">Trusted by customers across Accra and Ghana for premium kitchenware and home appliances.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-[#faf9f6] p-8 rounded-2xl border-2 border-neutral-100 hover:border-brand/40 transition-colors">
                <div className="w-14 h-14 bg-brand rounded-xl flex items-center justify-center mb-6">
                  <i className={`${value.icon} text-2xl text-white`} />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{value.title}</h3>
                <p className="text-neutral-600 leading-relaxed text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA — solid dark, solid gold button */}
      <div className="bg-[#0c0c0c] py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Ready to transform your kitchen?</h2>
          <p className="text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
            Explore our premium kitchenware and home electrical appliances. Visit us at Kojo Thompson Rd 8, Accra, or shop online.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 bg-brand text-[#0c0c0c] px-10 py-5 rounded-full font-bold text-lg hover:bg-brand-light transition-colors"
          >
            Shop Now
            <i className="ri-arrow-right-line" />
          </Link>
        </div>
      </div>
    </div>
  );
}
