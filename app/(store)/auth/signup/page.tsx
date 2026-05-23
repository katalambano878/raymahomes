'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { supabase } from '@/lib/supabase';
import { SITE_LOGO_PATH } from '@/lib/site';
import { useRecaptcha } from '@/hooks/useRecaptcha';

function getFriendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('email rate limit exceeded')) return 'System busy. Please try again later.';
  if (lower.includes('already registered')) return 'Account exists. Try signing in.';
  if (lower.includes('weak password')) return 'Password too weak.';
  if (lower.includes('invalid email')) return 'Invalid email address.';
  return message;
}

export default function SignupPage() {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    newsletter: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [success, setSuccess] = useState(false);
  const { getToken, verifying } = useRecaptcha();

  useEffect(() => {
    if (authError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');
    setIsLoading(true);

    const newErrors: any = {};
    if (!formData.firstName) newErrors.firstName = 'First name required';
    if (!formData.lastName) newErrors.lastName = 'Last name required';
    if (!formData.email) newErrors.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone) newErrors.phone = 'Phone required';
    if (!formData.password) newErrors.password = 'Password required';
    else if (formData.password.length < 8) newErrors.password = 'Min 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords mismatch';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'Terms not accepted';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    const isHuman = await getToken('signup');
    if (!isHuman) {
      setAuthError('Verification failed.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            newsletter: formData.newsletter
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'welcome',
            payload: { email: formData.email, firstName: formData.firstName }
          })
        }).catch(console.error);

        if (!data.session) setSuccess(true);
        else router.push('/account');
      }
    } catch (err: any) {
      setAuthError(getFriendlyError(err.message || 'Signup failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:block relative bg-[#050505] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556912173-3db996e16054?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
          <div className="relative z-10 h-full flex items-center justify-center p-16 text-white text-center">
            <div>
              <h1 className="font-serif text-5xl mb-4">Almost There.</h1>
              <p className="text-white/60 text-lg">Check your email to verify your account.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center p-8 bg-white text-[#050505]">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-[#B8860B]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#B8860B]">
              <i className="ri-mail-send-line text-4xl" />
            </div>
            <h2 className="font-serif text-3xl font-bold mb-4">Check your email</h2>
            <p className="text-neutral-600 mb-8">
              We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>.<br />
              Please check your inbox to activate your account.
            </p>
            <Link href="/auth/login" className="inline-block bg-[#050505] text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-[#B8860B] transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Visual Side */}
      <div className="hidden lg:block relative bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556912173-3db996e16054?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-between p-16 text-white">
          <Link href="/">
            <span className="font-serif text-2xl font-bold tracking-wider opacity-80">RAYMA</span>
          </Link>

          <div>
            <span className="text-[#B8860B] text-sm font-bold uppercase tracking-widest mb-4 block">Join the Family</span>
            <h1 className="font-serif text-5xl leading-tight mb-6">
              Elevate your <br /> everyday.
            </h1>
            <p className="text-white/60 text-lg max-w-md">
              Create an account to track orders, save items, and speed up checkout.
            </p>
          </div>

          <div className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Rayma Kitchenware.
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 bg-white text-[#050505] overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="text-center lg:text-left mb-10">
            <Link href="/" className="lg:hidden inline-block mb-8">
              <span className="font-serif text-2xl font-bold text-[#050505]">RAYMA</span>
            </Link>
            <h2 className="font-serif text-4xl mb-3">Create Account</h2>
            <p className="text-neutral-500">
              Already a member? <Link href="/auth/login" className="text-[#B8860B] font-semibold hover:underline">Sign In</Link>
            </p>
          </div>

          {authError && (
            <div ref={errorRef} className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full border-b-2 py-3 bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.firstName ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                  placeholder="First Name"
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full border-b-2 py-3 bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.lastName ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                  placeholder="Last Name"
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full border-b-2 py-3 bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.email ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                placeholder="Email Address"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full border-b-2 py-3 bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.phone ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                placeholder="Phone"
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full border-b-2 py-3 bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.password ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                  placeholder="Password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 p-2">
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-xl`} />
                </button>
              </div>
              <PasswordStrengthMeter password={formData.password} />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full border-b-2 py-3 bg-transparent focus:outline-none transition-colors placeholder-neutral-300 ${errors.confirmPassword ? 'border-red-500' : 'border-neutral-200 focus:border-[#B8860B]'}`}
                  placeholder="Confirm Password"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 p-2">
                  <i className={`${showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-xl`} />
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="w-4 h-4 mt-1 text-[#B8860B] border-neutral-300 rounded focus:ring-[#B8860B]"
                />
                <span className="text-xs text-neutral-600">
                  I agree to the <Link href="/terms" className="text-[#B8860B] hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-[#B8860B] hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.acceptTerms && <p className="text-xs text-red-500 mt-1">{errors.acceptTerms}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || verifying}
              className="w-full bg-[#050505] text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-[#B8860B] transition-all disabled:opacity-50 hover:shadow-xl hover:-translate-y-1 mt-6"
            >
              {isLoading || verifying ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
