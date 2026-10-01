import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { getWidget } from '@/lib/widget/service';
import { WidgetForm } from '@/components/dashboard/WidgetForm';
import { WidgetPauseResumeButton } from '@/components/dashboard/WidgetPauseResumeButton';
import { WidgetDeleteModal } from '@/components/dashboard/WidgetDeleteModal';
import { WidgetEmbedModal } from '@/components/dashboard/WidgetEmbedModal';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { WidgetConfig } from '@/lib/widget/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WidgetDetailsPage({ params }: PageProps) {
  const { id } = await params;

  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in widget details page', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { user, activeOrganization, role } = sessionCtx;
  if (!activeOrganization) {
    redirect('/dashboard');
  }

  // Fetch tenant-scoped widget with strict IDOR protection
  let widget = null;
  try {
    widget = await getWidget(user.id, activeOrganization.id, id);
  } catch (err) {
    console.error('Failed to retrieve widget details', err);
  }

  if (!widget) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">Widget Not Found</h2>
        <p className="text-xs text-neutral-500">
          The requested widget does not exist in this organization or has been archived.
        </p>
        <Link
          href="/dashboard/widgets"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Widgets</span>
        </Link>
      </div>
    );
  }

  const canEdit = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const canDelete = role === 'OWNER' || role === 'ADMIN';

  const isPaused = widget.status === 'PAUSED';
  const widgetConfig = widget.configuration as unknown as WidgetConfig;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard/widgets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Widgets</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                {widget.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
            </div>
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <span>Public Identifier:</span>
              <code className="font-mono text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">
                {widget.publicId}
              </code>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <WidgetEmbedModal
              publicId={widget.publicId}
              widgetName={widget.name}
            />

            <WidgetPauseResumeButton
              widgetId={widget.id}
              status={widget.status}
              canEdit={canEdit}
            />

            <WidgetDeleteModal
              widgetId={widget.id}
              name={widget.name}
              publicId={widget.publicId}
              canDelete={canDelete}
            />
          </div>
        </div>
      </div>

      {/* Stable Embed Code Banner Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-400/20">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Stable Remote Embed Snippet</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Permanent Embed Code for Your Website
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
              Paste this snippet on your website once. You can update destinations, colors, text, or pause/resume below without ever having to modify your website code again.
            </p>
          </div>

          <div>
            <WidgetEmbedModal
              publicId={widget.publicId}
              widgetName={widget.name}
            />
          </div>
        </div>
      </div>

      {/* Edit Form with Live Interactive Simulator */}
      <WidgetForm
        initialWidget={{
          id: widget.id,
          name: widget.name,
          publicId: widget.publicId,
          status: widget.status as 'ACTIVE' | 'PAUSED',
          configuration: widgetConfig,
        }}
        isEdit={true}
      />
    </div>
  );
}
