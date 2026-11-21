'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ChevronRight,
  Menu,
  Navigation,
  Loader2,
  PackageX,
  Scale,
  AlertCircle,
  FileText,
  Boxes,
  X,
  Check,
} from 'lucide-react';
import { farmerApi } from '@/lib/farmerApi';
import { logisticsApi } from '@/lib/logisticsApi';

interface DeliveryItem {
  id: string;
  orderNumber: string;
  product: string;
  quantity: string;
  courierName: string;
  courierPhone: string;
  vehicle: string;
  origin: string;
  destination: string;
  status: 'ASSIGNED' | 'HEADING_TO_PICKUP' | 'PICKED_UP' | 'EN_ROUTE' | 'DELIVERED';
  eta: string;
}

export default function DeliveriesPage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const [activeTab, setActiveTab] = useState<'local' | 'freight'>('local');
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [freightPickups, setFreightPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Digital Gate Handover Confirmation
  const [selectedPickupModal, setSelectedPickupModal] = useState<any | null>(null);
  const [handoverForm, setHandoverForm] = useState({
    collectedQuantityKg: 0,
    packageCount: 0,
    cargoCondition: 'PRIME_HARVEST',
    notes: '',
    confirmedByFarmer: false,
  });
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllDeliveries = async () => {
    try {
      setLoading(true);
      const [localRes, freightRes] = await Promise.all([
        farmerApi.getDeliveries().catch(() => ({ success: false, deliveries: [] })),
        logisticsApi.getFarmerOrders().catch(() => ({ success: false, data: [] })),
      ]);

      if (localRes?.success && Array.isArray(localRes.deliveries)) {
        setDeliveries(localRes.deliveries);
      }
      if (freightRes?.success && Array.isArray(freightRes.data)) {
        setFreightPickups(freightRes.data);
      }
    } catch (err) {
      console.error('Failed to load deliveries or freight pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDeliveries();
  }, []);

  const openHandoverModal = (pickup: any) => {
    setSelectedPickupModal(pickup);
    setHandoverForm({
      collectedQuantityKg: pickup.allocatedWeightKg || 500,
      packageCount: Math.ceil((pickup.allocatedWeightKg || 500) / 50),
      cargoCondition: 'PRIME_HARVEST',
      notes: '',
      confirmedByFarmer: false,
    });
  };

  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickupModal) return;
    if (!handoverForm.confirmedByFarmer) {
      showNotification('Please check the confirmation box before finalizing handover.', 'error');
      return;
    }

    setSubmittingHandover(true);
    try {
      await logisticsApi.confirmPickup(
        selectedPickupModal.shipmentId,
        selectedPickupModal.id,
        {
          collectedQuantityKg: Number(handoverForm.collectedQuantityKg),
          packageCount: Number(handoverForm.packageCount),
          cargoCondition: handoverForm.cargoCondition,
          notes: handoverForm.notes,
          farmerConfirmed: true,
        }
      );
      showNotification('Gate handover confirmed! Cargo released to commercial carrier.');
      setSelectedPickupModal(null);
      loadAllDeliveries();
    } catch (err: any) {
      showNotification(err.message || 'Failed to confirm freight handover.', 'error');
    } finally {
      setSubmittingHandover(false);
    }
  };

  const activeLocalCount = deliveries.filter((d) =>
    ['ASSIGNED', 'HEADING_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE'].includes(d.status)
  ).length;

  const pendingFreightCount = freightPickups.filter((p) => !p.farmerConfirmed).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all ${
            notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#173F35] dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Deliveries & Bulk Freight Logistics
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Track local courier dispatches and verify commercial inter-city truck gate handovers
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/farmer/orders"
          className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 transition-colors"
        >
          View Orders
        </Link>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Local Couriers</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeLocalCount}</div>
            <p className="text-xs text-gray-400 mt-0.5">En route to your farm</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inter-City Freight Pickups</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{pendingFreightCount} pending</div>
            <p className="text-xs text-gray-400 mt-0.5">Commercial truck gate loading</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Digital Gate Pass Handshakes</span>
            <div className="text-2xl font-black text-purple-600 mt-1">100%</div>
            <p className="text-xs text-gray-400 mt-0.5">Verified scale weight handshakes</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0D2118] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            Local Couriers ({deliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('freight')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'freight'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0D2118] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Inter-City Bulk Freight ({freightPickups.length})</span>
            {pendingFreightCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950">
                {pendingFreightCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: LOCAL COURIERS */}
        {activeTab === 'local' && (
          <div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Loading live dispatch records...</p>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="py-16 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">No active local couriers yet</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                  When nearby buyers purchase your produce and couriers accept delivery dispatch requests, live pickup routes will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((del) => (
                  <div
                    key={del.id}
                    className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-800 dark:text-white">
                          {del.product}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                          {del.orderNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            del.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {del.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>Pickup:</strong> {del.origin}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span><strong>Dropoff:</strong> {del.destination}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Courier: {del.courierName} ({del.vehicle})
                        </span>
                        {del.courierPhone ? (
                          <a
                            href={`tel:${del.courierPhone}`}
                            className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {del.courierPhone}
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Estimated Arrival</div>
                        <div className="text-sm font-black text-emerald-600">{del.eta}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTER-CITY BULK FREIGHT PICKUPS */}
        {activeTab === 'freight' && (
          <div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Loading inter-city freight pickups...</p>
              </div>
            ) : freightPickups.length === 0 ? (
              <div className="py-16 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">No inter-city bulk shipments scheduled</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                  When buyers in other regions make bulk orders of your harvest, commercial freight trucks dispatched to your farm gate will be scheduled here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {freightPickups.map((pickup) => (
                  <div
                    key={pickup.id}
                    className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                            Waybill #{pickup.shipment?.trackingNumber || 'AGRI-WAYBILL'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Stop #{pickup.pickupSequence} in Corridor
                          </span>
                          {pickup.shipment?.vehicle?.hasRefrigeration && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                              ❄️ Cold-Chain Truck
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Scheduled Pickup: {new Date(pickup.scheduledTime).toLocaleString()}
                        </div>
                      </div>

                      <div>
                        {pickup.farmerConfirmed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Gate Handover Completed
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting Farm Gate Loading
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Truck & Driver Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-gray-50 dark:bg-[#11241B] p-3 rounded-xl border border-gray-100 dark:border-white/5">
                      <div>
                        <span className="font-bold text-gray-500 block">Truck Plate & Model:</span>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                          {pickup.shipment?.vehicle?.plateNumber || 'TBD'} ({pickup.shipment?.vehicle?.category?.replace(/_/g, ' ') || 'Commercial Truck'})
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block">Designated Driver:</span>
                        <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-semibold">
                          <span>{pickup.shipment?.driver?.fullName || 'Assigned Carrier Driver'}</span>
                          {pickup.shipment?.driver?.phone && (
                            <a
                              href={`tel:${pickup.shipment.driver.phone}`}
                              className="text-emerald-600 font-bold hover:underline"
                            >
                              ({pickup.shipment.driver.phone})
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block">Allocated Cargo Load:</span>
                        <span className="font-mono font-black text-indigo-700 dark:text-indigo-400">
                          {pickup.allocatedWeightKg} kg Manifest
                        </span>
                      </div>
                    </div>

                    {/* Handover Status & Action */}
                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Farm Gate: {pickup.farmLocation}</span>
                      </div>

                      <div>
                        {!pickup.farmerConfirmed ? (
                          <button
                            onClick={() => openHandoverModal(pickup)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Confirm Gate Handover</span>
                          </button>
                        ) : (
                          <div className="text-right text-[11px] text-gray-500">
                            <div>Loaded: <strong>{pickup.collectedWeightKg} kg</strong></div>
                            {pickup.confirmedAt && (
                              <div className="text-[10px]">
                                Confirmed: {new Date(pickup.confirmedAt).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL: CONFIRM GATE HANDOVER ──────────────────────────── */}
      {selectedPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Gate Handover: Waybill #{selectedPickupModal.shipment?.trackingNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedPickupModal(null)} className="p-1 cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmHandover} className="space-y-4 text-xs">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                <div className="font-bold text-indigo-950 dark:text-indigo-200">
                  Carrier Truck: {selectedPickupModal.shipment?.vehicle?.plateNumber}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Driver: {selectedPickupModal.shipment?.driver?.fullName || 'Commercial Driver'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Actual Net Weight Loaded at Farm Gate (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={handoverForm.collectedQuantityKg || ''}
                    onChange={(e) =>
                      setHandoverForm({ ...handoverForm, collectedQuantityKg: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510] font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 font-bold">kg</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Manifest target: {selectedPickupModal.allocatedWeightKg} kg
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Package / Crate Count
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={handoverForm.packageCount || ''}
                  onChange={(e) =>
                    setHandoverForm({ ...handoverForm, packageCount: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Harvest Packaging & Quality State
                </label>
                <select
                  value={handoverForm.cargoCondition}
                  onChange={(e) => setHandoverForm({ ...handoverForm, cargoCondition: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                >
                  <option value="PRIME_HARVEST">Prime Harvest - Sealed & Undamaged</option>
                  <option value="SATISFACTORY">Satisfactory - Standard Packaging</option>
                  <option value="ACCEPTABLE">Acceptable - Minor Surface Abrasion</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Gate Clearance Seal / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Seal #ET-99481, loaded onto refrigerated compartment"
                  value={handoverForm.notes}
                  onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={handoverForm.confirmedByFarmer}
                    onChange={(e) => setHandoverForm({ ...handoverForm, confirmedByFarmer: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                    I confirm that {handoverForm.collectedQuantityKg} kg of agricultural harvest was physically verified, loaded, and handed over to the commercial carrier driver.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedPickupModal(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHandover}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {submittingHandover ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Gate Handover</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
