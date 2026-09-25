import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Plans — 100% Free Static QR & Upcoming Pro Dynamic',
  description:
    'Transparent pricing for Indian businesses. Unlimited forever-free static QR codes with zero expiration. Learn about upcoming Phase 2 dynamic features.',
  alternates: {
    canonical: 'https://quickqr.in/pricing',
  },
  openGraph: {
    title: 'Pricing & Plans | QuickQR India',
    description:
      'Unlimited free static QR generator with vector SVG and 300 DPI PNG exports. No credit card required.',
    url: 'https://quickqr.in/pricing',
  },
};

export default function PricingPage() {
  return (
    <main className="py-12 md:py-20 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Fair & Transparent
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Clear Pricing with Zero Hidden Traps
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Most QR generators entice you with a &ldquo;free&rdquo; code only to deactivate it 14 days later demanding monthly fees. At QuickQR, static codes are permanent and forever free.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch mb-20">
          {/* Card 1: Static Plan (Available Now) */}
          <div className="bg-white rounded-3xl border-2 border-indigo-600 p-8 sm:p-10 shadow-lg flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-8 px-3.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-wider">
              Phase 1 • Live Now
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Standard Static</h2>
                  <p className="text-xs text-neutral-500 mt-1">For shops, cafes, clinics, freelancers & print media</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-extrabold text-neutral-900">₹0</span>
                  <span className="text-xs text-neutral-500 block">Forever Free</span>
                </div>
              </div>

              <div className="space-y-3.5 pt-6 border-t border-neutral-100 text-xs sm:text-sm text-neutral-700">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Unlimited</strong> static QR generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>All 12 generator types:</strong> UPI, WhatsApp, Wi-Fi, vCard, Menus & more</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>High-resolution <strong>3000px PNG (300 DPI)</strong> & <strong>Vector SVG</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom frame cards (Scan to Pay, Review Us, Chat on WA)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom colors, dot shapes & center brand logos</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Zero expiration</strong> — codes work indefinitely once printed</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Client-side privacy (passwords & VPAs never stored on server)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No account, login, or credit card required</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <Link
                href="/qr-code-generator"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm transition shadow-sm"
              >
                <span>Generate Free QR Code</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Pro Dynamic (Roadmap) */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-10 shadow-xs flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-8 px-3.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Phase 2 Roadmap</span>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Pro Dynamic</h2>
                  <p className="text-xs text-neutral-500 mt-1">For multi-outlet brands, digital marketers & campaigns</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-neutral-500">Coming Soon</span>
                </div>
              </div>

              <div className="space-y-3.5 pt-6 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Editable Destinations:</strong> Change target URL without reprinting posters</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Real-Time Analytics:</strong> Track scans by Indian city, device OS & hour</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Custom Branded Domain:</strong> Use your own domain (e.g. qr.yourbrand.in)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Password & Expiry Locks:</strong> Time-sensitive flash deals & private files</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Full Restaurant CMS:</strong> Multi-category digital menu with real-time updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Developer REST API:</strong> Bulk automated QR generation for invoices</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Multi-user team management & campaign folders</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-xs text-neutral-600">
                Currently in active development. Static QR features remain 100% free and unhindered.
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden mb-20">
          <div className="p-6 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-lg font-bold text-neutral-900">
              Detailed Feature Comparison Matrix
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Clear breakdown of what is available today vs upcoming in Phase 2
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-6 font-semibold">Capability</th>
                  <th className="py-3 px-6 font-semibold text-indigo-700 bg-indigo-50/50">Standard Static (Now)</th>
                  <th className="py-3 px-6 font-semibold text-neutral-600">Pro Dynamic (Phase 2)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                <tr>
                  <td className="py-3.5 px-6 font-medium">Generation Cost</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-700 bg-indigo-50/20">₹0 (Free)</td>
                  <td className="py-3.5 px-6 text-neutral-500">Subscription / Pay per Dynamic QR</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Code Expiration</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-700 bg-indigo-50/20">Never Expires</td>
                  <td className="py-3.5 px-6 text-neutral-500">Active while subscription is live</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Scan Limits</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-700 bg-indigo-50/20">Unlimited Scans</td>
                  <td className="py-3.5 px-6 text-neutral-500">High Volume Tiers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Export Formats</td>
                  <td className="py-3.5 px-6 bg-indigo-50/20">PNG (up to 3000px) & Vector SVG</td>
                  <td className="py-3.5 px-6 text-neutral-500">PNG, SVG, PDF, EPS</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Edit Destination After Print</td>
                  <td className="py-3.5 px-6 bg-indigo-50/20">No (Data embedded in matrix)</td>
                  <td className="py-3.5 px-6 font-semibold text-indigo-700">Yes (Instant Dashboard Update)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Scan Analytics (City & Device)</td>
                  <td className="py-3.5 px-6 bg-indigo-50/20">No (Direct connection)</td>
                  <td className="py-3.5 px-6 font-semibold text-indigo-700">Yes (Real-Time Metrics)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Custom Domain Redirection</td>
                  <td className="py-3.5 px-6 bg-indigo-50/20">Not Applicable</td>
                  <td className="py-3.5 px-6 font-semibold text-indigo-700">Yes (White-label CNAME)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Privacy Architecture</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-700 bg-indigo-50/20">100% Client-Side Private</td>
                  <td className="py-3.5 px-6 text-neutral-500">Encrypted Cloud Storage</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing FAQs */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-neutral-900">Pricing FAQs</h3>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-neutral-700">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200">
              <h4 className="font-bold text-neutral-900 mb-1">Is there any catch to the free static generator?</h4>
              <p className="text-neutral-600 leading-relaxed">
                None. Static QR codes are mathematically calculated in your browser and do not route through any intermediary server. They cost us virtually nothing in server bandwidth, so we provide them permanently free to Indian entrepreneurs.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200">
              <h4 className="font-bold text-neutral-900 mb-1">Will my static QR codes stop working when Phase 2 launches?</h4>
              <p className="text-neutral-600 leading-relaxed">
                Never. Because static QR codes embed the raw destination payload directly inside the image, they have zero dependency on our servers. Even if our website were offline, your printed static codes would continue scanning seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
