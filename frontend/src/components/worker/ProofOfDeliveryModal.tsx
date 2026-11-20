'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Loader2,
  ShieldCheck,
  DollarSign,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { workerApi } from '@/lib/workerApi';

interface ProofOfDeliveryModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string | null;
  orderId?: string;
  paymentMethod?: string;
  totalAmount?: string | number;
  buyerName?: string;
  onDeliveryCompleted: () => void;
}

export function ProofOfDeliveryModal({
  open,
  onClose,
  jobId,
  orderId,
  paymentMethod,
  totalAmount,
  buyerName,
  onDeliveryCompleted,
}: ProofOfDeliveryModalProps) {
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photographic Proof of Delivery
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isCod = paymentMethod === 'CASH_ON_DELIVERY';

  if (!open || !jobId) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    try {
      const res = await workerApi.uploadProof(file);
      setProofPhotoUrl(res?.data?.secureUrl || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload proof photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() && !notes.trim() && !proofPhotoUrl) {
      setError('Please provide at least one proof element: recipient OTP code, delivery photo, or handover notes.');
      return;
    }

    if (isCod && !cashConfirmed) {
      setError(`Please confirm that you have collected ETB ${Number(totalAmount).toFixed(0)} from ${buyerName || 'the buyer'}.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await workerApi.updateStatus(jobId, 'DELIVERED', {
        proofOfDeliveryCode: code.trim() || undefined,
        proofOfDeliveryUrl: proofPhotoUrl || undefined,
        notes: notes.trim() || `Verified delivery handover to ${buyerName || 'recipient'}.`,
      });
      onDeliveryCompleted();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete delivery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0B3322] dark:text-[#EEFAF3]">
                Confirm Proof of Delivery
              </h3>
              <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                Order: {orderId ? orderId.slice(0, 8) : ''} • Recipient: {buyerName || 'Buyer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#12281E] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {isCod && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <DollarSign className="w-4 h-4" />
                <span>Cash on Delivery Collection Required</span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                Collect exact total amount from customer:{' '}
                <span className="font-mono font-black text-sm">ETB {Number(totalAmount || 0).toLocaleString()}</span>
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cashConfirmed}
                  onChange={e => setCashConfirmed(e.target.checked)}
                  className="accent-[#075C3B] rounded w-4 h-4"
                />
                <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                  I have collected full cash payment in person
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Recipient Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. 749201 (Provided by buyer on delivery)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-xs font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-[#088647]"
            />
            <p className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-1">
              Ask recipient for their 6-digit confirmation code shown on their order status.
            </p>
          </div>

          {/* Photographic Proof of Delivery */}
          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Geotagged Delivery Photo (Optional / Recommended)
            </label>
            {proofPhotoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={proofPhotoUrl}
                    alt="Proof of Delivery"
                    className="w-12 h-12 object-cover rounded-xl border"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Photo Attached</span>
                    </span>
                    <span className="text-[10px] text-gray-500">Cloudinary secure upload</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProofPhotoUrl(null)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-4 text-center bg-[#F0F5F2] dark:bg-[#12281E] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {uploadingPhoto ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading delivery photo...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-gray-400" />
                    <span className="text-xs font-bold text-emerald-600">
                      Snap Photo or Select Image
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Geotagged doorstep / handover proof
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mb-1.5">
              Handover Remarks / Delivery Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Handed directly to recipient at front door. All items in good condition."
              className="w-full p-3 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-xs text-[#0B3322] dark:text-[#EEFAF3] placeholder-slate-400 focus:outline-none focus:border-[#088647]"
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
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#096e47] text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Verify & Complete Delivery</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
