import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'WhatsApp QR Code Generator — Click to Chat QR with Message',
  description:
    'Generate free WhatsApp click-to-chat QR codes with pre-filled messages. Perfect for Indian businesses, customer support, catalog inquiries, and instant order booking.',
  alternates: {
    canonical: 'https://quickqr.in/whatsapp-qr-code-generator',
  },
  openGraph: {
    title: 'WhatsApp QR Code Generator | QuickQR India',
    description:
      'Turn store footfall and flyer readers into direct WhatsApp conversations with custom pre-filled message presets.',
    url: 'https://quickqr.in/whatsapp-qr-code-generator',
  },
};

export default function WhatsAppQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-200">
            WhatsApp Business Integration
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            WhatsApp QR Code Generator — Start 1-Tap Chats
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Create WhatsApp QR codes with pre-filled inquiry text. When customers scan, WhatsApp opens immediately with your chat ready to send without saving contacts.
          </p>
        </div>

        <QRGeneratorEngine initialType="whatsapp" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="whatsapp"
        title="WhatsApp QR Code Generator"
        introText="A WhatsApp QR code leverages WhatsApp's official click-to-chat protocol (https://wa.me/<number>). Scanning the code immediately launches the WhatsApp or WhatsApp Business application on the customer's phone and pre-populates your conversation screen with your custom inquiry text. Customers don't need to manually type in a phone number or save your business to their contact list."
        steps={[
          {
            title: 'Enter Phone & Country Code',
            description: 'Select your country code (default +91 for India) and input your active 10-digit WhatsApp or WhatsApp Business mobile number.',
          },
          {
            title: 'Add Pre-Filled Message',
            description: 'Choose one of our quick presets (e.g., "Order Now", "Customer Support", "Get Quote") or type a customized greeting for your campaign.',
          },
          {
            title: 'Customize Frame & Print',
            description: 'Select the official WhatsApp green or teal theme, choose the "Chat on WhatsApp" frame banner, and download in print-ready vector SVG or 300 DPI PNG.',
          },
        ]}
        useCases={[
          {
            title: 'Catalog Inquiries & Direct Sales',
            description: 'Include a WhatsApp QR code on social media posts and product brochures so prospective buyers can ask questions with one tap.',
          },
          {
            title: 'In-Store Customer Assistance',
            description: 'Place counter stickers asking customers to message your support desk for warranty claims, home delivery orders, or repeat purchases.',
          },
          {
            title: 'Doctor & Clinic Appointment Booking',
            description: 'Allow patients to easily request appointment slots by sending a pre-formatted message directly to your reception desk.',
          },
          {
            title: 'Restaurant Home Delivery Orders',
            description: 'Encourage direct takeaway orders via WhatsApp rather than paying high third-party aggregator commissions.',
          },
        ]}
        faqs={[
          {
            question: 'Does the customer need to save my phone number in their contacts?',
            answer: 'No! The wa.me standard opens a direct chat window immediately without requiring the user to add your contact to their phone address book first.',
          },
          {
            question: 'Can I use this with WhatsApp Business?',
            answer: 'Yes. It works identically with standard WhatsApp and WhatsApp Business. If you have automated greeting messages or quick replies configured in WhatsApp Business, they will trigger normally.',
          },
        ]}
      />
    </main>
  );
}
