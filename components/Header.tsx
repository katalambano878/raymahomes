'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MiniCart from './MiniCart';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useCMS } from '@/context/CMSContext';
import AnnouncementBar from './AnnouncementBar';
import { SITE_LOGO_PATH } from '@/lib/site';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { getSetting } = useCMS();

  const siteName = getSetting('site_name') || 'Rayma Kitchenware';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  // Wishlist & User Check
  useEffect(() => {
    const updateWishlistCount = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistCount(wishlist.length);
    };
    updateWishlistCount();
    window.addEventListener('wishlistUpdated', updateWishlistCount);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Category', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b border-transparent ${mounted && scrolled
            ? 'bg-[#050505]/90 backdrop-blur-md py-3 shadow-lg'
            : 'bg-[#050505] py-5 lg:py-6'
          }`}
      >
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* 1. Left: Logo (Restored Position) */}
            <div className="flex-shrink-0 flex items-center gap-4 z-20">
              <button
                className="lg:hidden text-white hover:text-[#B8860B] transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <i className="ri-menu-line text-2xl" />
              </button>

              <Link href="/" className="flex items-center group" aria-label="Homepage">
                <img
                  src={SITE_LOGO_PATH}
                  alt={siteName}
                  className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-9 md:h-10' : 'h-10 md:h-12'
                    }`}
                />
              </Link>
            </div>

            {/* 2. Center: Navigation (Floating Pill Style) */}
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10">
              <nav className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors group overflow-hidden rounded-full hover:bg-white/5"
                  >
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* 3. Right: Icons (Clean & Minimal) */}
            <div className="flex items-center gap-1 md:gap-2 z-20">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-all group"
                aria-label="Search"
              >
                <i className="ri-search-line text-lg group-hover:scale-110 transition-transform" />
              </button>

              <Link
                href="/wishlist"
                className="hidden sm:flex relative p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-all group"
                aria-label="Wishlist"
              >
                <i className="ri-heart-line text-lg group-hover:scale-110 transition-transform" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center bg-[#B8860B] text-[9px] font-bold text-white rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href={user ? "/account" : "/auth/login"}
                className="hidden sm:flex p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-all group"
                aria-label="Account"
              >
                <i className="ri-user-line text-lg group-hover:scale-110 transition-transform" />
              </Link>

              <div className="relative">
                <button
                  className="p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-all group flex items-center gap-2"
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  aria-label="Cart"
                >
                  <div className="relative">
                    <i className="ri-shopping-bag-3-line text-lg group-hover:scale-110 transition-transform" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center bg-[#B8860B] text-[9px] font-bold text-white rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </div>
                </button>
                <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Luxury Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-[#050505]/98 z-[100] flex flex-col pt-32 px-4 backdrop-blur-xl animate-fade-in text-center">
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-4"
          >
            <i className="ri-close-line text-4xl font-thin" />
          </button>

          <div className="w-full max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <span className="text-[#B8860B] text-xs font-bold uppercase tracking-[0.3em]">Search Directory</span>
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full bg-transparent border-b border-white/10 py-6 text-3xl md:text-5xl font-serif text-white placeholder-white/20 focus:outline-none focus:border-[#B8860B] transition-all text-center"
                  autoFocus
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#B8860B] transition-colors">
                  <i className="ri-arrow-right-line text-3xl" />
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Suggestions</p>
              <div className="flex flex-wrap justify-center gap-4">
                {['Air Fryer', 'Blender', 'Microwave', 'Cookware Set', 'Kettle'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSearchQuery(tag); document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }}
                    className="text-white/60 hover:text-[#B8860B] text-sm transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-full max-w-xs bg-[#0c0c0c] border-r border-white/5 shadow-2xl flex flex-col p-8 animate-slide-in-left">
            <div className="flex items-center justify-between mb-8">
              <img src={SITE_LOGO_PATH} alt={siteName} className="h-8 w-auto opacity-80" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/50 hover:text-white">
                <i className="ri-close-line text-3xl" />
              </button>
            </div>

            <nav className="flex-1 space-y-8 mt-8">
              <div className="space-y-4">
                {[{ label: 'Home', href: '/' }, ...navLinks].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-3xl font-serif text-white hover:text-[#B8860B] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="h-px bg-white/10 w-full" />

              <div className="space-y-4">
                <Link href="/wishlist" className="flex items-center gap-3 text-white/60 hover:text-[#B8860B] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="ri-heart-line text-lg" /> Wishlist
                </Link>
                <Link href={user ? "/account" : "/auth/login"} className="flex items-center gap-3 text-white/60 hover:text-[#B8860B] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="ri-user-line text-lg" /> {user ? 'My Account' : 'Log In'}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
