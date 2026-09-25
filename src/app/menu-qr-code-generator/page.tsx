import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Digital Menu QR Code Generator — Restaurant QR Code Maker',
  description:
    'Create contactless digital menu QR codes for restaurants, cafes, bars, and food trucks. Direct patrons to your online menu with print-ready acrylic table tent stands.',
  alternates: {
    canonical: 'https://quickqr.in/menu-qr-code-generator',
  },
  openGraph: {
    title: 'Digital Menu QR Code Generator | QuickQR India',
    description:
      'Touchless digital dining menus for Indian restaurants, cafes, and hotels. 300 DPI print-ready table tents.',
    url: 'https://quickqr.in/menu-qr-code-generator',
  },
};

export default function MenuQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
            F&B Hospitality Solution
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Digital Menu QR Code Generator for Restaurants
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Generate high-resolution touchless menu QR stands for your dining tables, bar counter, and room service. Direct guests straight to your digital menu link or PDF.
          </p>
        </div>

        <QRGeneratorEngine initialType="menu" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="menu"
        title="Digital Menu QR Code Generator"
        introText="A Digital Menu QR code links your dining tables directly to your online food & drink menu, PDF catalog, or ordering web app. In Phase 1, you can link to any existing menu URL (such as your website menu, Instagram highlights, or PDF link). This eliminates physical menu reprinting costs and keeps tables hygienic and clutter-free."
        disclaimer="Phase 1 Focus: QuickQR creates production-ready QR codes pointing to your existing digital menu URL or PDF. An interactive multi-category restaurant CMS menu builder with real-time dish toggling is slated for our upcoming Phase 2 platform release."
        steps={[
          {
            title: 'Enter Digital Menu URL',
            description: 'Paste the web address of your restaurant website menu, hosted PDF menu, or online ordering catalog.',
          },
          {
            title: 'Select Table Tent Frame',
            description: 'Choose one of our restaurant-tailored frame templates with callouts like "SCAN FOR DIGITAL MENU" or "DINE-IN MENU".',
          },
          {
            title: 'Print Acrylic Table Stands',
            description: 'Print directly using our A4 table tent template or export high-resolution vector SVG for your printing agency.',
          },
        ]}
        useCases={[
          {
            title: 'Fine Dining & Casual Restaurants',
            description: 'Provide an elegant, touchless menu experience on every table while reducing physical menu printing and lamination expenses.',
          },
          {
            title: 'Rooftop Lounges & Cocktail Bars',
            description: 'Place water-resistant acrylic QR stands for drink specials and late-night food items in dim lighting.',
          },
          {
            title: 'Hotel In-Room Dining',
            description: 'Put bedside table QR stands so hotel guests can scan and browse the room service menu from their smartphones.',
          },
          {
            title: 'Food Courts & Quick Service Counters',
            description: 'Place queuing signs at food court counters so customers can decide on their orders before reaching the till.',
          },
        ]}
        faqs={[
          {
            question: 'What kind of menu links work best?',
            answer: 'Any web link accessible from a smartphone works great — including your restaurant website menu page, a hosted PDF on Google Drive, or your Zomato/Swiggy public menu link.',
          },
          {
            question: 'What size should I print for restaurant tables?',
            answer: 'We recommend at least 4x4 cm for the QR code pattern, placed inside a standard 4x6 inch acrylic table tent stand with matte lamination to avoid glare from ambient lights.',
          },
        ]}
      />
    </main>
  );
}
