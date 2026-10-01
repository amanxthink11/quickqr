'use client';

import React, { useState } from 'react';
import { ApiKeySafe } from '@/lib/api-keys/types';
import { createApiKeyAction, revokeApiKeyAction } from '@/lib/api-keys/actions';
import { Key, Plus, Copy, Check, AlertTriangle, ShieldAlert, Trash2, Calendar, Clock } from 'lucide-react';
import { UserRole } from '@prisma/client';

interface ApiKeyManagerProps {
  initialKeys: ApiKeySafe[];
  userRole: UserRole;
  orgName: string;
}

export function ApiKeyManager({ initialKeys, userRole, orgName }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKeySafe[]>(initialKeys);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [expiryDays, setExpiryDays] = useState<string>('90');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State after creation
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const canManage = userRole === 'OWNER' || userRole === 'ADMIN';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const days = expiryDays === 'never' ? null : parseInt(expiryDays, 10);
    const res = await createApiKeyAction({
      name: keyName.trim(),
      expiresInDays: days,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      setNewRawKey(res.data.rawKey);
      setKeys((prev) => [res.data!.apiKey, ...prev]);
      setKeyName('');
    } else {
      setErrorMessage(res.error || 'Failed to create API key');
    }
  };

  const handleCopy = () => {
    if (newRawKey) {
      navigator.clipboard.writeText(newRawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setNewRawKey(null);
    setErrorMessage(null);
    setCopied(false);
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke '${name}'? Any system using this key will immediately lose access.`)) {
      return;
    }

    setRevokingId(id);
    const res = await revokeApiKeyAction(id);
    setRevokingId(null);

    if (res.success && res.data) {
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, revokedAt: res.data!.revokedAt } : k))
      );
    } else {
      alert(res.error || 'Failed to revoke API key');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900">Developer API Keys</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              REST v1
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Programmatically manage dynamic QR codes, analytics, and widgets for <span className="font-semibold text-neutral-700">{orgName}</span>.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New API Key</span>
          </button>
        )}
      </div>

      {!canManage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 flex items-start gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Restricted Access:</span> API keys can only be generated or revoked by organization Owners and Admins. Your current role is <span className="font-semibold uppercase">{userRole}</span>.
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">No API Keys Generated</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
              Create an API key to integrate QuickQR with your backend, POS, CRM, or automated marketing workflows.
            </p>
            {canManage && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Key</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Key Prefix</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5">Last Used</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60">
                {keys.map((k) => {
                  const isRevoked = k.revokedAt !== null;
                  const isExpired = k.expiresAt !== null && new Date(k.expiresAt) <= new Date();

                  return (
                    <tr key={k.id} className="hover:bg-neutral-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-neutral-900">
                        {k.name}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-700">
                          {k.keyPrefix}••••••••
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            Revoked
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{new Date(k.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {k.lastUsedAt ? (
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{new Date(k.lastUsedAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManage && !isRevoked && (
                          <button
                            onClick={() => handleRevoke(k.id, k.name)}
                            disabled={revokingId === k.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            title="Revoke API Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200">
            {!newRawKey ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Generate New API Key</h2>
                    <p className="text-xs text-neutral-500">Assign a recognizable label for this key.</p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200/60">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Key Name / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Backend, Zapier, POS Sync"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Expiration Period
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="30">30 Days</option>
                    <option value="90">90 Days (Recommended)</option>
                    <option value="180">180 Days</option>
                    <option value="365">1 Year</option>
                    <option value="never">No Expiration (Never)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !keyName.trim()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? 'Generating...' : 'Create Secret Key'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">API Key Generated</h2>
                    <p className="text-xs text-neutral-500">Copy your secret now. It will not be shown again.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Important:</span> For security reasons, QuickQR stores only a cryptographic hash of this key. If you lose it, you will need to revoke it and generate a new one.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Your API Secret Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newRawKey}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-mono text-xs bg-neutral-50 text-neutral-800 select-all"
                    />
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
