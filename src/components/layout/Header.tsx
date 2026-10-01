'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, Menu, X, ArrowRight, IndianRupee, MessageSquare, Star, Utensils, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: 'All Tools', href: '/qr-code-generator' },
    { label: 'UPI QR', href: '/upi-qr-code-generator', icon: IndianRupee },
    { label: 'WhatsApp', href: '/whatsapp-qr-code-generator', icon: MessageSquare },
    { label: 'Google Review', href: '/google-review-qr-code-generator', icon: Star },
    { label: 'Digital Menu', href: '/menu-qr-code-generator', icon: Utensils },
    { label: 'Website Widget', href: '/website-qr-widget', icon: Sparkles },
    { label: 'Pricing', href: '/pricing' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-600 transition-colors">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-neutral-900 tracking-tight flex items-center gap-1.5">
                QuickQR <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">India</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-medium -mt-1 hidden sm:block">
                QR Tools for Modern Businesses
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-neutral-500" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition px-2 py-1"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              href="/qr-code-generator"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition shadow-xs hover:shadow-sm"
            >
              <span>Create Free QR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden border-b border-neutral-200 bg-white px-4 pt-2 pb-5 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-neutral-500" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-200 hover:bg-indigo-100"
            >
              <span>Merchant Dashboard</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 text-sm font-semibold hover:bg-neutral-50"
            >
              <span>Sign In</span>
            </Link>
            <Link
              href="/qr-code-generator"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold shadow-xs"
            >
              <span>Create Free QR Code</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
