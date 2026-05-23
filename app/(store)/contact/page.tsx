"use client";

import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import { supabase } from '@/lib/supabase';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import PageHero from '@/components/PageHero';

// -- Components --

const ContactCard = ({ icon, title, content, subtext, action, actionLabel, delay }: any) => (
  <div
    className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up flex flex-col items-start h-full"
    style={{ animationDelay: delay }}
  >
    <div className="w-12 h-12 rounded-full bg-brand-muted flex items-center justify-center text-brand mb-6 text-xl">
      <i className={icon}></i>
    </div>
    <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
    <p className="text-brand-dark font-medium mb-1">{content}</p>
    <p className="text-neutral-500 text-sm mb-4">{subtext}</p>
    {action && (
      <a href={action} className="mt-auto text-sm font-bold text-brand hover:underline flex items-center gap-1">
        {actionLabel || "View"} <i className="ri-arrow-right-line"></i>
      </a>
    )}
  </div>
);

const FAQItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="font-bold text-neutral-800 group-hover:text-brand transition-colors pr-4">{question}</span>
        <i className={`ri-arrow-down-s-line text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-neutral-600 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

export default function ContactPage() {
  usePageTitle('Contact Us');
  const { getSetting } = useCMS();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { getToken, verifying } = useRecaptcha();

  // Settings
  const contactEmail = getSetting('contact_email') || 'info@raymakitchenware.com';
  const rawPhone = getSetting('contact_phone') || '0554081190';
  const contactAddress = getSetting('contact_address') || 'Kojo Thompson Rd 8, Accra, Ghana';
  const waNumber = rawPhone.replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const isHuman = await getToken('contact');
    if (!isHuman) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from('contact_submissions').insert(formData);

      // Fallback notification logic
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', payload: formData })
      }).catch(console.error);

      if (error && error.code !== '42P01') throw error;

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        title="Get In Touch"
        subtitle="Have a question or need assistance? Our friendly team is here to help."
        backgroundImage="/hero-7.jpeg"
      />

      {/* Contact Info Cards */}
      <div className="container mx-auto px-4 -mt-8 md:mt-16 mb-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ContactCard
            icon="ri-phone-line"
            title="Call Us"
            content={rawPhone}
            subtext="Mon-Fri, 8am-6pm GMT"
            delay="0.1s"
            action={`tel:${rawPhone.replace(/\s/g, '')}`}
            actionLabel="Call now"
          />
          <ContactCard
            icon="ri-mail-line"
            title="Email Us"
            content={contactEmail}
            subtext="We respond within 24 hours"
            delay="0.2s"
            action={`mailto:${contactEmail}`}
            actionLabel="Send email"
          />
          <ContactCard
            icon="ri-whatsapp-line"
            title="WhatsApp"
            content={rawPhone}
            subtext="Chat with us instantly"
            delay="0.3s"
            action={`https://wa.me/233${waNumber.startsWith('0') ? waNumber.slice(1) : waNumber}`}
            actionLabel="Chat now"
          />
          <ContactCard
            icon="ri-map-pin-line"
            title="Visit Us"
            content={contactAddress}
            subtext="Mon-Sat, 9am-6pm"
            delay="0.4s"
            action={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`}
            actionLabel="Get directions"
          />
        </div>
      </div>



      {/* Form & FAQ Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Form */}
          <div className="w-full lg:w-3/5">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3 font-serif">Send Us a Message</h2>
              <p className="text-neutral-600">Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-neutral-800 mb-2">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-neutral-400 bg-neutral-50 focus:bg-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-neutral-800 mb-2">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-neutral-400 bg-neutral-50 focus:bg-white"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-neutral-800 mb-2">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-neutral-400 bg-neutral-50 focus:bg-white"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-bold text-neutral-800 mb-2">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-neutral-400 bg-neutral-50 focus:bg-white"
                  placeholder="Order inquiry, product question, etc."
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-bold text-neutral-800 mb-2">Message *</label>
                <textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-neutral-400 bg-neutral-50 focus:bg-white resize-none"
                  placeholder="Tell us how we can help you..."
                  required
                />
                <div className="flex justify-between mt-2 text-xs text-neutral-400">
                  <span>0/500 characters</span>
                </div>
              </div>

              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-100 text-green-800 p-4 rounded-xl flex items-center gap-3">
                  <i className="ri-checkbox-circle-fill text-xl text-green-600"></i>
                  <span className="font-medium">Message sent successfully!</span>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl flex items-center gap-3">
                  <i className="ri-error-warning-fill text-xl text-red-600"></i>
                  <span className="font-medium">Failed to send. Please try again.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || verifying}
                className="bg-brand text-white w-full py-4 rounded-xl font-bold hover:bg-brand-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-brand/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i> Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>

          {/* Right Side Info */}
          <div className="w-full lg:w-2/5 space-y-8">
            {/* FAQ */}
            <div className="bg-white">
              <h3 className="text-2xl font-bold text-neutral-900 mb-6 font-serif">Quick Answers</h3>
              <p className="text-neutral-600 mb-6">Find answers to common questions before reaching out</p>

              <div className="space-y-2">
                <FAQItem
                  question="What are your delivery times?"
                  answer="We offer same-day delivery for orders within Accra placed before 2pm. For other regions, delivery typically takes 24-48 hours."
                />
                <FAQItem
                  question="Do you offer international shipping?"
                  answer="Currently, we primarily serve customers within Ghana. However, for bulk orders, we can arrange special international shipping. Please contact us for details."
                />
                <FAQItem
                  question="What payment methods do you accept?"
                  answer="We accept Mobile Money (MTN, Vodafone, AT), Bank Cards (Visa, Mastercard), and Cash on Delivery for orders within Accra."
                />
              </div>
            </div>

            {/* Immediate Help Card */}
            <div className="bg-brand rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="ri-customer-service-2-fill text-9xl -mr-10 -mt-10"></i>
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20">
                  <i className="ri-headphone-line text-2xl"></i>
                </div>

                <h3 className="text-2xl font-bold mb-3">Need Immediate Help?</h3>
                <p className="text-white/80 mb-8 leading-relaxed">
                  Our customer support team is available Monday to Friday, 8am-6pm GMT. For urgent matters, reach out via WhatsApp.
                </p>

                <a
                  href={`https://wa.me/233${waNumber.startsWith('0') ? waNumber.slice(1) : waNumber}`}
                  target="_blank"
                  className="bg-white text-brand-dark flex items-center justify-center gap-2 py-3.5 rounded-full font-bold hover:bg-neutral-100 transition-colors w-full"
                >
                  <i className="ri-whatsapp-fill text-lg"></i> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Store Section */}
      <div className="bg-white py-16 border-t border-neutral-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4 font-serif">Visit Our Store</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
            Prefer to shop in person? Visit our store. Our knowledgeable staff will be happy to assist you with product selection and answer any questions.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12">
            <div className="flex items-center gap-2 text-neutral-800 font-medium">
              <i className="ri-map-pin-line text-brand"></i> {contactAddress}
            </div>
            <div className="flex items-center gap-2 text-neutral-800 font-medium">
              <i className="ri-time-line text-brand"></i> Mon-Sat: 9am-6pm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
