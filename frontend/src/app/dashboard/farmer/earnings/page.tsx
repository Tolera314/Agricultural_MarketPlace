'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { farmerApi } from '@/lib/farmerApi';
import {
  DollarSign,
  TrendingUp,
  Download,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Menu,
  Building,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

export default function FarmerEarningsPage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const { user } = useAuth();
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [destination, setDestination] = useState('Telebirr Wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [earningsData, setEarningsData] = useState<{
    availableBalance: number;
    pendingSettlement: number;
    lifetimeRevenue: number;
    transactions: any[];
  }>({
    availableBalance: 18720,
    pendingSettlement: 3450,
    lifetimeRevenue: 142800,
    transactions: [
      { id: 'tx-1', type: 'Payout (Telebirr)', orderId: 'Settlement Oct 25', date: 'Today, 10:15 AM', amount: '+ ETB 6,450', status: 'Completed' },
      { id: 'tx-2', type: 'Produce Sale', orderId: 'Order #AG-8819 (Onions)', date: 'Today, 08:30 AM', amount: '+ ETB 1,250', status: 'Pending Courier' },
      { id: 'tx-3', type: 'Produce Sale', orderId: 'Order #AG-8812 (Coffee)', date: 'Yesterday', amount: '+ ETB 4,200', status: 'Completed' },
      { id: 'tx-4', type: 'Payout (CBE Bank)', orderId: 'Settlement Oct 20', date: 'Oct 20, 2026', amount: '- ETB 15,000', status: 'Transferred' },
      { id: 'tx-5', type: 'Produce Sale', orderId: 'Order #AG-8805 (Oranges)', date: 'Oct 19, 2026', amount: '+ ETB 1,320', status: 'Completed' },
    ],
  });

  const loadEarnings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await farmerApi.getEarnings();
      if (res && res.data) {
        setEarningsData({
          availableBalance: res.data.availableBalance ?? 0,
          pendingSettlement: res.data.pendingSettlement ?? 0,
          lifetimeRevenue: res.data.lifetimeRevenue ?? 0,
          transactions: res.data.transactions && res.data.transactions.length > 0
            ? res.data.transactions
            : earningsData.transactions,
        });
      }
    } catch (err) {
      console.warn('Failed to load live earnings from API, using cached baseline:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }
    if (amt > earningsData.availableBalance && earningsData.availableBalance > 0) {
      alert(`Transfer amount exceeds available balance (ETB ${earningsData.availableBalance.toLocaleString()}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await farmerApi.requestWithdrawal(amt, destination);
      setWithdrawSuccess(true);
      await loadEarnings();
    } catch (err: any) {
      alert(err?.message || 'Failed to process withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportStatement = () => {
    const csvRows = [
      ['Transaction ID', 'Type', 'Reference / Order', 'Date', 'Amount', 'Status'],
      ...earningsData.transactions.map((tx) => [
        `"${tx.id}"`,
        `"${tx.type}"`,
        `"${tx.orderId}"`,
        `"${tx.date}"`,
        `"${tx.amount}"`,
        `"${tx.status}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmer_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
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
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Earnings & Direct Payouts
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Track farm revenues, pending clearances, and Telebirr / Bank payouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEarnings}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setWithdrawSuccess(false);
              setWithdrawModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw Funds</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ETB {Number(earningsData.availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Ready for instant withdrawal
            </p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Settlement</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              ETB {Number(earningsData.pendingSettlement).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Clearing upon delivery proof
            </p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lifetime Revenue</span>
            <div className="text-2xl font-black text-[#173F35] dark:text-white mt-1">
              ETB {Number(earningsData.lifetimeRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Direct sales without broker deductions
            </p>
          </div>
        </div>

        {/* Transactions list */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-sm text-gray-800 dark:text-white">Recent Transactions</h2>
            <button
              onClick={handleExportStatement}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Statement (CSV)
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {earningsData.transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-gray-800 dark:text-white">{tx.type}</div>
                  <div className="text-[11px] text-gray-400">{tx.orderId} · {tx.date}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black ${tx.amount.startsWith('-') ? 'text-gray-700 dark:text-gray-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {tx.amount}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0D2118] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-white/10">
            <h3 className="font-extrabold text-base text-gray-800 dark:text-white mb-2">
              Withdraw to Telebirr or Bank
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Transfer your verified farm revenues directly into your bank or mobile wallet.
            </p>

            {withdrawSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-white">Withdrawal Initiated!</h4>
                <p className="text-xs text-gray-500">
                  ETB {parseFloat(withdrawAmount || '0').toLocaleString()} transferred to {destination}.
                </p>
                <button
                  onClick={() => setWithdrawModal(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Amount (ETB)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold bg-gray-50 dark:bg-white/5"
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Available: ETB {earningsData.availableBalance.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Select Destination</label>
                  <div
                    onClick={() => setDestination('Telebirr Wallet')}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                      destination === 'Telebirr Wallet'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    <div className="text-xs">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200">Telebirr Wallet</div>
                      <div className="text-gray-500">{user?.phone || '+251 911 234 567'} ({user?.fullName || 'Verified Farmer'})</div>
                    </div>
                  </div>
                  <div
                    onClick={() => setDestination('Commercial Bank of Ethiopia (CBE)')}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                      destination === 'Commercial Bank of Ethiopia (CBE)'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-gray-200 dark:border-white/10 opacity-70'
                    }`}
                  >
                    <Building className="w-5 h-5 text-gray-500" />
                    <div className="text-xs">
                      <div className="font-bold text-gray-800 dark:text-white">Commercial Bank of Ethiopia (CBE)</div>
                      <div className="text-gray-500">Account: 1000293847291</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setWithdrawModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Confirm Transfer</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
