import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  Globe2,
  Smartphone,
  Eye,
  Calendar,
  Sparkles,
  ShieldCheck,
  Tag,
  ExternalLink,
  X,
  Compass,
} from 'lucide-react';
import { getCurrentSession } from '@/lib/auth/session';
import {
  getCompleteAnalyticsReport,
  AnalyticsRange,
} from '@/lib/analytics/service';
import { prisma } from '@/lib/db/prisma';
import { ScanTrendChart } from '@/components/dashboard/ScanTrendChart';
import { DimensionBreakdownCard } from '@/components/dashboard/DimensionBreakdownCard';
import { AnalyticsDateFilter } from '@/components/dashboard/AnalyticsDateFilter';

export const dynamic = 'force-dynamic';

interface AnalyticsPageProps {
  searchParams: Promise<{
    range?: string;
    qrCodeId?: string;
  }>;
}

export default async function AnalyticsPage(props: AnalyticsPageProps) {
  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in analytics page', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { activeOrganization } = sessionCtx;
  if (!activeOrganization) {
    redirect('/dashboard');
  }

  const searchParams = await props.searchParams;
  const rawRange = searchParams.range;
  const range: AnalyticsRange =
    rawRange === 'today' || rawRange === '30d' ? rawRange : '7d';

  let filteredQrCode: { id: string; title: string; shortCode: string } | null = null;
  if (searchParams.qrCodeId) {
    // Tenant-isolated QR verification
    const qr = await prisma.qRCode.findFirst({
      where: {
        id: searchParams.qrCodeId,
        organizationId: activeOrganization.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        shortCode: true,
      },
    });
    if (qr) {
      filteredQrCode = qr;
    }
  }

  const report = await getCompleteAnalyticsReport(
    activeOrganization.id,
    range,
    filteredQrCode?.id
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Scan Analytics &amp; Insights
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700">
              {activeOrganization.name}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time, privacy-minimizing scan volume, client environments, and geographic performance.
          </p>

          {filteredQrCode && (
            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-700">
              <span>Filtered to: <strong>{filteredQrCode.title}</strong> ({filteredQrCode.shortCode})</span>
              <Link
                href={`/dashboard/analytics?range=${range}`}
                className="text-neutral-400 hover:text-neutral-800 transition"
                title="Clear QR filter"
              >
                <X className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Date Filter */}
        <AnalyticsDateFilter
          currentRange={range}
          qrCodeId={filteredQrCode?.id}
        />
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-semibold text-neutral-500">Total All-Time</span>
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {report.overview.totalScans.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-semibold text-neutral-500">Today</span>
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {report.overview.scansToday.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span className="text-[11px] font-semibold text-neutral-500">Last 7 Days</span>
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {report.overview.scans7d.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span className="text-[11px] font-semibold text-neutral-500">Last 30 Days</span>
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {report.overview.scans30d.toLocaleString()}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
              {range === 'today' ? 'Today' : range === '7d' ? '7-Day Total' : '30-Day Total'}
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {report.overview.periodScans.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Scan Trend Chart */}
      <ScanTrendChart
        data={report.trend}
        title={filteredQrCode ? `Scan Trend: ${filteredQrCode.title}` : 'Organization Scan Activity'}
        subtitle={`Aggregated scan distribution across ${range === 'today' ? 'today (UTC hours)' : range === '7d' ? 'the last 7 days' : 'the last 30 days'}`}
      />

      {/* Top QR Codes Table (shown when not filtered to single QR) */}
      {!filteredQrCode && (
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Top Performing QR Codes</h3>
              <p className="text-xs text-neutral-500">Most active dynamic QR codes during this period</p>
            </div>
            <Link
              href="/dashboard/qr-codes"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
            >
              View All QR Codes &rarr;
            </Link>
          </div>

          {report.topQRCodes.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No QR code scans recorded in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200/60 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">QR Title</th>
                    <th className="py-3 px-4">Short Code</th>
                    <th className="py-3 px-4">Active Destination</th>
                    <th className="py-3 px-4 text-right">Period Scans</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {report.topQRCodes.map((qr, idx) => (
                    <tr key={qr.id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        <Link
                          href={`/dashboard/qr-codes/${qr.id}`}
                          className="hover:text-indigo-600 transition"
                        >
                          {qr.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">
                        {qr.shortCode}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 max-w-xs truncate" title={qr.destinationUrl}>
                        {qr.destinationUrl || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-indigo-600">
                        {qr.periodScans.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/dashboard/analytics?range=${range}&qrCodeId=${qr.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md"
                        >
                          Filter
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Device Category */}
        <DimensionBreakdownCard
          title="Device Category"
          subtitle="Mobile vs Desktop vs Tablet"
          items={report.deviceBreakdown}
          emptyMessage="No device data recorded."
          icon={<Smartphone className="w-4 h-4" />}
        />

        {/* Operating System */}
        <DimensionBreakdownCard
          title="Operating System"
          subtitle="Client OS detection"
          items={report.osBreakdown}
          emptyMessage="No OS data recorded."
          icon={<Compass className="w-4 h-4" />}
        />

        {/* Browser */}
        <DimensionBreakdownCard
          title="Browser"
          subtitle="Top client web browsers"
          items={report.browserBreakdown}
          emptyMessage="No browser data recorded."
          icon={<Globe2 className="w-4 h-4" />}
        />

        {/* Referrer */}
        <DimensionBreakdownCard
          title="Traffic Origin / Referrer"
          subtitle="Referring domains & in-app browsers"
          items={report.referrerBreakdown}
          emptyMessage="Direct scans (camera scanner)"
          icon={<ExternalLink className="w-4 h-4" />}
        />
      </div>

      {/* Geographic & UTM Attribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Geographic Breakdown */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Globe2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-neutral-900">Coarse Geographic Distribution</h3>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Approximate country and city breakdown derived from edge network headers.
          </p>

          {report.geoBreakdown.countries.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-100">
              No location data recorded for this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Countries */}
              <div>
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Top Countries
                </h4>
                <div className="space-y-2">
                  {report.geoBreakdown.countries.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800">{c.name}</span>
                      <span className="text-neutral-500 font-mono text-[11px]">
                        {c.count} ({c.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cities */}
              <div>
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Top Cities
                </h4>
                {report.geoBreakdown.cities.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No city headers provided</p>
                ) : (
                  <div className="space-y-2">
                    {report.geoBreakdown.cities.map((ct, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800 truncate max-w-[65%]" title={ct.city}>
                          {ct.city} {ct.country ? `(${ct.country})` : ''}
                        </span>
                        <span className="text-neutral-500 font-mono text-[11px]">
                          {ct.count} {ct.count === 1 ? 'scan' : 'scans'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* UTM Attribution */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-neutral-900">Campaign &amp; UTM Attribution</h3>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Scans attributed to dynamic marketing campaigns and UTM tags.
          </p>

          {report.utmBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-100">
              No UTM campaign parameters captured in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Campaign</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Medium</th>
                    <th className="py-2 px-3 text-right">Scans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {report.utmBreakdown.map((u, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3 font-bold text-neutral-900 truncate max-w-[140px]" title={u.campaign}>
                        {u.campaign}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">{u.source || '—'}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{u.medium || '—'}</td>
                      <td className="py-2.5 px-3 text-right font-black text-indigo-600">{u.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3 text-xs text-neutral-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-neutral-900">Privacy-Minimizing Architecture</h4>
          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
            QuickQR strictly enforces privacy-first analytics. Raw IP addresses, full User-Agent strings, and GPS coordinates are never stored, logged, or retained. Geolocation is coarse and approximate, derived from edge network headers. Referrer query strings and sensitive tokens are permanently stripped.
          </p>
        </div>
      </div>
    </div>
  );
}
