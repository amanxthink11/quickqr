'use client';

import React from 'react';
import { WhatsAppPayloadInput } from '@/lib/qr/types';
import { MessageSquare, ShoppingBag, HelpCircle, Calendar, FileText, Package } from 'lucide-react';

interface WhatsAppInputProps {
  value: WhatsAppPayloadInput;
  onChange: (value: WhatsAppPayloadInput) => void;
}

const MESSAGE_PRESETS = [
  {
    title: 'Contact Us',
    text: 'Hi! I would like to get more information about your products and services.',
    icon: MessageSquare,
  },
  {
    title: 'Order Now',
    text: 'Hello, I want to place an order from your catalog. Please share the details.',
    icon: ShoppingBag,
  },
  {
    title: 'Get Quote',
    text: 'Hi, I need a customized price quotation. Could you please share your rate card?',
    icon: FileText,
  },
  {
    title: 'Customer Support',
    text: 'Hello Support Team, I need help with an existing order/service.',
    icon: HelpCircle,
  },
  {
    title: 'Book Appointment',
    text: 'Hello! I would like to schedule an appointment/consultation with your team.',
    icon: Calendar,
  },
  {
    title: 'Product Enquiry',
    text: 'Hi, is this item available in stock? Could you please share specifications and delivery time?',
    icon: Package,
  },
];

export const WhatsAppInput: React.FC<WhatsAppInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-5">
      {/* Phone Number & Country Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="wa-country" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Country Code <span className="text-red-500">*</span>
          </label>
          <select
            id="wa-country"
            value={value.countryCode}
            onChange={(e) => onChange({ ...value, countryCode: e.target.value })}
            className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
          >
            <option value="+91">🇮🇳 India (+91)</option>
            <option value="+1">🇺🇸 US / Canada (+1)</option>
            <option value="+44">🇬🇧 UK (+44)</option>
            <option value="+971">🇦🇪 UAE (+971)</option>
            <option value="+65">🇸🇬 Singapore (+65)</option>
            <option value="+61">🇦🇺 Australia (+61)</option>
            <option value="+49">🇩🇪 Germany (+49)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="wa-phone" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            WhatsApp Number <span className="text-red-500">*</span>
          </label>
          <input
            id="wa-phone"
            type="tel"
            required
            value={value.phoneNumber}
            onChange={(e) => onChange({ ...value, phoneNumber: e.target.value })}
            placeholder="e.g. 9876543210 (10 digits)"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Enter the active WhatsApp or WhatsApp Business mobile number without country code.
          </p>
        </div>
      </div>

      {/* Preset Messages */}
      <div>
        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Pre-filled Message Templates
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MESSAGE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = value.message === preset.text;
            return (
              <button
                key={preset.title}
                type="button"
                onClick={() => onChange({ ...value, message: preset.text })}
                className={`p-2.5 text-left rounded-lg border text-xs flex flex-col gap-1 transition ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-600'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                  <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{preset.title}</span>
                </div>
                <span className="text-neutral-500 line-clamp-1">{preset.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Body */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="wa-message" className="block text-sm font-semibold text-neutral-900">
            Pre-filled Message (Optional)
          </label>
          {value.message && (
            <button
              type="button"
              onClick={() => onChange({ ...value, message: '' })}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Clear message
            </button>
          )}
        </div>
        <textarea
          id="wa-message"
          rows={3}
          value={value.message || ''}
          onChange={(e) => onChange({ ...value, message: e.target.value })}
          placeholder="e.g. Hello, I want to book a table for 4 people tonight."
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
        />
        <p className="mt-1 text-xs text-neutral-500">
          When customers scan the QR, WhatsApp automatically opens with this message ready to send with one tap.
        </p>
      </div>

      {/* Visual Live Preview of WhatsApp Action */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
            WA
          </div>
          <div>
            <div className="font-semibold text-emerald-950">
              {value.countryCode} {value.phoneNumber || 'XXXXXXXXXX'}
            </div>
            <div className="text-emerald-800 line-clamp-1">
              {value.message || 'Customer opens direct chat'}
            </div>
          </div>
        </div>
        <span className="bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-full font-medium text-[11px]">
          1-Tap Chat
        </span>
      </div>
    </div>
  );
};
