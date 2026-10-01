import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'vCard QR Code Generator — Digital Business Card QR Maker',
  description:
    'Generate free vCard 3.0 digital business card QR codes. Share contact details, designation, phone numbers, email, and office address in a single scan. Compatible with iOS and Android.',
  alternates: {
    canonical: 'https://quickqr.amanxthink11.com/vcard-qr-code-generator',
  },
  openGraph: {
    title: 'vCard Digital Business Card QR Generator | QuickQR India',
    description:
      'Save full contact cards directly into phone address books with a single scan.',
    url: 'https://quickqr.amanxthink11.com/vcard-qr-code-generator',
  },
};

export default function VCardQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Digital Networking
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            vCard QR Code Generator — Digital Business Cards
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Print modern digital business cards. When scanned, smartphones prompt users to save your full contact details, phone numbers, email, company, and office location with one tap.
          </p>
        </div>

        <QRGeneratorEngine initialType="vcard" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="vcard"
        title="vCard QR Code Generator"
        introText="A vCard (Virtual Contact File) QR code adheres to the global RFC 6350 / vCard 3.0 electronic business card standard. When a client or business associate scans your QR code with their mobile camera, the phone automatically recognizes the vCard structure and opens the native Contacts application with all your details pre-filled and ready to save."
        steps={[
          {
            title: 'Enter Professional Info',
            description: 'Provide your name, company or agency name, designation, and primary business contact numbers.',
          },
          {
            title: 'Add Digital Touchpoints',
            description: 'Include your corporate email, official website, and physical office or clinic address.',
          },
          {
            title: 'Print on Business Cards',
            description: 'Download in high-resolution vector SVG or 3000px PNG to send to your visiting card printer.',
          },
        ]}
        useCases={[
          {
            title: 'Modern Paper Visiting Cards',
            description: 'Print a compact vCard QR code on the back of your traditional paper visiting card so recipients never lose your contact info.',
          },
          {
            title: 'Conference Badges & Networking Events',
            description: 'Display your QR on your lanyard or conference badge for zero-friction contact exchange during trade shows.',
          },
          {
            title: 'Resume & Portfolio Headers',
            description: 'Include your vCard QR in the header of your job application or design portfolio for quick recruiter dialing.',
          },
          {
            title: 'Storefront Reception Desks',
            description: 'Place a countertop stand allowing visiting corporate clients to save your account manager\'s contact instantly.',
          },
        ]}
        faqs={[
          {
            question: 'Does the recipient need a special app to scan a vCard QR?',
            answer: 'No. The standard camera app on both iOS and Android natively decodes vCard 3.0 format and offers a direct "Add to Contacts" prompt.',
          },
          {
            question: 'Why is vCard better than writing out details on a card?',
            answer: 'Manual typing of phone numbers and emails leads to frequent typos and lost leads. With a vCard QR, the entire contact card is saved in 2 seconds with zero typing.',
          },
        ]}
      />
    </main>
  );
}
