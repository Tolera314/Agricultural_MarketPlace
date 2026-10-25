'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  User,
  Package,
  ShieldCheck,
  Loader2,
  DollarSign,
  FileText,
  Truck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { workerApi } from '@/lib/workerApi';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { ReportIncidentModal } from './ReportIncidentModal';

interface ActiveDeliverySectionProps {
  onStatusUpdated: () => void;
  onNavigateSection?: (section: any) => void;
}

export function ActiveDeliverySection({
  onStatusUpdated,
  onNavigateSection,
}: ActiveDeliverySectionProps) {
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);

  // Handover checklist states
  const [checkProduce, setCheckProduce] = useState(true);
  const [checkQuantity, setCheckQuantity] = useState(true);
  const [checkPackaging, setCheckPackaging] = useState(true);

  const loadActiveJob = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.activeDelivery();
      setJob(res?.data || null);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveJob();
  }, [loadActiveJob]);

  // Status transition handlers
  const handleStartHeadingToPickup = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await workerApi.updateStatus(job.id, 'HEADING_TO_PICKUP', {
        notes: 'Worker commenced navigation to farmer collection hub.',
      });
      await loadActiveJob();
      onStatusUpdated();
    } catch (err: any) {
      alert(err?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await workerApi.updateStatus(job.id, 'PICKED_UP', {
        notes: 'Handover verified with farmer. Packaging intact and quantities matched.',
      });
      setHandoverModalOpen(false);
      await loadActiveJob();
      onStatusUpdated();
    } catch (err: any) {
      alert(err?.message || 'Failed to confirm pickup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRoute = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await workerApi.updateStatus(job.id, 'EN_ROUTE', {
        notes: 'Worker departed collection hub, in transit to buyer destination.',
      });
      await loadActiveJob();
      onStatusUpdated();
    } catch (err: any) {
      alert(err?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-[#075C3B] dark:text-[#34D399]" />
        <p className="text-xs text-[#517663] dark:text-[#88B8A0]">Loading active delivery...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-[#E3EDE6] dark:border-[#1E4130] p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#E5F7ED] dark:bg-[#133A27] text-[#088647] dark:text-[#34D399] flex items-center justify-center mx-auto">
          <Truck className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0B3322] dark:text-[#EEFAF3]">
            No Active Delivery In Progress
          </h3>
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-1 max-w-sm mx-auto leading-relaxed">
            You currently have no assigned delivery orders. Check incoming delivery offers or simulate a test order to start.
          </p>
        </div>
        {onNavigateSection && (
          <div className="pt-2">
            <button
              onClick={() => onNavigateSection('offers')}
              className="px-5 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#096e47] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Browse Delivery Requests
            </button>
          </div>
        )}
      </div>
    );
  }

  const isAssigned = job.status === 'ASSIGNED';
  const isHeadingPickup = job.status === 'HEADING_TO_PICKUP';
  const isPickedUp = job.status === 'PICKED_UP';
  const isEnRoute = job.status === 'EN_ROUTE';

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EDF5F0] dark:border-[#1A3326]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {job.tradeType || 'LOCAL'} DELIVERY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Order #{job.orderId.slice(0, 8)}
              </span>
            </div>
            <h2 className="text-lg font-black text-[#0B3322] dark:text-[#EEFAF3] mt-1">
              {job.product}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIncidentModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="pt-5 pb-2">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="space-y-1">
              <div
                className={`h-2 rounded-full ${
                  isAssigned || isHeadingPickup || isPickedUp || isEnRoute
                    ? 'bg-[#075C3B] dark:bg-[#10B981]'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3] text-[11px]">
                1. Assigned
              </span>
            </div>
            <div className="space-y-1">
              <div
                className={`h-2 rounded-full ${
                  isHeadingPickup || isPickedUp || isEnRoute
                    ? 'bg-[#075C3B] dark:bg-[#10B981]'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3] text-[11px]">
                2. Heading Pickup
              </span>
            </div>
            <div className="space-y-1">
              <div
                className={`h-2 rounded-full ${
                  isPickedUp || isEnRoute
                    ? 'bg-[#075C3B] dark:bg-[#10B981]'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3] text-[11px]">
                3. Picked Up
              </span>
            </div>
            <div className="space-y-1">
              <div
                className={`h-2 rounded-full ${
                  isEnRoute ? 'bg-[#075C3B] dark:bg-[#10B981]' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3] text-[11px]">
                4. In Transit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Delivery Workflow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route Instructions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pickup Card */}
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#075C3B] dark:text-[#34D399]">
                <MapPin className="w-4 h-4" />
                <span>STEP 1: PICKUP FROM FARMER</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {isPickedUp || isEnRoute ? 'Completed' : 'Pending Action'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                {job.farmerName || 'Agricultural Cooperative Hub'}
              </h4>
              <p className="text-xs text-[#517663] dark:text-[#88B8A0] mt-0.5">
                {job.pickupAddress}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#075C3B] dark:text-[#34D399]" />
                <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                  {job.quantityKg} kg &bull; {job.product}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                Packaging Verified
              </span>
            </div>

            {/* Pickup Action Buttons */}
            {isAssigned && (
              <button
                onClick={handleStartHeadingToPickup}
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-[#075C3B] hover:bg-[#096e47] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                <span>Start Heading to Pickup Location</span>
              </button>
            )}

            {isHeadingPickup && (
              <button
                onClick={() => setHandoverModalOpen(true)}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Product Pickup & Handover</span>
              </button>
            )}
          </div>

          {/* Dropoff Card */}
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Navigation className="w-4 h-4" />
                <span>STEP 2: DELIVER TO BUYER</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {job.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Prepaid Digital'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                {job.buyerName || 'Buyer Recipient'}
              </h4>
              <p className="text-xs text-[#517663] dark:text-[#88B8A0] mt-0.5">
                {job.dropoffAddress}
              </p>
            </div>

            {job.buyerPhone && (
              <div className="flex items-center gap-2 text-xs">
                <a
                  href={`tel:${job.buyerPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] font-bold text-[#0B3322] dark:text-[#EEFAF3] flex items-center gap-1.5 hover:bg-[#E3EDE6] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#075C3B] dark:text-[#34D399]" />
                  <span>Call Buyer ({job.buyerPhone})</span>
                </a>
              </div>
            )}

            {/* Dropoff Action Buttons */}
            {isPickedUp && (
              <button
                onClick={handleStartRoute}
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-[#075C3B] hover:bg-[#096e47] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                <span>Depart Pickup & Start Driving to Buyer</span>
              </button>
            )}

            {isEnRoute && (
              <button
                onClick={() => setProofModalOpen(true)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Recipient & Complete Delivery</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Financial & Summary Card */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">
              Delivery Compensation
            </h4>

            <div className="p-4 rounded-2xl bg-[#EAF6EE] dark:bg-[#163828] border border-[#BDE0CB] dark:border-[#224A37] text-center">
              <p className="text-[11px] font-bold text-[#517663] dark:text-[#88B8A0] uppercase tracking-wider">
                Your Guaranteed Earnings
              </p>
              <p className="text-2xl font-black text-[#075C3B] dark:text-[#34D399] mt-1 font-mono">
                ETB {Number(job.deliveryFee || 0).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#6B8B7B] dark:text-[#88B8A0]">
                <span>Payment Method:</span>
                <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                  {job.paymentMethod}
                </span>
              </div>
              {job.paymentMethod === 'CASH_ON_DELIVERY' && (
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold">
                  <span>Cash to Collect:</span>
                  <span className="font-mono text-sm">
                    ETB {Number(job.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Activity / Event Timeline */}
          {job.events && job.events.length > 0 && (
            <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] uppercase tracking-wider">
                Audit Timeline
              </h4>
              <div className="space-y-2 text-xs divide-y divide-[#EDF5F0] dark:divide-[#1A3326]">
                {job.events.map((ev: any) => (
                  <div key={ev.id} className="pt-2 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#075C3B] dark:text-[#34D399]">
                        {ev.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ev.occurredAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {ev.notes && (
                      <p className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
                        {ev.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Handover Verification Modal */}
      {handoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0B3322] dark:text-[#EEFAF3]">
                Pickup Handover Checklist
              </h3>
              <button
                onClick={() => setHandoverModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#517663] dark:text-[#88B8A0] leading-relaxed">
              Before marking product as collected, inspect the order with the farmer:
            </p>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkProduce}
                  onChange={e => setCheckProduce(e.target.checked)}
                  className="accent-[#075C3B] rounded w-4 h-4"
                />
                <span className="font-semibold text-[#0B3322] dark:text-[#EEFAF3]">
                  Verified produce type ({job.product}) matches order
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkQuantity}
                  onChange={e => setCheckQuantity(e.target.checked)}
                  className="accent-[#075C3B] rounded w-4 h-4"
                />
                <span className="font-semibold text-[#0B3322] dark:text-[#EEFAF3]">
                  Verified weight / box count ({job.quantityKg} kg)
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkPackaging}
                  onChange={e => setCheckPackaging(e.target.checked)}
                  className="accent-[#075C3B] rounded w-4 h-4"
                />
                <span className="font-semibold text-[#0B3322] dark:text-[#EEFAF3]">
                  Crates / sacks secure and suitable for transport
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setHandoverModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPickup}
                disabled={!checkProduce || !checkQuantity || !checkPackaging || actionLoading}
                className="px-5 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#096e47] text-white text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Handover & Pick Up</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        open={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        jobId={job.id}
        orderId={job.orderId}
        paymentMethod={job.paymentMethod}
        totalAmount={job.totalAmount}
        buyerName={job.buyerName}
        onDeliveryCompleted={() => {
          loadActiveJob();
          onStatusUpdated();
        }}
      />

      {/* Incident Report Modal */}
      <ReportIncidentModal
        open={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        jobId={job.id}
        orderId={job.orderId}
        onIncidentReported={() => {
          loadActiveJob();
          onStatusUpdated();
        }}
      />
    </div>
  );
}
