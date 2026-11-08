'use client';

import { useState, useEffect } from 'react';

export default function SocialProof() {
  const [testimonials, setTestimonials] = useState<Array<{ name: string; role: string; content: string; rating: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/storefront/reviews?limit=6')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Home Chefs</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <i key={i} className="ri-star-fill text-yellow-400 text-xl"></i>
              ))}
            </div>
            <span className="text-gray-600 font-semibold">4.8 out of 5</span>
          </div>
          <p className="text-lg text-gray-600">Based on 3,500+ verified reviews</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white p-8 rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:-rotate-0.5"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-yellow-400"></i>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.content}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center">
                  <i className="ri-user-line text-brand text-xl"></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
