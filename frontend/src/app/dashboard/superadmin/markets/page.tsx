'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Store,
  MapPin,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  X,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { superadminApi, CityItem, MarketItem } from '@/lib/superadminApi';

export default function SuperadminMarketsPage() {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'markets' | 'cities'>('markets');

  // Modals
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [cityForm, setCityForm] = useState({ name: '', regionName: '', latitude: 9.0108, longitude: 38.7613 });

  const [showAddMarketModal, setShowAddMarketModal] = useState(false);
  const [marketForm, setMarketForm] = useState({
    cityId: '',
    name: '',
    description: '',
    latitude: 9.0108,
    longitude: 38.7613,
    serviceRadiusKm: 35,
  });

  const [editingMarket, setEditingMarket] = useState<MarketItem | null>(null);
  const [editRadius, setEditRadius] = useState(35);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superadminApi.getMarketsAndCities();
      setCities(res.cities);
      setMarkets(res.markets);
      if (res.cities.length > 0 && !marketForm.cityId) {
        setMarketForm((prev) => ({ ...prev, cityId: res.cities[0].id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load markets and geographic regions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await superadminApi.createCity(cityForm);
      setShowAddCityModal(false);
      setCityForm({ name: '', regionName: '', latitude: 9.0108, longitude: 38.7613 });
      setActionMsg('City registered successfully.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to register city.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await superadminApi.createMarket(marketForm);
      setShowAddMarketModal(false);
      setMarketForm({
        cityId: cities[0]?.id || '',
        name: '',
        description: '',
        latitude: 9.0108,
        longitude: 38.7613,
        serviceRadiusKm: 35,
      });
      setActionMsg('Market created successfully.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create market.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMarketStatus = async (market: MarketItem) => {
    try {
      await superadminApi.updateMarket(market.id, { isActive: !market.isActive });
      setActionMsg(`Market ${!market.isActive ? 'activated' : 'deactivated'}.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update market status.');
    }
  };

  const handleSaveMarketRadius = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarket) return;
    setActionLoading(true);
    try {
      await superadminApi.updateMarket(editingMarket.id, { serviceRadiusKm: Number(editRadius) });
      setEditingMarket(null);
      setActionMsg('Market service radius updated.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update market radius.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMarkets = markets.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.cityName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Regions & Local Markets
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Administer Ethiopian cities, agricultural trading hubs, and delivery service coverage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCityModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 dark:border-[#163D2F] bg-white dark:bg-[#0A2218] hover:border-emerald-500 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add City</span>
          </button>
          <button
            onClick={() => setShowAddMarketModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Market</span>
          </button>
        </div>
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

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'markets'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
            }`}
          >
            Markets ({markets.length})
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'cities'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
            }`}
          >
            Cities & Regions ({cities.length})
          </button>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search markets or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none"
          />
        </div>
      </div>

      {/* Content View */}
      {activeTab === 'markets' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMarkets.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-[#0E3524] text-emerald-600 flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {m.cityName} {m.regionName ? `· ${m.regionName}` : ''}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                  >
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#142E24] dark:text-[#E6F0EB]">{m.name}</h3>
                {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-[#163D2F] text-xs space-y-2">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Coverage Radius:</span>
                  <span className="font-bold text-[#142E24] dark:text-[#E6F0EB]">{m.serviceRadiusKm} km</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Registered Farmers:</span>
                  <span className="font-bold text-[#142E24] dark:text-[#E6F0EB]">{m.farmerCount}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Delivery Zones:</span>
                  <span className="font-bold text-[#142E24] dark:text-[#E6F0EB]">{m.deliveryZoneCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditingMarket(m);
                    setEditRadius(m.serviceRadiusKm);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold border border-gray-200 dark:border-[#163D2F] rounded-lg hover:border-emerald-500 cursor-pointer"
                >
                  Adjust Radius
                </button>
                <button
                  onClick={() => handleToggleMarketStatus(m)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer ${
                    m.isActive
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  {m.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF9] dark:bg-[#0D261B] border-b border-[#E3EAE5] dark:border-[#163D2F] text-gray-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-6">City Name</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Markets Count</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#163D2F]">
              {cities.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E3524]/20">
                  <td className="py-3 px-6 font-bold text-[#142E24] dark:text-[#E6F0EB]">{c.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{c.regionName || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                    {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 font-bold">{c.markets?.length || 0} markets</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add City */}
      {showAddCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-[#163D2F]">
              <h3 className="text-base font-bold">Register Ethiopian City</h3>
              <button onClick={() => setShowAddCityModal(false)} className="cursor-pointer text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCity} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">City Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dire Dawa"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Region / Zone</label>
                <input
                  type="text"
                  placeholder="e.g. Harari / Dire Dawa"
                  value={cityForm.regionName}
                  onChange={(e) => setCityForm({ ...cityForm, regionName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cityForm.latitude}
                    onChange={(e) => setCityForm({ ...cityForm, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cityForm.longitude}
                    onChange={(e) => setCityForm({ ...cityForm, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCityModal(false)}
                  className="px-4 py-2 border rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl cursor-pointer"
                >
                  Save City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Market */}
      {showAddMarketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-[#163D2F]">
              <h3 className="text-base font-bold">Create Agricultural Market</h3>
              <button onClick={() => setShowAddMarketModal(false)} className="cursor-pointer text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMarket} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Host City *</label>
                <select
                  required
                  value={marketForm.cityId}
                  onChange={(e) => setMarketForm({ ...marketForm, cityId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.regionName || 'Ethiopia'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Market Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Merkato Grain Depot"
                  value={marketForm.name}
                  onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Primary hub for cereal and oilseeds"
                  value={marketForm.description}
                  onChange={(e) => setMarketForm({ ...marketForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={marketForm.latitude}
                    onChange={(e) => setMarketForm({ ...marketForm, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={marketForm.longitude}
                    onChange={(e) => setMarketForm({ ...marketForm, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Service Coverage Radius (Km)</label>
                <input
                  type="number"
                  min="5"
                  max="150"
                  required
                  value={marketForm.serviceRadiusKm}
                  onChange={(e) => setMarketForm({ ...marketForm, serviceRadiusKm: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMarketModal(false)}
                  className="px-4 py-2 border rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl cursor-pointer"
                >
                  Create Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Radius */}
      {editingMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold">Adjust Service Coverage</h3>
            <p className="text-gray-500">
              Set the delivery and dispatch radius for <strong>{editingMarket.name}</strong>.
            </p>
            <form onSubmit={handleSaveMarketRadius} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Service Radius (Km)</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  required
                  value={editRadius}
                  onChange={(e) => setEditRadius(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMarket(null)}
                  className="px-4 py-2 border rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#059669] text-white font-bold rounded-xl cursor-pointer"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

