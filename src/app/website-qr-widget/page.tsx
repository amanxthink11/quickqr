import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  ArrowRight,
  IndianRupee,
  MessageSquare,
  Star,
  Utensils,
  Layers,
} from 'lucide-react';
import { WebsiteWidgetBuilder } from '@/components/widget/WebsiteWidgetBuilder';

export const metadata: Metadata = {
  title: 'Website QR Widget Generator | Embed Floating QR Actions on Any Website',
  description:
    'Add an embeddable floating QR widget to any website. Let visitors scan and pay via UPI, chat on WhatsApp, leave Google reviews, or view menus directly from their phone.',
  alternates: {
    canonical: 'https://quickqr.art/website-qr-widget',
  },
  openGraph: {
    title: 'Website QR Widget Generator | QuickQR India',
    description:
      'Embed a floating QR button on any website. Enable 1-click UPI payments, WhatsApp chat, and Google reviews for desktop and mobile visitors.',
    url: 'https://quickqr.art/website-qr-widget',
    siteName: 'QuickQR',
    type: 'website',
  },
};

export default function WebsiteQrWidgetPage() {
  const faqs = [
    {
      q: 'How does the Website QR Widget work?',
      a: 'The widget embeds a subtle floating button (e.g., "Scan to Pay" or "Chat on WhatsApp") on your website. When a desktop or mobile visitor clicks it, an accessible QR modal appears with your verified QR code, allowing them to scan with their smartphone camera or mobile app.',
    },
    {
      q: 'Will the widget conflict with my website styles or WordPress theme?',
      a: 'No. The widget uses Shadow DOM encapsulation. All CSS styles, fonts, and layout rules are completely isolated inside the shadow root, meaning your site styling will never break the widget, and the widget will never bleed styles into your host page.',
    },
    {
      q: 'Does QuickQR charge a transaction fee or subscription for the widget?',
      a: 'No. The Website QR Widget is completely free in Phase 1. Static QR codes have no scan limits, no transaction cuts, and no expiration dates. Direct UPI payments go straight from customer bank to merchant bank.',
    },
    {
      q: 'How fast and lightweight is the widget script?',
      a: 'The widget script (widget.js) is under 45 KB minified and includes the entire QR code rendering engine natively. It makes zero third-party tracking calls and loads asynchronously to protect your Core Web Vitals and page speed.',
    },
    {
      q: 'Can I install this on Shopify, WordPress, Webflow, or custom HTML?',
      a: 'Yes! It works on any platform that allows you to paste a single <script> tag before the closing </body> tag. Complete installation instructions for HTML, WordPress, Shopify, and Next.js are provided directly in the generator.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>New Feature &bull; Embeddable Website Widget</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
            Website QR Widget Generator
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            Add a floating QR widget to any website. Let website visitors quickly scan, pay via UPI, chat on WhatsApp, review your business, or access your menu from their smartphones.
          </p>
        </div>

        {/* Interactive Builder */}
        <WebsiteWidgetBuilder />

        {/* Feature Highlights Section */}
        <div className="pt-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-extrabold text-neutral-900">
              Why Add a Floating QR Widget to Your Website?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2">
              Transform desktop visitors into direct mobile interactions in two seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">Instant Mobile Handoff</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Over 70% of Indian consumers prefer transacting via UPI or chatting on WhatsApp from their mobile apps. The widget bridges desktop viewers to their phones effortlessly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">Isolated Shadow DOM</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Zero styling collisions. Built inside an isolated Shadow DOM container so your website’s theme or CSS resets cannot alter widget styling, and widget CSS never leaks into your site.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">Zero Script Injection Risks</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Treated with strict input sanitization. Strips arbitrary HTML/script tags, blocks dangerous javascript: protocols, and safely renders through secure DOM nodes.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 text-center sm:text-left">
            Popular Website Widget Use Cases
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/upi-qr-code-generator"
              className="p-4 rounded-xl border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                <IndianRupee className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700">
                UPI Direct Checkout
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Receive instant direct bank payments on desktop websites without payment gateway fees.
              </p>
            </Link>

            <Link
              href="/whatsapp-qr-code-generator"
              className="p-4 rounded-xl border border-neutral-200 hover:border-green-500 hover:bg-green-50/20 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center mb-2.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-neutral-900 group-hover:text-green-700">
                WhatsApp Live Help Desk
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Let customers scan to start instant conversations with pre-filled product inquiries.
              </p>
            </Link>

            <Link
              href="/google-review-qr-code-generator"
              className="p-4 rounded-xl border border-neutral-200 hover:border-amber-500 hover:bg-amber-50/20 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5">
                <Star className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-neutral-900 group-hover:text-amber-700">
                Google Review Collector
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Capture verified 5-star Google Business ratings from happy clients and diners.
              </p>
            </Link>

            <Link
              href="/menu-qr-code-generator"
              className="p-4 rounded-xl border border-neutral-200 hover:border-orange-500 hover:bg-orange-50/20 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center mb-2.5">
                <Utensils className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-neutral-900 group-hover:text-orange-700">
                Digital Food Menu
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Enable restaurant visitors to browse your digital menu seamlessly on their smartphones.
              </p>
            </Link>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-neutral-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-1.5 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <h3 className="font-bold text-neutral-900 text-xs sm:text-sm">{faq.q}</h3>
                <p className="text-neutral-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA to Physical Table Stand */}
        <div className="p-8 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Physical QR Displays
            </span>
            <h3 className="text-xl font-black text-white">
              Need a physical display for your counter or dining tables?
            </h3>
            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
              Design a realistic, print-ready acrylic table stand or folded table tent with custom branding, UPI logos, and high-resolution export.
            </p>
          </div>

          <Link
            href="/upi-qr-code-generator"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold transition shrink-0 shadow-xs"
          >
            <span>Design Table Stand</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
