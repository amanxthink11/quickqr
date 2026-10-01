import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-neutral-50 via-white to-white border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800 mb-6 shadow-2xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>QR Tools for Modern Indian Businesses</span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-600 font-normal">100% Free Static Generation</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Create, customize and share{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900">
            production QR codes
          </span>{' '}
          for your business.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Generate high-reliability QR codes for UPI payments, WhatsApp support, Google customer reviews, digital dining menus, store locations, and websites. Custom branded and 300 DPI print-ready.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/qr-code-generator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold shadow-sm hover:shadow-md transition"
          >
            <span>Launch All-In-One Generator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/upi-qr-code-generator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-sm font-bold shadow-2xs transition"
          >
            <span>Generate UPI Payment QR</span>
          </Link>
        </div>

        {/* Trust Points */}
        <div className="mt-10 pt-8 border-t border-neutral-200/60 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero Expiration Dates</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>UPI-Compatible Intent</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No Account Required</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>SVG & 300 DPI PNG</span>
          </div>
        </div>
      </div>
    </section>
  );
};
