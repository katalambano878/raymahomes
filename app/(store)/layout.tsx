'use client';

import { Suspense } from 'react';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import ScrollToTop from '@/components/ScrollToTop';
import ErrorBoundary from '@/components/ErrorBoundary';
import NavigationProgress from '@/components/NavigationProgress';
import CookieConsent from '@/components/CookieConsent';
import { CMSProvider } from '@/context/CMSContext';

// Lazy-load non-critical components
import dynamic from 'next/dynamic';

// Load Header only on client to avoid hydration mismatch with cached bundles (announcement + header height placeholder)
const Header = dynamic(() => import('@/components/Header'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#050505]">
      <div className="h-10 bg-brand" aria-hidden />
      <div className="h-16 lg:h-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8" aria-hidden />
    </div>
  ),
});

const SessionTimeoutWarning = dynamic(() => import('@/components/SessionTimeoutWarning'), { ssr: false });
const PWAPrompt = dynamic(() => import('@/components/PWAPrompt'), { ssr: false });
// PWA-related components are disabled in development to avoid service-worker
// cache conflicts with Next.js dev bundles. They can be re-enabled for prod.
// const PWAInstaller = dynamic(() => import('@/components/PWAInstaller'), { ssr: false });
// const PWASplash = dynamic(() => import('@/components/PWASplash'), { ssr: false });
// const PushNotificationManager = dynamic(() => import('@/components/PushNotificationManager'), { ssr: false });
// const OfflineIndicator = dynamic(() => import('@/components/OfflineIndicator'), { ssr: false });
// const NetworkStatusMonitor = dynamic(() => import('@/components/NetworkStatusMonitor'), { ssr: false });
// const UpdatePrompt = dynamic(() => import('@/components/UpdatePrompt'), { ssr: false });
// const LiveSalesNotification = dynamic(() => import('@/components/LiveSalesNotification'), { ssr: false });

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CMSProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <ScrollToTop />
      <div className="min-h-screen bg-neutral-50">
        {/* PWA components disabled in dev to prevent stale SW bundles */}
        {/* <PWASplash /> */}
        {/* <PWAInstaller /> */}
        <Header />
        <ErrorBoundary>
          <div className="pwa-page-enter">
            {children}
          </div>
        </ErrorBoundary>
        <Footer />
        <MobileBottomNav />
        <SessionTimeoutWarning />
        <PWAPrompt />
        {/* <PushNotificationManager /> */}
        {/* <OfflineIndicator /> */}
        {/* <NetworkStatusMonitor /> */}
        {/* <UpdatePrompt /> */}
        {/* <LiveSalesNotification /> */}
        <CookieConsent />
      </div>
    </CMSProvider>
  );
}
