'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sprout,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { validatePasswordStrength } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/apiConfig';
import { safeParseApiResponse, getHumanReadableErrorMessage } from '@/lib/errorHandler';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState(searchParams.get('identifier') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [errors, setErrors] = useState<{
    identifier?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const strength = validatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Phone or email is required.';
    }

    if (!code.trim() || code.trim().length !== 6) {
      newErrors.code = 'Please enter the 6-digit recovery code.';
    }

    if (!strength.valid) {
      newErrors.newPassword = 'Password must meet all 4 strength requirements.';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: identifier.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const parsed = await safeParseApiResponse<{
        success?: boolean;
        message?: string;
        error?: { message?: string; field?: string };
      }>(res);

      if (!res.ok || !parsed.ok) {
        if (parsed.error?.field) {
          setErrors({ [parsed.error.field]: parsed.error.message });
        } else {
          setErrors({ general: parsed.error?.message || 'Password reset failed. Please check your recovery code and try again.' });
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setErrors({
        general: getHumanReadableErrorMessage(err),
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/10 dark:shadow-black/50 border border-[#DEECE2] dark:border-[#1E4130] transition-all">

        {/* Top Emblem */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E2F2E7] dark:bg-[#163828] border border-[#BBD6C5] dark:border-[#204735] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shadow-xs mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        {isSuccess ? (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#075C3B] dark:text-[#34D399]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-[#043E27] dark:text-[#EEFAF3]">
                Password Reset Complete
              </h1>
              <p className="text-xs sm:text-sm text-[#466957] dark:text-[#A7CEBC] leading-relaxed">
                Your password has been successfully updated. All other active sessions have been safely signed out.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.99] transition-all"
              >
                <span>Sign In With New Password</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] border border-[#B8D8C5] dark:border-[#204735] text-[#075C3B] dark:text-[#34D399] text-xs font-bold shadow-2xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verification & New Credentials</span>
              </div>
              <h1 className="text-2xl sm:text-[26px] font-black text-[#043E27] dark:text-[#EEFAF3] tracking-tight">
                Create New Password
              </h1>
              <p className="text-xs sm:text-sm text-[#527563] dark:text-[#90B8A3] font-medium leading-relaxed">
                Enter your 6-digit security code and choose a strong new password.
              </p>
            </div>

            {errors.general && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>

              {/* Identifier */}
              <div>
                <label htmlFor="identifier" className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1">
                  Phone Number or Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. +251 9XX XXX XXX or name@example.com"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-2 focus:ring-[#075C3B]/20 text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none transition-colors"
                />
                {errors.identifier && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.identifier}</p>
                )}
              </div>

              {/* 6-Digit Code */}
              <div>
                <label htmlFor="code" className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1">
                  6-Digit Recovery Code <span className="text-rose-500">*</span>
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-2 focus:ring-[#075C3B]/20 text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none transition-colors"
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.code}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-2 focus:ring-[#075C3B]/20 text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#719181] dark:text-[#648F7A] hover:text-[#075C3B] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-[#F4F9F6] dark:bg-[#11261D] border border-[#D8E8DE] dark:border-[#1E4331]">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#557A68] dark:text-[#88B8A0]">Strength:</span>
                      <span className="font-bold text-[#075C3B] dark:text-[#34D399]">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5ECE7] dark:bg-[#1C362A] rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                      <span className={`flex items-center gap-1 ${strength.requirements.length ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-400'}`}>
                        {strength.requirements.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ Characters
                      </span>
                      <span className={`flex items-center gap-1 ${strength.requirements.uppercase ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-400'}`}>
                        {strength.requirements.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 1 Uppercase Letter
                      </span>
                      <span className={`flex items-center gap-1 ${strength.requirements.number ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-400'}`}>
                        {strength.requirements.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 1 Digit (0-9)
                      </span>
                      <span className={`flex items-center gap-1 ${strength.requirements.symbol ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-400'}`}>
                        {strength.requirements.symbol ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 1 Symbol (!@#$)
                      </span>
                    </div>
                  </div>
                )}
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-2 focus:ring-[#075C3B]/20 text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none transition-colors"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password & Sign Out Others</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#093522] dark:text-[#EEFAF3] flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-800 transition-colors">
      <header className="relative z-20 w-full border-b border-[#E3EDE6] dark:border-[#163828] bg-white/80 dark:bg-[#0B1E15]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#075C3B] dark:text-[#34D399] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 relative flex flex-col justify-center items-center px-4 sm:px-6 py-10 z-10">
        <Suspense fallback={<div className="text-center py-12 text-sm text-[#075C3B]">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </main>

      <footer className="w-full py-4 text-center text-xs text-[#6A8B7B] dark:text-[#6A917F] border-t border-[#E3EDE6] dark:border-[#163828]">
        AgriMarket Ethiopia · Security & Account Recovery
      </footer>
    </div>
  );
}
