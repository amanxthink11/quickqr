'use client';

import React, { useState } from 'react';
import { Code, Copy, Check, X, Sparkles, ShieldCheck } from 'lucide-react';
import { generateRemoteEmbedCode } from '@/lib/widget/config';

interface WidgetEmbedModalProps {
  publicId: string;
  widgetName: string;
}

export const WidgetEmbedModal: React.FC<WidgetEmbedModalProps> = ({
  publicId,
  widgetName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'html' | 'wordpress' | 'shopify'>('html');

  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://quickqr.art';

  const embedCode = generateRemoteEmbedCode(publicId, origin);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition"
        title="View website embed code"
      >
        <Code className="w-3.5 h-3.5" />
        <span>Embed Code</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-100 space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Remote Synced Widget</span>
              </div>
              <h3 className="text-base font-extrabold text-neutral-900">
                Embed &ldquo;{widgetName}&rdquo; on Your Website
              </h3>
              <p className="text-xs text-neutral-500">
                Paste this snippet into your website template. Future configuration changes in this dashboard update your live widget automatically without touching this code.
              </p>
            </div>

            {/* Embed Code Snippet Container */}
            <div className="relative bg-neutral-950 rounded-2xl p-4 font-mono text-xs text-neutral-200 border border-neutral-800">
              <pre className="overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {embedCode}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Platform Instructions */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 border-b border-neutral-200 text-xs font-bold pb-2">
                <button
                  type="button"
                  onClick={() => setActivePlatform('html')}
                  className={`pb-1 px-1 transition border-b-2 -mb-2 ${
                    activePlatform === 'html'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Plain HTML
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatform('wordpress')}
                  className={`pb-1 px-1 transition border-b-2 -mb-2 ${
                    activePlatform === 'wordpress'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  WordPress
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatform('shopify')}
                  className={`pb-1 px-1 transition border-b-2 -mb-2 ${
                    activePlatform === 'shopify'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Shopify
                </button>
              </div>

              <div className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                {activePlatform === 'html' && (
                  <p>
                    Paste the snippet right before the closing{' '}
                    <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800 font-mono">
                      &lt;/body&gt;
                    </code>{' '}
                    tag in your HTML file.
                  </p>
                )}
                {activePlatform === 'wordpress' && (
                  <p>
                    In your WordPress dashboard, navigate to <strong>Appearance &gt; Theme File Editor</strong>, open{' '}
                    <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800 font-mono">
                      footer.php
                    </code>
                    , and paste the code snippet immediately before{' '}
                    <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800 font-mono">
                      &lt;/body&gt;
                    </code>
                    . Alternatively, use any &ldquo;Header &amp; Footer Code&rdquo; plugin.
                  </p>
                )}
                {activePlatform === 'shopify' && (
                  <p>
                    From your Shopify admin, go to <strong>Online Store &gt; Themes &gt; Edit Code</strong>. Select{' '}
                    <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800 font-mono">
                      theme.liquid
                    </code>
                    , scroll down to the bottom, and paste the code right before{' '}
                    <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800 font-mono">
                      &lt;/body&gt;
                    </code>
                    .
                  </p>
                )}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Encapsulated via Shadow DOM. Zero style conflicts with your site theme. 44 KB async script.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
