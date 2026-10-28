'use client';

import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calculator,
  Search,
  X,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { superadminApi, PricingRuleItem } from '@/lib/superadminApi';

export default function SuperadminCommissionsPage() {
  const [rules, setRules] = useState<PricingRuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Calculator simulator
  const [simOrderAmount, setSimOrderAmount] = useState<number>(5000);
  const [simCommissionRate, setSimCommissionRate] = useState<number>(5);
  const [simDeliveryBase, setSimDeliveryBase] = useState<number>(50);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    type: 'COMMISSION_PERCENTAGE',
    scope: 'GLOBAL',
    value: 5,
  });

  const [editingRule, setEditingRule] = useState<PricingRuleItem | null>(null);
  const [editVal, setEditVal] = useState<number>(5);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superadminApi.getPricingRules();
      setRules(res);
      // Auto-set simulator from global rules if present
      const comm = res.find((r) => r.type === 'COMMISSION_PERCENTAGE' && r.scope === 'GLOBAL');
      if (comm) setSimCommissionRate(comm.value);
      const del = res.find((r) => r.type === 'DELIVERY_BASE_FEE');
      if (del) setSimDeliveryBase(del.value);
    } catch (err: any) {
      setError(err?.message || 'Failed to load pricing fee rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await superadminApi.createPricingRule(ruleForm);
      setShowAddModal(false);
      setActionMsg('Platform fee rule configured successfully.');
      loadRules();
    } catch (err: any) {
      setError(err?.message || 'Failed to create fee rule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setActionLoading(true);
    try {
      await superadminApi.updatePricingRule(editingRule.id, {
        value: Number(editVal),
        isActive: editActive,
      });
      setEditingRule(null);
      setActionMsg('Fee rule updated.');
      loadRules();
    } catch (err: any) {
      setError(err?.message || 'Failed to update rule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculator outputs
  const calculatedCommission = (simOrderAmount * simCommissionRate) / 100;
  const calculatedFarmerPayout = simOrderAmount - calculatedCommission;
  const calculatedTotalBuyerCost = simOrderAmount + simDeliveryBase;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Commissions & Fee Policies
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Administer platform fee structures, carrier logistics charges, and financial revenue rates
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Fee Rule</span>
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

      {/* Interactive Fee Simulator Card */}
      <div className="bg-gradient-to-br from-[#0E3D2B] to-[#0A291D] text-white rounded-2xl p-6 shadow-md border border-[#164C37]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Live Financial Calculation Simulator</h3>
            <p className="text-[11px] text-[#A3C9B7]">
              Preview how active commission and logistics policies affect buyer checkout and farmer earnings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-[#A3C9B7] mb-1">
              Sample Order Gross (ETB)
            </label>
            <input
              type="number"
              value={simOrderAmount}
              onChange={(e) => setSimOrderAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-[#0A2218] rounded-xl border border-[#174D38] text-white text-xs font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A3C9B7] mb-1">
              Platform Commission (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={simCommissionRate}
              onChange={(e) => setSimCommissionRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#0A2218] rounded-xl border border-[#174D38] text-white text-xs font-bold focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#0A2218]/70 border border-[#174D38] text-xs">
            <span className="text-[10px] text-[#A3C9B7] block uppercase font-bold">Platform Net Revenue</span>
            <span className="text-lg font-black text-emerald-300">
              ETB {calculatedCommission.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0A2218]/70 border border-[#174D38] text-xs">
            <span className="text-[10px] text-[#A3C9B7] block uppercase font-bold">Farmer Net Payout</span>
            <span className="text-lg font-black text-white">
              ETB {calculatedFarmerPayout.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-[#163D2F] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#142E24] dark:text-[#E6F0EB]">Active Platform Fee Policies</h3>
          <button
            onClick={() => loadRules()}
            className="p-1.5 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0E261D] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF9] dark:bg-[#0D261B] border-b border-[#E3EAE5] dark:border-[#163D2F] text-gray-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-6">Rule Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Rate / Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#163D2F]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading pricing rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No pricing rules configured.
                  </td>
                </tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E3524]/20">
                    <td className="py-3 px-6">
                      <p className="font-bold text-[#142E24] dark:text-[#E6F0EB]">{r.name}</p>
                      {r.description && <p className="text-[11px] text-gray-400">{r.description}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#0E261D] font-mono text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium">
                      {r.scope} {r.categoryName ? `(${r.categoryName})` : ''}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#142E24] dark:text-[#E6F0EB]">
                      {r.type.includes('PERCENTAGE') ? `${r.value}%` : `ETB ${r.value}`}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        }`}
                      >
                        {r.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingRule(r);
                          setEditVal(r.value);
                          setEditActive(r.isActive);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold border border-gray-200 dark:border-[#163D2F] rounded-lg hover:border-emerald-500 cursor-pointer"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Fee Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-[#163D2F]">
              <h3 className="text-base font-bold">Configure Fee Policy</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Platform Marketplace Commission"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Fee Type *</label>
                <select
                  value={ruleForm.type}
                  onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 cursor-pointer"
                >
                  <option value="COMMISSION_PERCENTAGE">COMMISSION_PERCENTAGE (%)</option>
                  <option value="FLAT_COMMISSION">FLAT_COMMISSION (ETB)</option>
                  <option value="DELIVERY_BASE_FEE">DELIVERY_BASE_FEE (ETB)</option>
                  <option value="INTERCITY_FEE">INTERCITY_FEE (ETB)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Scope</label>
                  <select
                    value={ruleForm.scope}
                    onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="GLOBAL">GLOBAL</option>
                    <option value="CATEGORY">CATEGORY</option>
                    <option value="MARKET">MARKET</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ruleForm.value}
                    onChange={(e) => setRuleForm({ ...ruleForm, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Description / Policy Notes</label>
                <input
                  type="text"
                  placeholder="Applies to all transactions..."
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
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
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Rule */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold">Update {editingRule.name}</h3>
            <form onSubmit={handleUpdateRule} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">
                  Rate / Amount ({editingRule.type.includes('PERCENTAGE') ? '%' : 'ETB'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editVal}
                  onChange={(e) => setEditVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="activeCheck" className="font-semibold cursor-pointer">
                  Policy rule is currently active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
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

