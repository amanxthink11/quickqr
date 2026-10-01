'use client';

import { QRCustomization, QRReadabilityResult } from './types';
import jsQR from 'jsqr';

export interface QRCodeStylingInstance {
  append: (element: HTMLElement) => Promise<void> | void;
  update: (options: Record<string, unknown>) => void;
  getRawData: (extension: 'png' | 'jpeg' | 'svg' | 'webp') => Promise<Blob | null>;
}

export interface QRCodeStylingConstructor {
  new (options: Record<string, unknown>): QRCodeStylingInstance;
}

let QRCodeStylingModule: QRCodeStylingConstructor | null = null;

export async function getQRCodeStyling(): Promise<QRCodeStylingConstructor | null> {
  if (typeof window === 'undefined') return null;
  if (!QRCodeStylingModule) {
    const mod = await import('qr-code-styling');
    QRCodeStylingModule = (mod.default || mod) as QRCodeStylingConstructor;
  }
  return QRCodeStylingModule;
}

/**
 * Creates or updates a QRCodeStyling instance with the given configuration
 */
export async function createQRCodeInstance(
  payload: string,
  customization: QRCustomization
): Promise<QRCodeStylingInstance | null> {
  const QRCodeClass = await getQRCodeStyling();
  if (!QRCodeClass) return null;

  // Map our dotStyle to qr-code-styling dot options
  let dotType: 'square' | 'dots' | 'rounded' | 'classy' | 'extra-rounded' = 'rounded';
  if (customization.dotStyle) {
    dotType = customization.dotStyle;
  }

  // Map eye corners
  let cornerSquareType: 'square' | 'dot' | 'extra-rounded' = 'extra-rounded';
  let cornerDotType: 'square' | 'dot' = 'dot';

  if (customization.eyeStyle === 'square') {
    cornerSquareType = 'square';
    cornerDotType = 'square';
  } else if (customization.eyeStyle === 'circle') {
    cornerSquareType = 'extra-rounded';
    cornerDotType = 'dot';
  } else if (customization.eyeStyle === 'rounded') {
    cornerSquareType = 'extra-rounded';
    cornerDotType = 'square';
  }

  const options: Record<string, unknown> = {
    width: customization.size || 320,
    height: customization.size || 320,
    type: 'canvas',
    data: payload || 'https://quickqr.amanxthink11.com',
    margin: (customization.margin ?? 3) * 4,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: customization.errorCorrectionLevel || 'M',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: customization.logoSize || 0.22,
      margin: customization.logoMargin ?? 2,
      crossOrigin: 'anonymous',
    },
    dotsOptions: {
      color: customization.fgColor || '#1E293B',
      type: dotType,
    },
    backgroundOptions: {
      color: customization.bgColor || '#FFFFFF',
    },
    cornersSquareOptions: {
      color: customization.eyeColor || customization.fgColor || '#1E293B',
      type: cornerSquareType,
    },
    cornersDotOptions: {
      color: customization.eyeColor || customization.fgColor || '#1E293B',
      type: cornerDotType,
    },
    image: customization.logoUrl || undefined,
  };

  return new QRCodeClass(options);
}

/**
 * Validates optical scan readability by running jsQR decoder directly on canvas pixels
 */
export function verifyOpticalScan(
  canvas: HTMLCanvasElement,
  expectedPayload: string
): QRReadabilityResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      isReadable: true,
      score: 85,
      issues: ['Canvas context unavailable for optical test.'],
      suggestions: [],
    };
  }

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data) {
      const isExactMatch = code.data === expectedPayload;
      return {
        isReadable: true,
        score: isExactMatch ? 100 : 90,
        decodedText: code.data,
        issues: isExactMatch ? [] : ['Decoded payload slightly differs from expected.'],
        suggestions: isExactMatch ? ['Scans perfectly with camera!'] : [],
      };
    } else {
      issues.push('Scanner could not decode the QR code pattern.');
      suggestions.push('Try increasing contrast, reducing logo size, or setting Error Correction to "H".');
      return {
        isReadable: false,
        score: 30,
        issues,
        suggestions,
      };
    }
  } catch {
    // If canvas cross-origin or buffer read issue
    return {
      isReadable: false,
      score: 50,
      issues: ['Optical camera simulation check restricted by browser canvas security. Verify scan with your phone camera before printing.'],
      suggestions: ['Test scan directly using your phone camera app.'],
    };
  }
}

