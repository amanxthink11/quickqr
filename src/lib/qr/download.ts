import { QRCustomization } from './types';

/**
 * Triggers a direct browser file download from a Blob or DataURL
 */
export function triggerFileDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Draws a framed QR card onto a canvas at high resolution
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

  if (frameStyle === 'none') {
    // Just QR code with background
    const padding = 60;
    canvas.width = targetQRSize + padding * 2;
    canvas.height = targetQRSize + padding * 2;

    ctx.fillStyle = customization.bgColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);
    return canvas;
  }

  if (frameStyle === 'bottom-banner') {
    const padding = 80;
    const bannerHeight = 180;
    canvas.width = targetQRSize + padding * 2;
    canvas.height = targetQRSize + padding * 2 + bannerHeight;

    // Background
    ctx.fillStyle = customization.bgColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR
    ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);

    // Draw Banner Container
    const bannerY = targetQRSize + padding + 20;
    const bannerRadius = 24;
    const bannerWidth = targetQRSize;
    const bannerX = padding;

    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight - 40, bannerRadius);
    ctx.fill();

    // Banner Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(targetQRSize * 0.045)}px "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvas.width / 2, bannerY + (bannerHeight - 40) / 2);

    return canvas;
  }

  if (frameStyle === 'card') {
    const borderWidth = 24;
    const padding = 80;
    const headerHeight = 140;
    const footerHeight = 140;

    canvas.width = targetQRSize + padding * 2 + borderWidth * 2;
    canvas.height = targetQRSize + padding * 2 + headerHeight + footerHeight + borderWidth * 2;

    // Card background
    ctx.fillStyle = customization.bgColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);

    // Header Pill
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, headerHeight);

    // Header Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(targetQRSize * 0.042)}px "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvas.width / 2, headerHeight / 2);

    // Draw QR
    ctx.drawImage(qrCanvasOrImage, borderWidth + padding, headerHeight + padding, targetQRSize, targetQRSize);

    // Footer instruction
    ctx.fillStyle = customization.fgColor || '#1E293B';
    ctx.font = `600 ${Math.round(targetQRSize * 0.03)}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText('Point your phone camera to scan', canvas.width / 2, canvas.height - footerHeight / 2 - borderWidth);

    return canvas;
  }

  if (frameStyle === 'badge') {
    const padding = 70;
    const badgeHeight = 120;
    canvas.width = targetQRSize + padding * 2;
    canvas.height = targetQRSize + padding * 2 + badgeHeight;

    // Card with rounded border
    ctx.fillStyle = customization.bgColor || '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 36);
    ctx.fill();

    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw QR
    ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);

    // Badge pill below
    const pillWidth = targetQRSize * 0.8;
    const pillHeight = 70;
    const pillX = (canvas.width - pillWidth) / 2;
    const pillY = targetQRSize + padding + 15;

    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 35);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(targetQRSize * 0.035)}px "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, canvas.width / 2, pillY + pillHeight / 2);

    return canvas;
  }

  // Fallback to plain
  const padding = 60;
  canvas.width = targetQRSize + padding * 2;
  canvas.height = targetQRSize + padding * 2;
  ctx.fillStyle = customization.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qrCanvasOrImage, padding, padding, targetQRSize, targetQRSize);
  return canvas;
}

/**
 * Generates an SVG string containing the framed QR code
 */
export function buildFramedQRSVG(
  rawQRSVG: string,
  customization: QRCustomization,
  targetSize = 600
): string {
  const frameStyle = customization.frameStyle;
  const frameText = (customization.frameText || 'SCAN ME').trim().toUpperCase();
  const frameColor = customization.frameColor || '#1E293B';
  const textColor = customization.frameTextColor || '#FFFFFF';
  const bgColor = customization.bgColor || '#FFFFFF';

  // Extract raw SVG content if wrapped
  let innerQR = rawQRSVG;
  const svgMatch = rawQRSVG.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (svgMatch && svgMatch[1]) {
    innerQR = svgMatch[1];
  }

  if (frameStyle === 'none') {
    const padding = 30;
    const width = targetSize + padding * 2;
    const height = targetSize + padding * 2;
    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}" />
  <g transform="translate(${padding}, ${padding})">
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
  <rect width="100%" height="100%" fill="${bgColor}" rx="16" />
  <g transform="translate(${padding}, ${padding})">
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
  <rect width="100%" height="100%" fill="${bgColor}" rx="20" stroke="${frameColor}" stroke-width="8" />
  <path d="M 0,20 Q 0,0 20,0 L ${width - 20},0 Q ${width},0 ${width},20 L ${width},${headerHeight} L 0,${headerHeight} Z" fill="${frameColor}" />
  <text x="${width / 2}" y="${headerHeight / 2 + fontSize / 3}" font-family="Inter, Segoe UI, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle">${frameText}</text>
  <g transform="translate(${padding}, ${headerHeight + padding})">
    ${innerQR}
  </g>
  <text x="${width / 2}" y="${height - footerHeight / 2 + subFontSize / 3}" font-family="Inter, Segoe UI, sans-serif" font-size="${subFontSize}" font-weight="600" fill="${customization.fgColor}" text-anchor="middle">Point your camera to scan</text>
</svg>`;
  }

  // Default fallback
  const padding = 30;
  const width = targetSize + padding * 2;
  const height = targetSize + padding * 2;
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}" />
  <g transform="translate(${padding}, ${padding})">
    ${innerQR}
  </g>
</svg>`;
}

/**
 * Triggers a print modal for a high-quality physical stand / table tent
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

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print QR Code - ${title}</title>
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
          <h1>${title}</h1>
          ${subtitle ? `<p class="sub">${subtitle}</p>` : ''}
          <img class="qr" src="${dataUrl}" alt="QR Code" />
          <div class="footer">Generated with QuickQR • Scan with any smartphone camera or UPI app</div>
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
