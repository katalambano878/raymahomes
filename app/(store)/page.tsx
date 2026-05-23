import Hero from '../../New Frontend/app/Hero';
import CategoryChips from '../../New Frontend/app/CategoryChips';
import FeaturedCategories from '../../New Frontend/app/FeaturedCategories';
import FeaturedProducts from '@/components/FeaturedProducts';
import ValueProps from '../../New Frontend/app/ValueProps';
import BundleSection from '../../New Frontend/app/BundleSection';
import SocialProof from '../../New Frontend/app/SocialProof';
import Newsletter from '../../New Frontend/app/Newsletter';
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

