'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Join Our Kitchen Community</h2>
        <p className="text-lg text-gray-600 mb-8">
          Get exclusive recipes, cooking tips, and 10% off your first order when you subscribe
        </p>

        {submitted ? (
          <div className="bg-green-50 text-green-800 px-6 py-4 rounded-lg inline-flex items-center gap-2 shadow-sm animate-fade-in">
            <i className="ri-check-line text-xl w-6 h-6 flex items-center justify-center"></i>
            <span>Thanks for subscribing!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B87333] text-base"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-lg font-bold text-base whitespace-nowrap shadow-md transition-all duration-200 min-w-[140px] hover:-translate-y-0.5 hover:shadow-xl hover:bg-[#B87333]"
              style={{ backgroundColor: '#2C3E50', color: '#ffffff' }}
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
