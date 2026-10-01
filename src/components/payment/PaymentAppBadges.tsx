'use client';

import React, { useState } from 'react';

export interface PaymentAppBadgeItem {
  id: string;
  name: string;
  src: string;
  alt: string;
  aspectRatio: number; // width / height
}

export const PAYMENT_APPS: PaymentAppBadgeItem[] = [
  {
    id: 'google-pay',
    name: 'Google Pay',
    src: '/payment-apps/google-pay/google-pay.svg',
    alt: 'Google Pay official logo',
    aspectRatio: 64 / 24, // 2.67
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    src: '/payment-apps/phonepe/phonepe.svg',
    alt: 'PhonePe official logo',
    aspectRatio: 230 / 69.75, // 3.30
  },
  {
    id: 'paytm',
    name: 'Paytm',
    src: '/payment-apps/paytm/paytm.svg',
    alt: 'Paytm official logo',
    aspectRatio: 16.838 / 5.285, // 3.19
  },
  {
    id: 'bhim',
    name: 'BHIM',
    src: '/payment-apps/bhim/bhim.svg',
    alt: 'BHIM official logo',
    aspectRatio: 32.17 / 7.957, // 4.04
  },
  {
    id: 'upi',
    name: 'UPI',
    src: '/payment-apps/upi/upi.svg',
    alt: 'UPI official logo',
    aspectRatio: 99.073 / 35.012, // 2.83
  },
];

export interface PaymentAppBadgesProps {
  className?: string;
  badgeHeight?: number; // height in px for each logo (default 14px)
  variant?: 'pill' | 'plain';
}

/**
 * PaymentAppBadges
 *
 * Renders official payment-app logo assets (Google Pay, PhonePe, Paytm, BHIM, UPI)
 * with balanced visual heights, preserved aspect ratios, and no distortion or recoloring.
 * Fallbacks to official brand text if an asset cannot be rendered.
 */
export const PaymentAppBadges: React.FC<PaymentAppBadgesProps> = ({
  className = '',
  badgeHeight = 14,
  variant = 'pill',
}) => {
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedLogos((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap ${className}`}
      aria-label="Supported UPI Payment Apps"
    >
      {PAYMENT_APPS.map((app) => {
        const hasFailed = failedLogos[app.id];

        if (variant === 'plain') {
          return (
            <div
              key={app.id}
              className="flex items-center justify-center p-0.5"
              style={{ minHeight: `${badgeHeight}px` }}
            >
              {!hasFailed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={app.src}
                  alt={app.alt}
                  style={{
                    height: `${badgeHeight}px`,
                    width: 'auto',
                    maxWidth: '65px',
                  }}
                  className="object-contain block"
                  onError={() => handleImageError(app.id)}
                  loading="eager"
                />
              ) : (
                <span className="text-[9.5px] font-bold text-neutral-700 font-mono">
                  {app.name}
                </span>
              )}
            </div>
          );
        }

        // Default 'pill' variant: clean white container with subtle neutral border
        return (
          <div
            key={app.id}
            className="bg-white border border-neutral-200/90 rounded-md px-1.5 py-0.5 flex items-center justify-center shadow-2xs transition-transform hover:scale-[1.02]"
            style={{ minHeight: `${badgeHeight + 4}px` }}
          >
            {!hasFailed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={app.src}
                alt={app.alt}
                style={{
                  height: `${badgeHeight}px`,
                  width: 'auto',
                  maxWidth: '60px',
                }}
                className="object-contain block"
                onError={() => handleImageError(app.id)}
                loading="eager"
              />
            ) : (
              <span className="text-[9.5px] font-bold text-neutral-700">
                {app.name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
