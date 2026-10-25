'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { workerApi } from '@/lib/workerApi';

interface ReportIncidentModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string | null;
  orderId?: string;
  onIncidentReported: () => void;
}

const REASON_CODES = [
  { code: 'FARMER_UNAVAILABLE', label: 'Farmer unavailable at pickup point' },
  { code: 'BUYER_UNAVAILABLE', label: 'Buyer unreachable at destination' },
  { code: 'ADDRESS_INACCESSIBLE', label: 'Address inaccessible or road blocked' },
  { code: 'QUANTITY_MISMATCH', label: 'Product quantity mismatch on handover' },
  { code: 'DAMAGED_GOODS', label: 'Produce damaged or degraded' },
  { code: 'VEHICLE_BREAKDOWN', label: 'Vehicle mechanical breakdown / puncture' },
  { code: 'BUYER_REFUSED', label: 'Buyer refused delivery' },
  { code: 'OTHER', label: 'Other delivery exception' },
];

export function ReportIncidentModal({
  open,
  onClose,
  jobId,
  orderId,
  onIncidentReported,
}: ReportIncidentModalProps) {
  const [reasonCode, setReasonCode] = useState(REASON_CODES[0].code);
  const [description, setDescription] = useState('');
  const [terminateJob, setTerminateJob] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !jobId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a detailed description of the incident.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await workerApi.reportIncident(jobId, {
        reasonCode,
        description: description.trim(),
        terminateJob,
      });
      onIncidentReported();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit incident report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-950 dark:text-rose-200">
                Report Delivery Incident
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                Job ID: {jobId.slice(0, 8)} {orderId ? `• Order: ${orderId.slice(0, 8)}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#12281E] border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Incident Reason Code
            </label>
            <select
              value={reasonCode}
              onChange={e => setReasonCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-xs font-semibold text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-rose-500"
            >
              {REASON_CODES.map(r => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Incident Details & Evidence Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe exactly what occurred, who was contacted, and actions taken..."
              className="w-full p-3 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-xs text-[#0B3322] dark:text-[#EEFAF3] placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130] cursor-pointer">
            <input
              type="checkbox"
              checked={terminateJob}
              onChange={e => setTerminateJob(e.target.checked)}
              className="mt-0.5 accent-rose-600 rounded"
            />
            <div className="text-xs">
              <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                Terminate Delivery as Failed
              </span>
              <p className="text-[#6B8B7B] dark:text-[#88B8A0] text-[11px] mt-0.5">
                Check this if delivery cannot continue (e.g. buyer refused, severe breakdown).
              </p>
            </div>
          </label>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit Incident Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
