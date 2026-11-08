import Hero from '../../new-frontend/app/Hero';
import CategoryChips from '../../new-frontend/app/CategoryChips';
import FeaturedCategories from '../../new-frontend/app/FeaturedCategories';
import FeaturedProducts from '@/components/FeaturedProducts';
import ValueProps from '../../new-frontend/app/ValueProps';
import BundleSection from '../../new-frontend/app/BundleSection';
import SocialProof from '../../new-frontend/app/SocialProof';
import Newsletter from '../../new-frontend/app/Newsletter';
import AnimatedSection from '@/components/AnimatedSection';

export default function Home() {
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

      <AnimatedSection animation="fade-up" delay={175}>
        <FeaturedProducts />
      </AnimatedSection>

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

