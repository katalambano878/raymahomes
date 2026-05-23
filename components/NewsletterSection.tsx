'use client';

import { useState } from 'react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSubmitStatus('success');
      setEmail('');
    } catch {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="bg-[#0c0c0c] rounded-3xl overflow-hidden shadow-2xl relative border-2 border-brand">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 md:p-10 lg:p-12 gap-8">
          <div className="text-center lg:text-left max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/20 border border-brand/40 text-brand text-xs font-semibold tracking-widest uppercase mb-4">
              Kitchen Boss
            </span>
            <h3 className="font-serif text-3xl md:text-4xl text-white mb-4 leading-tight">
              Stay in the loop
            </h3>
            <p className="text-white/70 text-base leading-relaxed">
              New arrivals, restocks, and offers on premium kitchenware and appliances. No spam — just the good stuff.
            </p>
          </div>
          <div className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-1.5">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 bg-transparent border-none text-white placeholder-white/40 px-5 py-3.5 focus:ring-0 text-base rounded-xl"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand hover:bg-brand-light text-rayma-dark font-semibold px-6 py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap text-sm"
              >
                {isSubmitting ? <i className="ri-loader-4-line animate-spin text-lg" /> : 'Join'}
              </button>
            </form>
          </div>
        </div>
        {submitStatus === 'success' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand text-rayma-dark px-5 py-2 rounded-full font-semibold text-sm animate-in fade-in slide-in-from-bottom-2">
            <i className="ri-checkbox-circle-line mr-2" /> Thanks for joining!
          </div>
        )}
      </div>
    </div>
  );
}
