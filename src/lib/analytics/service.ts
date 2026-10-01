import { prisma } from '@/lib/db/prisma';

export type AnalyticsRange = 'today' | '7d' | '30d';

export interface AnalyticsOverview {
  totalScans: number;
  scansToday: number;
  scans7d: number;
  scans30d: number;
  periodScans: number;
}

export interface ScanTrendItem {
  date: string; // ISO date string (YYYY-MM-DD or HH:00)
  label: string; // User-facing label (e.g. "Sep 25", "14:00")
  count: number;
}

export interface DimensionBreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface TopQRCodeItem {
  id: string;
  title: string;
  shortCode: string;
  type: string;
  status: string;
  destinationUrl?: string;
  periodScans: number;
}

export interface UtmBreakdownItem {
  campaign: string;
  source: string | null;
  medium: string | null;
  count: number;
}

export interface GeoBreakdown {
  countries: DimensionBreakdownItem[];
  cities: { city: string; country: string | null; count: number }[];
}

export interface CompleteAnalyticsReport {
  overview: AnalyticsOverview;
  trend: ScanTrendItem[];
  deviceBreakdown: DimensionBreakdownItem[];
  osBreakdown: DimensionBreakdownItem[];
  browserBreakdown: DimensionBreakdownItem[];
  geoBreakdown: GeoBreakdown;
  referrerBreakdown: DimensionBreakdownItem[];
  utmBreakdown: UtmBreakdownItem[];
  topQRCodes: TopQRCodeItem[];
}

/**
 * Computes date range boundaries in UTC.
 */
export function getDateRangeBoundary(range: AnalyticsRange): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case 'today':
      startDate.setUTCHours(0, 0, 0, 0);
      break;
    case '7d':
      startDate.setUTCDate(startDate.getUTCDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);
      break;
    case '30d':
      startDate.setUTCDate(startDate.getUTCDate() - 29);
      startDate.setUTCHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}

/**
 * Retrieves high-level scan counts (Total, Today, Last 7 Days, Last 30 Days).
 * Tenant Isolation: Strictly enforces organizationId.
 */
