import { NextRequest, NextResponse } from 'next/server';
import { resolveDynamicQRCode, getQRBaseUrl } from '@/lib/qr/resolver';
import { safeScheduleScan } from '@/lib/analytics/ingestion';

export const dynamic = 'force-dynamic';

/**
 * Public Dynamic QR Code Redirect Endpoint
 * Route: GET /q/{shortCode}
 *
 * Requirements:
 * 1. Validates 7-character Base62 shortCode.
 * 2. Resolves active QRCodeDestination.
 * 3. Schedules asynchronous, privacy-preserving scan analytics without blocking redirect.
 * 4. Returns HTTP 302 redirect with Location header.
 * 5. Redirects inactive/expired/paused QR codes to safe branded status pages.
 * 6. Does NOT render HTML or dashboards for redirects.
 * 7. Adds noindex and no-cache headers.
 * 8. CRITICAL RULE: QR REDIRECT > ANALYTICS. Failure of analytics never delays or cancels 302.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
): Promise<NextResponse> {
  const { shortCode } = await context.params;
  const baseUrl = getQRBaseUrl();

  const result = await resolveDynamicQRCode(shortCode);

  if (result.success) {
    // Schedule asynchronous scan capture without blocking HTTP 302 response
    try {
      safeScheduleScan({
        organizationId: result.organizationId,
        qrCodeId: result.qrCodeId,
        userAgent: request.headers.get('user-agent'),
        rawReferrer: request.headers.get('referer') || request.headers.get('referrer'),
        searchParams: request.nextUrl.searchParams,
        destinationUrl: result.destinationUrl,
        headers: request.headers,
      });
    } catch (scanErr) {
      console.error('[SCAN_CAPTURE_SCHEDULE_ERROR]', scanErr);
    }

    return NextResponse.redirect(result.destinationUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  // Handle non-active or invalid statuses with safe branded redirects
  switch (result.status) {
    case 'PAUSED':
      return NextResponse.redirect(`${baseUrl}/q-status/paused`, {
        status: 302,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      });

    case 'EXPIRED':
      return NextResponse.redirect(`${baseUrl}/q-status/expired`, {
        status: 302,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      });

    case 'INVALID_CODE':
    case 'NOT_FOUND':
    case 'INACTIVE':
    case 'MISSING_DESTINATION':
    case 'INVALID_DESTINATION':
    case 'ERROR':
    default:
      return NextResponse.redirect(`${baseUrl}/q-status/not-found`, {
        status: 302,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      });
  }
}
