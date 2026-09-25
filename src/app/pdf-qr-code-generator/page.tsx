import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'PDF Document QR Code Generator — Link PDF to QR Code',
  description:
    'Convert any public PDF document into a scannable QR code. Perfect for product catalogs, brochures, restaurant menus, user manuals, and real estate flyers.',
  alternates: {
    canonical: 'https://quickqr.in/pdf-qr-code-generator',
  },
  openGraph: {
    title: 'PDF Document QR Code Generator | QuickQR India',
    description:
      'Direct customers straight to your public PDF catalogs, brochures, and specification sheets.',
    url: 'https://quickqr.in/pdf-qr-code-generator',
  },
};

export default function PDFQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
            Document Access
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            PDF Document QR Code Generator
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Convert any public PDF document (hosted on Google Drive, your website, Dropbox, or S3) into a permanent, high-resolution QR code for instant viewing on smartphones.
          </p>
        </div>

        <QRGeneratorEngine initialType="pdf" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="pdf"
        title="PDF Document QR Code Generator"
        introText="A PDF QR code encodes the direct public web URL of your hosted PDF file. When scanned, smartphones prompt users to open and download the document directly in their mobile browser or PDF viewer (like Adobe Acrobat or Google Drive). In Phase 1, QuickQR generates static QR codes for your existing hosted files. Native server cloud storage will be part of our Phase 2 dynamic roadmap."
        disclaimer="Phase 1 Architectural Scope: This tool generates a high-quality static QR code pointing to your hosted PDF link (e.g., Google Drive, AWS S3, or your website). It does not provide temporary mock file storage. Ensure your hosted PDF file has public sharing permissions set so customers can view it without needing login approval."
        steps={[
          {
            title: 'Host Your PDF Online',
            description: 'Upload your PDF document to Google Drive, Dropbox, your corporate website, or cloud storage, and copy the public sharing link.',
          },
          {
            title: 'Paste URL & Label Document',
            description: 'Paste the public link into the generator and add an optional document title for local identification.',
          },
          {
            title: 'Download & Distribute',
            description: 'Download in SVG or PNG format and print on physical product packaging, user manuals, and brochures.',
          },
        ]}
        useCases={[
          {
            title: 'Product User Manuals & Guides',
            description: 'Eliminate bulky paper manuals in electronics packaging by printing a compact QR code linking to your digital PDF guide.',
          },
          {
            title: 'Real Estate Floor Plans & Catalogs',
            description: 'Put PDF QR codes on site boundary walls and property flyers so prospective buyers can download high-res floor plans.',
          },
          {
            title: 'B2B Wholesale Price Lists',
            description: 'Distribute wholesale product catalogs at trade show booths without printing expensive heavy paper binders.',
          },
        ]}
        faqs={[
          {
            question: 'How do I use a Google Drive link for a PDF QR code?',
            answer: 'Upload your PDF to Google Drive, right-click and select "Share", set General Access to "Anyone with the link can view", and paste that share link into the PDF QR generator above.',
          },
          {
            question: 'Does QuickQR store my PDF file in Phase 1?',
            answer: 'No. To ensure 100% privacy and reliability without artificial hosting limits, this phase generates clean static QR codes for your existing hosted URL. Native cloud PDF hosting will be introduced in Phase 2.',
          },
        ]}
      />
    </main>
  );
}
