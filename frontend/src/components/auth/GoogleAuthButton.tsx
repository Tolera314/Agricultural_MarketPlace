'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithGoogle, linkGoogleAccount, AuthUser } from '@/lib/auth';
import { AlertCircle, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, X } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          cancel: () => void;
        };
        oauth2: {
          initCodeClient: (config: any) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup';
  className?: string;
  onSuccess?: (user: AuthUser) => void;
  onError?: (error: string) => void;
}

export function GoogleAuthButton({
  mode = 'signin',
  className = '',
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);

  // Account Linking Modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<string | null>(null);
  const [conflictEmail, setConflictEmail] = useState<string>('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const gisInitializedRef = useRef(false);

  // Load Google Identity Services SDK script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const scriptId = 'google-gis-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setGisLoaded(true);
      script.onerror = () => {
        console.warn('Google Identity Services SDK failed to load. Will fallback to redirect.');
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', () => setGisLoaded(true));
    }
  }, []);

  const routeUserAfterAuth = (user: AuthUser, redirectUrl?: string) => {
    if (onSuccess) {
      onSuccess(user);
      return;
    }

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

  const handleCredentialVerification = async (credential: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginWithGoogle(credential);

    if (result.success && result.user) {
      routeUserAfterAuth(result.user, result.redirectUrl);
      return;
    }

    setIsLoading(false);

    if (result.requiresLinkVerification) {
      // Require existing account password confirmation to link identity securely
      setPendingCredential(credential);
      setConflictEmail(result.email || '');
      setLinkPassword('');
      setLinkError(null);
      setLinkModalOpen(true);
      return;
    }

    const err = result.error || 'Google authentication failed.';
    setErrorMessage(err);
    if (onError) onError(err);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCredential || !linkPassword) return;

    setLinkLoading(true);
    setLinkError(null);

    const result = await linkGoogleAccount(pendingCredential, linkPassword);
    setLinkLoading(false);

    if (result.success && result.user) {
      setLinkModalOpen(false);
      routeUserAfterAuth(result.user, result.redirectUrl);
      return;
    }

    setLinkError(result.error || 'Failed to verify account password.');
  };

  const startGoogleAuth = () => {
    setErrorMessage(null);

    if (!clientId) {
      const msg = 'Google Client ID is not configured. Please check your environment settings.';
      setErrorMessage(msg);
      if (onError) onError(msg);
      return;
    }

    // Try Google Identity Services code client for modern pop-up authorization
    if (window.google?.accounts?.oauth2?.initCodeClient) {
      try {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: (response: any) => {
            if (response.code) {
              handleCredentialVerification(response.code);
            } else if (response.error) {
              if (response.error !== 'popup_closed_by_user') {
                const msg = `Google sign-in error: ${response.error}`;
                setErrorMessage(msg);
                if (onError) onError(msg);
              }
            }
          },
          error_callback: (error: any) => {
            console.error('Google Auth Popup Error:', error);
            // Fallback to standard redirect
            performOAuthRedirect();
          },
        });
        client.requestCode();
        return;
      } catch (err) {
        console.warn('initCodeClient failed, falling back to redirect:', err);
      }
    }

    // Standard OAuth 2.0 Full Redirect Flow fallback
    performOAuthRedirect();
  };

  const performOAuthRedirect = () => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      'openid email profile'
    )}&prompt=select_account&access_type=online`;

    window.location.href = oauthUrl;
  };

  return (
    <div className="w-full space-y-3">
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={startGoogleAuth}
        disabled={isLoading}
        id={`google-${mode}-btn`}
        aria-label={mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
        className={`w-full py-3 px-6 rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] hover:bg-gray-50 dark:hover:bg-[#183528] text-xs sm:text-sm font-semibold text-[#183E2C] dark:text-[#D5EADF] flex items-center justify-center gap-3 transition-colors shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Connecting with Google...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
          </>
        )}
      </button>

      {/* Account Linking Modal to prevent account takeover */}
      {linkModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#0D2118] border border-[#CDE0D4] dark:border-[#1E4130] rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => {
                setLinkModalOpen(false);
                setPendingCredential(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 id="link-modal-title" className="text-base font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Link Your Google Account
                </h3>
                <p className="text-xs text-[#527563] dark:text-[#90B8A3]">
                  Secure identity linking verification
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
                  htmlFor="link-password"
                  className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1.5"
                >
                  AgriMarket Account Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="link-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
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
                <button
                  type="button"
                  onClick={() => {
                    setLinkModalOpen(false);
                    setPendingCredential(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading || !linkPassword}
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
        </div>
      )}
    </div>
  );
}
