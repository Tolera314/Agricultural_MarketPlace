'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, ArrowRight, Loader2, CreditCard, Smartphone } from 'lucide-react';
import { paymentApi } from '@/lib/paymentApi';

function SimulateChapaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txRef = searchParams.get('tx_ref') || `AGRI-TEST-${Date.now()}`;
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '1,250.00';

  const [selectedMethod, setSelectedMethod] = useState<'telebirr' | 'cbebirr' | 'card'>('telebirr');
  const [phoneOrCard, setPhoneOrCard] = useState('0911000111');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      await paymentApi.simulatePaymentSuccess(txRef);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/buyer?tab=orders&tx_ref=${encodeURIComponent(txRef)}&payment=success&orderId=${encodeURIComponent(orderId)}`);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Payment simulation failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#0E2018] rounded-3xl shadow-xl border border-[#E1EBE4] dark:border-[#1E3A2F] overflow-hidden">
        {/* Chapa Header */}
        <div className="bg-[#007A5A] p-6 text-white text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Chapa Payment Sandbox</span>
          </div>
          <h2 className="text-xl font-bold">AgriMarket Ethiopia</h2>
          <p className="text-xs text-emerald-100 mt-1">Direct Farmer Produce Order</p>
          <div className="mt-4 bg-white/20 p-3 rounded-2xl backdrop-blur-xs">
            <span className="text-xs text-emerald-100">Total Payable Amount</span>
            <p className="text-2xl font-black font-mono">ETB {amount}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-[#1E2923] dark:text-[#E8F7EE]">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Payment Successful!</h3>
              <p className="text-xs text-[#68766C] dark:text-[#88A89A]">
                Transaction verified by Chapa. Redirecting to your confirmed order...
              </p>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-2">Choose Payment Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('telebirr')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                      selectedMethod === 'telebirr'
                        ? 'border-[#007A5A] bg-emerald-50 dark:bg-emerald-950/40 text-[#007A5A] dark:text-emerald-400'
                        : 'border-[#E1EBE4] dark:border-[#1E3A2F]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Telebirr</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cbebirr')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                      selectedMethod === 'cbebirr'
                        ? 'border-[#007A5A] bg-emerald-50 dark:bg-emerald-950/40 text-[#007A5A] dark:text-emerald-400'
                        : 'border-[#E1EBE4] dark:border-[#1E3A2F]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>CBE Birr</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                      selectedMethod === 'card'
                        ? 'border-[#007A5A] bg-emerald-50 dark:bg-emerald-950/40 text-[#007A5A] dark:text-emerald-400'
                        : 'border-[#E1EBE4] dark:border-[#1E3A2F]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Bank Card</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  {selectedMethod === 'card' ? 'Card Number (Demo)' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  required
                  value={phoneOrCard}
                  onChange={(e) => setPhoneOrCard(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E1EBE4] dark:border-[#1E3A2F] bg-white dark:bg-[#11221C] focus:outline-none focus:ring-1 focus:ring-[#007A5A]"
                />
              </div>

              <div className="p-3 bg-[#FAF8F5] dark:bg-[#11241C] rounded-xl text-[11px] text-[#68766C] dark:text-[#88A89A] space-y-1">
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono font-bold text-[#1E2923] dark:text-white">{txRef}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sandbox Test Verification</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#007A5A] hover:bg-[#005B43] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with Chapa...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Authorize ETB {amount}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimulateChapaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Chapa Gateway...</div>}>
      <SimulateChapaContent />
    </Suspense>
  );
}

