import React from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  MessageSquare,
  Globe,
  Star,
  Utensils,
  Wifi,
  Contact,
  MapPin,
  FileText,
  PhoneCall,
  Mail,
  AlignLeft,
  ArrowRight,
} from 'lucide-react';
import { QR_TYPE_INFO } from '@/lib/qr/presets';
import { QRType } from '@/lib/qr/types';

const ICON_MAP: Record<string, React.ElementType> = {
  IndianRupee,
  MessageSquare,
  Globe,
  Star,
  Utensils,
  Wifi,
  Contact,
  MapPin,
  FileText,
  PhoneCall,
  Mail,
  AlignLeft,
};

export const PopularToolsGrid: React.FC = () => {
  const qrTypes = Object.keys(QR_TYPE_INFO) as QRType[];

  return (
    <section className="py-16 md:py-20 bg-neutral-50 border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Dedicated Generators
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Popular QR Code Generators for Indian Commerce
          </h2>
          <p className="text-neutral-600 text-sm mt-2">
            Every business touchpoint covered — from instant UPI counter payments to direct WhatsApp chats and 5-star Google review stands.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {qrTypes.map((type) => {
            const tool = QR_TYPE_INFO[type];
            const Icon = ICON_MAP[tool.icon] || Globe;

            return (
              <Link
                key={type}
                href={tool.path}
                className="group relative bg-white p-5 rounded-2xl border border-neutral-200/80 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 group-hover:bg-indigo-600 group-hover:text-white text-neutral-800 flex items-center justify-center transition-colors shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    {tool.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-900 group-hover:text-indigo-600">
                  <span>Generate Free QR</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
