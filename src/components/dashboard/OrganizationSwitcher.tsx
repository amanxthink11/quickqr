'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { switchOrganizationAction } from '@/lib/auth/actions';

interface OrganizationSwitcherProps {
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  memberships: {
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string;
  }[];
  currentRole: string | null;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  activeOrganization,
  memberships,
  currentRole,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) {
      setIsOpen(false);
      return;
    }

    try {
      setIsSwitching(true);
      setError(null);
      const res = await switchOrganizationAction(organizationId);

      if (!res.success) {
        setError(res.error || 'Failed to switch organization');
        setIsSwitching(false);
        return;
      }

      setIsOpen(false);
      // Hard refresh to re-execute server component hierarchy with new organization context
      window.location.reload();
    } catch {
      setError('An unexpected error occurred while switching organization');
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 transition text-left shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          {activeOrganization ? activeOrganization.name.charAt(0).toUpperCase() : 'O'}
        </div>
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-900 truncate max-w-[140px] sm:max-w-[180px]">
              {activeOrganization ? activeOrganization.name : 'Select Organization'}
            </span>
            {currentRole && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentRole}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[140px] sm:max-w-[180px]">
            /{activeOrganization?.slug || 'no-org'}
          </span>
        </div>
        {isSwitching ? (
          <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin shrink-0" />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-white border border-neutral-200/90 shadow-lg py-1.5 z-50">
          <div className="px-3 py-1.5 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Organizations ({memberships.length})
            </span>
          </div>

          {error && (
            <div className="px-3 py-1 text-[11px] text-rose-600 bg-rose-50 border-b border-rose-100">
              {error}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
            {memberships.map((m) => {
              const isSelected = m.organizationId === activeOrganization?.id;
              return (
                <button
                  key={m.organizationId}
                  type="button"
                  onClick={() => handleSelectOrg(m.organizationId)}
                  disabled={isSwitching}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-neutral-50 transition text-xs ${
                    isSelected ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-neutral-400'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className={`font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-neutral-800'}`}>
                        {m.organizationName}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        /{m.organizationSlug}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600">
                      {m.role}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
