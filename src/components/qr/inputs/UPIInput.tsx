'use client';

import React from 'react';
import { UPIPayloadInput } from '@/lib/qr/types';
import { AlertCircle, IndianRupee, Store, Receipt, Coffee, HandCoins } from 'lucide-react';

interface UPIInputProps {
  value: UPIPayloadInput;
  onChange: (value: UPIPayloadInput) => void;
}

export const UPIInput: React.FC<UPIInputProps> = ({ value, onChange }) => {
  const applyPreset = (preset: {
    note: string;
    amount?: string;
    label: string;
  }) => {
    onChange({
      ...value,
      transactionNote: preset.note,
      amount: preset.amount !== undefined ? preset.amount : value.amount,
    });
  };

  return (
    <div className="space-y-5">
      {/* Disclaimer Box */}
      <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-900 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">Payment QR Notice</p>
          <p className="text-amber-800 leading-relaxed">
            This tool generates a standard UPI payment QR code for Indian bank accounts (compatible with Google Pay, PhonePe, Paytm, CRED, BHIM). It does not process payments or confirm transaction status. Funds deposit directly into your linked bank account.
          </p>
        </div>
      </div>

      {/* Preset Chips */}
      <div>
        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Quick Business Presets
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              applyPreset({
                note: 'Store Payment',
                amount: '',
                label: 'Shop Counter',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition"
          >
            <Store className="w-3.5 h-3.5 text-neutral-600" />
            Shop Counter (Open Amount)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                note: 'Restaurant Dining Bill',
                amount: '',
                label: 'Restaurant',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition"
          >
            <Coffee className="w-3.5 h-3.5 text-neutral-600" />
            Restaurant / Cafe
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                note: 'Invoice Payment',
                label: 'Invoice',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition"
          >
            <Receipt className="w-3.5 h-3.5 text-neutral-600" />
            Invoice / Bill
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                note: 'Charity Donation',
                amount: '100.00',
                label: 'Donation',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition"
          >
            <HandCoins className="w-3.5 h-3.5 text-neutral-600" />
            Donation ₹100
          </button>
        </div>
      </div>

      {/* UPI ID / VPA */}
      <div>
        <label htmlFor="upi-vpa" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          UPI ID / VPA <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="upi-vpa"
            type="text"
            required
            value={value.vpa}
            onChange={(e) => onChange({ ...value, vpa: e.target.value })}
            placeholder="e.g. sharma.store@okhdfcbank or 9876543210@paytm"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Find your UPI ID inside Google Pay, PhonePe, Paytm, or your banking app.
        </p>
      </div>

      {/* Payee Name */}
      <div>
        <label htmlFor="upi-payee" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Payee / Merchant Name <span className="text-red-500">*</span>
        </label>
        <input
          id="upi-payee"
          type="text"
          required
          value={value.payeeName}
          onChange={(e) => onChange({ ...value, payeeName: e.target.value })}
          placeholder="e.g. Sharma General Store"
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
        />
        <p className="mt-1 text-xs text-neutral-500">
          This name appears on the customer&apos;s phone when scanning.
        </p>
      </div>

      {/* Amount (INR) */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="upi-amount" className="block text-sm font-semibold text-neutral-900">
            Requested Amount (Optional)
          </label>
          <span className="text-xs text-neutral-500">
            {value.amount ? 'Fixed Amount' : 'Open Amount (Payer enters)'}
          </span>
        </div>
        <div className="relative rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
            <IndianRupee className="w-4 h-4" />
          </div>
          <input
            id="upi-amount"
            type="number"
            step="0.01"
            min="0"
            value={value.amount || ''}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
            placeholder="Leave blank for open amount"
            className="w-full pl-9 pr-24 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {value.amount ? (
              <button
                type="button"
                onClick={() => onChange({ ...value, amount: '' })}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Clear to Open
              </button>
            ) : (
              <span className="text-xs font-semibold text-neutral-400">INR</span>
            )}
          </div>
        </div>
        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          {['50', '100', '250', '500', '1000'].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onChange({ ...value, amount: amt })}
              className={`px-2.5 py-1 text-xs rounded border transition ${
                value.amount === amt
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Note & Ref */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="upi-note" className="block text-sm font-medium text-neutral-800 mb-1.5">
            Transaction Note / Remarks
          </label>
          <input
            id="upi-note"
            type="text"
            value={value.transactionNote || ''}
            onChange={(e) => onChange({ ...value, transactionNote: e.target.value })}
            placeholder="e.g. Table 4 / Order 1024"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
          />
        </div>
        <div>
          <label htmlFor="upi-ref" className="block text-sm font-medium text-neutral-800 mb-1.5">
            Bill / Reference ID
          </label>
          <input
            id="upi-ref"
            type="text"
            value={value.transactionRef || ''}
            onChange={(e) => onChange({ ...value, transactionRef: e.target.value })}
            placeholder="e.g. INV-9821"
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
          />
        </div>
      </div>
    </div>
  );
};
