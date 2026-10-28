'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginWithGoogle, linkGoogleAccount, AuthUser } from '@/lib/auth';
import { AlertCircle, ArrowRight, ShieldCheck, Lock, Eye, EyeOff, X } from 'lucide-react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'link_required' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Link verification state
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [conflictEmail, setConflictEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const routeUser = (user: AuthUser, redirectUrl?: string) => {
    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }

    const userRole = user.role;
    const onboardingStatus = user.onboardingStatus;

    if (onboardingStatus === 'PENDING_ROLE') {
      router.push('/dashboard');
    } else if (onboardingStatus === 'IN_PROGRESS') {
      if (userRole === 'FARMER') router.push('/onboarding/farmer');
      else if (userRole === 'DELIVERY_WORKER') router.push('/onboarding/worker');
      else router.push('/onboarding/select-role');
    } else if (onboardingStatus === 'PENDING_VERIFICATION') {
      if (userRole === 'FARMER') router.push('/dashboard/farmer/verification-status');
      else if (userRole === 'DELIVERY_WORKER') router.push('/dashboard/worker/verification-status');
      else router.push('/dashboard/buyer');
    } else if (userRole === 'DELIVERY_WORKER') {
      router.push('/dashboard/worker');
    } else if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
      router.push('/dashboard/admin');
    } else if (userRole === 'FARMER') {
      router.push('/dashboard/farmer');
    } else {
      router.push('/dashboard/buyer');
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage(`Google authentication was cancelled or failed: ${errorParam}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('Missing authorization code from Google.');
      return;
    }

    setAuthCode(code);

    let isMounted = true;

    async function verify() {
      try {
        const result = await loginWithGoogle(code!);
        if (!isMounted) return;

        if (result.success && result.user) {
          setStatus('success');
          setTimeout(() => {
            routeUser(result.user!, result.redirectUrl);
          }, 800);
          return;
        }

        if (result.requiresLinkVerification) {
          setStatus('link_required');
          setConflictEmail(result.email || '');
          return;
        }

        setStatus('error');
        setErrorMessage(result.error || 'Failed to authenticate with Google.');
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Network error occurred during authentication.');
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode || !password) return;

    setLinkLoading(true);
    setLinkError(null);

    const result = await linkGoogleAccount(authCode, password);
    setLinkLoading(false);

    if (result.success && result.user) {
      setStatus('success');
      setTimeout(() => {
        routeUser(result.user!, result.redirectUrl);
      }, 800);
      return;
    }

    setLinkError(result.error || 'Failed to verify account password.');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0D2118] border border-[#CDE0D4] dark:border-[#1E4130] rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        {status === 'verifying' && (
          <div className="space-y-4 py-6">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-[#0D3823] dark:text-[#EEFAF3]">
              Verifying Google Authentication
            </h2>
            <p className="text-xs text-[#527563] dark:text-[#90B8A3]">
              Please wait while we verify your Google credentials with AgriMarket...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#0D3823] dark:text-[#EEFAF3]">
              Authentication Successful!
            </h2>
            <p className="text-xs text-[#527563] dark:text-[#90B8A3] animate-pulse">
              Redirecting you to your account...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-4 text-left">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400">
                Authentication Failed
              </h2>
              <p className="text-xs text-rose-600/90 dark:text-rose-300">
                {errorMessage || 'Unable to complete Google sign-in.'}
              </p>
            </div>
            <Link
              href="/login"
              className="mt-4 w-full py-3 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Back to Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === 'link_required' && (
          <div className="text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Link Your Google Account
                </h3>
                <p className="text-xs text-[#527563] dark:text-[#90B8A3]">
                  Existing account detected
                </p>
              </div>
            </div>

            <p className="text-xs text-[#355A46] dark:text-[#A7CEBC] leading-relaxed">
              An AgriMarket account with email <strong className="text-[#0D3823] dark:text-[#EEFAF3]">{conflictEmail}</strong> already exists. To protect your account from takeover, enter your password to link your Google login.
            </p>

            {linkError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="callback-link-password"
                  className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1.5"
                >
                  AgriMarket Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="callback-link-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none focus:ring-2 focus:ring-[#075C3B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#719181] dark:text-[#5B806E] hover:text-[#075C3B]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-center transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={linkLoading || !password}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {linkLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Confirm & Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
