import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Clock, ArrowLeft, QrCode } from 'lucide-react';

export const metadata: Metadata = {
  title: 'QR Code Expired — QuickQR India',
  description: 'This QR code promotion or link has expired.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function QRExpiredPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-neutral-50/50">
      <div className="w-full max-w-md bg-white border border-neutral-200/80 rounded-2xl shadow-sm p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-4">
          <Clock className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mb-2">
          QR Code Expired
        </h1>

        <p className="text-sm text-neutral-600 leading-relaxed mb-6">
          The link or promotion associated with this QR code has expired and is no longer active. Please contact the merchant or business for an updated link.
        </p>

        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>QuickQR Home</span>
          </Link>
          <Link
            href="/qr-code-generator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition"
          >
            <QrCode className="w-3.5 h-3.5 text-neutral-500" />
            <span>Create Free QR</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
