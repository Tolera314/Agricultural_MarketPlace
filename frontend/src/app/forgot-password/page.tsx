'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sprout,
  User,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { API_BASE_URL } from '@/lib/apiConfig';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    message: string;
    channel?: string;
    recipient?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim();

    if (!clean) {
      setError('Please enter your registered phone number or email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: clean }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setRetryAfter(data.error?.retryAfterSeconds || 900);
        setError(data.error?.message || 'Too many attempts. Please try again later.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error?.message || 'Could not process request. Please try again.');
        setIsLoading(false);
        return;
      }

      setSubmittedData({
        message: data.message,
        channel: data.data?.channel,
        recipient: data.data?.recipient,
      });
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setError('Could not connect to the server. Please check your internet connection.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#093522] dark:text-[#EEFAF3] flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-800 transition-colors">
      
      {/* Top Navbar */}
      <header className="relative z-20 w-full border-b border-[#E3EDE6] dark:border-[#163828] bg-white/80 dark:bg-[#0B1E15]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#075C3B] dark:text-[#34D399] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Body */}
      <main className="flex-1 relative flex flex-col justify-center items-center px-4 sm:px-6 py-10 z-10">
        
        {/* Background Subtle Ambience */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-radial from-emerald-500 to-transparent blur-3xl" />
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/10 dark:shadow-black/50 border border-[#DEECE2] dark:border-[#1E4130] transition-all">

            {/* Emblem Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E2F2E7] dark:bg-[#163828] border border-[#BBD6C5] dark:border-[#204735] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shadow-xs mb-4">
              <KeyRound className="w-7 h-7" />
            </div>

            {submittedData ? (
              <div className="text-center space-y-5">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#075C3B] dark:text-[#34D399]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black text-[#043E27] dark:text-[#EEFAF3]">
                    Recovery Code Sent
                  </h1>
                  <p className="text-xs sm:text-sm text-[#466957] dark:text-[#A7CEBC] leading-relaxed">
                    {submittedData.message}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F0F7F2] dark:bg-[#122A1E] border border-[#CDE0D4] dark:border-[#1F4532] text-xs text-[#2B543F] dark:text-[#90BFA6] space-y-1 text-left">
                  <div className="flex items-center gap-1.5 font-bold text-[#075C3B] dark:text-[#34D399]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Single-use code valid for 15 minutes</span>
                  </div>
                  <p className="text-[11px]">Check your SMS inbox or email spam folder if not visible immediately.</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/reset-password?identifier=${encodeURIComponent(identifier.trim())}`)}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Enter Recovery Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedData(null);
                      setError(null);
                    }}
                    className="w-full py-2.5 text-xs font-semibold text-[#527563] dark:text-[#8BB39D] hover:underline"
                  >
                    Try another phone number or email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6 space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] border border-[#B8D8C5] dark:border-[#204735] text-[#075C3B] dark:text-[#34D399] text-xs font-bold shadow-2xs mb-1">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>Account Security</span>
                  </div>
                  <h1 className="text-2xl sm:text-[26px] font-black text-[#043E27] dark:text-[#EEFAF3] tracking-tight">
                    Reset Your Password
                  </h1>
                  <p className="text-xs sm:text-sm text-[#527563] dark:text-[#90B8A3] font-medium leading-relaxed">
                    Enter your phone number or email and we will send you a 6-digit verification code to regain access.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span>{error}</span>
                      {retryAfter && (
                        <p className="mt-1 font-bold">
                          Retry available in {Math.ceil(retryAfter / 60)} minutes.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="identifier" className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1.5">
                      Phone Number or Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="e.g. +251 9XX XXX XXX or name@example.com"
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-3 focus:ring-[#075C3B]/20 text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none transition-colors shadow-2xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Recovery Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Recovery Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#E8F0EA] dark:border-[#183928] text-center">
                  <p className="text-xs text-[#527563] dark:text-[#8BB39D]">
                    Remembered your credentials?{' '}
                    <Link href="/login" className="font-bold text-[#075C3B] dark:text-[#34D399] hover:underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#6A8B7B] dark:text-[#6A917F] border-t border-[#E3EDE6] dark:border-[#163828]">
        AgriMarket Ethiopia · Security & Account Recovery
      </footer>
    </div>
  );
}
