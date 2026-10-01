import { QRType, QRCustomization } from './types';
import { escapeXml } from './download';

export type TableStandFormat = 'table-tent' | 'counter-stand' | 'a6' | 'a5' | 'a4' | 'square';
export type TableStandOrientation = 'portrait' | 'landscape';

export interface TableStandConfig {
  format: TableStandFormat;
  orientation: TableStandOrientation;
  businessName: string;
  headlineCTA: string;
  supportingText: string;
  footerText: string;
  accentColor: string;
  showFoldLine: boolean;
}

/**
 * Returns default CTA headlines, supporting text, and accent colors tailored to each QR type.
 */
export function getDefaultTableStandConfig(
  type: QRType,
  businessName = 'Your Business Name'
): TableStandConfig {
  switch (type) {
    case 'upi':
      return {
        format: 'table-tent',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'SCAN & PAY WITH ANY UPI APP',
        supportingText: 'Supports Google Pay, PhonePe, Paytm, CRED & BHIM',
        footerText: 'Direct Bank-to-Bank Payment • Zero Commission',
        accentColor: '#059669', // Emerald
        showFoldLine: true,
      };

    case 'whatsapp':
      return {
        format: 'counter-stand',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'CHAT WITH US ON WHATSAPP',
        supportingText: 'Scan with your camera to start a direct WhatsApp chat',
        footerText: 'Quick Customer Support & Orders',
        accentColor: '#16a34a', // WhatsApp green
        showFoldLine: false,
      };

    case 'review':
      return {
        format: 'table-tent',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'REVIEW US ON GOOGLE',
        supportingText: 'Scan to share your genuine experience and feedback',
        footerText: 'Verified Google Business Profile',
        accentColor: '#d97706', // Warm Amber / Gold
        showFoldLine: true,
      };

    case 'menu':
      return {
        format: 'table-tent',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'VIEW OUR DIGITAL MENU',
        supportingText: 'Scan with your phone to view food & drink selections',
        footerText: 'Touchless Tabletop Dining • Updated Daily',
        accentColor: '#ea580c', // Orange
        showFoldLine: true,
      };

    case 'maps':
      return {
        format: 'counter-stand',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'SCAN FOR DIRECTIONS',
        supportingText: 'Find our exact store location on Google Maps',
        footerText: 'Open in Google Maps Navigation',
        accentColor: '#2563eb', // Blue
        showFoldLine: false,
      };

    case 'wifi':
      return {
        format: 'counter-stand',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'FREE GUEST WI-FI',
        supportingText: 'Scan to connect instantly without typing passwords',
        footerText: 'High-Speed Complimentary Internet Access',
        accentColor: '#4f46e5', // Indigo
        showFoldLine: false,
      };

    case 'vcard':
      return {
        format: 'counter-stand',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'SAVE OUR CONTACT',
        supportingText: 'Scan to download digital business card into phone contacts',
        footerText: 'Official Digital Contact Card (vCard)',
        accentColor: '#0891b2', // Cyan
        showFoldLine: false,
      };

    case 'phone':
      return {
        format: 'counter-stand',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'CALL CUSTOMER DESK',
        supportingText: 'Scan to dial our direct support line immediately',
        footerText: 'Direct Telephone Assistance',
        accentColor: '#0284c7', // Sky blue
        showFoldLine: false,
      };

    case 'email':
      return {
        format: 'counter-stand',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'EMAIL OUR TEAM',
        supportingText: 'Scan to compose an email directly to our inbox',
        footerText: 'Official Customer Support Inbox',
        accentColor: '#7c3aed', // Purple
        showFoldLine: false,
      };

    case 'pdf':
      return {
        format: 'a4',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'VIEW DIGITAL DOCUMENT',
        supportingText: 'Scan to read or download the complete PDF brochure',
        footerText: 'Official Digital PDF Publication',
        accentColor: '#dc2626', // Red
        showFoldLine: false,
      };

    case 'text':
      return {
        format: 'square',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'SCAN TO REVEAL DETAILS',
        supportingText: 'Scan with your camera to view voucher code & details',
        footerText: 'Information Voucher Card',
        accentColor: '#475569', // Slate
        showFoldLine: false,
      };

    case 'url':
    default:
      return {
        format: 'counter-stand',
        orientation: 'portrait',
        businessName,
        headlineCTA: 'SCAN TO VISIT WEBSITE',
        supportingText: 'Scan with your phone to open our official website',
        footerText: 'Official Verified Web Link',
        accentColor: '#0f172a', // Slate 900
        showFoldLine: false,
      };
  }
}

