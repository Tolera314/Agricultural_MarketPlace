'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { superadminApi, IntercityRouteItem, CityItem, MarketItem } from '@/lib/superadminApi';

export default function SuperadminRoutesPage() {
  const [routes, setRoutes] = useState<IntercityRouteItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add Route Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [routeForm, setRouteForm] = useState({
    originCityId: '',
    destinationCityId: '',
    originMarketId: '',
    destinationMarketId: '',
    transitDays: 2,
    requiresApproval: true,
    minLimit: 1000,
    maxLimit: 100000,
    notes: '',
  });

  // Edit Route Modal
  const [editingRoute, setEditingRoute] = useState<IntercityRouteItem | null>(null);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW'>('ACTIVE');
  const [editRequiresApproval, setEditRequiresApproval] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [routeRes, geoRes] = await Promise.all([
        superadminApi.getIntercityRoutes(),
        superadminApi.getMarketsAndCities(),
      ]);
      setRoutes(routeRes.routes);
      setPendingApprovals(routeRes.pendingApprovals);
      setCities(geoRes.cities);
      setMarkets(geoRes.markets);

      if (geoRes.cities.length >= 2 && !routeForm.originCityId) {
        setRouteForm((prev) => ({
          ...prev,
          originCityId: geoRes.cities[0].id,
          destinationCityId: geoRes.cities[1].id,
          originMarketId: geoRes.markets[0]?.id || '',
          destinationMarketId: geoRes.markets[1]?.id || '',
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load intercity trading routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await superadminApi.createIntercityRoute(routeForm);
      setShowAddModal(false);
      setActionMsg('Intercity trade route established successfully.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create route.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    setActionLoading(true);
    try {
      await superadminApi.updateIntercityRoute(editingRoute.id, {
        status: editStatus,
        requiresApproval: editRequiresApproval,
      });
      setEditingRoute(null);
      setActionMsg('Route policy updated.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update route.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRoutes = routes.filter(
    (r) =>
      r.originCityName.toLowerCase().includes(search.toLowerCase()) ||
      r.destinationCityName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Intercity Trading Routes
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Configure cross-regional logistics corridors, transit thresholds, and authorization policies
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Establish Route</span>
        </button>
      </div>

      {/* Notifications */}
      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-between border border-emerald-200">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-800 text-xs font-semibold flex items-center justify-between border border-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Intercity Approvals Banner if any */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {pendingApprovals.length} Intercity Orders Awaiting Authorization
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Cross-regional orders exceeding transaction thresholds require administrative review before carrier dispatch.
              </p>
            </div>
          </div>
          <button
            onClick={() => alert(`Reviewing ${pendingApprovals.length} pending intercity shipments.`)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Review Queue
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search intercity routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none"
          />
        </div>

        <button
          onClick={() => loadData()}
          title="Refresh"
          className="p-2 text-gray-500 hover:text-emerald-600 rounded-xl hover:bg-gray-100 dark:hover:bg-[#0E261D] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRoutes.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  {r.status}
                </span>
                {r.requiresApproval && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Requires Approval</span>
                  </span>
                )}
              </div>

              {/* Corridor Heading */}
              <div className="flex items-center gap-2 font-bold text-sm text-[#142E24] dark:text-[#E6F0EB]">
                <span>{r.originCityName}</span>
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{r.destinationCityName}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {r.originMarketName} → {r.destinationMarketName}
              </p>
            </div>

            {/* Metrics */}
            <div className="pt-3 border-t border-gray-100 dark:border-[#163D2F] text-xs space-y-2 text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>Estimated Transit:</span>
                <span className="font-bold text-[#142E24] dark:text-[#E6F0EB]">
                  {r.estimatedTransitDays || 2} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completed Orders:</span>
                <span className="font-bold text-[#142E24] dark:text-[#E6F0EB]">{r.orderCount} orders</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Trade GMV:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{r.totalValueFormatted}</span>
              </div>
              {r.maxTransactionLimit && (
                <div className="flex items-center justify-between">
                  <span>Max Transaction Cap:</span>
                  <span className="font-semibold text-gray-500">ETB {r.maxTransactionLimit.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setEditingRoute(r);
                  setEditStatus(r.status);
                  setEditRequiresApproval(r.requiresApproval);
                }}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-[#163D2F] rounded-xl hover:border-emerald-500 cursor-pointer"
              >
                Configure Policy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Establish Route */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-[#163D2F]">
              <h3 className="text-base font-bold">Establish Intercity Route</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Origin City</label>
                  <select
                    required
                    value={routeForm.originCityId}
                    onChange={(e) => setRouteForm({ ...routeForm, originCityId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Destination City</label>
                  <select
                    required
                    value={routeForm.destinationCityId}
                    onChange={(e) => setRouteForm({ ...routeForm, destinationCityId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Origin Market Hub</label>
                  <select
                    required
                    value={routeForm.originMarketId}
                    onChange={(e) => setRouteForm({ ...routeForm, originMarketId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 cursor-pointer"
                  >
                    {markets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Destination Market</label>
                  <select
                    required
                    value={routeForm.destinationMarketId}
                    onChange={(e) => setRouteForm({ ...routeForm, destinationMarketId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 cursor-pointer"
                  >
                    {markets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Est. Transit Days</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    required
                    value={routeForm.transitDays}
                    onChange={(e) => setRouteForm({ ...routeForm, transitDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Transaction Cap (ETB)</label>
                  <input
                    type="number"
                    value={routeForm.maxLimit}
                    onChange={(e) => setRouteForm({ ...routeForm, maxLimit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqAppr"
                  checked={routeForm.requiresApproval}
                  onChange={(e) => setRouteForm({ ...routeForm, requiresApproval: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="reqAppr" className="font-semibold cursor-pointer">
                  Require Superadmin/Admin approval before dispatch
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl cursor-pointer"
                >
                  Establish Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Route Policy */}
      {editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold">
              Configure {editingRoute.originCityName} → {editingRoute.destinationCityName}
            </h3>
            <form onSubmit={handleUpdateRoute} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Corridor Operational Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE (Accepting shipments)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily closed)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Auditing logistics)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editReqAppr"
                  checked={editRequiresApproval}
                  onChange={(e) => setEditRequiresApproval(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="editReqAppr" className="font-semibold cursor-pointer">
                  Require administrative sign-off on orders
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="px-4 py-2 border rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#059669] text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

