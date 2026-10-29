'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sprout,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { setAccessToken, setCurrentUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/apiConfig';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialIdentifier = searchParams.get('identifier') || searchParams.get('phone') || searchParams.get('email') || '';

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);
    setOtpError(null);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (val && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    setOtpError(null);

    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (!identifier.trim()) {
      setOtpError('Please provide your phone number or email.');
      return;
    }
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: identifier.trim(),
          otpCode: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error?.message || 'Invalid or expired verification code.');
        setIsVerifying(false);
        return;
      }

      if (data.data?.accessToken || data.data?.token) {
        setAccessToken(data.data.accessToken || data.data.token);
        setCurrentUser(data.data.user);
      }

      setVerifiedSuccess(true);
      setIsVerifying(false);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err) {
      setIsVerifying(false);
      setOtpError('Network error while verifying. Please check your connection.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !identifier.trim()) return;

    setIsResending(true);
    setResendNotice(null);
    setOtpError(null);

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error?.message || 'Failed to resend code.');
        setIsResending(false);
        return;
      }

      setResendNotice(data.message || 'Verification code resent successfully.');
      setResendCooldown(45);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setOtpError('Network error while resending verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-[#0D2118] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#DEECE2] dark:border-[#1E4130] transition-all">
      {verifiedSuccess ? (
        <div className="py-6 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#E8F5E9] dark:bg-[#153B2A] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] text-[#075C3B] dark:text-[#34D399] text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Identity Verified</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#093522] dark:text-[#EEFAF3]">
              Welcome to AgriMarket!
            </h2>
            <p className="text-sm text-[#466957] dark:text-[#A7CEBC]">
              Your account has been verified. Welcome notification dispatched!
            </p>
          </div>
          <p className="text-xs text-[#075C3B] dark:text-[#34D399] font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#075C3B] animate-ping" />
            Taking you to dashboard...
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold transition-colors shadow-md"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] border border-[#B8D8C5] dark:border-[#204735] text-[#075C3B] dark:text-[#34D399] text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account Security Verification</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight">
              Enter Verification Code
            </h1>
            <p className="text-xs sm:text-sm text-[#527563] dark:text-[#90B8A3] leading-relaxed">
              Enter the 6-digit code sent via Brevo email or Ethio Telecom SMS to verify your account.
            </p>
          </div>

          {/* Identifier Input if not prefilled */}
          {!initialIdentifier && (
            <div>
              <label className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1">
                Phone Number or Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. +251 9XX XXX XXX or user@example.com"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] text-[#113123] dark:text-white placeholder-[#8FA79B] focus:outline-none focus:ring-2 focus:ring-[#075C3B]"
                />
              </div>
            </div>
          )}

          {initialIdentifier && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EAF5EE] dark:bg-[#122A1E] border border-[#C6DFD0] dark:border-[#1E4331] text-xs font-mono font-bold text-[#075C3B] dark:text-[#34D399]">
                {identifier.includes('@') ? (
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{identifier}</span>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {otpError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{otpError}</span>
            </div>
          )}

          {/* Resend Notice */}
          {resendNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resendNotice}</span>
            </div>
          )}

          {/* 6 Digit Inputs */}
          <div>
            <label className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-2 text-center">
              6-Digit Code
            </label>
            <div
              className="grid grid-cols-6 gap-2 sm:gap-2.5 max-w-sm mx-auto"
              onPaste={handlePaste}
            >
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl bg-white dark:bg-[#12281E] border border-[#CBDCD1] dark:border-[#224A37] focus:border-[#075C3B] dark:focus:border-[#34D399] focus:ring-3 focus:ring-[#075C3B]/20 text-[#093522] dark:text-white outline-none transition-all"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isVerifying || otpDigits.join('').length !== 6}
            className="w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Proceed to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend actions */}
          <div className="pt-1 text-center space-y-2">
            <div className="text-xs text-[#527563] dark:text-[#8BB39D]">
              {resendCooldown > 0 ? (
                <span>
                  Resend code in{' '}
                  <strong className="text-[#075C3B] dark:text-[#34D399]">
                    {resendCooldown}s
                  </strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-bold text-[#075C3B] dark:text-[#34D399] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`}
                  />
                  <span>Didn't get the code? Resend Code</span>
                </button>
              )}
            </div>

            <div className="pt-2">
              <Link
                href="/signup"
                className="text-xs text-[#527563] dark:text-[#8BB39D] hover:text-[#075C3B] dark:hover:text-[#34D399] hover:underline"
              >
                ← Return to Signup
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E8EFEA] dark:border-[#1A3326]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
                <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
                <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
                <path d="M18 25V30" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-[#075C3B] dark:text-[#34D399] tracking-tight leading-none">
                AgriMarket
              </span>
              <span className="text-[9px] text-[#476C57] dark:text-[#88B8A0] font-semibold tracking-wider uppercase mt-0.5">
                Farmers · Buyers · Better Tomorrow
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-center text-sm text-[#075C3B]">Loading verification...</div>}>
          <VerifyOtpContent />
        </Suspense>
      </main>
    </div>
  );
}
