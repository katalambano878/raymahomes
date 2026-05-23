import Hero from './Hero';
import CategoryChips from './CategoryChips';
import FeaturedCategories from './FeaturedCategories';
import ValueProps from './ValueProps';
import BundleSection from './BundleSection';
import SocialProof from './SocialProof';
import Newsletter from './Newsletter';
import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection';

export default function HomePage() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/defe6a78-b389-4d98-8d6f-36791ca665f9', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `log_${Date.now()}_home_page`,
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'New Frontend/app/page.tsx:HomePage',
      message: 'HomePage server render hit',
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  return (
    <main className="space-y-0">
      <AnimatedSection animation="fade-up">
        <Hero />
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={100}>
        <CategoryChips />
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={150}>
        <FeaturedCategories />
      </AnimatedSection>

      {/* BestSellers and NewArrivals are omitted here for now.
          We will wire them to the real product backend instead of mock data
          before enabling them on the live storefront. */}

      <AnimatedSection animation="fade-up" delay={200}>
        <ValueProps />
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={250}>
        <BundleSection />
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={300}>
        <SocialProof />
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={350}>
        <Newsletter />
      </AnimatedSection>
    </main>
  );
}
