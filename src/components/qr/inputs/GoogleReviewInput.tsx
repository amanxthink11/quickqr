'use client';

import React from 'react';
import { GoogleReviewPayloadInput } from '@/lib/qr/types';
import { Star, HelpCircle, ExternalLink } from 'lucide-react';

interface GoogleReviewInputProps {
  value: GoogleReviewPayloadInput;
  onChange: (value: GoogleReviewPayloadInput) => void;
  onApplyPresetText?: (text: string) => void;
}

const REVIEW_PRESETS = [
  'Review Us',
  'Share Your Feedback',
  'Rate Our Service',
  'Scan & Review',
  'Review Us on Google',
];

export const GoogleReviewInput: React.FC<GoogleReviewInputProps> = ({
  value,
  onChange,
  onApplyPresetText,
}) => {
  return (
    <div className="space-y-4">
      {/* Review URL */}
      <div>
        <label htmlFor="review-url" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Google Review Link <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <input
            id="review-url"
            type="url"
            required
            value={value.reviewUrl}
            onChange={(e) => onChange({ ...value, reviewUrl: e.target.value })}
            placeholder="e.g. https://g.page/r/your-code/review"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Must be your business&apos;s direct Google review link.
        </p>
      </div>

      {/* Frame Text Callout Presets */}
      <div>
        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Recommended Stand Label Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {REVIEW_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onApplyPresetText?.(preset)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Step by step guide to obtain review link */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2.5 text-xs text-neutral-700">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>How to obtain your official Google Review link:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 pl-1 text-neutral-600 leading-relaxed">
          <li>
            Sign in to the Google account managing your{' '}
            <a
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 underline inline-flex items-center gap-0.5"
            >
              Google Business Profile <ExternalLink className="w-3 h-3" />
            </a>.
          </li>
          <li>Search for your business name directly on Google Search.</li>
          <li>
            Look for the business dashboard box and tap <strong>&ldquo;Ask for reviews&rdquo;</strong> or <strong>&ldquo;Get more reviews&rdquo;</strong>.
          </li>
          <li>
            Copy the short link (format: <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px]">https://g.page/r/.../review</code>).
          </li>
          <li>Paste that exact URL above.</li>
        </ol>
      </div>
    </div>
  );
};
