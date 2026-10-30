'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sprout,
  Store,
  Truck,
  ShoppingBag,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { RoleSelectionModal } from '@/components/onboarding/RoleSelectionModal';
import { setAccessToken, setCurrentUser, validatePasswordStrength } from '@/lib/auth';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { API_BASE_URL } from '@/lib/apiConfig';
import { safeParseApiResponse, getHumanReadableErrorMessage } from '@/lib/errorHandler';

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');

  // Validate internal destination
  const safeRedirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : null;

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    agreedToTerms: false,
  });

  const [showRoleModal, setShowRoleModal] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    token: string;
    user: { fullName: string; phone: string; role: string };
  } | null>(null);

  // OTP Verification state
  const [verificationState, setVerificationState] = useState<{
    required: boolean;
    channel: 'email' | 'sms';
    recipient: string;
    identifier: string;
  } | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input when entering verification mode
  React.useEffect(() => {
    if (verificationState?.required && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [verificationState?.required]);

  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
    terms?: string;
    general?: string;
  }>({});


  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-transparent' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-emerald-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-600' };
      default:
        return { score: 0, label: '', color: 'bg-transparent' };
    }
  };

  const strength = getPasswordStrength(formData.password);

  // Field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full legal name.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must contain at least 2 characters.';
    }

    const cleanPhone = formData.phone.replace(/[\s\-().]/g, '');
    const ethioPhoneRegex = /^(\+251|251|0)?[97]\d{8}$/;
    if (!cleanPhone) {
      newErrors.phone = 'Please enter your mobile phone number.';
    } else if (!ethioPhoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid Ethiopian phone number (e.g. 0911 234 567).';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Enter a valid email address, such as name@example.com.';
      }
    }

    const passCheck = validatePasswordStrength(formData.password);
    if (!formData.password) {
      newErrors.password = 'Please choose a secure account password.';
    } else if (!passCheck.valid) {
      newErrors.password = 'Your password must contain at least 8 characters, including 1 uppercase letter, 1 digit, and 1 symbol.';
    }

    if (!formData.agreedToTerms) {
      newErrors.terms = 'Please review and accept the Terms of Service and Privacy Policy before continuing.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          password: formData.password,
        }),
      });

      const parsed = await safeParseApiResponse<any>(res);

      if (!parsed.ok) {
        const errorInfo = parsed.error;
        if (errorInfo?.field) {
          setErrors({ [errorInfo.field]: errorInfo.message });
        } else {
          setErrors({ general: errorInfo?.message || 'Registration could not be completed. Please check your entries and try again.' });
        }
        setIsLoading(false);
        return;
      }

      const data = parsed.data;
      const payload = data?.data !== undefined ? data.data : data;

      setIsLoading(false);

      // Handle verification flow (OTP Verification UI activation)
      if (payload?.requiresVerification) {
        setVerificationState({
          required: true,
          channel: payload.verificationChannel || (formData.email.trim() ? 'email' : 'sms'),
          recipient: payload.recipient || (formData.email.trim() || formData.phone.trim()),
          identifier: payload.user?.phone || formData.phone.trim(),
        });
        setResendCooldown(30); // 30s initial resend cooldown
        return;
      }

      // If already verified or no verification required
      if (payload?.accessToken || payload?.token) {
        setAccessToken(payload.accessToken || payload.token);
        if (payload.user) {
          setCurrentUser(payload.user);
        }
      }

      setSuccessData(payload);
      setTimeout(() => {
        const nextUrl = safeRedirect
          ? `/onboarding/select-role?redirect=${encodeURIComponent(safeRedirect)}`
          : '/onboarding/select-role';
        router.push(nextUrl);
      }, 900);
    } catch (err: any) {
      setIsLoading(false);
      setErrors({
        general: 'Could not connect to the server. Please check your internet connection and try again.',
      });
    }
  };

  // Handle OTP digit changes
  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto-advance
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (val && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  // Handle Backspace navigation
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste
  const handleDigitPaste = (e: React.ClipboardEvent) => {
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
      handleVerifyCode(pasted);
    } else {
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Execute OTP verification
  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!verificationState?.identifier) return;

    setIsVerifying(true);
    setOtpError(null);

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: verificationState.identifier,
          otpCode: code,
        }),
      });

      const parsed = await safeParseApiResponse<any>(res);

      if (!parsed.ok) {
        setOtpError(parsed.error?.message || 'Invalid or expired verification code. Please check your entries.');
        setIsVerifying(false);
        return;
      }

      const data = parsed.data;
      const payload = data?.data !== undefined ? data.data : data;

      // Store in memory
      if (payload?.accessToken || payload?.token) {
        setAccessToken(payload.accessToken || payload.token);
      }
      if (payload?.user) {
        setCurrentUser(payload.user);
      }

      setVerifiedSuccess(true);
      setIsVerifying(false);

      setTimeout(() => {
        const nextUrl = safeRedirect
          ? `/onboarding/select-role?redirect=${encodeURIComponent(safeRedirect)}`
          : '/onboarding/select-role';
        router.push(nextUrl);
      }, 1100);
    } catch (err) {
      setIsVerifying(false);
      setOtpError('Connection error while verifying code. Please try again.');
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !verificationState?.identifier) return;

    setIsResending(true);
    setResendNotice(null);
    setOtpError(null);

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: verificationState.identifier,
        }),
      });

      const parsed = await safeParseApiResponse<any>(res);

      if (!parsed.ok) {
        setOtpError(parsed.error?.message || 'Unable to resend verification code right now. Please wait a moment.');
        setIsResending(false);
        return;
      }

      setResendNotice(
        `A new 6-digit code has been sent via ${
          verificationState.channel === 'email' ? 'email' : 'SMS'
        }!`
      );
      setResendCooldown(45);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setOtpError('Connection error while resending code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col font-sans transition-colors duration-200">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER (Sticky Solid Logo Bar)                          */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E8EFEA] dark:border-[#1A3326] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 flex items-center justify-between">
          
          {/* Mobile Back Button */}
          <div className="flex items-center lg:hidden">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg text-[#075C3B] dark:text-[#34D399] hover:bg-[#EAF5EE] dark:hover:bg-[#132A20] transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          {/* Mobile Centered Brand */}
          <div className="lg:hidden flex-1 flex justify-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
                  <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
                  <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
                  <path d="M18 25V30" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-[#075C3B] dark:text-[#34D399] tracking-tight leading-none">AgriMarket</span>
                <span className="text-[9px] text-[#476C57] dark:text-[#88B8A0] font-semibold tracking-wider uppercase mt-0.5">Farmers · Buyers · Better Tomorrow</span>
              </div>
            </Link>
          </div>

          {/* Desktop Left Brand */}
          <div className="hidden lg:flex items-center">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                <svg
                  className="w-8 h-8 sm:w-9 sm:h-9"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z"
                    fill="#10B981"
                  />
                  <path
                    d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2"
                    fill="#059669"
                  />
                  <path
                    d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2"
                    fill="#34D399"
                  />
                  <path
                    d="M18 25V30"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl text-[#075C3B] dark:text-[#34D399] tracking-tight group-hover:text-[#05462D] dark:group-hover:text-[#6EE7B7] transition-colors leading-none">
                  AgriMarket
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#476C57] dark:text-[#88B8A0] font-semibold tracking-wide uppercase mt-0.5">
                  Farmers · Buyers · Better Tomorrow
                </span>
              </div>
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center justify-end">
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs text-[#527563] dark:text-[#8BB39D]">
                Already a member?
              </span>
              <Link
                href={safeRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : '/login'}
                className="text-sm font-bold text-[#075C3B] dark:text-[#34D399] hover:underline px-2.5 py-1.5 rounded-lg hover:bg-[#EAF5EE] dark:hover:bg-[#132A20] transition-colors"
              >
                Log In
              </Link>
            </div>
            <div className="lg:ml-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN HERO SECTION                                           */}
      {/* ============================================================== */}
      <main className="flex-1 relative flex flex-col justify-start lg:justify-center overflow-x-hidden">
        
        {/* Mobile Scenic Landscape Banner (Lush terraced hills of signup_landscape_hero.jpg fading softly to page background) */}
        <div className="lg:hidden relative w-full h-44 sm:h-52 overflow-hidden shrink-0 pointer-events-none">
          <div className="absolute inset-0 w-[180%] -left-[80%] h-full">
            <Image
              src="/images/signup_landscape_hero.jpg"
              alt="Scenic terraced farm landscape"
              fill
              priority
              loading="eager"
              sizes="(max-width: 1023px) 180vw, 0vw"
              className="object-cover object-top"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FAF8F5]/50 to-[#FAF8F5] dark:via-[#07130D]/70 dark:to-[#07130D]" />
        </div>

        {/* Desktop Full-Width Scenic Landscape Background */}
        <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/signup_landscape_hero.jpg"
            alt="Scenic Ethiopian farm terraces with smiling farmer holding fresh produce"
            fill
            priority={false}
            sizes="(min-width: 1024px) 100vw, 0vw"
            className="object-cover object-bottom"
          />
          <div className="hidden dark:block absolute inset-0 bg-[#07130D]/75" />
        </div>

        {/* Content Grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-0 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* -------------------------------------------------------- */}
            {/* LEFT COLUMN: Community Value Proposition (Desktop Only) */}
            {/* -------------------------------------------------------- */}
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-6 pr-2">
              
              <div className="space-y-4">
                {/* Pill Badge matching reference — crisp solid background */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#12281E] border border-[#BBD6C5] dark:border-[#204735] shadow-xs">
                  <div className="w-4 h-4 rounded-full bg-[#E2F2E7] dark:bg-[#1C3E2E] flex items-center justify-center text-[#075C3B] dark:text-[#34D399]">
                    <Sprout className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] tracking-wide">
                    Join Our Growing Community
                  </span>
                </div>

                {/* Main Heading — High Contrast Rich Emerald */}
                <h1 className="text-4xl xl:text-5xl font-black text-[#043E27] dark:text-[#EEFAF3] tracking-tight leading-[1.12] drop-shadow-xs">
                  Create Your <br />
                  <span className="text-[#075C3B] dark:text-[#34D399]">Account</span>
                </h1>

                {/* Subtitle paragraph */}
                <p className="text-sm xl:text-base text-[#1A402E] dark:text-[#A7CEBC] leading-relaxed max-w-lg font-semibold">
                  Be part of a trusted agricultural marketplace that connects farmers and buyers for a healthier and more prosperous future.
                </p>
              </div>

              {/* 3 Value Pillars */}
              <div className="space-y-3 pt-1 max-w-md">
                
                {/* Feature 1: Buy Fresh & Local */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/92 dark:bg-[#0D2118]/92 border border-[#CDE0D4] dark:border-[#1E4130] shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#E2F2E7] dark:bg-[#163828] border border-[#B8D8C5] dark:border-[#224A37] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shrink-0 shadow-xs">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#043E27] dark:text-[#EEFAF3]">
                      Buy Fresh & Local
                    </h2>
                    <p className="text-xs text-[#1F4934] dark:text-[#97BFA9] font-medium leading-relaxed">
                      Get quality agricultural products directly from verified local farmers.
                    </p>
                  </div>
                </div>

                {/* Feature 2: Sell Your Products */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/92 dark:bg-[#0D2118]/92 border border-[#CDE0D4] dark:border-[#1E4130] shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#E2F2E7] dark:bg-[#163828] border border-[#B8D8C5] dark:border-[#224A37] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shrink-0 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#043E27] dark:text-[#EEFAF3]">
                      Sell Your Products
                    </h2>
                    <p className="text-xs text-[#1F4934] dark:text-[#97BFA9] font-medium leading-relaxed">
                      Reach more buyers, set your own prices, and grow your agricultural income.
                    </p>
                  </div>
                </div>

                {/* Feature 3: Fast & Reliable Delivery */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/92 dark:bg-[#0D2118]/92 border border-[#CDE0D4] dark:border-[#1E4130] shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#E2F2E7] dark:bg-[#163828] border border-[#B8D8C5] dark:border-[#224A37] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shrink-0 shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#043E27] dark:text-[#EEFAF3]">
                      Fast & Reliable Delivery
                    </h2>
                    <p className="text-xs text-[#1F4934] dark:text-[#97BFA9] font-medium leading-relaxed">
                      From farm to your table, safely and on time with community couriers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tagline Cursive text */}
              <div className="pt-2">
                <span className="font-serif italic text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide">
                  Better Farmers · Brighter Future
                </span>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* RIGHT COLUMN: Signup Form Panel                         */}
            {/* -------------------------------------------------------- */}
            <div className="lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto">
              
              <div className="bg-transparent lg:bg-white lg:dark:bg-[#0D2118] rounded-none lg:rounded-[28px] p-1 sm:p-4 lg:p-8 shadow-none lg:shadow-2xl shadow-emerald-950/20 dark:shadow-black/60 border-0 lg:border lg:border-[#DEECE2] lg:dark:border-[#1E4130] transition-all">
                
                {/* 1. Success Banner Overlay after OTP Verification */}
                {verifiedSuccess ? (
                  <div className="py-8 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#E8F5E9] dark:bg-[#153B2A] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] text-[#075C3B] dark:text-[#34D399] text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Account Verified</span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-[#093522] dark:text-[#EEFAF3]">
                        Welcome to AgriMarket!
                      </h2>
                      <p className="text-sm text-[#466957] dark:text-[#A7CEBC]">
                        Your identity has been verified. Welcome to our agricultural marketplace!
                      </p>
                    </div>
                    <p className="text-xs text-[#075C3B] dark:text-[#34D399] font-medium flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#075C3B] animate-ping" />
                      Redirecting to your dashboard...
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold transition-colors shadow-md"
                    >
                      Continue to Dashboard Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : verificationState?.required ? (
                  /* 2. Professional 6-Digit OTP Verification View */
                  <div className="py-2 space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] border border-[#B8D8C5] dark:border-[#204735] text-[#075C3B] dark:text-[#34D399] text-xs font-bold shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Step 2 of 2: Identity Verification</span>
                      </div>

                      <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight leading-snug">
                        Enter Verification Code
                      </h2>

                      <p className="text-xs sm:text-sm text-[#527563] dark:text-[#90B8A3] font-medium leading-relaxed">
                        {verificationState.channel === 'email' ? (
                          <>We sent a 6-digit security code via transactional email to:</>
                        ) : (
                          <>We sent an automated 6-digit code via Ethio Telecom SMS to:</>
                        )}
                      </p>

                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EAF5EE] dark:bg-[#122A1E] border border-[#C6DFD0] dark:border-[#1E4331] text-xs font-mono font-bold text-[#075C3B] dark:text-[#34D399]">
                        {verificationState.channel === 'email' ? (
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{verificationState.recipient}</span>
                      </div>
                    </div>

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

                    {/* 6 Digit Input Group */}
                    <div className="py-2">
                      <label className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-2 text-center">
                        6-Digit Security Code
                      </label>
                      <div
                        className="grid grid-cols-6 gap-2 sm:gap-2.5 max-w-sm mx-auto"
                        onPaste={handleDigitPaste}
                      >
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              otpInputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(index, e)}
                            className="w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl bg-white dark:bg-[#12281E] border border-[#CBDCD1] dark:border-[#224A37] focus:border-[#075C3B] dark:focus:border-[#34D399] focus:ring-3 focus:ring-[#075C3B]/20 text-[#093522] dark:text-white outline-none transition-all"
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Submit Verification Button */}
                    <button
                      type="button"
                      onClick={() => handleVerifyCode()}
                      disabled={isVerifying || otpDigits.join('').length !== 6}
                      className="w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Proceed</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Resend & Back Actions */}
                    <div className="pt-2 space-y-3 text-center">
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
                            <span>Didn't receive code? Resend Code</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationState(null);
                            setOtpError(null);
                          }}
                          className="text-xs text-[#527563] dark:text-[#8BB39D] hover:text-[#075C3B] dark:hover:text-[#34D399] hover:underline transition-colors cursor-pointer"
                        >
                          ← Change phone number or email
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header Details (Exact styling from phone screenshot) */}
                    <div className="mb-5 space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] border border-[#B8D8C5] dark:border-[#204735] text-[#075C3B] dark:text-[#34D399] text-xs font-bold shadow-2xs">
                        <Sprout className="w-3.5 h-3.5" />
                        <span>Join Our Growing Community</span>
                      </div>
                      
                      <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight leading-snug">
                        Create Your Account
                      </h1>
                      
                      <p className="text-xs sm:text-sm text-[#527563] dark:text-[#90B8A3] font-medium leading-relaxed">
                        Fill in your details to get started.
                      </p>
                    </div>

                    {/* General Error Banner */}
                    {errors.general && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errors.general}</span>
                      </div>
                    )}



                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                      
                      {/* Field 1: Full Name */}
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1"
                        >
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12281E] border ${
                              errors.fullName
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-[#075C3B]/20'
                            } text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none focus:ring-3 transition-colors`}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Field 2: Phone Number */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1"
                        >
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+251 9XX XXX XXX"
                            className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12281E] border ${
                              errors.phone
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-[#075C3B]/20'
                            } text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none focus:ring-3 transition-colors`}
                          />
                        </div>
                        {errors.phone ? (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.phone}
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] text-[#719181] dark:text-[#648F7A]">
                            Supports Ethio Telecom (+251 9...) & Safaricom (+251 7...)
                          </p>
                        )}
                      </div>

                      {/* Field 3: Email (Optional) */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1"
                        >
                          Email <span className="text-[#88A395] font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12281E] border ${
                              errors.email
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-[#075C3B]/20'
                            } text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none focus:ring-3 transition-colors`}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Field 4: Password */}
                      <div>
                        <label
                          htmlFor="password"
                          className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1"
                        >
                          Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#719181] dark:text-[#5B806E]">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
                            className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12281E] border ${
                              errors.password
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-[#075C3B]/20'
                            } text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none focus:ring-3 transition-colors`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#719181] dark:text-[#648F7A] hover:text-[#075C3B] dark:hover:text-[#34D399] transition-colors focus:outline-none cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Password strength bar */}
                        {formData.password && (
                          <div className="mt-1.5 space-y-1">
                            <div className="h-1.5 w-full bg-[#E5ECE7] dark:bg-[#1C362A] rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${strength.color}`}
                                style={{ width: `${strength.score}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#6A8B7B] dark:text-[#88B8A0]">
                              <span>Min. 8 characters</span>
                              <span className="font-semibold">{strength.label}</span>
                            </div>
                          </div>
                        )}

                        {errors.password && (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* Terms and Conditions Checkbox */}
                      <div className="pt-0.5">
                        <label className="flex items-start gap-2 cursor-pointer text-xs text-[#355746] dark:text-[#97C2AC]">
                          <input
                            type="checkbox"
                            name="agreedToTerms"
                            checked={formData.agreedToTerms}
                            onChange={handleChange}
                            className="mt-0.5 w-4 h-4 rounded text-[#075C3B] border-[#BED4C7] dark:border-[#224A37] focus:ring-[#075C3B] dark:bg-[#12281E] cursor-pointer"
                          />
                          <span className="leading-snug">
                            I agree to the{' '}
                            <Link
                              href="/terms"
                              target="_blank"
                              className="text-[#075C3B] dark:text-[#34D399] font-bold hover:underline"
                            >
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link
                              href="/privacy"
                              target="_blank"
                              className="text-[#075C3B] dark:text-[#34D399] font-bold hover:underline"
                            >
                              Privacy Policy
                            </Link>
                          </span>
                        </label>
                        {errors.terms && (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.terms}
                          </p>
                        )}
                      </div>

                      {/* Primary Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Divider "or" */}
                      <div className="relative py-2 flex items-center justify-center">
                        <div className="border-t border-[#E3EDE6] dark:border-[#1E4130] w-full" />
                        <span className="bg-[#FAF8F5] lg:bg-white dark:bg-[#07130D] lg:dark:bg-[#0D2118] px-3 text-xs text-[#8BA799] dark:text-[#6E9581] font-medium lowercase absolute">
                          or
                        </span>
                      </div>

                      {/* Google Continue Button */}
                      <GoogleAuthButton mode="signup" />

                      {/* Card Footer: Already have an account? Login */}
                      <div className="pt-2 text-center text-xs sm:text-sm text-[#527563] dark:text-[#8BB39D]">
                        Already have an account?{' '}
                        <Link
                          href={safeRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : '/login'}
                          className="font-bold text-[#075C3B] dark:text-[#34D399] hover:underline"
                        >
                          Login
                        </Link>
                      </div>

                    </form>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* Mobile Decorative Botanical Leaves & Terraced Hills Footer */}
        <div className="lg:hidden relative w-full h-24 -mt-2 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 w-[180%] -left-[80%] h-full">
            <Image
              src="/images/signup_landscape_hero.jpg"
              alt="Fresh farm tea leaves and landscape"
              fill
              priority={false}
              sizes="(max-width: 1023px) 180vw, 0vw"
              className="object-cover object-bottom"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#FAF8F5]/30 to-[#FAF8F5] dark:via-[#07130D]/40 dark:to-[#07130D]" />
        </div>
      </main>

      {/* Role Selection Modal displayed post-signup */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onSuccess={() => setShowRoleModal(false)}
      />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF8F0] dark:bg-[#111A15] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupFormContent />
    </Suspense>
  );
}
