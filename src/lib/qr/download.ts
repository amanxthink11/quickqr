import { QRCustomization } from './types';

/**
 * Escapes characters for XML / SVG / HTML insertion to prevent XSS and malformed XML.
 */
export function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitizes download filenames to prevent directory traversal or invalid filesystem characters.
 */
export function sanitizeFilename(filename: string, defaultName = 'quickqr-code'): string {
  if (!filename || typeof filename !== 'string') return `${defaultName}.png`;
  // Extract basename to eliminate directory traversal
  const basename = filename.replace(/^.*[\\/]/, '');
  const sanitized = basename
    .replace(/[?%*:|"<>]/g, '')
    .replace(/\.\./g, '')
    .replace(/^[.-]+/, '')
    .trim();
  const finalBase = sanitized || defaultName;
  return finalBase.includes('.') ? finalBase : `${finalBase}.png`;
}

/**
 * Triggers a direct browser file download from a Blob or DataURL
 */
export function triggerFileDownload(url: string, filename: string): void {
  const safeFilename = sanitizeFilename(filename);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Draws a framed QR card onto a canvas at high resolution with mathematically
 * proportional dimensions to ensure no text clipping at 1000px, 2000px, or 3000px.
 */
export async function renderFramedQRToCanvas(
  qrCanvasOrImage: HTMLCanvasElement | HTMLImageElement,
  customization: QRCustomization,
  targetQRSize = 1200
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  const frameStyle = customization.frameStyle;
  const frameText = (customization.frameText || 'SCAN ME').trim().toUpperCase();
  const frameColor = customization.frameColor || '#1E293B';
  const textColor = customization.frameTextColor || '#FFFFFF';
  const bgColor = customization.bgColor || '#FFFFFF';
  const isTransparent = bgColor.toLowerCase() === 'transparent';

  if (frameStyle === 'none') {
    const padding = Math.round(targetQRSize * 0.05);
    canvas.width = targetQRSize + padding * 2;
    canvas.height = targetQRSize + padding * 2;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);
    return canvas;
  }

  if (frameStyle === 'bottom-banner') {
    const padding = Math.round(targetQRSize * 0.06);
    const bannerHeight = Math.round(targetQRSize * 0.16);
    const bannerMargin = Math.round(targetQRSize * 0.02);
    canvas.width = targetQRSize + padding * 2;
    canvas.height = targetQRSize + padding * 2 + bannerHeight;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draw QR
    ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);

    // Draw Banner Container
    const bannerY = targetQRSize + padding + bannerMargin;
    const bannerRadius = Math.round(bannerHeight * 0.2);
    const bannerWidth = targetQRSize;
    const bannerX = padding;
    const actualBannerHeight = bannerHeight - bannerMargin * 2;

    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerWidth, actualBannerHeight, bannerRadius);
    ctx.fill();

    // Banner Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(targetQRSize * 0.042)}px "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvas.width / 2, bannerY + actualBannerHeight / 2);

    return canvas;
  }

  if (frameStyle === 'card') {
    const borderWidth = Math.max(8, Math.round(targetQRSize * 0.02));
    const padding = Math.round(targetQRSize * 0.07);
    const headerHeight = Math.round(targetQRSize * 0.14);
    const footerHeight = Math.round(targetQRSize * 0.12);

    canvas.width = targetQRSize + padding * 2 + borderWidth * 2;
    canvas.height = targetQRSize + padding * 2 + headerHeight + footerHeight + borderWidth * 2;

    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Border
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);

    // Header Pill
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, headerHeight);

    // Header Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(targetQRSize * 0.04)}px "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvas.width / 2, headerHeight / 2);

    // Draw QR
    ctx.drawImage(qrCanvasOrImage, borderWidth + padding, headerHeight + padding, targetQRSize, targetQRSize);

    // Footer instruction
    ctx.fillStyle = customization.fgColor || '#1E293B';
    ctx.font = `600 ${Math.round(targetQRSize * 0.028)}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText('Point your phone camera to scan', canvas.width / 2, canvas.height - footerHeight / 2 - borderWidth);

    return canvas;
  }

  if (frameStyle === 'badge') {
    const padding = Math.round(targetQRSize * 0.06);
    const badgeHeight = Math.round(targetQRSize * 0.14);
    canvas.width = targetQRSize + padding * 2;
    canvas.height = targetQRSize + padding * 2 + badgeHeight;

    // Card with rounded border
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 36);
      ctx.fill();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.strokeStyle = frameColor;
    ctx.lineWidth = Math.max(4, Math.round(targetQRSize * 0.008));
    ctx.stroke();

    // Draw QR
    ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);

    // Badge pill below
    const pillWidth = targetQRSize * 0.8;
    const pillHeight = Math.round(badgeHeight * 0.6);
    const pillX = (canvas.width - pillWidth) / 2;
    const pillY = targetQRSize + padding + Math.round(badgeHeight * 0.15);

    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(targetQRSize * 0.035)}px "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvas.width / 2, pillY + pillHeight / 2);

    return canvas;
  }

  // Fallback to plain
  const padding = Math.round(targetQRSize * 0.05);
  canvas.width = targetQRSize + padding * 2;
  canvas.height = targetQRSize + padding * 2;
  if (!isTransparent) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);
  return canvas;
}

/**
 * Generates an SVG string containing the framed QR code, properly scaling the
 * inner vector QR content to fit targetSize and escaping all XML attributes.
 */
export function buildFramedQRSVG(
  rawQRSVG: string,
  customization: QRCustomization,
  targetSize = 600
): string {
  const frameStyle = customization.frameStyle;
  const frameText = escapeXml((customization.frameText || 'SCAN ME').trim().toUpperCase());
  const frameColor = escapeXml(customization.frameColor || '#1E293B');
  const textColor = escapeXml(customization.frameTextColor || '#FFFFFF');
  const bgColor = escapeXml(customization.bgColor || '#FFFFFF');
  const fgColor = escapeXml(customization.fgColor || '#1E293B');
  const isTransparent = bgColor.toLowerCase() === 'transparent';

  // Extract raw SVG content and determine original width/viewBox for scaling
  let innerQR = rawQRSVG;
  let originalSize = 320;

  const viewBoxMatch = rawQRSVG.match(/viewBox=["']\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/i);
  if (viewBoxMatch && viewBoxMatch[1]) {
    originalSize = parseFloat(viewBoxMatch[1]);
  } else {
    const widthMatch = rawQRSVG.match(/width=["']([0-9.]+)["']/i);
    if (widthMatch && widthMatch[1]) {
      originalSize = parseFloat(widthMatch[1]);
    }
  }

  const svgMatch = rawQRSVG.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (svgMatch && svgMatch[1]) {
    innerQR = svgMatch[1];
  }

  const scaleRatio = targetSize / originalSize;

  if (frameStyle === 'none') {
    const padding = 30;
    const width = targetSize + padding * 2;
    const height = targetSize + padding * 2;
    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${!isTransparent ? `<rect width="100%" height="100%" fill="${bgColor}" />` : ''}
  <g transform="translate(${padding}, ${padding}) scale(${scaleRatio})">
    ${innerQR}
  </g>
</svg>`;
  }

  if (frameStyle === 'bottom-banner') {
    const padding = 40;
    const bannerHeight = 80;
    const width = targetSize + padding * 2;
    const height = targetSize + padding * 2 + bannerHeight;
    const bannerY = targetSize + padding + 10;
    const bannerWidth = targetSize;
    const fontSize = Math.round(targetSize * 0.045);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${!isTransparent ? `<rect width="100%" height="100%" fill="${bgColor}" rx="16" />` : ''}
  <g transform="translate(${padding}, ${padding}) scale(${scaleRatio})">
    ${innerQR}
  </g>
  <rect x="${padding}" y="${bannerY}" width="${bannerWidth}" height="${bannerHeight - 20}" rx="12" fill="${frameColor}" />
  <text x="${width / 2}" y="${bannerY + (bannerHeight - 20) / 2 + fontSize / 3}" font-family="Inter, Segoe UI, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle">${frameText}</text>
</svg>`;
  }

  if (frameStyle === 'card') {
    const padding = 40;
    const headerHeight = 70;
    const footerHeight = 60;
    const width = targetSize + padding * 2;
    const height = targetSize + padding * 2 + headerHeight + footerHeight;
    const fontSize = Math.round(targetSize * 0.04);
    const subFontSize = Math.round(targetSize * 0.026);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${!isTransparent ? `<rect width="100%" height="100%" fill="${bgColor}" rx="20" stroke="${frameColor}" stroke-width="8" />` : `<rect width="100%" height="100%" fill="none" rx="20" stroke="${frameColor}" stroke-width="8" />`}
  <path d="M 0,20 Q 0,0 20,0 L ${width - 20},0 Q ${width},0 ${width},20 L ${width},${headerHeight} L 0,${headerHeight} Z" fill="${frameColor}" />
  <text x="${width / 2}" y="${headerHeight / 2 + fontSize / 3}" font-family="Inter, Segoe UI, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle">${frameText}</text>
  <g transform="translate(${padding}, ${headerHeight + padding}) scale(${scaleRatio})">
    ${innerQR}
  </g>
  <text x="${width / 2}" y="${height - footerHeight / 2 + subFontSize / 3}" font-family="Inter, Segoe UI, sans-serif" font-size="${subFontSize}" font-weight="600" fill="${fgColor}" text-anchor="middle">Point your camera to scan</text>
</svg>`;
  }

  if (frameStyle === 'badge') {
    const padding = 40;
    const badgeHeight = 70;
    const width = targetSize + padding * 2;
    const height = targetSize + padding * 2 + badgeHeight;
    const pillWidth = targetSize * 0.8;
    const pillHeight = 44;
    const pillX = (width - pillWidth) / 2;
    const pillY = targetSize + padding + 12;
    const fontSize = Math.round(targetSize * 0.035);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${!isTransparent ? `<rect width="100%" height="100%" fill="${bgColor}" rx="24" stroke="${frameColor}" stroke-width="6" />` : `<rect width="100%" height="100%" fill="none" rx="24" stroke="${frameColor}" stroke-width="6" />`}
  <g transform="translate(${padding}, ${padding}) scale(${scaleRatio})">
    ${innerQR}
  </g>
  <rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${pillHeight / 2}" fill="${frameColor}" />
  <text x="${width / 2}" y="${pillY + pillHeight / 2 + fontSize / 3}" font-family="Inter, Segoe UI, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle">${frameText}</text>
</svg>`;
  }

  // Default fallback
  const padding = 30;
  const width = targetSize + padding * 2;
  const height = targetSize + padding * 2;
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${!isTransparent ? `<rect width="100%" height="100%" fill="${bgColor}" />` : ''}
  <g transform="translate(${padding}, ${padding}) scale(${scaleRatio})">
    ${innerQR}
  </g>
</svg>`;
}

