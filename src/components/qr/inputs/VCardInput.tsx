'use client';

import React from 'react';
import { VCardPayloadInput } from '@/lib/qr/types';
import { Contact } from 'lucide-react';

interface VCardInputProps {
  value: VCardPayloadInput;
  onChange: (value: VCardPayloadInput) => void;
}

export const VCardInput: React.FC<VCardInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="vc-first" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="vc-first"
            type="text"
            required
            value={value.firstName}
            onChange={(e) => onChange({ ...value, firstName: e.target.value })}
            placeholder="e.g. Rajesh"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
        <div>
          <label htmlFor="vc-last" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Last Name
          </label>
          <input
            id="vc-last"
            type="text"
            value={value.lastName}
            onChange={(e) => onChange({ ...value, lastName: e.target.value })}
            placeholder="e.g. Sharma"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Organization & Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="vc-org" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Company / Organization
          </label>
          <input
            id="vc-org"
            type="text"
            value={value.organization || ''}
            onChange={(e) => onChange({ ...value, organization: e.target.value })}
            placeholder="e.g. Apex Enterprises Pvt Ltd"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
        <div>
          <label htmlFor="vc-title" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Job Title / Designation
          </label>
          <input
            id="vc-title"
            type="text"
            value={value.title || ''}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. Founder & CEO"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Phone Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="vc-mobile" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Mobile Number
          </label>
          <input
            id="vc-mobile"
            type="tel"
            value={value.mobile || ''}
            onChange={(e) => onChange({ ...value, mobile: e.target.value })}
            placeholder="e.g. +91 98765 43210"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
        <div>
          <label htmlFor="vc-phone" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Office Phone / Landline
          </label>
          <input
            id="vc-phone"
            type="tel"
            value={value.phone || ''}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="e.g. +91 11 2345 6789"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Email & Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="vc-email" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Email Address
          </label>
          <input
            id="vc-email"
            type="email"
            value={value.email || ''}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="e.g. rajesh@apex.in"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
        <div>
          <label htmlFor="vc-web" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Website URL
          </label>
          <input
            id="vc-web"
            type="url"
            value={value.website || ''}
            onChange={(e) => onChange({ ...value, website: e.target.value })}
            placeholder="e.g. https://apex.in"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Address */}
      <div className="pt-2 border-t border-neutral-200">
        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Office Address Details
        </label>
        <div className="space-y-3">
          <input
            type="text"
            value={value.street || ''}
            onChange={(e) => onChange({ ...value, street: e.target.value })}
            placeholder="Street address / Building / Floor"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              type="text"
              value={value.city || ''}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="City"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
            <input
              type="text"
              value={value.state || ''}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              placeholder="State"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
            <input
              type="text"
              value={value.zipCode || ''}
              onChange={(e) => onChange({ ...value, zipCode: e.target.value })}
              placeholder="PIN Code"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
            <input
              type="text"
              value={value.country || 'India'}
              onChange={(e) => onChange({ ...value, country: e.target.value })}
              placeholder="Country"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-indigo-900 bg-indigo-50 border border-indigo-200/60 p-3 rounded-lg">
        <Contact className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>Standard vCard 3.0: Scanning prompts smartphones to save the contact directly into Google Contacts, Apple Contacts, or Outlook.</span>
      </div>
    </div>
  );
};
