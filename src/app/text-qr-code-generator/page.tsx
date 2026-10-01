import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Plain Text QR Code Generator — Free Text to QR Converter',
  description:
    'Convert raw text, notes, serial keys, inventory batch codes, or instructions into static QR codes. Works offline without internet connection.',
  alternates: {
    canonical: 'https://quickqr.amanxthink11.com/text-qr-code-generator',
  },
  openGraph: {
    title: 'Plain Text QR Code Generator | QuickQR India',
    description:
      'Encode plain alphanumeric text, serial keys, and notes with real-time character density guidance.',
    url: 'https://quickqr.amanxthink11.com/text-qr-code-generator',
  },
};

export default function TextQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
            Offline Plain Text
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Plain Text QR Code Generator
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Encode raw alphanumeric text, security tokens, warehouse bin codes, or instructions directly into a QR matrix. Decodes completely offline without requiring an internet connection.
          </p>
        </div>

        <QRGeneratorEngine initialType="text" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="text"
        title="Plain Text QR Code Generator"
        introText="A Plain Text QR code contains raw UTF-8 characters. When scanned, the scanning device displays the text directly on the screen without opening a browser or application. Because no web URL is involved, text QR codes can be read and decoded in total isolation from the internet, making them popular for inventory, manufacturing, and offline verification."
        steps={[
          {
            title: 'Enter Text Content',
            description: 'Type or paste your text. Our live character counter and density meter advise when length starts increasing grid complexity.',
          },
          {
            title: 'Select Contrast & Margins',
            description: 'Maintain high contrast so dense alphanumeric matrices can be resolved by basic smartphone cameras.',
          },
          {
            title: 'Download & Print',
            description: 'Export SVG or PNG for product labels, inventory racks, and packaging.',
          },
        ]}
        useCases={[
          {
            title: 'Warehouse & Inventory Bin Numbering',
            description: 'Label warehouse shelves, inventory pallets, and spare part bins with alphanumeric SKU codes for handheld laser scanner reading.',
          },
          {
            title: 'Coupon Vouchers & Promotional Codes',
            description: 'Print single-use promo codes on receipts for customers to scan and copy into mobile checkout forms.',
          },
          {
            title: 'Equipment Maintenance Logs',
            description: 'Encode machine serial numbers, installation dates, and model specs on equipment chassis plates.',
          },
        ]}
        faqs={[
          {
            question: 'How much text can a QR code hold?',
            answer: 'Theoretically, a QR code can hold up to ~4,296 alphanumeric characters. However, in practice, keeping text under 300-400 characters ensures the code remains easy to scan quickly with smartphone cameras from a distance.',
          },
        ]}
      />
    </main>
  );
}
