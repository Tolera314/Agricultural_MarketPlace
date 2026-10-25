'use client';

import React, { useState } from 'react';
import { DollarSign, X, Loader2, CheckCircle2 } from 'lucide-react';
import { workerApi } from '@/lib/workerApi';

interface CodRecord {
  id: string;
  jobId: string | null;
  amount: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface CodReconciliationModalProps {
  open: boolean;
  onClose: () => void;
  pendingRecords: CodRecord[];
  onRemitted: () => void;
}

export function CodReconciliationModal({
  open,
  onClose,
  pendingRecords,
  onRemitted,
}: CodReconciliationModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    pendingRecords.map(r => r.id)
  );
  const [paymentService, setPaymentService] = useState('Telebirr');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedTotal = pendingRecords
    .filter(r => selectedIds.includes(r.id))
    .reduce((sum, r) => sum + r.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Please select at least one pending COD record to remit.');
      return;
    }
    if (!referenceNumber.trim()) {
      setError('Please provide the transaction reference or deposit slip number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await workerApi.submitReconciliation({
        reconciliationIds: selectedIds,
        paymentService,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim() || undefined,
      });
      onRemitted();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit cash remittance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#083827] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Remit Cash on Delivery (COD)</h3>
              <p className="text-xs text-emerald-200">
                Submit proof of cash deposit for settlement clearance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Pending records list */}
          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-2">
              Select Pending Collections to Remit
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-[#E3EDE6] dark:border-[#1E4130] rounded-2xl p-2 bg-[#F8FAF9] dark:bg-[#0A1812]">
              {pendingRecords.length === 0 ? (
                <p className="text-xs text-center py-4 text-slate-400">
                  No pending cash collections found.
                </p>
              ) : (
                pendingRecords.map(rec => {
                  const checked = selectedIds.includes(rec.id);
                  return (
                    <label
                      key={rec.id}
                      onClick={() => toggleSelect(rec.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                        checked
                          ? 'bg-emerald-50/80 dark:bg-[#133A27] border-emerald-300 dark:border-emerald-700'
                          : 'bg-white dark:bg-[#0D2118] border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="accent-[#075C3B] rounded"
                        />
                        <div>
                          <p className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                            {rec.notes || `Order Collection (${rec.id.slice(0, 6)})`}
                          </p>
                          <p className="text-[10px] text-[#6B8B7B] dark:text-[#88B8A0]">
                            {new Date(rec.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#088647] dark:text-emerald-400">
                        ETB {rec.amount.toLocaleString()}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EAF6EE] dark:bg-[#163828] border border-[#BDE0CB] dark:border-[#224A37] flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3]">
              Selected Remittance Total:
            </span>
            <span className="font-mono text-base font-black text-[#075C3B] dark:text-[#34D399]">
              ETB {selectedTotal.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Remittance Deposit Channel
            </label>
            <select
              value={paymentService}
              onChange={e => setPaymentService(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-xs font-semibold text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-[#088647]"
            >
              <option value="Telebirr">Telebirr (Merchant Account)</option>
              <option value="CBE Birr">CBE Birr</option>
              <option value="Bank Deposit">Commercial Bank of Ethiopia (Branch Deposit)</option>
              <option value="Awash Bank">Awash Bank</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Deposit Slip / Transaction Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="e.g. TXN-9481023847"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-xs font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-[#088647]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Deposit Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Deposited at Bole branch teller #3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-xs text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-[#088647]"
            />
          </div>

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
              disabled={loading || selectedIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#096e47] text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Submit Cash Remittance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
