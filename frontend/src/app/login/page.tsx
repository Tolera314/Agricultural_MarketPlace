'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sprout,
  ShieldCheck,
  Leaf,
  Truck,
  Star,
  User,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    token: string;
    user: { fullName: string; phone: string; role: string };
  } | null>(null);

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    general?: string;
  }>({});

  const [googleNotice, setGoogleNotice] = useState(false);

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

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Phone number or email is required.';
    } else {
      const trimmed = formData.identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const cleanPhone = trimmed.replace(/[\s\-().]/g, '');
      const ethioPhoneRegex = /^(\+251|251|0)?[97]\d{8}$/;
      if (!isEmail && !ethioPhoneRegex.test(cleanPhone)) {
        newErrors.identifier = 'Enter a valid phone (e.g. +251 9XX XXX XXX) or email address.';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.field) {
          setErrors({ [data.error.field]: data.error.message });
        } else {
          setErrors({
            general: data.error?.message || 'Sign in failed. Please check your credentials.',
          });
        }
        setIsLoading(false);
        return;
      }

      if (data.data?.token) {
        try {
          localStorage.setItem('agrimarket_token', data.data.token);
          localStorage.setItem('agrimarket_user', JSON.stringify(data.data.user));
        } catch {
          // ignore
        }
      }

      setSuccessData(data.data);
      setIsLoading(false);

      setTimeout(() => {
        if (data.data?.user?.role === 'DELIVERY_WORKER') {
          router.push('/dashboard/worker');
        } else if (data.data?.user?.role === 'ADMIN' || data.data?.user?.role === 'SUPERADMIN') {
          router.push('/admin/locations');
        } else {
          router.push('/dashboard/buyer');
        }
      }, 1500);
    } catch {
      setIsLoading(false);
      setErrors({
        general: 'Could not connect to the server. Please check your internet connection.',
      });
    }
  };

  const handleGoogleAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        window.location.origin + '/auth/google/callback'
      )}&response_type=code&scope=email%20profile`;
    } else {
      setGoogleNotice(true);
      setTimeout(() => setGoogleNotice(false), 4500);
    }
  };

  const features = [
    { icon: <Leaf className="w-5 h-5" />, title: 'Fresh & Quality Products', desc: 'Direct from verified farmers.' },
    { icon: <Star className="w-5 h-5" />, title: 'Local & Fair Prices', desc: 'Support local, get better value.' },
    { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure & Reliable', desc: 'Safe payments and trusted delivery.' },
    { icon: <Truck className="w-5 h-5" />, title: 'A Sustainable Future', desc: 'Stronger communities, greener tomorrow.' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col font-sans transition-colors duration-200">

      {/* HEADER */}
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
                <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
                  <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
                  <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
                  <path d="M18 25V30" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl text-[#075C3B] dark:text-[#34D399] tracking-tight group-hover:text-[#05462D] dark:group-hover:text-[#6EE7B7] transition-colors leading-none">AgriMarket</span>
                <span className="text-[10px] sm:text-[11px] text-[#476C57] dark:text-[#88B8A0] font-semibold tracking-wide uppercase mt-0.5">Farmers · Buyers · Better Tomorrow</span>
              </div>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end">
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs text-[#527563] dark:text-[#8BB39D]">New here?</span>
              <Link href="/signup" className="text-xs sm:text-sm font-bold text-[#075C3B] dark:text-[#34D399] hover:underline px-2.5 py-1.5 rounded-lg hover:bg-[#EAF5EE] dark:hover:bg-[#132A20] transition-colors">
                Create an account →
              </Link>
            </div>
            <div className="lg:ml-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
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

        {/* Desktop Full-Screen Landscape Background */}
        <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/signup_landscape_hero.jpg"
            alt="Ethiopian farmer holding fresh vegetables in a lush green farm"
            fill
            priority={false}
            sizes="(min-width: 1024px) 100vw, 0vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-white/10 dark:bg-[#07130D]/75" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-0 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">

            {/* LEFT PANEL (Desktop Only) */}
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-6 pr-2">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#12281E] border border-[#BBD6C5] dark:border-[#204735] shadow-xs">
                  <div className="w-4 h-4 rounded-full bg-[#E2F2E7] dark:bg-[#1C3E2E] flex items-center justify-center text-[#075C3B] dark:text-[#34D399]">
                    <Sprout className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] tracking-wide">Local Farmers · Fresh Products · Direct to You</span>
                </div>

                <h1 className="text-4xl xl:text-5xl font-black text-[#043E27] dark:text-[#EEFAF3] tracking-tight leading-[1.12] drop-shadow-xs">
                  Welcome Back<br />
                  <span className="text-[#075C3B] dark:text-[#34D399]">to AgriMarket</span>
                </h1>

                <p className="text-sm xl:text-base text-[#1A402E] dark:text-[#A7CEBC] leading-relaxed max-w-lg font-semibold">
                  Sign in to access fresh agricultural products, connect with local farmers, and be part of a healthier and more prosperous future.
                </p>
              </div>

              <div className="space-y-3 pt-1 max-w-md">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/92 dark:bg-[#0D2118]/92 border border-[#CDE0D4] dark:border-[#1E4130] shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-[#E2F2E7] dark:bg-[#163828] border border-[#B8D8C5] dark:border-[#224A37] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shrink-0 shadow-xs">
                      {f.icon}
                    </div>
                    <div className="space-y-0.5">
                      <h2 className="text-sm font-bold text-[#043E27] dark:text-[#EEFAF3]">{f.title}</h2>
                      <p className="text-xs text-[#1F4934] dark:text-[#97BFA9] font-medium leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <span className="font-serif italic text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide">
                  Better Farmers · Brighter Future
                </span>
              </div>
            </div>

            {/* RIGHT PANEL - SIGN IN FORM */}
            <div className="lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto">
              <div className="bg-transparent lg:bg-white lg:dark:bg-[#0D2118] rounded-none lg:rounded-[28px] p-1 sm:p-4 lg:p-8 shadow-none lg:shadow-2xl shadow-emerald-950/20 dark:shadow-black/60 border-0 lg:border lg:border-[#DEECE2] lg:dark:border-[#1E4130] transition-all">

                {successData ? (
                  <div className="py-8 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#E8F5E9] dark:bg-[#153B2A] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-extrabold text-[#093522] dark:text-[#EEFAF3]">Welcome back!</h2>
                      <p className="text-sm text-[#466957] dark:text-[#A7CEBC]">You have successfully signed in.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F0F7F2] dark:bg-[#122A1E] text-xs text-[#315643] dark:text-[#88B8A0] space-y-1">
                      <p className="font-semibold text-sm text-[#093522] dark:text-[#EEFAF3]">{successData.user.fullName}</p>
                      <p>{successData.user.phone}</p>
                    </div>
                    <p className="text-xs text-gray-500 animate-pulse">Redirecting to marketplace...</p>
                    <Link href="/" className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-[#075C3B] text-white font-bold hover:bg-[#05462D] transition-colors">
                      Go to Marketplace <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Header Details (Exact styling from phone screenshot) */}
                    <div className="mb-5 space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#143224] border border-[#B8D8C5] dark:border-[#204735] text-[#075C3B] dark:text-[#34D399] text-xs font-bold shadow-2xs">
                        <Sprout className="w-3.5 h-3.5" />
                        <span>Local Farmers · Fresh Products · Direct to You</span>
                      </div>
                      <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight leading-snug">
                        Welcome Back!<br />
                        <span className="text-[#0D3823] dark:text-[#EEFAF3]">Sign In to AgriMarket</span>
                      </h1>
                      <p className="text-xs sm:text-sm text-[#527563] dark:text-[#90B8A3] font-medium leading-relaxed">
                        Enter your phone number or email and password to continue.
                      </p>
                    </div>

                    {errors.general && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errors.general}</span>
                      </div>
                    )}

                    {googleNotice && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Google Sign-In is configured on production. For now, please sign in using your phone number or email below.</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                      {/* Phone or Email */}
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
                            value={formData.identifier}
                            onChange={handleChange}
                            placeholder="e.g. +251 9XX XXX XXX or name@example.com"
                            className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-[#12281E] border ${
                              errors.identifier
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-[#075C3B]/20'
                            } text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none focus:ring-3 transition-colors shadow-2xs`}
                          />
                        </div>
                        {errors.identifier && (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.identifier}
                          </p>
                        )}
                      </div>

                      {/* Password */}
                      <div>
                        <label htmlFor="password" className="block text-xs font-bold text-[#143E2C] dark:text-[#D5EADF] mb-1.5">
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
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className={`w-full pl-10 pr-11 py-3 text-sm rounded-xl bg-white dark:bg-[#12281E] border ${
                              errors.password
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-[#D5E2DA] dark:border-[#224A37] focus:border-[#075C3B] focus:ring-[#075C3B]/20'
                            } text-[#113123] dark:text-white placeholder-[#8FA79B] dark:placeholder-[#4E7361] focus:outline-none focus:ring-3 transition-colors shadow-2xs`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#719181] dark:text-[#648F7A] hover:text-[#075C3B] dark:hover:text-[#34D399] transition-colors focus:outline-none cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* Remember Me + Forgot Password */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#355746] dark:text-[#97C2AC]">
                          <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                            className="w-4 h-4 rounded text-[#075C3B] border-[#BED4C7] dark:border-[#224A37] focus:ring-[#075C3B] dark:bg-[#12281E] cursor-pointer"
                          />
                          <span>Remember me</span>
                        </label>
                        <Link href="/forgot-password" className="text-xs font-semibold text-[#075C3B] dark:text-[#34D399] hover:underline">
                          Forgot password?
                        </Link>
                      </div>

                      {/* Sign In Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        id="signin-btn"
                        className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative py-2 flex items-center justify-center">
                        <div className="border-t border-[#E3EDE6] dark:border-[#1E4130] w-full" />
                        <span className="bg-[#FAF8F5] lg:bg-white dark:bg-[#07130D] lg:dark:bg-[#0D2118] px-3 text-xs text-[#8BA799] dark:text-[#6E9581] font-medium lowercase absolute">
                          or
                        </span>
                      </div>

                      {/* Google Button */}
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        id="google-signin-btn"
                        className="w-full py-3 px-6 rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E2DA] dark:border-[#224A37] hover:bg-gray-50 dark:hover:bg-[#183528] text-xs sm:text-sm font-semibold text-[#183E2C] dark:text-[#D5EADF] flex items-center justify-center gap-3 transition-colors shadow-2xs cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      {/* Footer Link */}
                      <div className="pt-2 text-center text-xs sm:text-sm text-[#527563] dark:text-[#8BB39D]">
                        {"Don't have an account?"}{' '}
                        <Link href="/signup" className="font-bold text-[#075C3B] dark:text-[#34D399] hover:underline">
                          Create an account →
                        </Link>
                      </div>

                    </form>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
