import { QRCustomization } from './types';
import { PAYMENT_BRAND_ASSETS, loadPaymentBrandImages } from './payment-assets';

export type UPIStandTemplate = 'classic' | 'business' | 'scan-and-pay' | 'minimal';

export interface UPIStandConfig {
  template: UPIStandTemplate;
  merchantName: string;
  upiId: string;
  instructionText: string;
  footerText: string;
  showPaymentBranding: boolean;
  isUppercaseName: boolean;
  accentColor: string;
  amountText?: string;
  showAmount: boolean;
}

/**
 * Extracts VPA (pa), Merchant Name (pn), and Amount (am) from a standard upi:// payment URI.
 */
export function parseUPIPayload(payload: string): { vpa: string; name: string; amount?: string } {
  if (!payload || typeof payload !== 'string') {
    return { vpa: '', name: '' };
  }

  try {
    if (payload.startsWith('upi://pay')) {
      const url = new URL(payload.replace('upi://pay', 'https://upi.dummy'));
      const vpa = url.searchParams.get('pa') || '';
      const name = url.searchParams.get('pn') || '';
      const am = url.searchParams.get('am') || '';
      return {
        vpa: decodeURIComponent(vpa),
        name: decodeURIComponent(name),
        amount: am ? `₹${parseFloat(am).toFixed(2)}` : undefined,
      };
    }
  } catch {
    // If URL parsing fails, extract via regex
    const paMatch = payload.match(/[?&]pa=([^&]+)/i);
    const pnMatch = payload.match(/[?&]pn=([^&]+)/i);
    const amMatch = payload.match(/[?&]am=([^&]+)/i);
    return {
      vpa: paMatch ? decodeURIComponent(paMatch[1]) : '',
      name: pnMatch ? decodeURIComponent(pnMatch[1]) : '',
      amount: amMatch ? `₹${parseFloat(decodeURIComponent(amMatch[1])).toFixed(2)}` : undefined,
    };
  }

  return { vpa: '', name: '' };
}

/**
 * Generates default configuration for the dedicated UPI Stand.
 */
export function getDefaultUPIStandConfig(
  payload?: string,
  initialMerchantName?: string
): UPIStandConfig {
  const parsed = payload ? parseUPIPayload(payload) : { vpa: '', name: '' };
  const merchantName =
    initialMerchantName?.trim() || parsed.name || 'YOUR BUSINESS NAME';
  const upiId = parsed.vpa || 'merchant@upi';

  return {
    template: 'classic',
    merchantName,
    upiId,
    instructionText: 'Scan and pay using your preferred UPI app',
    footerText: 'BHIM UPI',
    showPaymentBranding: true,
    isUppercaseName: true,
    accentColor: '#0f172a',
    amountText: parsed.amount,
    showAmount: !!parsed.amount,
  };
}

/**
 * Simple XML/HTML character escaper to prevent XSS injection in generated print dialogs
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders the dedicated UPI counter stand to an HTML5 Canvas at exact 3:4 aspect ratio.
 * Used for visual parity across preview, high-resolution PNG export (300 DPI), and print.
 */