/**
 * Calculates aspect ratio dimensions for preview and high-resolution rendering.
 */
export function getTableStandDimensions(
  format: TableStandFormat,
  orientation: TableStandOrientation
): { width: number; height: number; aspectRatio: number } {
  const isLandscape = orientation === 'landscape';

  switch (format) {
    case 'square':
      return { width: 600, height: 600, aspectRatio: 1.0 };

    case 'a4':
    case 'a5':
    case 'a6': {
      // Standard ISO 216 paper ratio 1 : 1.4142
      const w = isLandscape ? 842 : 595;
      const h = isLandscape ? 595 : 842;
      return { width: w, height: h, aspectRatio: w / h };
    }

    case 'table-tent': {
      // Folded tent front face is slightly more compact
      const w = isLandscape ? 700 : 540;
      const h = isLandscape ? 520 : 680;
      return { width: w, height: h, aspectRatio: w / h };
    }

    case 'counter-stand':
    default: {
      const w = isLandscape ? 720 : 520;
      const h = isLandscape ? 520 : 720;
      return { width: w, height: h, aspectRatio: w / h };
    }
  }
}

/**
 * Draws the complete physical Table Stand / Table Tent display card onto a high-resolution Canvas.
 * Renders the table stand ensuring visual parity between preview, PNG export, and print.
 */
export async function renderTableStandToCanvas(
  qrCanvasOrImage: HTMLCanvasElement | HTMLImageElement,
  standConfig: TableStandConfig,
  customization: QRCustomization,
  targetWidth = 1800
): Promise<HTMLCanvasElement> {
  const { width: baseW, height: baseH } = getTableStandDimensions(
    standConfig.format,
    standConfig.orientation
  );

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for Table Stand');

  const scale = targetWidth / baseW;
  const canvasWidth = targetWidth;
  const canvasHeight = Math.round(baseH * scale);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Background
  const cardBg = customization.bgColor && customization.bgColor.toLowerCase() !== 'transparent'
    ? customization.bgColor
    : '#FFFFFF';

  ctx.fillStyle = cardBg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Outer border / stand edge simulation
  const borderWidth = Math.max(4, Math.round(6 * scale));
  const cardRadius = Math.round(16 * scale);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvasWidth - borderWidth, canvasHeight - borderWidth);

  // Top Accent Header Bar
  const accentH = Math.round(baseH * 0.09 * scale);
  ctx.fillStyle = standConfig.accentColor || '#059669';
  ctx.fillRect(0, 0, canvasWidth, accentH);

  // Business Name in Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(20 * scale)}px "Inter", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    (standConfig.businessName || 'YOUR BUSINESS NAME').toUpperCase(),
    canvasWidth / 2,
    accentH / 2
  );

  // Headline CTA (e.g. "SCAN & PAY WITH ANY UPI APP")
  const ctaY = accentH + Math.round(baseH * 0.07 * scale);
  ctx.fillStyle = '#0F172A';
  ctx.font = `900 ${Math.round(24 * scale)}px "Inter", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(standConfig.headlineCTA.toUpperCase(), canvasWidth / 2, ctaY);

  // Secondary indicator pill under CTA
  const pillY = ctaY + Math.round(22 * scale);
  const pillW = Math.round(canvasWidth * 0.65);
  const pillH = Math.round(24 * scale);
  ctx.fillStyle = `${standConfig.accentColor}15`; // 10% opacity tint
  ctx.beginPath();
  ctx.roundRect((canvasWidth - pillW) / 2, pillY - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.fillStyle = standConfig.accentColor;
  ctx.font = `bold ${Math.round(11 * scale)}px "Inter", "Segoe UI", sans-serif`;
  ctx.fillText('CAMERA & PAYMENT APPS ACCEPTED', canvasWidth / 2, pillY);

  // Calculate QR size and position
  // The QR must be dominant, taking ~52% of card height in portrait
  const qrAvailableH = canvasHeight - (pillY + Math.round(40 * scale)) - Math.round(baseH * 0.22 * scale);
  const qrAvailableW = canvasWidth - Math.round(canvasWidth * 0.2);
  const qrSize = Math.min(qrAvailableW, qrAvailableH);

  const qrX = Math.round((canvasWidth - qrSize) / 2);
  const qrY = pillY + Math.round(30 * scale);

  // QR Container Card with quiet zone shadow
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
  ctx.shadowBlur = Math.round(20 * scale);
  ctx.shadowOffsetY = Math.round(8 * scale);
  ctx.beginPath();
  ctx.roundRect(qrX - Math.round(16 * scale), qrY - Math.round(16 * scale), qrSize + Math.round(32 * scale), qrSize + Math.round(32 * scale), cardRadius);
  ctx.fill();

  // Reset shadow for QR draw
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Draw QR
  ctx.drawImage(qrCanvasOrImage, qrX, qrY, qrSize, qrSize);

  // Supporting Text underneath QR
  const subTextY = qrY + qrSize + Math.round(36 * scale);
  ctx.fillStyle = '#334155';
  ctx.font = `600 ${Math.round(14 * scale)}px "Inter", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(standConfig.supportingText, canvasWidth / 2, subTextY);

  // Footer bar with trust info
  const footerH = Math.round(baseH * 0.08 * scale);
  const footerY = canvasHeight - footerH;

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, footerY, canvasWidth, footerH);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = Math.round(1.5 * scale);
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(canvasWidth, footerY);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = `500 ${Math.round(11 * scale)}px "Inter", "Segoe UI", sans-serif`;
  ctx.fillText(standConfig.footerText, canvasWidth / 2, footerY + footerH / 2);

  // If table tent mode with fold guide requested, draw subtle dashed fold indicators
  if (standConfig.format === 'table-tent' && standConfig.showFoldLine) {
    ctx.save();
    ctx.setLineDash([Math.round(8 * scale), Math.round(6 * scale)]);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = Math.round(1.5 * scale);

    // Fold line across top edge
    ctx.beginPath();
    ctx.moveTo(0, accentH);
    ctx.lineTo(canvasWidth, accentH);
    ctx.stroke();

    ctx.font = `600 ${Math.round(9 * scale)}px "Inter", sans-serif`;
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('✂ FOLD LINE (TOP TENT CREASE)', canvasWidth / 2, accentH + Math.round(12 * scale));
    ctx.restore();
  }

  return canvas;
}

