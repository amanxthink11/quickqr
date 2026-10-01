import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { listQRCodes, QRCodeWithDestinations } from '@/lib/qr/service';
import { QRStatus } from '@prisma/client';
import { QRFilterBar } from '@/components/dashboard/QRFilterBar';
import { EditDestinationModal } from '@/components/dashboard/EditDestinationModal';
import { PauseResumeButton } from '@/components/dashboard/PauseResumeButton';
import { DeleteQRModal } from '@/components/dashboard/DeleteQRModal';
import { QrCode, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

/**
 * Strips sensitive query params (tokens, secrets, keys) and safely formats URL for table view.
 */
function formatSafeDisplayUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl);
    // Return host + path for clean and safe display
    const path = url.pathname === '/' ? '' : url.pathname;
    const base = `${url.host}${path}`;
    if (base.length > 45) {
      return base.slice(0, 42) + '...';
    }
    return base;
  } catch {
    return rawUrl.length > 45 ? rawUrl.slice(0, 42) + '...' : rawUrl;
  }
}

export default async function QRCodesListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || '';
  const statusParam = params.status?.toUpperCase();
  const pageNum = parseInt(params.page || '1', 10) || 1;

  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in QR list', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { user, activeOrganization, role } = sessionCtx;
  if (!activeOrganization) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">No Organization Selected</h2>
        <p className="text-xs text-neutral-500">
          Please select or switch to an organization to view QR codes.
        </p>
      </div>
    );
  }

  // RBAC checks for mutations
  const canEdit = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const canDelete = role === 'OWNER' || role === 'ADMIN';

  let filterStatus: QRStatus | undefined = undefined;
  if (statusParam === 'ACTIVE' || statusParam === 'PAUSED' || statusParam === 'ARCHIVED') {
    filterStatus = statusParam as QRStatus;
  }

  let result: {
    qrCodes: QRCodeWithDestinations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } = {
    qrCodes: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  };

  try {
    result = await listQRCodes(user.id, activeOrganization.id, {
      search: q || undefined,
      status: filterStatus,
      page: pageNum,
      limit: 25,
    });
  } catch (err) {
    console.error('Failed to query QR codes', err);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Dynamic QR Codes
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700">
              {result.total}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your organization&apos;s dynamic codes and destinations without reprinting.
          </p>
        </div>

        {canEdit && (
          <Link
            href="/dashboard/qr-codes/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Dynamic QR</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <QRFilterBar currentSearch={q} currentStatus={statusParam || 'ALL'} />

      {/* QR Codes Table Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {result.qrCodes.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-500 space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-sm">
                {q || filterStatus ? 'No matching QR codes found' : 'No QR codes created yet'}
              </p>
              <p className="text-neutral-400 mt-0.5 max-w-sm mx-auto">
                {q || filterStatus
                  ? 'Try clearing your search query or status filter.'
                  : 'Get started by creating your first dynamic QR code.'}
              </p>
            </div>
            {canEdit && !q && !filterStatus && (
              <Link
                href="/dashboard/qr-codes/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Dynamic QR</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">QR Name</th>
                  <th className="py-3 px-4 font-semibold">Short Code</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Destination URL</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold">Updated</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {result.qrCodes.map((qr) => {
                  const activeDest = qr.destinations?.[0]?.destinationUrl || '';
                  const safeDestDisplay = formatSafeDisplayUrl(activeDest);
                  const isPaused = qr.status === 'PAUSED';

                  return (
                    <tr key={qr.id} className="hover:bg-neutral-50/60 transition">
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
                      <td className="py-3 px-4 text-neutral-500 font-medium">
                        {qr.type}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {activeDest ? (
                          <span
                            className="font-mono text-[11px] text-neutral-600 truncate block hover:text-neutral-900 transition"
                            title={activeDest}
                          >
                            {safeDestDisplay}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">No destination</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaused
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPaused ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span>{qr.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                        {new Date(qr.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                        {new Date(qr.updatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/qr-codes/${qr.id}`}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
                          >
                            View
                          </Link>
                          {canEdit && (
                            <EditDestinationModal
                              qrCodeId={qr.id}
                              currentDestinationUrl={activeDest}
                              canEdit={canEdit}
                            />
                          )}
                          {canEdit && (
                            <PauseResumeButton
                              qrCodeId={qr.id}
                              status={qr.status}
                              canEdit={canEdit}
                              size="sm"
                            />
                          )}
                          {canDelete && (
                            <DeleteQRModal
                              qrCodeId={qr.id}
                              title={qr.title}
                              shortCode={qr.shortCode}
                              canDelete={canDelete}
                              size="sm"
                              onDeletedRedirectTo=""
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls if multiple pages */}
        {result.totalPages > 1 && (
          <div className="p-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Page {result.page} of {result.totalPages} ({result.total} total)
            </span>
            <div className="flex items-center gap-1">
              {result.page > 1 && (
                <Link
                  href={`/dashboard/qr-codes?page=${result.page - 1}${q ? `&q=${q}` : ''}${statusParam ? `&status=${statusParam}` : ''}`}
                  className="px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 font-semibold"
                >
                  Previous
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`/dashboard/qr-codes?page=${result.page + 1}${q ? `&q=${q}` : ''}${statusParam ? `&status=${statusParam}` : ''}`}
                  className="px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 font-semibold"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
