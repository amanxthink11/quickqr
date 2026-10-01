import React from 'react';
import Link from 'next/link';
import { IndianRupee, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const UPIHighlightSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-950 via-neutral-900 to-neutral-950 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Zero Transaction Commissions</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              UPI-Compatible Payment QR Codes for Direct Bank Payment
            </h2>

            <p className="text-neutral-300 text-sm leading-relaxed max-w-xl">
              QuickQR creates <code className="bg-neutral-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">upi://pay</code> payment intent links compatible with Indian UPI apps. Compatible across all major UPI apps in India including Google Pay, PhonePe, Paytm, CRED, Amazon Pay, and BHIM.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Open Amount & Fixed Amount options</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Custom bill/order reference & remarks</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Center BHIM UPI / RuPay logo badge</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Direct customer-to-bank payment intent</span>
              </div>
            </div>

            {/* Clear Payment Gateway vs QR generator disclaimer */}
            <div className="rounded-xl bg-neutral-900/80 border border-neutral-700/80 p-4 text-xs text-neutral-300 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white">Payment Generator vs Gateway Notice:</span>
                <p className="text-neutral-400 leading-relaxed">
                  Scanning this QR code prompts the customer&apos;s UPI app to initiate payment directly to your bank account. QuickQR is not a payment gateway, does not process funds, and cannot confirm transaction completion on your behalf. Check your official banking app or SMS for payment credits.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/upi-qr-code-generator"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition shadow-sm"
              >
                <span>Generate Your Custom UPI Stand QR</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Visual Table Tent Card Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-white text-neutral-900 rounded-3xl p-6 shadow-2xl border-4 border-emerald-500/40 text-center space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  All UPI Apps Accepted
                </span>
                <span className="text-[10px] font-semibold text-neutral-400">UPI Compatible</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-neutral-900">Sharma Kirana Store</h3>
                <p className="text-xs text-neutral-500 font-mono">sharma.store@okhdfcbank</p>
              </div>

              {/* QR Box */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 inline-block shadow-inner">
                <div className="w-44 h-44 mx-auto bg-white rounded-xl p-3 border border-neutral-200 flex flex-col items-center justify-center relative">
                  <div className="w-full h-full bg-neutral-900 rounded-lg flex items-center justify-center text-white text-[10px] font-mono p-2 text-center">
                    [UPI QR CODE PATTERN]
                  </div>
                </div>
                <div className="mt-3 bg-emerald-800 text-white font-bold text-xs py-1.5 px-4 rounded-lg tracking-wide uppercase">
                  Scan & Pay with Any UPI App
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-medium text-neutral-600">
                <span>Google Pay</span>
                <span>•</span>
                <span>PhonePe</span>
                <span>•</span>
                <span>Paytm</span>
                <span>•</span>
                <span>BHIM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