/**
 * Opens browser print dialog with accurate paper sizing (A4/A5/A6/Square),
 * orientation, and cut/fold guide lines.
 */
export function openTableStandPrintDialog(
  standDataUrl: string,
  standConfig: TableStandConfig
): void {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow pop-ups to open the Table Stand print dialog.');
    return;
  }

  const safeTitle = escapeXml(standConfig.businessName || 'QR Table Stand');
  const safeCta = escapeXml(standConfig.headlineCTA);
  const pageSize = standConfig.format === 'square' ? '150mm 150mm' : `${standConfig.format.toUpperCase()} ${standConfig.orientation}`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Print Table Stand - ${safeTitle}</title>
        <style>
          @page {
            size: ${pageSize};
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f1f5f9;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .toolbar {
            width: 100%;
            max-width: 600px;
            background: #0f172a;
            color: #fff;
            padding: 12px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
          }
          .btn-print {
            background: #059669;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          }
          .stand-card {
            background: #fff;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
            max-width: ${standConfig.orientation === 'landscape' ? '800px' : '560px'};
            width: 100%;
          }
          .stand-card img {
            display: block;
            width: 100%;
            height: auto;
          }
          .tent-guidelines {
            margin-top: 16px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
            max-width: 500px;
          }
          @media print {
            body {
              background: #fff;
              padding: 0;
            }
            .toolbar { display: none; }
            .stand-card {
              box-shadow: none;
              max-width: 100%;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div>
            <strong>Ready to Print:</strong> ${safeTitle} (${safeCta})
          </div>
          <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
        </div>

        <div class="stand-card">
          <img src="${standDataUrl}" alt="${safeTitle} Table Stand" />
        </div>

        <div class="tent-guidelines">
          ${standConfig.format === 'table-tent'
            ? '💡 <strong>Table Tent Assembly:</strong> Print on heavy paper or cardstock (250–300 GSM). Fold along top edge to create a freestanding tabletop tent.'
            : '💡 <strong>Counter Stand Assembly:</strong> Insert printed card into standard acrylic L-stand or T-stand display holder.'}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
