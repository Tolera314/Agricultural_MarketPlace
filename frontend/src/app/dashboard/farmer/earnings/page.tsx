'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  CreditCard,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Menu,
  Building,
  Smartphone,
} from 'lucide-react';

export default function FarmerEarningsPage({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const transactions = [
    { id: 'tx-1', type: 'Payout (Telebirr)', orderId: 'Settlement Oct 25', date: 'Today, 10:15 AM', amount: '+ ETB 6,450', status: 'Completed' },
    { id: 'tx-2', type: 'Produce Sale', orderId: 'Order #AG-8819 (Onions)', date: 'Today, 08:30 AM', amount: '+ ETB 1,250', status: 'Pending Courier' },
    { id: 'tx-3', type: 'Produce Sale', orderId: 'Order #AG-8812 (Coffee)', date: 'Yesterday', amount: '+ ETB 4,200', status: 'Completed' },
    { id: 'tx-4', type: 'Payout (CBE Bank)', orderId: 'Settlement Oct 20', date: 'Oct 20, 2026', amount: '- ETB 15,000', status: 'Transferred' },
    { id: 'tx-5', type: 'Produce Sale', orderId: 'Order #AG-8805 (Oranges)', date: 'Oct 19, 2026', amount: '+ ETB 1,320', status: 'Completed' },
  ];

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
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">ETB 18,720.00</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Ready for instant withdrawal
            </p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Settlement</span>
            <div className="text-2xl font-black text-amber-600 mt-1">ETB 3,450.00</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Clearing upon delivery proof
            </p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lifetime Revenue</span>
            <div className="text-2xl font-black text-[#173F35] dark:text-white mt-1">ETB 142,800.00</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              +18.4% growth this month
            </p>
          </div>
        </div>

        {/* Transactions list */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-sm text-gray-800 dark:text-white">Recent Transactions</h2>
            <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              Export Statement (PDF)
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {transactions.map((tx) => (
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
                <p className="text-xs text-gray-500">ETB 10,000 sent to Telebirr account +251 911 234 567.</p>
                <button
                  onClick={() => setWithdrawModal(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
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
                    defaultValue="10000"
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold bg-gray-50 dark:bg-white/5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Select Destination</label>
                  <div className="p-3 rounded-xl border border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-3 cursor-pointer">
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    <div className="text-xs">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200">Telebirr Wallet</div>
                      <div className="text-gray-500">+251 911 234 567 (Tesfaye Abebe)</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 flex items-center gap-3 opacity-70">
                    <Building className="w-5 h-5 text-gray-500" />
                    <div className="text-xs">
                      <div className="font-bold">Commercial Bank of Ethiopia (CBE)</div>
                      <div className="text-gray-500">Account: 1000293847291</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setWithdrawModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setWithdrawSuccess(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    Confirm Transfer
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
