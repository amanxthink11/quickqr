import React from 'react';
import { BarChart3, RefreshCw, Lock, Globe, Clock } from 'lucide-react';

export const DynamicQRTeaser: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-neutral-900 text-white border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-amber-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Product Roadmap • Phase 2 Coming Soon</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Upcoming: Dynamic QR & Enterprise Analytics
          </h2>

          <p className="text-neutral-400 text-sm leading-relaxed">
            While Phase 1 delivers unlimited, forever-free static QR generation with client-side privacy, our team is actively architecting our cloud-backed Dynamic QR platform.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-700 flex items-center justify-center text-amber-400 mb-3">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Editable Destinations</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Change where your printed QR code redirects anytime without reprinting your posters, menus, or stands.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-700 flex items-center justify-center text-emerald-400 mb-3">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Real-Time Scan Analytics</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Track scans by city across India, device operating system, peak hours, and marketing campaign attribution.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-700 flex items-center justify-center text-indigo-400 mb-3">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Custom Brand Domains</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Use your company&apos;s domain (e.g. <code className="text-neutral-300">qr.yourbrand.in</code>) for white-labeled redirection.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-700 flex items-center justify-center text-rose-400 mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Password & Expiry Locks</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Protect confidential PDF documents or set automatic QR expiration for time-limited flash sales.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-neutral-500">
          Phase 1 is 100% focused on free, high-reliability static QR tools. No credit card or account required.
        </div>
      </div>
    </section>
  );
};
