import React from 'react';
import Link from 'next/link';
import { QrCode, Shield, CheckCircle2, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
      {/* Top Value Strip */}
      <div className="border-b border-neutral-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Client-Side Generation</p>
                <p className="text-neutral-400 mt-0.5 leading-relaxed">
                  Your business data never leaves your browser for static codes. 100% private.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">UPI & Standards Compatible</p>
                <p className="text-neutral-400 mt-0.5 leading-relaxed">
                  Generates standard upi:// payment intent URIs tested on PhonePe, GPay, Paytm & BHIM.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">300 DPI Print-Ready</p>
                <p className="text-neutral-400 mt-0.5 leading-relaxed">
                  Export vector SVG or high-res PNG for acrylic table stands and shop banners.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-sky-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Zero Hidden Charges</p>
                <p className="text-neutral-400 mt-0.5 leading-relaxed">
                  Static QR codes do not expire and have no scan limitations or fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info (2 cols on md) */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-neutral-900 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5 text-neutral-900" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                QuickQR <span className="text-xs uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">India</span>
              </span>
            </Link>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              India&apos;s dedicated QR generation platform built for modern retail, kirana stores, cafes, clinics, freelancers, and businesses. Create custom styled QR codes with high scan reliability.
            </p>
            <div className="text-xs text-neutral-500 pt-2 flex items-center gap-1.5">
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>for Indian Entrepreneurs</span>
            </div>
          </div>

          {/* Column 1: Payments & Customer Touchpoints */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Payments & Sales
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/upi-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  UPI Payment QR
                </Link>
              </li>
              <li>
                <Link href="/whatsapp-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  WhatsApp Chat QR
                </Link>
              </li>
              <li>
                <Link href="/google-review-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Google Review QR
                </Link>
              </li>
              <li>
                <Link href="/menu-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Digital Menu QR
                </Link>
              </li>
              <li>
                <Link href="/google-maps-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Google Maps Store QR
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Digital Utilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Business Utilities
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/url-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Website URL QR
                </Link>
              </li>
              <li>
                <Link href="/wifi-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Guest Wi-Fi QR
                </Link>
              </li>
              <li>
                <Link href="/vcard-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  vCard Business Card QR
                </Link>
              </li>
              <li>
                <Link href="/pdf-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  PDF Document QR
                </Link>
              </li>
              <li>
                <Link href="/phone-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Phone Call QR
                </Link>
              </li>
              <li>
                <Link href="/email-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Email QR
                </Link>
              </li>
              <li>
                <Link href="/text-qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  Plain Text QR
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Platform & Plans
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/qr-code-generator" className="text-neutral-400 hover:text-white transition">
                  All-in-One Generator
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-neutral-400 hover:text-white transition">
                  Pricing & Features
                </Link>
              </li>
              <li>
                <Link href="/website-qr-widget" className="text-emerald-400 hover:text-emerald-300 font-medium transition flex items-center gap-1.5">
                  <span>Website QR Widget</span>
                  <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">NEW</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition flex items-center gap-1.5">
                  <span>Dynamic QRs</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition flex items-center gap-1.5">
                  <span>Scan Analytics</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/api-keys" className="hover:text-white transition flex items-center gap-1.5">
                  <span>Developer API</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="mt-10 pt-6 border-t border-neutral-800 text-[11px] text-neutral-400 leading-relaxed space-y-2">
          <p>
            <strong>Regulatory & Payment Clarification:</strong> QuickQR generates standard-compliant payment intent strings compatible with unified payment interface (UPI) specifications. QuickQR does not process payments, verify transactions, hold merchant settlements, or function as a payment aggregator/gateway. Payments are executed directly between payer and payee banks through authorized PSP applications (such as Google Pay, PhonePe, Paytm, BHIM, CRED).
          </p>
          <p>
            All static QR codes generated on this website are rendered client-side directly within your browser. QuickQR does not store, log, or track your customer payment addresses or confidential Wi-Fi passkeys. Scan analytics for dynamic QR codes are privacy-minimized without storing raw IP addresses.
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-3">
          <p>© {new Date().getFullYear()} QuickQR — Open-source QR infrastructure. Created by <a href="https://amanxthink11.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-medium">Aman Singh</a>.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
            <Link href="/qr-code-generator" className="hover:text-white transition">
              Free Generators
            </Link>
            <Link href="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
