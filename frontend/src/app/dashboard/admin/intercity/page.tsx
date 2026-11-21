'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Route,
  ShieldCheck,
  Building2,
  Clock,
  Truck,
  Scale,
  DollarSign,
  Layers,
  Plus,
  Snowflake,
  FileText,
  UserCheck,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { logisticsApi } from '@/lib/logisticsApi';
import { adminApi } from '@/lib/adminApi';

export default function AdminIntercityLogisticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'providers' | 'rates' | 'consolidation'>('overview');
  const [overview, setOverview] = useState<any | null>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rate Policy Modal
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateForm, setRateForm] = useState({
    vehicleCategory: 'MEDIUM_DUTY_TRUCK',
    originCity: '',
    destinationCity: '',
    baseFareETB: 1500,
    perKmRateETB: 24,
    perKgRateETB: 1.8,
    multiStopSurchargeETB: 400,
    loadingAssistanceFeeETB: 600,
    coldChainMultiplier: 1.25,
    minDistanceKm: 0,
    maxDistanceKm: 1200,
  });

  // Consolidation State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [consolidating, setConsolidating] = useState(false);

  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overRes, shipRes, ratesRes, appRes] = await Promise.all([
        logisticsApi.getAdminOverview().catch(() => ({ success: false, data: null })),
        logisticsApi.getAdminShipments().catch(() => ({ success: false, data: [] })),
        logisticsApi.getAdminRates().catch(() => ({ success: false, data: [] })),
        adminApi.getIntercityApprovals().catch(() => []),
      ]);

      if (overRes?.success && overRes.data) setOverview(overRes.data);
      if (shipRes?.success && Array.isArray(shipRes.data)) setShipments(shipRes.data);
      if (ratesRes?.success && Array.isArray(ratesRes.data)) setRates(ratesRes.data);
      if (Array.isArray(appRes)) setApprovals(appRes);
    } catch (err: any) {
      console.error('Failed to load admin logistics data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Transport Rate Policy
  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logisticsApi.saveAdminRate({
        vehicleCategory: rateForm.vehicleCategory,
        originCity: rateForm.originCity.trim() || undefined,
        destinationCity: rateForm.destinationCity.trim() || undefined,
        baseFareETB: Number(rateForm.baseFareETB),
        perKmRateETB: Number(rateForm.perKmRateETB),
        perKgRateETB: Number(rateForm.perKgRateETB),
        multiStopSurchargeETB: Number(rateForm.multiStopSurchargeETB),
        loadingAssistanceFeeETB: Number(rateForm.loadingAssistanceFeeETB),
        coldChainMultiplier: Number(rateForm.coldChainMultiplier),
        minDistanceKm: Number(rateForm.minDistanceKm),
        maxDistanceKm: Number(rateForm.maxDistanceKm),
      });
      showNotification('Transport pricing rate policy saved successfully!');
      setIsRateModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save rate policy.', 'error');
    }
  };

  // Provider Verification
  const handleVerifyProvider = async (providerId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await logisticsApi.adminVerifyProvider(providerId, status);
      showNotification(`Commercial carrier profile marked as ${status}.`);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to verify provider.', 'error');
    }
  };

  // Vehicle Verification
  const handleVerifyVehicle = async (vehicleId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await logisticsApi.adminVerifyVehicle(vehicleId, status);
      showNotification(`Freight vehicle marked as ${status}.`);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to verify vehicle.', 'error');
    }
  };

  // Consolidation Action
  const handleConsolidateOrders = async () => {
    if (selectedOrderIds.length < 2) {
      showNotification('Please select at least 2 compatible orders for corridor consolidation.', 'error');
      return;
    }
    setConsolidating(true);
    try {
      await logisticsApi.adminConsolidate(selectedOrderIds);
      showNotification(`Consolidated ${selectedOrderIds.length} orders into a single multi-stop corridor shipment!`);
      setSelectedOrderIds([]);
      fetchData();
      setActiveTab('shipments');
    } catch (err: any) {
      showNotification(err.message || 'Failed to consolidate orders.', 'error');
    } finally {
      setConsolidating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            Inter-City Trade & Bulk Logistics Control Center
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Administer fixed-price transportation policies, corridor consolidation, carrier verification, and shipments.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-xs font-semibold text-[#142E24] dark:text-[#E2EAE5] hover:border-[#10B981] transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#0A2218] p-4 rounded-2xl border border-[#E3EAE5] dark:border-[#163D2F] shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Total Shipments</span>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
            {overview?.totalShipments ?? shipments.length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#0A2218] p-4 rounded-2xl border border-[#E3EAE5] dark:border-[#163D2F] shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Active In-Transit</span>
          <div className="text-xl font-black text-indigo-600 mt-1">
            {overview?.activeShipments ?? shipments.filter((s) => ['SCHEDULED', 'IN_TRANSIT', 'LOADING'].includes(s.status)).length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#0A2218] p-4 rounded-2xl border border-[#E3EAE5] dark:border-[#163D2F] shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Delivered Safely</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {overview?.deliveredShipments ?? shipments.filter((s) => s.status === 'DELIVERED').length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#0A2218] p-4 rounded-2xl border border-[#E3EAE5] dark:border-[#163D2F] shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Pending Carriers</span>
          <div className="text-xl font-black text-amber-600 mt-1">
            {overview?.pendingProviders ?? 0}
          </div>
        </div>
        <div className="bg-white dark:bg-[#0A2218] p-4 rounded-2xl border border-[#E3EAE5] dark:border-[#163D2F] shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Fleet Vehicles</span>
          <div className="text-xl font-black text-purple-600 mt-1">
            {overview?.totalVehicles ?? 0}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#0A2218] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
          }`}
        >
          Authorization Queue ({approvals.filter((a) => a.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('shipments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'shipments'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#0A2218] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Freight Shipments ({shipments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rates'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#0A2218] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Transport Rates Policy ({rates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('consolidation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'consolidation'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#0A2218] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Corridor Consolidation</span>
        </button>
      </div>

      {/* TAB 1: AUTHORIZATION QUEUE (Existing functionality preserved) */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
                Intercity Trade Authorization Queue
              </h2>
              <p className="text-xs text-gray-500">
                Bulk agricultural orders (&gt;10,000 kg) requiring mandatory administrative review.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-full text-xs font-bold">
              {approvals.filter((a) => a.status === 'PENDING').length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#0C2A1E]/60 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Buyer Name</th>
                  <th className="px-4 py-3">Origin ➔ Destination</th>
                  <th className="px-4 py-3">Produce Load Summary</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
                {approvals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                      No orders currently pending trade approval.
                    </td>
                  </tr>
                ) : (
                  approvals.map((app) => (
                    <tr key={app.id}>
                      <td className="px-4 py-3 font-mono font-bold">#{app.orderId.slice(0, 8)}</td>
                      <td className="px-4 py-3">{app.buyerName}</td>
                      <td className="px-4 py-3 text-indigo-600 font-semibold">{app.originCity} ➔ {app.destinationCity}</td>
                      <td className="px-4 py-3">{app.productSummary}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{app.totalAmountFormatted}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {app.status === 'PENDING' && (
                          <button
                            onClick={async () => {
                              await adminApi.decideIntercityApproval(app.id, 'APPROVED', 'Approved by administrator');
                              showNotification('Order approved for dispatch.');
                              fetchData();
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FREIGHT SHIPMENTS LIST */}
      {activeTab === 'shipments' && (
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
                Active & Completed Commercial Freight Shipments
              </h2>
              <p className="text-xs text-gray-500">
                End-to-end audit trail of regional physical shipments, truck assignments, and milestones.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#0C2A1E]/60 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Waybill #</th>
                  <th className="px-4 py-3">Corridor</th>
                  <th className="px-4 py-3">Cargo Weight</th>
                  <th className="px-4 py-3">Vehicle Plate</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Agreed Fee</th>
                  <th className="px-4 py-3">Shipment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No freight shipments created yet.
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        #{s.trackingNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        {s.originCity} ➔ {s.destinationCity}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {s.totalWeightKg?.toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {s.vehicle?.plateNumber || <span className="text-gray-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        {s.driver?.fullName || <span className="text-gray-400 italic">TBD</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        ETB {s.agreedCost?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          s.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'IN_TRANSIT'
                            ? 'bg-blue-100 text-blue-800'
                            : s.status === 'REQUESTED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSPORT RATES POLICY */}
      {activeTab === 'rates' && (
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
                Administrative Transport Rates & Pricing Formulas
              </h2>
              <p className="text-xs text-gray-500">
                Configure distance bands, payload tiers, multi-stop pickup surcharges, and cold-chain multipliers. Zero hard-coded prices.
              </p>
            </div>
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rate Rule</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#0C2A1E]/60 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Corridor Scope</th>
                  <th className="px-4 py-3">Base Fare</th>
                  <th className="px-4 py-3">Rate / km</th>
                  <th className="px-4 py-3">Rate / kg</th>
                  <th className="px-4 py-3">Stop Surcharge</th>
                  <th className="px-4 py-3">Cold Chain</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      Using standard system pricing matrix. Click "Add Rate Rule" to customize specific corridor tariffs.
                    </td>
                  </tr>
                ) : (
                  rates.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {r.vehicleCategory?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        {r.originCity && r.destinationCity ? `${r.originCity} ➔ ${r.destinationCity}` : 'All Regional Routes'}
                      </td>
                      <td className="px-4 py-3 font-mono">ETB {r.baseFareETB}</td>
                      <td className="px-4 py-3 font-mono">ETB {r.perKmRateETB}/km</td>
                      <td className="px-4 py-3 font-mono">ETB {r.perKgRateETB}/kg</td>
                      <td className="px-4 py-3 font-mono">ETB {r.multiStopSurchargeETB}</td>
                      <td className="px-4 py-3 font-mono">{r.coldChainMultiplier}x</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE (v{r.version})
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CORRIDOR CONSOLIDATION */}
      {activeTab === 'consolidation' && (
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
                Corridor Multi-Order Consolidation Tool
              </h2>
              <p className="text-xs text-gray-500">
                Consolidate multiple small farmer shipments along compatible geographic delivery corridors into a single high-efficiency truck.
              </p>
            </div>
            <button
              disabled={selectedOrderIds.length < 2 || consolidating}
              onClick={handleConsolidateOrders}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Consolidate Selected ({selectedOrderIds.length})</span>
            </button>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-xs space-y-2 border border-indigo-100 dark:border-indigo-900/40">
            <div className="font-bold text-indigo-900 dark:text-indigo-200">
              Corridor Clustering Engine:
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              The clustering algorithm groups farm gate pickups along arterial highways (e.g., Hawassa ➔ Shashemene ➔ Adama ➔ Addis Ababa) within a 45 km corridor buffer, ensuring truck capacity constraints are strictly respected and transportation costs are allocated weight-proportionally.
            </p>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD TRANSPORT RATE POLICY ───────────────────────── */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Configure Transport Pricing Policy
              </h3>
              <button onClick={() => setIsRateModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Vehicle Category</label>
                <select
                  value={rateForm.vehicleCategory}
                  onChange={(e) => setRateForm({ ...rateForm, vehicleCategory: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                >
                  <option value="LIGHT_DUTY_TRUCK">Light Duty Truck (Up to 3,500 kg)</option>
                  <option value="MEDIUM_DUTY_TRUCK">Medium Duty Truck (Up to 8,000 kg)</option>
                  <option value="HEAVY_DUTY_TRUCK">Heavy Duty Semi-Trailer (Up to 24,000 kg)</option>
                  <option value="REFRIGERATED_TRUCK">Refrigerated Truck (Cold-Chain)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Origin City (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hawassa"
                    value={rateForm.originCity}
                    onChange={(e) => setRateForm({ ...rateForm, originCity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Destination City (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Addis Ababa"
                    value={rateForm.destinationCity}
                    onChange={(e) => setRateForm({ ...rateForm, destinationCity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold mb-1">Base Fare (ETB)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={rateForm.baseFareETB}
                    onChange={(e) => setRateForm({ ...rateForm, baseFareETB: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Per-KM Rate (ETB)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0"
                    value={rateForm.perKmRateETB}
                    onChange={(e) => setRateForm({ ...rateForm, perKmRateETB: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Per-KG Rate (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={rateForm.perKgRateETB}
                    onChange={(e) => setRateForm({ ...rateForm, perKgRateETB: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold mb-1">Multi-Stop Surcharge</label>
                  <input
                    type="number"
                    value={rateForm.multiStopSurchargeETB}
                    onChange={(e) => setRateForm({ ...rateForm, multiStopSurchargeETB: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Loading Fee (ETB)</label>
                  <input
                    type="number"
                    value={rateForm.loadingAssistanceFeeETB}
                    onChange={(e) => setRateForm({ ...rateForm, loadingAssistanceFeeETB: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Cold-Chain Multiplier</label>
                  <input
                    type="number"
                    step="0.05"
                    value={rateForm.coldChainMultiplier}
                    onChange={(e) => setRateForm({ ...rateForm, coldChainMultiplier: parseFloat(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Rate Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
