'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, QrCode, BarChart3, Globe, Key, Settings, Plus } from 'lucide-react';

export const DashboardNav: React.FC = () => {
  const pathname = usePathname();

  const links = [
    {
      label: 'Overview',
      href: '/dashboard',
      exact: true,
      icon: LayoutDashboard,
    },
    {
      label: 'QR Codes',
      href: '/dashboard/qr-codes',
      exact: false,
      icon: QrCode,
    },
    {
      label: 'Widgets',
      href: '/dashboard/widgets',
      exact: false,
      icon: Globe,
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      exact: false,
      icon: BarChart3,
    },
    {
      label: 'API Keys',
      href: '/dashboard/api-keys',
      exact: false,
      icon: Key,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      exact: true,
      icon: Settings,
    },
  ];

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex items-center justify-between border-b border-neutral-200/80 bg-white px-4 sm:px-6 lg:px-8">
      {/* Navigation tabs */}
      <nav className="flex space-x-1 sm:space-x-2 -mb-px overflow-x-auto py-1">
        {links.map((link) => {
          const active = isLinkActive(link.href, link.exact);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                active
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Create CTA */}
      <div className="hidden sm:flex items-center gap-2 py-1">
        <Link
          href="/dashboard/qr-codes/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Dynamic QR</span>
        </Link>
      </div>
    </div>
  );
};
