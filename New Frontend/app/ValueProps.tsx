'use client';

import { useState, useEffect } from 'react';

const ICON_MAP: Record<string, string> = {
  shield: 'ri-shield-check-line', leaf: 'ri-leaf-line', truck: 'ri-truck-line',
  star: 'ri-star-line', check: 'ri-check-line', warranty: 'ri-shield-check-line',
};

export default function ValueProps() {
  const [values, setValues] = useState<Array<{ icon?: string; title: string; description: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/storefront/value-props')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setValues(list.map((c: any) => ({
          icon: ICON_MAP[(c.metadata?.icon || c.block_key || 'star').toLowerCase()] || 'ri-star-line',
          title: c.title || '',
          description: c.content || c.subtitle || '',
        })).filter((v: any) => v.title));
      })
      .catch(() => setValues([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || values.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-lg text-gray-600">Quality you can trust, service you can count on</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div
              key={value.title}
              className="text-center rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#B87333]/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-[#B87333]">
                <i className={`${value.icon} text-3xl text-[#B87333] w-8 h-8 flex items-center justify-center`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

