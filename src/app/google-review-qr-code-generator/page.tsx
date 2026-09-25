import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Google Review QR Code Generator — Free Scan to Review Maker',
  description:
    'Generate free Google review QR codes for physical tabletop stands and counter cards. Direct customers straight to your 5-star Google review form. Boost local SEO and reputation.',
  alternates: {
    canonical: 'https://quickqr.in/google-review-qr-code-generator',
  },
  openGraph: {
    title: 'Google Review QR Code Generator | QuickQR India',
    description:
      'Capture 5-star customer reviews right at your billing counter with print-ready QR stands.',
    url: 'https://quickqr.in/google-review-qr-code-generator',
  },
};

export default function GoogleReviewQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
            Reputation & Ratings
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Google Review QR Code Generator — Get 5-Star Reviews
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Generate printable counter stands that direct happy customers straight to your Google Business Profile review screen. Capture positive feedback while the customer is in your store.
          </p>
        </div>

        <QRGeneratorEngine initialType="review" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="review"
        title="Google Review QR Code Generator"
        introText="A Google Review QR code links directly to your verified Google Business Profile review dialog (typically formatted as https://g.page/r/<id>/review). Rather than forcing customers to manually search for your business name on Google, deal with similar-named competitors, and scroll to find the review tab, scanning this QR takes them straight to the star rating screen with the 5-star rating input opened."
        steps={[
          {
            title: 'Obtain Google Review URL',
            description: 'Visit your Google Business Profile dashboard on Google Search or Maps, tap "Ask for reviews", and copy your unique short link.',
          },
          {
            title: 'Select Stand Template',
            description: 'Choose a gold or navy theme, and select banner presets like "RATE US 5 STARS ★" or "SHARE YOUR FEEDBACK".',
          },
          {
            title: 'Print Table Tent Stands',
            description: 'Export an A4 print-ready sheet or vector SVG to place on your billing counter, dining tables, or reception desk.',
          },
        ]}
        useCases={[
          {
            title: 'Restaurants, Cafes & Bakeries',
            description: 'Place acrylic table tents on dining tables so satisfied guests can leave a review while finishing their dessert or waiting for the bill.',
          },
          {
            title: 'Salons, Spas & Wellness Clinics',
            description: 'Ask customers to review your service at the reception desk immediately after enjoying their haircut or spa treatment.',
          },
          {
            title: 'Dental Clinics & Healthcare Practices',
            description: 'Encourage patients who had a gentle, pleasant consultation to share their positive experience for local community trust.',
          },
          {
            title: 'Automotive Garages & Detailers',
            description: 'Hand a post-service card with a review QR to car owners upon vehicle delivery.',
          },
        ]}
        faqs={[
          {
            question: 'How does getting more Google reviews help my business?',
            answer: 'Google\'s local search algorithm strongly prioritizes businesses with a high volume of recent, positive 5-star reviews. It directly improves your ranking in the Google Maps "Local 3-Pack" when nearby customers search for your category.',
          },
          {
            question: 'Will customers need a Google account to leave a review?',
            answer: 'Yes. Since reviews are hosted on Google, customers must be logged into their standard Google / Gmail account, which virtually all Android and iPhone users already have.',
          },
        ]}
      />
    </main>
  );
}
