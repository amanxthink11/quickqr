'use client';

import React from 'react';
import { PDFPayloadInput } from '@/lib/qr/types';
import { FileText, AlertCircle, Cloud } from 'lucide-react';

interface PDFInputProps {
  value: PDFPayloadInput;
  onChange: (value: PDFPayloadInput) => void;
}

export const PDFInput: React.FC<PDFInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Scope Disclaimer */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">Public PDF Document Link</p>
          <p className="text-blue-800 leading-relaxed">
            In this phase, QuickQR creates a high-reliability QR code pointing directly to your existing public PDF document (e.g. hosted on Google Drive, Dropbox, your website, or cloud storage). Native file upload/hosting will be part of the upcoming Pro Dynamic QR suite.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="pdf-url" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Public PDF Document URL <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <FileText className="w-4 h-4 text-rose-600" />
          </div>
          <input
            id="pdf-url"
            type="url"
            required
            value={value.pdfUrl}
            onChange={(e) => onChange({ ...value, pdfUrl: e.target.value })}
            placeholder="https://yourdomain.in/catalog-2026.pdf or Google Drive link"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Make sure the link has public viewing permissions enabled.
        </p>
      </div>

      <div>
        <label htmlFor="pdf-title" className="block text-sm font-medium text-neutral-800 mb-1.5">
          Document Title / Label (Optional)
        </label>
        <input
          id="pdf-title"
          type="text"
          value={value.documentTitle || ''}
          onChange={(e) => onChange({ ...value, documentTitle: e.target.value })}
          placeholder="e.g. Product Catalog / Real Estate Brochure"
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
        />
      </div>

      <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600">
        <Cloud className="w-4 h-4 text-neutral-500 shrink-0" />
        <span>Works with Google Drive, OneDrive, Amazon S3, Dropbox, or any standard PDF web address.</span>
      </div>
    </div>
  );
};
