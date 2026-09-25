import React from 'react';
import { ShieldCheck, Zap, Ban, Printer, Lock, CheckCircle2 } from 'lucide-react';

const ADVANTAGES = [
  {
    icon: Ban,
    title: 'No Expiration Triggers or Paywalls',
    description: 'Unlike commercial generators that quietly deactivate your printed codes after 14 days demanding a monthly fee, our static QR codes are permanent. Once printed, they work forever.',
  },
  {
    icon: ShieldCheck,
    title: '100% Client-Side Privacy',
    description: 'All static QR codes are computed directly in your browser JavaScript. Your Wi-Fi passwords, customer vCards, and UPI merchant codes are never transmitted to or saved on remote servers.',
  },
  {
    icon: Zap,
    title: 'Integrated Optical Scan Safety Check',
    description: 'Our engine uses mathematical contrast evaluation and real-time barcode decoding to ensure custom colors and logos never compromise phone camera readability.',
  },
  {
    icon: Printer,
    title: 'True Vector SVG & 300 DPI Export',
    description: 'Download crisp, infinitely scalable SVG files for sign-makers and printers, or ultra-high resolution 3000px PNGs that stay sharp on large posters and billboards.',
  },
  {
    icon: Lock,
    title: 'Direct Scan Routing (No Middleman Ads)',
    description: 'When your customer scans the QR code, they are directed immediately to your target link or payment intent without annoying interstitial ads or third-party tracking delays.',
  },
  {
    icon: CheckCircle2,
    title: 'NPCI Standards & Indian Banking Ready',
    description: 'Tested extensively with Google Pay, PhonePe, Paytm, CRED, BHIM, and Axis/HDFC/ICICI banking apps across iOS and Android.',
  },
];

export const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Engineered with Integrity
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Why Indian Businesses Choose QuickQR Over Generic Tools
          </h2>
          <p className="text-neutral-600 text-sm mt-2">
            Built from first principles for reliability, speed, and clean business ethics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADVANTAGES.map((adv) => {
            const Icon = adv.icon;
            return (
              <div
                key={adv.title}
                className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">{adv.title}</h3>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  {adv.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