export async function getAnalyticsOverview(
  organizationId: string,
  range: AnalyticsRange = '7d',
  qrCodeId?: string
): Promise<AnalyticsOverview> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const baseWhere = {
    organizationId,
    ...(qrCodeId ? { qrCodeId } : {}),
  };

  const [totalScans, scansToday, scans7d, scans30d] = await Promise.all([
    prisma.scanEvent.count({
      where: baseWhere,
    }),
    prisma.scanEvent.count({
      where: {
        ...baseWhere,
        scannedAt: { gte: todayStart },
      },
    }),
    prisma.scanEvent.count({
      where: {
        ...baseWhere,
        scannedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.scanEvent.count({
      where: {
        ...baseWhere,
        scannedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  let periodScans = scans7d;
  if (range === 'today') periodScans = scansToday;
  if (range === '30d') periodScans = scans30d;

  return {
    totalScans,
    scansToday,
    scans7d,
    scans30d,
    periodScans,
  };
}

/**
 * Retrieves time-series scan count buckets for chart display.
 * Generates continuous days/hours without missing gaps.
 */
export async function getScanTrend(
  organizationId: string,
  range: AnalyticsRange = '7d',
  qrCodeId?: string
): Promise<ScanTrendItem[]> {
  const { startDate, endDate } = getDateRangeBoundary(range);

  const events = await prisma.scanEvent.findMany({
    where: {
      organizationId,
      ...(qrCodeId ? { qrCodeId } : {}),
      scannedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      scannedAt: true,
    },
    orderBy: {
      scannedAt: 'asc',
    },
  });

  if (range === 'today') {
    // 24 hourly buckets for today
    const hourMap = new Map<number, number>();
    for (let h = 0; h <= 23; h++) {
      hourMap.set(h, 0);
    }

    for (const ev of events) {
      const h = ev.scannedAt.getUTCHours();
      hourMap.set(h, (hourMap.get(h) || 0) + 1);
    }

    const items: ScanTrendItem[] = [];
    for (let h = 0; h <= 23; h++) {
      const hourStr = `${h.toString().padStart(2, '0')}:00`;
      items.push({
        date: hourStr,
        label: `${hourStr} UTC`,
        count: hourMap.get(h) || 0,
      });
    }
    return items;
  }

  // Daily buckets for 7d or 30d
  const numDays = range === '7d' ? 7 : 30;
  const dayMap = new Map<string, number>();

  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().split('T')[0];
    dayMap.set(key, 0);
  }

  for (const ev of events) {
    const key = ev.scannedAt.toISOString().split('T')[0];
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) || 0) + 1);
    }
  }

  const items: ScanTrendItem[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (const [key, count] of dayMap.entries()) {
    const [, month, day] = key.split('-').map(Number);
    const label = `${monthNames[month - 1]} ${day}`;
    items.push({
      date: key,
      label,
      count,
    });
  }

  return items;
}

/**
 * Aggregates client dimension breakdowns (Device, OS, Browser, Referrer).
 */
export async function getDimensionBreakdown(
  organizationId: string,
  field: 'deviceCategory' | 'operatingSystem' | 'browser' | 'referrer',
  range: AnalyticsRange = '7d',
  qrCodeId?: string
): Promise<DimensionBreakdownItem[]> {
  const { startDate, endDate } = getDateRangeBoundary(range);

  const events = await prisma.scanEvent.findMany({
    where: {
      organizationId,
      ...(qrCodeId ? { qrCodeId } : {}),
      scannedAt: { gte: startDate, lte: endDate },
    },
    select: {
      [field]: true,
    },
  });

  const total = events.length;
  if (total === 0) return [];

  const counts = new Map<string, number>();

  for (const ev of events) {
    const rawVal = (ev as Record<string, unknown>)[field];
    const val = rawVal ? String(rawVal) : 'Unknown';
    counts.set(val, (counts.get(val) || 0) + 1);
  }

  const sorted = Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, 10);
}

/**
 * Aggregates geographic breakdown (Country & City).
 */
export async function getGeoBreakdown(
  organizationId: string,
  range: AnalyticsRange = '7d',
  qrCodeId?: string
): Promise<GeoBreakdown> {
  const { startDate, endDate } = getDateRangeBoundary(range);

  const events = await prisma.scanEvent.findMany({
    where: {
      organizationId,
      ...(qrCodeId ? { qrCodeId } : {}),
      scannedAt: { gte: startDate, lte: endDate },
    },
    select: {
      country: true,
      city: true,
    },
  });

  const total = events.length;
  if (total === 0) {
    return { countries: [], cities: [] };
  }

  const countryCounts = new Map<string, number>();
  const cityCounts = new Map<string, { city: string; country: string | null; count: number }>();

  for (const ev of events) {
    const country = ev.country || 'Unknown';
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);

    if (ev.city) {
      const cityKey = `${ev.city}::${country}`;
      const existing = cityCounts.get(cityKey);
      if (existing) {
        existing.count += 1;
      } else {
        cityCounts.set(cityKey, { city: ev.city, country: ev.country, count: 1 });
      }
    }
  }

  const countries = Array.from(countryCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const cities = Array.from(cityCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { countries, cities };
}

/**
 * Aggregates UTM campaign performance.
 */
export async function getUtmBreakdown(
  organizationId: string,
  range: AnalyticsRange = '7d',
  qrCodeId?: string
): Promise<UtmBreakdownItem[]> {
  const { startDate, endDate } = getDateRangeBoundary(range);

  const events = await prisma.scanEvent.findMany({
    where: {
      organizationId,
      ...(qrCodeId ? { qrCodeId } : {}),
      scannedAt: { gte: startDate, lte: endDate },
      utmCampaign: { not: null },
    },
    select: {
      utmCampaign: true,
      utmSource: true,
      utmMedium: true,
    },
  });

  if (events.length === 0) return [];

  const map = new Map<string, UtmBreakdownItem>();

  for (const ev of events) {
    if (!ev.utmCampaign) continue;
    const key = `${ev.utmCampaign}::${ev.utmSource || ''}::${ev.utmMedium || ''}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        campaign: ev.utmCampaign,
        source: ev.utmSource,
        medium: ev.utmMedium,
        count: 1,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Retrieves top scanned QR codes for this organization within the date range.
 */
export async function getTopQRCodes(
  organizationId: string,
  range: AnalyticsRange = '7d',
  limit = 5
): Promise<TopQRCodeItem[]> {
  const { startDate, endDate } = getDateRangeBoundary(range);

  // Group scan events by qrCodeId for the active organization
  const grouped = await prisma.scanEvent.groupBy({
    by: ['qrCodeId'],
    where: {
      organizationId,
      scannedAt: { gte: startDate, lte: endDate },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  });

  if (grouped.length === 0) {
    return [];
  }

  const qrIds = grouped.map((g) => g.qrCodeId);

  // Query QR details scoped to organization
  const qrs = await prisma.qRCode.findMany({
    where: {
      id: { in: qrIds },
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      shortCode: true,
      type: true,
      status: true,
      destinations: {
        where: { isActive: true },
        take: 1,
        select: { destinationUrl: true },
      },
    },
  });

  const qrMap = new Map(qrs.map((q) => [q.id, q]));

  const results: TopQRCodeItem[] = [];
  for (const g of grouped) {
    const qr = qrMap.get(g.qrCodeId);
    if (qr) {
      results.push({
        id: qr.id,
        title: qr.title,
        shortCode: qr.shortCode,
        type: qr.type,
        status: qr.status,
        destinationUrl: qr.destinations[0]?.destinationUrl,
        periodScans: g._count.id,
      });
    }
  }

  return results;
}

/**
 * Compiles a full analytics report for the dashboard.
 */
export async function getCompleteAnalyticsReport(
  organizationId: string,
  range: AnalyticsRange = '7d',
  qrCodeId?: string
): Promise<CompleteAnalyticsReport> {
  const [
    overview,
    trend,
    deviceBreakdown,
    osBreakdown,
    browserBreakdown,
    geoBreakdown,
    referrerBreakdown,
    utmBreakdown,
    topQRCodes,
  ] = await Promise.all([
    getAnalyticsOverview(organizationId, range, qrCodeId),
    getScanTrend(organizationId, range, qrCodeId),
    getDimensionBreakdown(organizationId, 'deviceCategory', range, qrCodeId),
    getDimensionBreakdown(organizationId, 'operatingSystem', range, qrCodeId),
    getDimensionBreakdown(organizationId, 'browser', range, qrCodeId),
    getGeoBreakdown(organizationId, range, qrCodeId),
    getDimensionBreakdown(organizationId, 'referrer', range, qrCodeId),
    getUtmBreakdown(organizationId, range, qrCodeId),
    getTopQRCodes(organizationId, range, 5),
  ]);

  return {
    overview,
    trend,
    deviceBreakdown,
    osBreakdown,
    browserBreakdown,
    geoBreakdown,
    referrerBreakdown,
    utmBreakdown,
    topQRCodes,
  };
}

/**
 * QR-specific Analytics Summary for `/dashboard/qr-codes/[id]`
 */
export async function getQRCodeAnalyticsSummary(
  organizationId: string,
  qrCodeId: string
): Promise<{
  overview: AnalyticsOverview;
  recentTrend: ScanTrendItem[];
}> {
  const [overview, recentTrend] = await Promise.all([
    getAnalyticsOverview(organizationId, '7d', qrCodeId),
    getScanTrend(organizationId, '7d', qrCodeId),
  ]);

  return {
    overview,
    recentTrend,
  };
}
