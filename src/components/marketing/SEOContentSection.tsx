import React from 'react';
import Link from 'next/link';
import { QRType } from '@/lib/qr/types';
import { QR_TYPE_INFO } from '@/lib/qr/presets';
import { CheckCircle2, ArrowRight, Printer, HelpCircle } from 'lucide-react';

interface SEOContentProps {
  type: QRType;
  title: string;
  introText: string;
  steps: { title: string; description: string }[];
  useCases: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  disclaimer?: string;
}

export const SEOContentSection: React.FC<SEOContentProps> = ({
  type,
  title,
  introText,
  steps,
  useCases,
  faqs,
  disclaimer,
}) => {
  const currentInfo = QR_TYPE_INFO[type];
  const allTypes = Object.keys(QR_TYPE_INFO) as QRType[];
  const relatedTypes = allTypes.filter((t) => t !== type).slice(0, 4);

  return (
    <article className="py-16 md:py-20 bg-neutral-50/70 border-t border-neutral-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section 1: Overview */}
        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            About {title || currentInfo.title}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            {introText}
          </p>
          {disclaimer && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <strong>Notice:</strong> {disclaimer}
            </div>
          )}
        </section>

        {/* Section 2: Step-by-Step Instructions */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-neutral-900">
            How to Create a {currentInfo.shortTitle} QR Code in 3 Simple Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2 relative"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-sm text-neutral-900 pt-1">{step.title}</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Business Use Cases */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-neutral-900">
            Recommended Business Use Cases
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="bg-white p-5 rounded-2xl border border-neutral-200/80 space-y-1.5"
              >
                <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uc.title}</span>
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed pl-6">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Print & Reliability Advice */}
        <section className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
            <Printer className="w-5 h-5 text-indigo-600" />
            <span>Printing & Deployment Best Practices</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-600">
            <div className="space-y-1">
              <strong className="text-neutral-900 block font-semibold">1. Quiet Zone Clearance</strong>
              <p>Always maintain at least 3-4 modules of blank space around the QR so phone cameras differentiate it from background graphics.</p>
            </div>
            <div className="space-y-1">
              <strong className="text-neutral-900 block font-semibold">2. Sizing Standards</strong>
              <p>For table stands and counter stickers, ensure a minimum size of 4x4 cm. For shop banners, use at least 15x15 cm.</p>
            </div>
            <div className="space-y-1">
              <strong className="text-neutral-900 block font-semibold">3. High Contrast Finish</strong>
              <p>Matte finishes reduce reflection from restaurant lighting and outdoor sunlight, maximizing instant scan rate.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Tool Specific FAQs */}
        {faqs.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>Questions About {currentInfo.shortTitle} QR Codes</span>
            </h3>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="bg-white p-5 rounded-2xl border border-neutral-200/80 space-y-1.5"
                >
                  <h4 className="font-bold text-sm text-neutral-900">{faq.question}</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 6: Internal Links / Related Tools */}
        <section className="pt-8 border-t border-neutral-200 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Explore Other Free QR Generators
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {relatedTypes.map((rType) => {
              const info = QR_TYPE_INFO[rType];
              return (
                <Link
                  key={rType}
                  href={info.path}
                  className="p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-indigo-400 hover:bg-neutral-50 transition group"
                >
                  <div className="text-xs font-bold text-neutral-900 group-hover:text-indigo-600 flex items-center justify-between">
                    <span>{info.shortTitle}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                    {info.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </article>
  );
};
