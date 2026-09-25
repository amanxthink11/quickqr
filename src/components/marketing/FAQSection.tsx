'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Will my generated QR codes ever expire or stop working?',
    answer:
      'No. All static QR codes generated on QuickQR encode your destination data (such as your UPI address, WhatsApp URL, Wi-Fi configuration, or website link) directly into the pixel matrix. There is no middleman redirect server involved. As long as your destination link or bank account is active, your QR code will work permanently.',
  },
  {
    question: 'Does generating a UPI QR code mean payments are automatically verified?',
    answer:
      'No. QuickQR is a QR generation engine conforming to NPCI UPI specifications. When a customer scans your UPI QR code, their banking or payment app (Google Pay, PhonePe, Paytm, etc.) prepares a transaction to your bank account. QuickQR does not process payments or verify transaction completion. Always check your bank notification, SMS, or Soundbox before handing over goods.',
  },
  {
    question: 'Can I print these QR codes on physical acrylic stands, banners, and flyers?',
    answer:
      'Yes, absolutely. QuickQR supports high-resolution PNG export (up to 3000px at 300 DPI) as well as infinitely scalable Vector SVG export. Print shops, acrylic stand fabricators, and signboard makers can scale vector SVGs to any dimension without pixelation.',
  },
  {
    question: 'Is my data secure and private?',
    answer:
      'Yes. In this phase, static QR code rendering happens completely client-side in your web browser using HTML5 Canvas and SVG. Your confidential details (such as Wi-Fi passphrases, customer contact details, or private links) are never sent to or logged in an external database.',
  },
  {
    question: 'What is the difference between a Static QR and a Dynamic QR?',
    answer:
      'A Static QR embeds the final destination text directly into the code pattern; once printed, the destination cannot be altered. A Dynamic QR (launching in Phase 2) routes through a short URL, allowing you to edit the destination anytime without reprinting, while capturing real-time scan statistics such as location and device breakdown.',
  },
  {
    question: 'How do I obtain my direct Google Review URL?',
    answer:
      'Log in to your Google Business Profile on Google Search or Maps, click on "Ask for reviews" or "Get more reviews", and copy the provided short link (format: https://g.page/r/.../review). Paste that link into our Google Review QR generator to produce an in-store counter stand.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Everything You Need to Know About QuickQR
          </h2>
          <p className="text-neutral-600 text-sm mt-2">
            Clear, honest answers about QR generation, UPI payment standards, and printing.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-neutral-200/90 overflow-hidden transition-all bg-neutral-50/40"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-neutral-900 hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100/80 bg-white">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
