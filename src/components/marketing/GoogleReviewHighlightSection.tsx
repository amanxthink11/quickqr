import React from 'react';
import Link from 'next/link';
import { Star, ArrowRight, CheckCircle2 } from 'lucide-react';

export const GoogleReviewHighlightSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-amber-50/50 border-b border-amber-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Left */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>Reputation & Local SEO</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight">
              Collect Customer Feedback and Make It Easy to Review Your Business
            </h2>

            <p className="text-neutral-700 text-sm leading-relaxed max-w-xl">
              Customers appreciate when sharing feedback is simple. Place a tabletop QR stand at your billing counter or restaurant table to make it easy for patrons to leave genuine reviews on Google.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-2.5 text-xs text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Opens direct Google rating screen (bypasses search)</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Custom banner text: &ldquo;Review Us on Google&rdquo;</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Print-ready A4 table tent template</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Helps customers discover and review your business</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/google-review-qr-code-generator"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Generate Google Review QR Stand</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card Mockup Right */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-xl border-4 border-amber-400 text-center space-y-4">
              <div className="flex justify-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h3 className="font-extrabold text-base text-neutral-900">
                We Value Your Feedback
              </h3>
              <p className="text-xs text-neutral-500">
                Scan with your phone camera to share your honest review on Google.
              </p>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 inline-block">
                <div className="w-40 h-40 bg-neutral-900 text-white rounded-xl flex items-center justify-center text-xs font-mono p-2">
                  [REVIEW QR CODE]
                </div>
              </div>

              <div className="bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl uppercase tracking-wider">
                Review Us on Google
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
