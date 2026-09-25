import React from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

export const WhatsAppHighlightSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual on Left on Desktop */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center">
            <div className="w-full max-w-sm rounded-3xl bg-neutral-900 text-white p-6 shadow-xl border border-neutral-800 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold text-xs">
                  WA
                </div>
                <div>
                  <div className="font-bold text-sm">Customer WhatsApp Desk</div>
                  <div className="text-[11px] text-emerald-400">Available • Instant Chat</div>
                </div>
              </div>

              <div className="p-4 bg-neutral-800/80 rounded-2xl border border-neutral-700 space-y-3">
                <div className="bg-emerald-950/60 border border-emerald-800/50 p-3 rounded-xl text-xs text-emerald-200">
                  <span className="font-semibold text-white block mb-0.5">Pre-filled Customer Message:</span>
                  &ldquo;Hi, I saw your product catalog. Can you please share the pricing &amp; delivery details?&rdquo;
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Target: +91 98765 43210</span>
                  <span className="text-emerald-400 font-semibold">1-Tap Send</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Chat with Us on WhatsApp
                </span>
              </div>
            </div>
          </div>

          {/* Text Content on Right */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              <span>Direct Customer Engagement</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight">
              Turn Foot Traffic into Direct WhatsApp Conversations
            </h2>

            <p className="text-neutral-600 text-sm leading-relaxed max-w-xl">
              Eliminate friction. Instead of making customers manually type and save a phone number in their address book, let them scan your customized QR to launch WhatsApp directly with your pre-written inquiry.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pre-filled messages for orders, support & quotes</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Works on both WhatsApp & WhatsApp Business</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Print-friendly WhatsApp logo badge included</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero phone saving required by customer</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/whatsapp-qr-code-generator"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Create WhatsApp QR Code</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
