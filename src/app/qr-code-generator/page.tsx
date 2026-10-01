import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Free QR Code Generator — Custom QR Code Maker with Logo',
  description:
    'Create free, customized QR codes for websites, UPI payments, WhatsApp, Wi-Fi, vCards, Google reviews, and menus. Download vector SVG and high-resolution PNG with QR readability validated before export.',
  alternates: {
    canonical: 'https://quickqr.amanxthink11.com/qr-code-generator',
  },
  openGraph: {
    title: 'Free All-in-One QR Code Generator | QuickQR India',
    description:
      'Free QR code creator with color customization, frames, brand logos, and instant QR readability check before export.',
    url: 'https://quickqr.amanxthink11.com/qr-code-generator',
  },
};

export default function AllInOneGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Universal QR Generator Studio
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Free Online QR Code Generator with Custom Styles & Logos
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Generate production-grade QR codes for any business use case. Customize colors, dot shapes, center logos, and framed call-to-actions with real-time scan verification.
          </p>
        </div>

        {/* Generator Component */}
        <QRGeneratorEngine initialType="url" allowTypeSwitching={true} />
      </div>

      {/* SEO & Knowledge Content */}
      <SEOContentSection
        type="url"
        title="Universal QR Code Generator"
        introText="QuickQR provides a comprehensive suite of static QR code generators tailored for Indian enterprises, small merchants, and service professionals. Unlike commercial generators that add paywalls or link timeouts after a short period, our static QR codes are mathematically calculated and permanent."
        steps={[
          {
            title: 'Select Code Type',
            description: 'Choose your desired use case from the 12 generator tabs above — such as UPI payments, WhatsApp chats, or website links.',
          },
          {
            title: 'Enter Target Data',
            description: 'Fill in your destination URL, phone number, Wi-Fi passkey, or merchant VPA. Our validation engine checks for syntax errors in real time.',
          },
          {
            title: 'Style & Download',
            description: 'Select your brand colors, upload a center logo, choose a frame label, and export high-resolution PNG or vector SVG.',
          },
        ]}
        useCases={[
          {
            title: 'Marketing Flyers & Brochures',
            description: 'Lead prospective customers straight from physical pamphlets to your mobile landing page or seasonal discount.',
          },
          {
            title: 'Product Packaging & Labels',
            description: 'Direct buyers to user manuals, authenticity verification, or warranty registration pages.',
          },
          {
            title: 'Shop Fronts & Billboards',
            description: 'High-resolution vector SVG downloads scale to huge dimensions without pixelation on outdoor signage.',
          },
          {
            title: 'Event Badges & Passes',
            description: 'Encode registration URLs or attendee credentials on physical badges for speedy check-in.',
          },
        ]}
        faqs={[
          {
            question: 'Are there any scan limits on generated QR codes?',
            answer: 'No. There are zero limits on the number of times your QR code can be scanned. Static QR codes encode information directly into the pattern and function indefinitely.',
          },
          {
            question: 'Which download format should I send to my commercial printer?',
            answer: 'For professional printing, send the Vector SVG file. SVG retains crisp geometric vector paths at any scale. If your printer prefers raster files, download the 3000px PNG (300 DPI ready).',
          },
        ]}
      />
    </main>
  );
}
