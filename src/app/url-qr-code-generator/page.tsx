import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Website URL QR Code Generator — Free Link to QR Maker',
  description:
    'Convert any website link, online store, or landing page into a custom branded QR code. Free, permanent static codes with vector SVG and 300 DPI PNG download.',
  alternates: {
    canonical: 'https://quickqr.in/url-qr-code-generator',
  },
  openGraph: {
    title: 'Website URL QR Code Generator | QuickQR India',
    description:
      'Direct customers straight to your website without middleman redirects or scan limits.',
    url: 'https://quickqr.in/url-qr-code-generator',
  },
};

export default function URLQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Direct Link QR
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Website URL QR Code Generator
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Convert any web address, ecommerce store, portfolio, or landing page into a clean, permanent QR code with custom colors, frame labels, and logos.
          </p>
        </div>

        <QRGeneratorEngine initialType="url" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="url"
        title="Website URL QR Code Generator"
        introText="A URL QR code encodes your direct website destination directly into the two-dimensional matrix. When scanned by any smartphone camera app, users receive a direct prompt to open the website in their default mobile browser (Safari, Chrome, etc.). No third-party redirect middleman is involved, guaranteeing zero link expiry and maximum speed."
        steps={[
          {
            title: 'Paste Your Web Address',
            description: 'Enter your full web address (e.g. https://yourbrand.in or your Shopify/Amazon store link). Our validator ensures secure protocol handling.',
          },
          {
            title: 'Style With Brand Colors',
            description: 'Pick your corporate brand palette, select rounded or classy dot styles, and add a custom center icon.',
          },
          {
            title: 'Export Vector SVG or PNG',
            description: 'Download in print-ready format for flyers, packaging boxes, business cards, or outdoor hoardings.',
          },
        ]}
        useCases={[
          {
            title: 'Ecommerce & Storefront Traffic',
            description: 'Place URL QR codes on physical packaging inserts to drive repeat orders, register warranties, or offer discount codes.',
          },
          {
            title: 'Print Advertising & Newspapers',
            description: 'Turn static print readers into website visitors without making them type long, complicated URLs.',
          },
          {
            title: 'Exhibition Stands & Posters',
            description: 'Direct conference attendees straight to your whitepaper, demo video, or signup landing page.',
          },
        ]}
        faqs={[
          {
            question: 'Can I link to an Instagram profile or YouTube video?',
            answer: 'Yes! Any valid web link works, including your Instagram profile, LinkedIn page, YouTube channel, Amazon storefront, or Google form.',
          },
          {
            question: 'Will this link ever expire?',
            answer: 'No. Static URL QR codes encode the destination text permanently. As long as your website is live and operational, the QR code will direct scanners to it.',
          },
        ]}
      />
    </main>
  );
}
