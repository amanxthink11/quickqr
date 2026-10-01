import React from 'react';
import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/Hero';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { PopularToolsGrid } from '@/components/marketing/PopularToolsGrid';
import { BusinessUseCases } from '@/components/marketing/BusinessUseCases';
import { UPIHighlightSection } from '@/components/marketing/UPIHighlightSection';
import { WhatsAppHighlightSection } from '@/components/marketing/WhatsAppHighlightSection';
import { GoogleReviewHighlightSection } from '@/components/marketing/GoogleReviewHighlightSection';
import { WhyChooseUs } from '@/components/marketing/WhyChooseUs';
import { DynamicQRTeaser } from '@/components/marketing/DynamicQRTeaser';
import { PricingTeaser } from '@/components/marketing/PricingTeaser';
import { FAQSection } from '@/components/marketing/FAQSection';
import { WebsiteWidgetHighlightSection } from '@/components/marketing/WebsiteWidgetHighlightSection';

export const metadata: Metadata = {
  title: 'QuickQR — Open-Source QR Infrastructure for Businesses',
  description:
    'Create, customize and download print-ready QR codes for UPI payments, WhatsApp support, Google customer reviews, digital menus, and dynamic QR analytics with website widgets.',
  alternates: {
    canonical: 'https://quickqr.amanxthink11.com',
  },
};

export default function HomePage() {
  return (
    <main>
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Primary QR Generator Entry Point */}
      <section id="generator" className="py-12 md:py-16 bg-white border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Live QR Studio
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              Create Your Production QR Code in Seconds
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Select your use case, configure details, customize branding, and download print-ready vector or high-DPI raster outputs.
            </p>
          </div>

          <QRGeneratorEngine initialType="upi" allowTypeSwitching={true} />
        </div>
      </section>

      {/* 2.5 Website QR Widget Highlight Feature */}
      <WebsiteWidgetHighlightSection />

      {/* 3. Popular QR Tools */}
      <PopularToolsGrid />

      {/* 4. Business Use Cases */}
      <BusinessUseCases />

      {/* 5. UPI QR Highlight Section */}
      <UPIHighlightSection />

      {/* 6. WhatsApp QR Highlight Section */}
      <WhatsAppHighlightSection />

      {/* 7. Google Review Highlight Section */}
      <GoogleReviewHighlightSection />

      {/* 8. Why Choose Us */}
      <WhyChooseUs />

      {/* 9. Dynamic QR Roadmap Teaser */}
      <DynamicQRTeaser />

      {/* 10. Pricing Teaser */}
      <PricingTeaser />

      {/* 11. FAQ Section */}
      <FAQSection />
    </main>
  );
}
