import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Phone Call QR Code Generator — Free Scan to Call Maker',
  description:
    'Generate free scan-to-call QR codes. When scanned, smartphones immediately open the phone dialer with your business number ready to call. Clean tel: URI standard.',
  alternates: {
    canonical: 'https://quickqr.in/phone-qr-code-generator',
  },
  openGraph: {
    title: 'Phone Call QR Code Generator | QuickQR India',
    description:
      'Enable customers to call your helpline, desk, or emergency contact with a single scan.',
    url: 'https://quickqr.in/phone-qr-code-generator',
  },
};

export default function PhoneQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-200">
            Speed Dial QR
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Phone Call QR Code Generator — Scan to Call
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Create direct calling QR codes for store windows, roadside hoardings, vehicle fleets, and flyers. Customers scan to dial your support or sales team in one tap.
          </p>
        </div>

        <QRGeneratorEngine initialType="phone" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="phone"
        title="Phone Call QR Code Generator"
        introText="A Phone QR code formats your phone number using the RFC 3966 tel: protocol. When a customer scans the code, their device opens the native phone dialer with your number already keyed in, requiring just one tap on the call button to connect."
        steps={[
          {
            title: 'Enter Phone Number',
            description: 'Provide your mobile number, toll-free helpline, or landline including country code (+91 for India).',
          },
          {
            title: 'Customize Stand Frame',
            description: 'Select our green or blue theme and label the frame "SCAN TO CALL NOW" for maximum clarity.',
          },
          {
            title: 'Download & Display',
            description: 'Export in high-resolution PNG or SVG for vehicle branding, window stickers, and service trucks.',
          },
        ]}
        useCases={[
          {
            title: 'Emergency Breakdown & Towing Services',
            description: 'Put scan-to-call stickers on fleet trucks and roadside signs for drivers in urgent need of assistance.',
          },
          {
            title: 'After-Hours Shop Shutters',
            description: 'Display a calling QR on your closed shopfront shutter so urgent customers can reach you during off-hours.',
          },
          {
            title: 'Service Technicians & Repairmen',
            description: 'Place service stickers on water purifiers, AC units, and home appliances for easy annual maintenance bookings.',
          },
        ]}
        faqs={[
          {
            question: 'Will scanning automatically initiate a call without the user knowing?',
            answer: 'No. Modern operating systems prioritize user safety; scanning opens the phone dialer with the number ready, but the user must press the green call button to confirm the call.',
          },
        ]}
      />
    </main>
  );
}
