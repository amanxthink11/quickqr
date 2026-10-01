import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Email QR Code Generator — Pre-filled Email to QR Maker',
  description:
    'Create free email QR codes with pre-filled recipient address, subject line, and draft message body. Opens Gmail, Outlook, or Apple Mail instantly upon scan.',
  alternates: {
    canonical: 'https://quickqr.amanxthink11.com/email-qr-code-generator',
  },
  openGraph: {
    title: 'Email QR Code Generator | QuickQR India',
    description:
      'Pre-populate customer email drafts with target recipient and subject lines in one scan.',
    url: 'https://quickqr.amanxthink11.com/email-qr-code-generator',
  },
};

export default function EmailQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
            Email Protocol Standard
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Email QR Code Generator — Scan to Send
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Generate QR codes that launch the user&apos;s default email client (Gmail, Outlook, Apple Mail) with your recipient address, subject line, and template text ready to send.
          </p>
        </div>

        <QRGeneratorEngine initialType="email" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="email"
        title="Email QR Code Generator"
        introText="An Email QR code uses the standardized RFC 6068 mailto: protocol. When scanned, smartphones prompt the user to compose a new message using their active email account, populating the recipient address, subject line, and inquiry details automatically."
        steps={[
          {
            title: 'Enter Recipient Email',
            description: 'Provide your business or department email (e.g. sales@yourcompany.in or support@brand.in).',
          },
          {
            title: 'Add Subject & Body Template',
            description: 'Pre-fill a subject line such as "Feedback on Order #..." to help categorize incoming customer inquiries.',
          },
          {
            title: 'Export & Embed',
            description: 'Download in SVG or PNG format to place on warranties, product packages, and user manuals.',
          },
        ]}
        useCases={[
          {
            title: 'Warranty & Support Claims',
            description: 'Include a support email QR on technical product packaging so customers can quickly report defects or submit receipts.',
          },
          {
            title: 'B2B Sales Enquiries',
            description: 'Place an email inquiry QR in conference handouts for procurement officers looking to request formal price bids.',
          },
          {
            title: 'HR Job Application Kiosks',
            description: 'Allow walk-in candidates to submit their resumes to your recruitment mailbox with a pre-formatted subject line.',
          },
        ]}
        faqs={[
          {
            question: 'Which email client opens when scanned?',
            answer: 'Whatever email client is set as the default on the customer\'s smartphone — such as Gmail on Android or Apple Mail on iPhone.',
          },
        ]}
      />
    </main>
  );
}
