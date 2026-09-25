import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export const PricingTeaser: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-neutral-50 border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Simple & Transparent
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Free Static Codes Today. Enterprise Dynamic Features Tomorrow.
          </h2>
          <p className="text-neutral-600 text-sm mt-2">
            No forced trials. No bait-and-switch. Static codes generated on QuickQR remain valid and functional for life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Static Plan - Available Now */}
          <div className="bg-white rounded-3xl border-2 border-indigo-600 p-8 shadow-md flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-8 px-3 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-wider">
              Available Now • Phase 1
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Standard Static</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">For offline retail, counter stands & flyers</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-neutral-900">₹0</span>
                  <span className="text-xs text-neutral-500 block">Forever Free</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs text-neutral-700">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Unlimited</strong> static QR generation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>All 12 generator types:</strong> UPI, WhatsApp, Menu, Reviews & more</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>High-resolution 3000px PNG & Vector SVG download</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom frames, banners, colors & center logos</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero expiration date — codes never deactivate</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Client-side privacy (no server logging)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <Link
                href="/qr-code-generator"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition shadow-xs"
              >
                <span>Generate Free QR Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pro Dynamic Plan - Upcoming Phase 2 */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-xs flex flex-col justify-between opacity-95">
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-neutral-900">Pro Dynamic</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                      Phase 2
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">For campaigns, marketing agencies & multi-outlet chains</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-neutral-400">Roadmap</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs text-neutral-600">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Editable destination URLs</strong> after printing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Real-time scan tracking (city, OS, device, time)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Custom white-label domain routing (qr.yourdomain.in)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Password-protected confidential documents</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Native multi-page Digital Menu builder CMS</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Developer REST API for bulk QR automation</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <Link
                href="/pricing"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition"
              >
                <span>View Full Roadmap & Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
