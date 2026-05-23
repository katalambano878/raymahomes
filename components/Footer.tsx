'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import { SITE_LOGO_WHITE_PATH } from '@/lib/site';

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 lg:border-none last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 text-left lg:py-0 lg:cursor-default lg:mb-6"
      >
        <h4 className="font-serif text-lg font-medium text-white tracking-wide">{title}</h4>
        <i className={`ri-arrow-down-s-line text-[#B8860B] text-xl transition-transform lg:hidden ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0 lg:max-h-full lg:overflow-visible'}`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const { getSetting } = useCMS();

  const siteName = getSetting('site_name') || 'Rayma Kitchenware';
  const siteTagline = getSetting('site_tagline') || 'Trusted dealers in premium kitchen appliances and kitchenware. Kitchen Boss!';
  const contactPhone = getSetting('contact_phone') || '0554081190';
  const socialInstagram = getSetting('social_instagram') || 'https://www.instagram.com/raymakitchenware';
  const socialTiktok = getSetting('social_tiktok') || 'https://www.tiktok.com/@thekitchenbosss';
  const socialSnapchat = getSetting('social_snapchat') || 'https://www.snapchat.com/add/raymabackup';
  const socialTwitter = getSetting('social_twitter') || '';
  const socialFacebook = getSetting('social_facebook') || '';
  const socialYoutube = getSetting('social_youtube') || '';

  const waNumber = contactPhone.startsWith('0') ? '233' + contactPhone.slice(1) : contactPhone.replace(/\D/g, '');

  return (
    <footer className="relative bg-[#050505] text-white pt-24 pb-12 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#B8860B]/50 to-transparent" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="inline-block">
              <img src={SITE_LOGO_WHITE_PATH} alt={siteName} className="h-16 w-auto object-contain" />
            </Link>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm font-light">
              {siteTagline}
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { link: socialInstagram, icon: 'ri-instagram-line', label: 'Instagram' },
                { link: socialTiktok, icon: 'ri-tiktok-fill', label: 'TikTok' },
                { link: socialSnapchat, icon: 'ri-snapchat-fill', label: 'Snapchat' },
              ].filter(s => s.link).map((social, i) => (
                <a
                  key={i}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-[#0c0c0c] hover:bg-[#B8860B] hover:border-[#B8860B] transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <i className={`${social.icon} text-xl transition-transform group-hover:scale-110`} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FooterSection title="Shop">
              <ul className="space-y-4">
                <li><Link href="/shop" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">All Products</Link></li>
                <li><Link href="/categories" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Category</Link></li>
                <li><Link href="/shop?sort=newest" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">New Arrivals</Link></li>
                <li><Link href="/shop?sort=bestsellers" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Best Sellers</Link></li>
              </ul>
            </FooterSection>

            <FooterSection title="Customer Care">
              <ul className="space-y-4">
                <li><Link href="/contact" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Contact Us</Link></li>
                <li><Link href="/order-tracking" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Track Order</Link></li>
                <li><Link href="/shipping" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Shipping & Delivery</Link></li>
                <li><Link href="/returns" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Returns & Exchanges</Link></li>
              </ul>
            </FooterSection>

            <FooterSection title="Legal">
              <ul className="space-y-4">
                <li><Link href="/about" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Our Story</Link></li>
                <li><Link href="/privacy" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-[#B8860B] transition-colors text-sm uppercase tracking-wider">Terms of Service</Link></li>
              </ul>
            </FooterSection>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm font-light">
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-white/40 text-sm font-light uppercase tracking-widest hidden md:inline">Accepted Payments</span>
            <div className="flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity duration-300 [&_img]:h-6 [&_img]:w-auto [&_img]:object-contain">
              <img src="https://cdn.simpleicons.org/visa/FFFFFF" alt="Visa" title="Visa" className="h-6 w-10 object-contain" />
              <img src="https://cdn.simpleicons.org/mastercard/FFFFFF" alt="Mastercard" title="Mastercard" className="h-6 w-10 object-contain" />
              <span title="Mobile Money" className="flex items-center justify-center text-white" aria-label="Mobile Money">
                <i className="ri-smartphone-line text-2xl" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
