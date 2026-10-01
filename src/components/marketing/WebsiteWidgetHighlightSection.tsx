import React from 'react';
import Link from 'next/link';
import {
  Code,
  Sparkles,
  ArrowRight,
  IndianRupee,
  MessageSquare,
  Star,
  Utensils,
  Smartphone,
  Globe,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const WebsiteWidgetHighlightSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Your Website',
      description: 'Visitors browse your desktop or mobile site',
      icon: Globe,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      step: '02',
      title: 'Floating QR Widget',
      description: 'Subtle branded button at bottom corner',
      icon: Layers,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      step: '03',
      title: 'Customer Scans',
      description: 'Customer scans QR with smartphone camera',
      icon: Smartphone,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      step: '04',
      title: 'Action Triggered',
      description: 'Instant UPI pay, WhatsApp chat, or review',
      icon: Sparkles,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ];

  const purposes = [
    {
      name: 'Scan & Pay via UPI',
      description: 'Direct bank checkout without payment gateway transaction fees',
      icon: IndianRupee,
      tag: 'UPI Payments',
      color: 'text-emerald-700 bg-emerald-100',
    },
    {
      name: 'WhatsApp Customer Desk',
      description: 'Instant customer inquiry desk with pre-filled product queries',
      icon: MessageSquare,
      tag: 'Live Chat',
      color: 'text-green-700 bg-green-100',
    },
    {
      name: 'Google Review Collector',
      description: 'Direct link to your verified Google Business rating profile',
      icon: Star,
      tag: '5-Star Reviews',
      color: 'text-amber-700 bg-amber-100',
    },
    {
      name: 'Contactless Digital Menu',
      description: 'Full food and beverage menu for dine-in guests and delivery inquiries',
      icon: Utensils,
      tag: 'Digital Menu',
      color: 'text-orange-700 bg-orange-100',
    },
  ];

  return (
    <section className="py-16 bg-neutral-900 text-white relative overflow-hidden border-b border-neutral-800">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Product Capability</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Add QR-Powered Actions Directly to Your Website
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Let visitors quickly scan, pay via UPI, chat on WhatsApp, review your business, or open your menu from their smartphones using a lightweight, embeddable floating widget.
          </p>
        </div>

        {/* Step Flow Diagram: Website -> Floating Widget -> Customer Scans -> Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-5 relative group hover:border-neutral-600 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-neutral-500">
                    STEP {item.step}
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-snug">{item.description}</p>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 text-neutral-600">
                    &rarr;
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4 Purposes Grid & Embed Teaser */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: 4 Purposes (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {purposes.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700/60 space-y-2 hover:border-indigo-500/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-700/60 text-neutral-300">
                      {p.tag}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{p.name}</h4>
                  <p className="text-[11px] text-neutral-400 leading-snug">{p.description}</p>
                </div>
              );
            })}
          </div>

          {/* Right: Technical Features & CTA (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-800/90 border border-neutral-700 rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                <Code className="w-4 h-4" />
                <span>Single Line Embed</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Works on Shopify, WordPress, Next.js & Custom HTML
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Protected by Shadow DOM isolation. Merchant styles never bleed into the widget, and widget styles never affect your host website.
              </p>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Under 45 KB minified with built-in QR generator</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero script injection risks, strictly sanitized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free in Phase 1 with unlimited scans</span>
              </div>
            </div>

            <Link
              href="/website-qr-widget"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
            >
              <span>Build Your Free Website Widget</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
