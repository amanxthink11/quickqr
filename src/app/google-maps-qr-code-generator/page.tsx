import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Google Maps Location QR Code Generator — Store Navigation QR',
  description:
    'Generate free Google Maps QR codes for shops, restaurants, clinics, and offices. Direct customers to your exact store location with turn-by-turn navigation in Google Maps.',
  alternates: {
    canonical: 'https://quickqr.in/google-maps-qr-code-generator',
  },
  openGraph: {
    title: 'Google Maps Location QR Code Generator | QuickQR India',
    description:
      'Help customers find your store, clinic, or event venue with turn-by-turn directions.',
    url: 'https://quickqr.in/google-maps-qr-code-generator',
  },
};

export default function GoogleMapsQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
            Store Location Navigation
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Google Maps Location QR Code Generator
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Create QR codes that open Google Maps on smartphones with turn-by-turn driving, transit, or walking directions straight to your business premises.
          </p>
        </div>

        <QRGeneratorEngine initialType="maps" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="maps"
        title="Google Maps Location QR Code Generator"
        introText="A Google Maps QR code contains a verified Google Maps location link or geographical search query. When scanned, the customer's phone launches the Google Maps app or mobile browser, centered on your location with a prominent 'Directions' button ready to guide them to your door."
        steps={[
          {
            title: 'Copy Your Google Maps Link',
            description: 'Open Google Maps, search for your business, tap "Share", and copy the link. Alternatively, paste your full physical address.',
          },
          {
            title: 'Select Navigation Frame',
            description: 'Choose a frame banner with text such as "LOCATE US ON GOOGLE MAPS" or "FIND OUR STORE".',
          },
          {
            title: 'Print on Marketing Material',
            description: 'Include the QR code on print flyers, business cards, delivery boxes, and invitations.',
          },
        ]}
        useCases={[
          {
            title: 'Retail Outlets & Showrooms',
            description: 'Put location QR codes on promotional flyers so potential buyers can easily navigate to your nearest store.',
          },
          {
            title: 'Clinics, Diagnostics & Hospitals',
            description: 'Help visiting patients find your clinic entrance without calling your reception repeatedly for street landmarks.',
          },
          {
            title: 'Wedding & Event Invitations',
            description: 'Print on physical wedding cards and conference passes so attendees navigate straight to the banquet hall or hotel gate.',
          },
        ]}
        faqs={[
          {
            question: 'Will this open the Google Maps app automatically?',
            answer: 'Yes. If the user has Google Maps installed on their iOS or Android device, the link will open natively inside the app with GPS directions ready.',
          },
        ]}
      />
    </main>
  );
}
