import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { getQRCode } from '@/lib/qr/service';
import { getQRBaseUrl } from '@/lib/qr/resolver';
import { getQRCodeAnalyticsSummary } from '@/lib/analytics/service';
import { DynamicQRPreviewCard } from '@/components/dashboard/DynamicQRPreviewCard';
import { QRAnalyticsCard } from '@/components/dashboard/QRAnalyticsCard';
import { EditDestinationModal } from '@/components/dashboard/EditDestinationModal';
import { EditTitleModal } from '@/components/dashboard/EditTitleModal';
import { PauseResumeButton } from '@/components/dashboard/PauseResumeButton';
import { DeleteQRModal } from '@/components/dashboard/DeleteQRModal';
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  History,
  ShieldCheck,
  Clock,
  Calendar,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QRCodeDetailsPage({ params }: PageProps) {
  const { id } = await params;

  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in QR details page', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { user, activeOrganization, role } = sessionCtx;
  if (!activeOrganization) {
    redirect('/dashboard');
  }

  // Fetch tenant-scoped QR code (enforcing IDOR protection)
  let qrCode = null;
  try {
    qrCode = await getQRCode(user.id, activeOrganization.id, id);
  } catch (err) {
    console.error('Failed to retrieve QR code details', err);
  }

  if (!qrCode) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">QR Code Not Found</h2>
        <p className="text-xs text-neutral-500">
          The requested QR code does not exist in this organization or has been deleted.
        </p>
        <Link
          href="/dashboard/qr-codes"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to QR Codes</span>
        </Link>
      </div>
    );
  }

  const canEdit = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const canDelete = role === 'OWNER' || role === 'ADMIN';

  const baseUrl = getQRBaseUrl();
  const activeDestObj = qrCode.destinations.find((d) => d.isActive);
  const activeDestUrl = activeDestObj?.destinationUrl || '';
  const inactiveDests = qrCode.destinations.filter((d) => !d.isActive);
  const isPaused = qrCode.status === 'PAUSED';

  const analyticsSummary = await getQRCodeAnalyticsSummary(activeOrganization.id, qrCode.id);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-3">
        <div>
          <Link
            href="/dashboard/qr-codes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All QR Codes</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              {qrCode.title}
            </h1>
            <EditTitleModal
              qrCodeId={qrCode.id}
              currentTitle={qrCode.title}
              canEdit={canEdit}
            />
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isPaused
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>{qrCode.status}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PauseResumeButton
              qrCodeId={qrCode.id}
              status={qrCode.status}
              canEdit={canEdit}
            />
            {canDelete && (
              <DeleteQRModal
                qrCodeId={qrCode.id}
                title={qrCode.title}
                shortCode={qrCode.shortCode}
                canDelete={canDelete}
                onDeletedRedirectTo="/dashboard/qr-codes"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = QR Preview Card, Right = Dynamic Destination & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Preview and Print Assets (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <DynamicQRPreviewCard
            shortCode={qrCode.shortCode}
            title={qrCode.title}
            status={qrCode.status}
            styling={qrCode.styling}
            baseUrl={baseUrl}
          />

          {/* Value callout */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-indigo-950 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Permanent Print Guarantee</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              This physical QR pattern will never change. When you update the destination URL, all new scans will immediately redirect to the new link.
            </p>
          </div>
        </div>

        {/* Right Column: Destination Management & Analytics (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* QR Analytics Summary Card */}
          <QRAnalyticsCard
            qrCodeId={qrCode.id}
            qrTitle={qrCode.title}
            overview={analyticsSummary.overview}
            recentTrend={analyticsSummary.recentTrend}
          />

          {/* Active Destination Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-neutral-900">Active Destination URL</h2>
              </div>
              <EditDestinationModal
                qrCodeId={qrCode.id}
                currentDestinationUrl={activeDestUrl}
                canEdit={canEdit}
              />
            </div>

            {activeDestUrl ? (
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                    Redirect Target
                  </span>
                  <a
                    href={activeDestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-semibold text-indigo-600 hover:text-indigo-800 break-all transition flex items-center gap-1.5"
                  >
                    <span>{activeDestUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No active destination set. Scans will land on a 404 status page.
              </div>
            )}

            {/* Destination Change History */}
            {inactiveDests.length > 0 && (
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
                  <History className="w-3.5 h-3.5" />
                  <span>Previous Destinations ({inactiveDests.length})</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {inactiveDests.map((dest) => (
                    <div
                      key={dest.id}
                      className="p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500"
                    >
                      <span className="font-mono truncate max-w-sm mr-2">{dest.destinationUrl}</span>
                      <span className="shrink-0 text-neutral-400 text-[10px]">
                        Replaced {dest.deactivatedAt ? new Date(dest.deactivatedAt).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* QR Code Details Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              Code Configuration &amp; Metadata
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-neutral-400 text-[11px] font-medium">Short Code</span>
                <div className="font-mono font-bold text-neutral-900 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200/60 inline-block">
                  {qrCode.shortCode}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-400 text-[11px] font-medium">QR Type</span>
                <div className="font-semibold text-neutral-900">{qrCode.type}</div>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-400 text-[11px] font-medium">Created On</span>
                <div className="text-neutral-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {new Date(qrCode.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-400 text-[11px] font-medium">Last Destination Update</span>
                <div className="text-neutral-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {new Date(qrCode.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
