'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { SITE_LOGO_PATH } from '@/lib/site';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { getToken, verifying } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');
    setIsLoading(true);

    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    const isHuman = await getToken('login');
    if (!isHuman) {
      setAuthError('Security verification failed. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.session) {
        router.push('/account');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual Side */}
      <div className="hidden lg:block relative bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556912173-3db996e16054?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-between p-16 text-white">
          <Link href="/">
            <img src="/logo-white.png" alt="Rayma" className="h-10 w-auto opacity-80" />
            {/* Fallback if logo-white doesn't exist, generic text */}
            <span className="font-serif text-2xl font-bold tracking-wider hidden">RAYMA</span>
          </Link>

          <div>
            <span className="text-[#B8860B] text-sm font-bold uppercase tracking-widest mb-4 block">Kitchen Boss</span>
            <h1 className="font-serif text-5xl leading-tight mb-6">
              Welcome back to <br /> excellence.
            </h1>
            <p className="text-white/60 text-lg max-w-md">
              Sign in to manage your orders, wishlist, and account details.
            </p>
          </div>

          <div className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Rayma Kitchenware. All rights reserved.
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 bg-white text-[#050505]">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-10">
            <Link href="/" className="lg:hidden inline-block mb-8">
              <span className="font-serif text-2xl font-bold text-[#050505]">RAYMA</span>
            </Link>
            <h2 className="font-serif text-4xl mb-3">Sign In</h2>
            <p className="text-neutral-500">
              New to Rayma? <Link href="/auth/signup" className="text-[#B8860B] font-semibold hover:underline">Create an account</Link>
            </p>
          </div>

          {authError && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email Address</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full border-b-2 py-3 text-lg bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.email ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-neutral-400 hover:text-[#B8860B] transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full border-b-2 py-3 text-lg bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.password ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-2"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-xl`} />
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="remember"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 text-[#B8860B] border-neutral-300 rounded focus:ring-[#B8860B]"
              />
              <label htmlFor="remember" className="text-sm text-neutral-600 select-none">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={isLoading || verifying}
              className="w-full bg-[#050505] text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-[#B8860B] transition-all disabled:opacity-50 hover:shadow-xl hover:-translate-y-1 mt-4"
            >
              {isLoading || verifying ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-12 text-center lg:text-left">
            <Link href="/" className="text-neutral-400 hover:text-[#050505] transition-colors inline-flex items-center gap-2 text-sm">
              <i className="ri-arrow-left-line" /> Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