/**
 * Triggers a print modal for a high-quality physical stand / table tent.
 * Sanitizes and escapes all user-supplied title and subtitle strings to prevent XSS.
 */
export function openPrintDialog(
  dataUrl: string,
  title: string,
  subtitle?: string
): void {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow pop-ups to open the print preview.');
    return;
  }

  const safeTitle = escapeXml(title || 'QR Code Stand');
  const safeSubtitle = subtitle ? escapeXml(subtitle) : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Print QR Code - ${safeTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm;
          }
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            text-align: center;
            background: #fff;
            color: #0f172a;
            padding: 20px;
            margin: 0;
          }
          .card {
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            padding: 40px;
            max-width: 520px;
            margin: 0 auto;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          h1 {
            font-size: 24px;
            margin: 0 0 8px 0;
            color: #0f172a;
          }
          p.sub {
            font-size: 14px;
            color: #64748b;
            margin: 0 0 24px 0;
          }
          img.qr {
            max-width: 380px;
            width: 100%;
            height: auto;
            border-radius: 12px;
          }
          .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .card { box-shadow: none; border-color: #cbd5e1; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${safeTitle}</h1>
          ${safeSubtitle ? `<p class="sub">${safeSubtitle}</p>` : ''}
          <img class="qr" src="${dataUrl}" alt="QR Code" />
          <div class="footer">Scan with any smartphone camera or UPI app</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