export async function renderUPIStandToCanvas(
  qrCanvas: HTMLCanvasElement,
  config: UPIStandConfig,
  customization: QRCustomization,
  targetWidth = 1800
): Promise<HTMLCanvasElement> {
  // Logical 3:4 aspect ratio (width: targetWidth, height: targetWidth * 4 / 3)
  const targetHeight = Math.round((targetWidth * 4) / 3);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Scale factor relative to 450px base design (e.g. 1800 / 450 = 4)
  const scale = targetWidth / 450;

  // 1. Stand Background (Clean White)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. Subtle Card Border with Rounded Corners
  const cardMargin = 16 * scale;
  const cardRadius = 20 * scale;
  const cardWidth = targetWidth - cardMargin * 2;
  const cardHeight = targetHeight - cardMargin * 2;

  ctx.save();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.roundRect(cardMargin, cardMargin, cardWidth, cardHeight, cardRadius);
  ctx.stroke();
  ctx.restore();

  // Template specific top accent
  let topY = cardMargin + 24 * scale;

  if (config.template === 'business') {
    // Elegant colored brand accent bar at the top edge
    ctx.save();
    ctx.fillStyle = config.accentColor || '#0F172A';
    ctx.beginPath();
    ctx.roundRect(cardMargin + 24 * scale, cardMargin + 10 * scale, cardWidth - 48 * scale, 4 * scale, 2 * scale);
    ctx.fill();
    ctx.restore();
    topY += 12 * scale;
  } else if (config.template === 'scan-and-pay') {
    // Prominent "SCAN & PAY" badge at top
    ctx.save();
    ctx.fillStyle = config.accentColor || '#065F46';
    const badgeText = 'SCAN & PAY';
    ctx.font = `800 ${13.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textMetrics = ctx.measureText(badgeText);
    const badgeW = textMetrics.width + 24 * scale;
    const badgeH = 26 * scale;
    const badgeX = (targetWidth - badgeW) / 2;
    const badgeY = topY - 4 * scale;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 999 * scale);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, targetWidth / 2, badgeY + badgeH / 2);
    ctx.restore();
    topY += 32 * scale;
  }

  // 3. Merchant Name (with responsive scaling and multi-line wrapping)
  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const rawName = config.merchantName.trim() || 'ABC GENERAL STORE';
  const displayName = config.isUppercaseName ? rawName.toUpperCase() : rawName;

  // Responsive font scaling based on text length
  let nameFontSize = 21 * scale;
  if (displayName.length > 50) {
    nameFontSize = 13.5 * scale;
  } else if (displayName.length > 28) {
    nameFontSize = 16.5 * scale;
  }
  ctx.font = `700 ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  const maxNameWidth = cardWidth - 48 * scale;
  // Word wrap lines if needed
  const words = displayName.split(/\s+/);
  const nameLines: string[] = [];
  let curLine = '';

  for (const w of words) {
    const testLine = curLine ? `${curLine} ${w}` : w;
    if (ctx.measureText(testLine).width <= maxNameWidth) {
      curLine = testLine;
    } else {
      if (curLine) nameLines.push(curLine);
      // If a single word is wider than maxNameWidth, wrap characters
      if (ctx.measureText(w).width > maxNameWidth) {
        let chunk = '';
        for (const char of w) {
          if (ctx.measureText(chunk + char).width <= maxNameWidth) {
            chunk += char;
          } else {
            nameLines.push(chunk);
            chunk = char;
          }
        }
        curLine = chunk;
      } else {
        curLine = w;
      }
    }
  }
  if (curLine) nameLines.push(curLine);

  const nameLineHeight = nameFontSize * 1.25;
  for (const line of nameLines) {
    ctx.fillText(line, targetWidth / 2, topY);
    topY += nameLineHeight;
  }
  ctx.restore();

  // 4. Subtle Thin Divider Line (Classic / Reference style)
  if (config.template !== 'minimal') {
    topY += 8 * scale;
    ctx.save();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(cardMargin + 40 * scale, topY);
    ctx.lineTo(targetWidth - cardMargin - 40 * scale, topY);
    ctx.stroke();
    ctx.restore();
    topY += 12 * scale;
  } else {
    topY += 8 * scale;
  }

  // 5. Fixed Amount Badge (if applicable)
  if (config.showAmount && config.amountText) {
    ctx.save();
    ctx.fillStyle = '#ECFDF5';
    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 1 * scale;
    const amText = `Fixed Amount: ${config.amountText}`;
    ctx.font = `700 ${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const amMetrics = ctx.measureText(amText);
    const amW = amMetrics.width + 20 * scale;
    const amH = 24 * scale;
    const amX = (targetWidth - amW) / 2;
    ctx.beginPath();
    ctx.roundRect(amX, topY, amW, amH, 6 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(amText, targetWidth / 2, topY + amH / 2);
    ctx.restore();
    topY += amH + 12 * scale;
  }

  const topSectionBottom = topY;

  // Calculate Bottom Section Dimensions
  const rawUpiId = config.upiId.trim() || 'merchant@upi';
  let upiFontSize = 14 * scale;
  if (rawUpiId.length > 32) {
    upiFontSize = 11.5 * scale;
  } else if (rawUpiId.length > 22) {
    upiFontSize = 12.5 * scale;
  }

  const instructionFontSize = 12 * scale;
  const badgeH = 22 * scale;
  const footerFontSize = 10.5 * scale;

  const cleanFooter = config.footerText
    ? config.footerText
        .replace(/labnol/gi, '')
        .replace(/www\.labnol\.org[^\s]*/gi, '')
        .trim()
    : '';

  // Measure total vertical height needed for bottom elements
  let bottomSectionHeight = upiFontSize + 8 * scale + instructionFontSize + 8 * scale;
  if (config.showPaymentBranding) {
    bottomSectionHeight += badgeH + 8 * scale;
  }
  if (cleanFooter) {
    bottomSectionHeight += footerFontSize + 8 * scale;
  }

  // Anchor bottom section neatly above bottom card border
  const bottomSectionStartY = targetHeight - cardMargin - 20 * scale - bottomSectionHeight;

  // 6. Dominant Center QR Code (~62% card width for clear visual hierarchy)
  const qrSize = Math.round(targetWidth * 0.62);
  const qrX = Math.round((targetWidth - qrSize) / 2);

  // Vertically center the QR code in available vertical space between top and bottom sections
  const availableCenterSpace = bottomSectionStartY - topSectionBottom;
  const qrY = Math.round(topSectionBottom + Math.max(10 * scale, (availableCenterSpace - qrSize) / 2));

  // Draw clean quiet zone container
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX - 8 * scale, qrY - 8 * scale, qrSize + 16 * scale, qrSize + 16 * scale);
  // Draw the actual rendered QR canvas
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
  ctx.restore();

  // 7. Render Bottom Section Elements
  let curBottomY = bottomSectionStartY;

  // 7a. UPI ID (Directly below QR with readable typography)
  ctx.save();
  ctx.fillStyle = '#1E293B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `600 ${upiFontSize}px "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
  while (ctx.measureText(rawUpiId).width > cardWidth - 48 * scale && upiFontSize > 9 * scale) {
    upiFontSize -= 0.5 * scale;
    ctx.font = `600 ${upiFontSize}px "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
  }
  ctx.fillText(rawUpiId, targetWidth / 2, curBottomY);
  curBottomY += upiFontSize + 8 * scale;
  ctx.restore();

  // 7b. Instruction Text
  ctx.save();
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `500 ${instructionFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const instruction = config.instructionText.trim() || 'Scan and pay using your preferred UPI app';
  ctx.fillText(instruction, targetWidth / 2, curBottomY);
  curBottomY += instructionFontSize + 8 * scale;
  ctx.restore();

  // 7c. Payment Ecosystem Badges (Official payment-app logo assets - optional toggle)
  if (config.showPaymentBranding) {
    ctx.save();
    const brandImages = await loadPaymentBrandImages();
    const badgeGap = 7 * scale;
    const badgePadX = 7 * scale;
    const logoH = 14 * scale;

    const badgeWidths = PAYMENT_BRAND_ASSETS.map((asset) => {
      const logoW = Math.round(logoH * asset.aspectRatio);
      return logoW + badgePadX * 2;
    });

    const totalBadgesW =
      badgeWidths.reduce((sum, w) => sum + w, 0) + badgeGap * (PAYMENT_BRAND_ASSETS.length - 1);
    let startX = (targetWidth - totalBadgesW) / 2;

    PAYMENT_BRAND_ASSETS.forEach((asset, i) => {
      const bW = badgeWidths[i];
      const logoW = Math.round(logoH * asset.aspectRatio);
      const img = brandImages.get(asset.id);

      // Clean white rounded badge container with subtle neutral border
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.roundRect(startX, curBottomY, bW, badgeH, 5 * scale);
      ctx.fill();
      ctx.stroke();

      if (img && img.naturalWidth > 0) {
        const logoX = startX + Math.round((bW - logoW) / 2);
        const logoY = curBottomY + Math.round((badgeH - logoH) / 2);
        ctx.drawImage(img, logoX, logoY, logoW, logoH);
      } else {
        // Official brand text fallback if logo fails to load
        ctx.fillStyle = '#334155';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${9.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(asset.name, startX + bW / 2, curBottomY + badgeH / 2);
      }

      startX += bW + badgeGap;
    });
    ctx.restore();
    curBottomY += badgeH + 8 * scale;
  }

  // 7d. Optional Footer (Product-neutral copy, zero Labnol text)
  if (cleanFooter) {
    ctx.save();
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `500 ${footerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(cleanFooter, targetWidth / 2, curBottomY);
    ctx.restore();
  }

  return canvas;
}

/**
 * Opens a dedicated, clean browser print dialog with the exact 3:4 aspect ratio.
 * Contains only merchant-facing content without UI chrome or decorative artifacts.
 */
export function openUPIStandPrintDialog(
  qrCanvas: HTMLCanvasElement,
  config: UPIStandConfig
): void {
  const qrDataUrl = qrCanvas.toDataURL('image/png', 1.0);
  const printWindow = window.open('', '_blank', 'width=800,height=950');
  if (!printWindow) {
    alert('Please allow popups for QuickQR to open the print dialog.');
    return;
  }

  const rawName = config.merchantName.trim() || 'ABC GENERAL STORE';
  const displayName = config.isUppercaseName ? rawName.toUpperCase() : rawName;
  const upiId = config.upiId.trim() || 'merchant@upi';
  const instruction = config.instructionText.trim() || 'Scan and pay using your preferred UPI app';
  const cleanFooter = (config.footerText || 'BHIM UPI')
    .replace(/labnol/gi, '')
    .replace(/www\.labnol\.org[^\s]*/gi, '')
    .trim();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UPI Counter Stand - ${escapeXml(displayName)}</title>
  <style>
    @page {
      size: portrait;
      margin: 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #0F172A;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .upi-stand-card {
      width: 100%;
      max-width: 450px;
      aspect-ratio: 3 / 4;
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-radius: 18px;
      padding: 24px 20px 18px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }
    .business-accent-bar {
      position: absolute;
      top: 0;
      left: 32px;
      right: 32px;
      height: 4px;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      background-color: ${config.accentColor || '#0F172A'};
    }
    .scan-pay-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 999px;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      background-color: ${config.accentColor || '#065F46'};
    }
    .merchant-name {
      font-size: ${displayName.length > 50 ? '13px' : displayName.length > 28 ? '16px' : '20px'};
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.01em;
      line-height: 1.25;
      max-width: 100%;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .stand-divider {
      width: 70%;
      height: 1px;
      background: #E2E8F0;
      margin: 8px auto 6px auto;
    }
    .fixed-amount-badge {
      display: inline-block;
      font-size: 11.5px;
      font-weight: 700;
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
      padding: 2.5px 10px;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .qr-container {
      width: 276px;
      height: 276px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2px 0 6px 0;
    }
    .qr-container img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .upi-id {
      font-family: "SF Mono", Monaco, Consolas, "Courier New", monospace;
      font-size: ${upiId.length > 32 ? '11px' : upiId.length > 22 ? '12.5px' : '14px'};
      font-weight: 600;
      color: #1E293B;
      letter-spacing: 0.02em;
      overflow-wrap: anywhere;
      word-break: break-all;
      margin-bottom: 4px;
    }
    .instruction-text {
      font-size: 11.5px;
      font-weight: 500;
      color: #475569;
      margin-bottom: 8px;
    }
    .payment-branding {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .app-badge {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 3px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-height: 22px;
    }
    .app-badge img {
      height: 15px;
      width: auto;
      max-width: 65px;
      object-fit: contain;
      display: block;
    }
    .footer-text {
      font-size: 10.5px;
      color: #94A3B8;
      font-weight: 500;
    }
    @media print {
      html, body {
        min-height: auto;
        margin: 0;
        padding: 0;
      }
      .upi-stand-card {
        border-color: #CBD5E1;
        box-shadow: none;
        page-break-inside: avoid;
        break-inside: avoid;
        margin: auto;
      }
    }
  </style>
</head>
<body>
  <div class="upi-stand-card">
    ${config.template === 'business' ? '<div class="business-accent-bar"></div>' : ''}
    <div style="width: 100%;">
      ${config.template === 'scan-and-pay' ? '<div class="scan-pay-badge">SCAN &amp; PAY</div>' : ''}
      <div class="merchant-name">${escapeXml(displayName)}</div>
      ${config.template !== 'minimal' ? '<div class="stand-divider"></div>' : ''}
      ${
        config.showAmount && config.amountText
          ? `<div class="fixed-amount-badge">Fixed Amount: ${escapeXml(config.amountText)}</div>`
          : ''
      }
    </div>

    <div class="qr-container">
      <img src="${qrDataUrl}" alt="UPI QR Code" />
    </div>

    <div style="width: 100%;">
      <div class="upi-id">${escapeXml(upiId)}</div>
      <div class="instruction-text">${escapeXml(instruction)}</div>

      ${
        config.showPaymentBranding
          ? `<div class="payment-branding">
              ${PAYMENT_BRAND_ASSETS.map(
                (asset) => `
                <div class="app-badge">
                  <img src="${asset.dataUrl}" alt="${escapeXml(asset.name)}" />
                </div>`
              ).join('')}
            </div>`
          : ''
      }

      ${cleanFooter ? `<div class="footer-text">${escapeXml(cleanFooter)}</div>` : ''}
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
