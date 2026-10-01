import { NextRequest, NextResponse } from 'next/server';
import { getPublicWidgetConfig } from '@/lib/widget/service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const CACHE_HEADERS = {
  ...CORS_HEADERS,
  // Bounded cache TTL: 60s browser/CDN cache, with 120s background revalidation.
  // Guarantees merchant configuration changes propagate to embeds within 60 seconds.
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await context.params;

    // 1. Strict public identifier validation (alphanumeric, dash, underscore only, 8-64 chars)
    if (!publicId || !/^[a-zA-Z0-9_-]{8,64}$/.test(publicId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid widget identifier format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 2. Lookup widget by publicId (excludes soft-deleted records)
    const result = await getPublicWidgetConfig(publicId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Widget not found or has been deactivated' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const { widget, safeConfig } = result;

    // 3. Status verification: PAUSED widgets must not expose active functionality
    if (widget.status === 'PAUSED') {
      return NextResponse.json(
        {
          success: false,
          status: 'PAUSED',
          message: 'This widget is currently paused by the merchant.',
        },
        { status: 200, headers: CACHE_HEADERS }
      );
    }

    // 4. Return sanitized active payload (zero tenant-internal leaks)
    return NextResponse.json(
      {
        success: true,
        publicId: widget.publicId,
        name: widget.name,
        status: 'ACTIVE',
        config: safeConfig,
        updatedAt: widget.updatedAt.toISOString(),
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error while resolving widget' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
