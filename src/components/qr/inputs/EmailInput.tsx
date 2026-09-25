'use client';

import React from 'react';
import { EmailPayloadInput } from '@/lib/qr/types';
import { Mail } from 'lucide-react';

interface EmailInputProps {
  value: EmailPayloadInput;
  onChange: (value: EmailPayloadInput) => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="email-to" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Recipient Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="email-to"
            type="email"
            required
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="e.g. support@yourcompany.in"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email-subject" className="block text-sm font-medium text-neutral-800 mb-1.5">
          Default Subject Line
        </label>
        <input
          id="email-subject"
          type="text"
          value={value.subject || ''}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          placeholder="e.g. Product Inquiry / Quotation Request"
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
        />
      </div>

      <div>
        <label htmlFor="email-body" className="block text-sm font-medium text-neutral-800 mb-1.5">
          Default Email Body Message
        </label>
        <textarea
          id="email-body"
          rows={3}
          value={value.body || ''}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          placeholder="e.g. Hello team, I would like to learn more about..."
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Pre-populates the customer&apos;s email app (Gmail, Outlook, Apple Mail) upon scanning.
        </p>
      </div>
    </div>
  );
};
