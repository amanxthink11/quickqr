'use client';

import React from 'react';
import { QRType } from '@/lib/qr/types';
import { QR_TYPE_INFO } from '@/lib/qr/presets';
import {
  IndianRupee,
  MessageSquare,
  Globe,
  Wifi,
  Contact,
  PhoneCall,
  Mail,
  AlignLeft,
  MapPin,
  Star,
  FileText,
  Utensils,
} from 'lucide-react';

interface QRTypeSelectorProps {
  selectedType: QRType;
  onSelectType: (type: QRType) => void;
}

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  IndianRupee,
  MessageSquare,
  Globe,
  Wifi,
  Contact,
  PhoneCall,
  Mail,
  AlignLeft,
  MapPin,
  Star,
  FileText,
  Utensils,
};

export const QRTypeSelector: React.FC<QRTypeSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  const qrTypes = Object.keys(QR_TYPE_INFO) as QRType[];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Select QR Code Type
        </span>
        <span className="text-xs text-neutral-500">12 Ready Generators</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {qrTypes.map((type) => {
          const info = QR_TYPE_INFO[type];
          const Icon = ICON_COMPONENTS[info.icon] || Globe;
          const isSelected = selectedType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(type)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-sm ring-2 ring-indigo-600/30'
                  : 'border-neutral-200/90 bg-white hover:border-neutral-300 hover:bg-neutral-50/80 text-neutral-700'
              }`}
            >
              {info.badge && (
                <span
                  className={`absolute -top-1.5 right-1.5 px-1.5 py-0.2 text-[9px] font-semibold rounded-full uppercase tracking-tighter ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                  }`}
                >
                  {info.badge}
                </span>
              )}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200 group-hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs tracking-tight line-clamp-1">{info.shortTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
