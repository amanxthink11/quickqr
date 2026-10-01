import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { listWidgets } from '@/lib/widget/service';
import { WidgetEmbedModal } from '@/components/dashboard/WidgetEmbedModal';
import { WidgetPauseResumeButton } from '@/components/dashboard/WidgetPauseResumeButton';
import { WidgetDeleteModal } from '@/components/dashboard/WidgetDeleteModal';
import { Globe, Plus, Edit } from 'lucide-react';
import { WidgetConfig } from '@/lib/widget/types';
import { Widget } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function WidgetsListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || '';
  const pageNum = parseInt(params.page || '1', 10) || 1;

  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in widgets list', err);
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
          Please select or switch to an organization to view your widgets.
        </p>
      </div>
    );
  }

  const canEdit = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const canDelete = role === 'OWNER' || role === 'ADMIN';

  let result: { widgets: Widget[]; total: number } = { widgets: [], total: 0 };
  try {
    result = await listWidgets(user.id, activeOrganization.id, {
      search: q || undefined,
      page: pageNum,
      limit: 25,
    });
  } catch (err) {
    console.error('Failed to list tenant widgets', err);
  }

  const { widgets, total } = result;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Website QR Widgets
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold">
              {total}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Embed floating QR code actions on your website with remote dashboard updates.
          </p>
        </div>

        {canEdit && (
          <Link
            href="/dashboard/widgets/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Widget</span>
          </Link>
        )}
      </div>

      {/* Widget List */}
      {widgets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Globe className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">
              No Website Widgets Created Yet
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
              Create your first floating QR button for UPI payments, WhatsApp chats, or Google reviews. Embed it once and update remotely anytime.
            </p>
          </div>
          {canEdit && (
            <div className="pt-2">
              <Link
                href="/dashboard/widgets/new"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Website Widget</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200/80 bg-neutral-50/50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Widget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Public Identifier</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {widgets.map((widget) => {
                  const cfg = widget.configuration as unknown as WidgetConfig;
                  const isPaused = widget.status === 'PAUSED';

                  return (
                    <tr
                      key={widget.id}
                      className="hover:bg-neutral-50/60 transition group"
                    >
                      {/* Name & Type */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/dashboard/widgets/${widget.id}`}
                            className="font-bold text-neutral-900 hover:text-indigo-600 transition flex items-center gap-1.5"
                          >
                            <span>{widget.name}</span>
                            <Edit className="w-3 h-3 text-neutral-400 group-hover:text-indigo-600" />
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium">
                            <span className="capitalize">{cfg.type || 'Custom'}</span>
                            <span>&bull;</span>
                            <span className="truncate max-w-[200px]" title={cfg.payload}>
                              {cfg.payload}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPaused
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                            }`}
                          />
                          <span>{widget.status}</span>
                        </span>
                      </td>

                      {/* Public ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-600">
                        <code>{widget.publicId}</code>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-neutral-500 text-[11px]">
                        {new Date(widget.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <WidgetEmbedModal
                            publicId={widget.publicId}
                            widgetName={widget.name}
                          />

                          <Link
                            href={`/dashboard/widgets/${widget.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition"
                          >
                            <span>Edit</span>
                          </Link>

                          <WidgetPauseResumeButton
                            widgetId={widget.id}
                            status={widget.status}
                            canEdit={canEdit}
                            size="sm"
                          />

                          <WidgetDeleteModal
                            widgetId={widget.id}
                            name={widget.name}
                            publicId={widget.publicId}
                            canDelete={canDelete}
                            size="sm"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
