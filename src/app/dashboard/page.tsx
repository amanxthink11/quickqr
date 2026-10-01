import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { getDashboardStats, QRCodeWithDestinations } from '@/lib/qr/service';
import {
  QrCode,
  CheckCircle2,
  PauseCircle,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session context', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { user, activeOrganization } = sessionCtx;

  if (!activeOrganization) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">No Organization Selected</h2>
        <p className="text-xs text-neutral-500">
          Please contact an administrator or switch to an existing organization to view your dashboard.
        </p>
      </div>
    );
  }

  // Fetch stats for active organization
  let stats: {
    totalQRs: number;
    activeQRs: number;
    pausedQRs: number;
    recentQRs: QRCodeWithDestinations[];
  } = {
    totalQRs: 0,
    activeQRs: 0,
    pausedQRs: 0,
    recentQRs: [],
  };

  try {
    stats = await getDashboardStats(user.id, activeOrganization.id);
  } catch (err) {
    console.error('Failed to fetch dashboard stats', err);
  }

  return (
    <div className="space-y-6">
      {/* Dynamic QR Value Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Dynamic QR Engine Operational</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Change Destinations Anytime — Without Reprinting
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Print your QR codes once on counter stands, table tents, or packaging. When menus, promotions, or links change, update them in real-time right here.
            </p>
          </div>

          <Link
            href="/dashboard/qr-codes/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-bold transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Create Dynamic QR</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row: Total, Active, Paused */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total QR Codes */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total QR Codes
            </span>
            <div className="text-2xl font-extrabold text-neutral-900 mt-1">
              {stats.totalQRs}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              In {activeOrganization.name}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        {/* Active QR Codes */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Active & Redirecting
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {stats.activeQRs}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Resolving to target destinations
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Paused QR Codes */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Paused Codes
            </span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">
              {stats.pausedQRs}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Redirecting to pause page
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <PauseCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recently Created QR Codes Section */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-900">Recently Created QR Codes</h2>
          </div>
          <Link
            href="/dashboard/qr-codes"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            <span>View All QR Codes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentQRs.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-sm">No QR codes created yet</p>
              <p className="text-neutral-400 mt-0.5 max-w-sm mx-auto">
                Create your first dynamic QR code to start routing visitors to custom websites, menus, or deals.
              </p>
            </div>
            <Link
              href="/dashboard/qr-codes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Dynamic QR</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">QR Name</th>
                  <th className="py-3 px-4 font-semibold">Short Code</th>
                  <th className="py-3 px-4 font-semibold">Destination</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stats.recentQRs.map((qr) => {
                  const activeDest = qr.destinations?.[0]?.destinationUrl;
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
                      <td className="py-3 px-4 max-w-xs truncate text-neutral-600">
                        {activeDest ? (
                          <span className="font-mono text-[11px] truncate block" title={activeDest}>
                            {activeDest}
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
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span>{qr.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {new Date(qr.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/qr-codes/${qr.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
