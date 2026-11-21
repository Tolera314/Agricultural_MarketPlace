'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sprout,
  User,
  ShieldCheck,
  MapPin,
  Tag,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Loader2,
  Save,
  Navigation,
  FileText,
  HelpCircle,
  Crosshair,
  RefreshCw,
  ExternalLink,
  Radio,
  Check,
} from 'lucide-react';
import { onboardingApi } from '@/lib/onboardingApi';
import { compressDocumentImage } from '@/lib/imageCompressor';
import { getHumanReadableErrorMessage } from '@/lib/errorHandler';
import { getCurrentUser, setCurrentUser } from '@/lib/auth';

export function FarmerOnboardingForm() {
  const router = useRouter();

  // Multi-step: 1: Personal, 2: Identity, 3: Farm & Location, 4: Selling, 5: Docs & Consent, 6: Review
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: '',
    phone: '',
    email: '',
    language: 'English',

    // Step 2: Identity
    identityType: 'Kebele ID',
    identityNumber: '',
    identityDocUrl: '',
    faydaNumber: '',
    faydaDocUrl: '',

    // Step 3: Farm & Location
    farmName: '',
    farmDescription: '',
    region: 'Oromia',
    woreda: '',
    kebele: '',
    farmLatitude: 9.0222,
    farmLongitude: 38.7468,
    farmSizeHectares: '2.5',
    isOrganic: false,

    // Step 4: Selling Details
    categories: ['vegetables'],
    expectedProducts: '',
    productionSeason: 'Year-round irrigation',
    marketId: 'addis-central-hub',

    // Step 5: Docs & Consent
    landCertificateUrl: '',
    consentedToTerms: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Automated GPS Real Data Tracking (No manual coordinate input)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'acquired' | 'error' | 'denied'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [gpsSource, setGpsSource] = useState<'auto_gps' | 'manual_refresh' | 'draft_restored' | 'preset'>('auto_gps');

  // Load user data & saved draft
  useEffect(() => {
    async function loadInitial() {
      try {
        const status = await onboardingApi.getStatus();

        // If user already submitted their application, lead directly to dashboard
        if (status.onboardingStatus === 'PENDING_VERIFICATION' || status.onboardingStatus === 'COMPLETED') {
          router.replace('/dashboard/farmer');
          return;
        }

        // Prefill contact info
        setFormData((prev) => ({
          ...prev,
          fullName: status.fullName || prev.fullName,
          phone: status.phone || prev.phone,
          email: status.email || prev.email,
        }));

        // If draft exists, resume draft
        if (status.onboardingDraft && typeof status.onboardingDraft === 'object') {
          setFormData((prev) => ({
            ...prev,
            ...status.onboardingDraft,
          }));
          if (status.onboardingDraft.farmLatitude && status.onboardingDraft.farmLongitude) {
            setGpsStatus('acquired');
            setGpsSource('draft_restored');
            setGpsTimestamp('Restored from draft');
          }
          setDraftNotice('Resumed your previously saved application draft.');
          setTimeout(() => setDraftNotice(null), 4000);
        }
      } catch (err) {
        console.warn('Could not load status/draft:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitial();
  }, []);

  // Save draft helper
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftNotice(null);
    try {
      await onboardingApi.saveDraft(formData);
      setDraftNotice('Draft saved successfully. You can safely return anytime.');
      setTimeout(() => setDraftNotice(null), 3500);
    } catch (err: any) {
      setDraftNotice(getHumanReadableErrorMessage(err));
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    setErrors((prev) => ({ ...prev, [fieldName]: '' }));

    try {
      // Compress document images client-side before network upload (handles 8-15 MB camera photos)
      const { file: processedFile, savingsPercentage, isCompressed } = await compressDocumentImage(file);
      if (isCompressed) {
        console.info(`[Image Compressor] Reduced ${file.name} by ${savingsPercentage}% for fast rural upload.`);
      }

      if (processedFile.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [fieldName]: 'Document exceeds 5MB after compression. Please select a smaller file.' }));
        setUploadingField(null);
        return;
      }

      const uploadRes = await onboardingApi.uploadDocument(processedFile);
      setFormData((prev) => ({
        ...prev,
        [fieldName]: uploadRes.documentUrl,
      }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [fieldName]: getHumanReadableErrorMessage(err) }));
    } finally {
      setUploadingField(null);
    }
  };

  // Verified Ethiopian Agricultural Hub presets as instant zero-typing fallback
  const REGIONAL_PRESETS = [
    { label: 'Mojo / Lume Farming Corridor', region: 'Oromia', woreda: 'Lume / Mojo', lat: 8.5878, lon: 39.1245 },
    { label: 'Bishoftu Agricultural Area', region: 'Oromia', woreda: "Ada'a / Bishoftu", lat: 8.7523, lon: 38.9785 },
    { label: 'Adama Regional Valley', region: 'Oromia', woreda: 'Adama', lat: 8.5414, lon: 39.2689 },
    { label: 'Addis Ababa Central Hub', region: 'Addis Ababa', woreda: 'Kirkos / Bole', lat: 9.0222, lon: 38.7468 },
    { label: 'Hawassa Lake Corridor', region: 'Sidama', woreda: 'Hawassa Zuria', lat: 7.0620, lon: 38.4764 },
    { label: 'Bahir Dar Agro Zone', region: 'Amhara', woreda: 'Bahir Dar Zuria', lat: 11.5936, lon: 37.3908 },
  ];

  // Automated Real-World Geolocation Detection (Zero Manual Input)
  const detectRealCoordinates = (isManualTrigger = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setErrors((prev) => ({ ...prev, gps: 'Geolocation is not supported by your browser.' }));
      return;
    }

    setGpsStatus('detecting');
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.gps;
      return copy;
    });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const realLat = parseFloat(pos.coords.latitude.toFixed(6));
        const realLon = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        setFormData((prev) => ({
          ...prev,
          farmLatitude: realLat,
          farmLongitude: realLon,
        }));

        setGpsAccuracy(accuracy);
        setGpsTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setGpsStatus('acquired');
        setGpsSource(isManualTrigger ? 'manual_refresh' : 'auto_gps');

        // Non-blocking reverse lookup to auto-suggest Woreda and Region without typing
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${realLat}&lon=${realLon}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const woredaOrDistrict = addr.county || addr.district || addr.suburb || addr.town || addr.city || '';
            const detectedState = addr.state || '';
            if (woredaOrDistrict) {
              setDetectedAddress(data.display_name?.split(',').slice(0, 3).join(',') || woredaOrDistrict);
              setFormData((prev) => ({
                ...prev,
                woreda: prev.woreda.trim() ? prev.woreda : woredaOrDistrict,
                region: prev.region || (detectedState.includes('Oromia') ? 'Oromia' : prev.region),
              }));
            }
          }
        } catch {
          // Ignore reverse geocoding errors silently
        }
      },
      (err) => {
        let errorMsg = 'Unable to acquire real GPS location fix.';
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          errorMsg = 'Location permission was denied. Please allow location access in your browser to automatically capture real farm coordinates.';
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus('error');
          errorMsg = 'GPS satellite request timed out. Please tap retry.';
        } else {
          setGpsStatus('error');
        }
        setErrors((prev) => ({ ...prev, gps: errorMsg }));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Automatically trigger real GPS acquisition when arriving at Step 3
  useEffect(() => {
    if (currentStep === 3) {
      if (gpsStatus === 'idle') {
        detectRealCoordinates(false);
      }
    }
  }, [currentStep, gpsStatus]);

  // Apply Regional Preset without manual number input
  const handleApplyPreset = (preset: (typeof REGIONAL_PRESETS)[number]) => {
    setFormData((prev) => ({
      ...prev,
      farmLatitude: preset.lat,
      farmLongitude: preset.lon,
      region: preset.region,
      woreda: prev.woreda.trim() ? prev.woreda : preset.woreda,
    }));
    setGpsStatus('acquired');
    setGpsSource('preset');
    setGpsAccuracy(50);
    setGpsTimestamp('Calibrated Regional Hub');
    setDetectedAddress(`${preset.label} (${preset.region})`);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.gps;
      return copy;
    });
  };

  // Step validation
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        newErrors.fullName = 'Full legal name is required (at least 2 characters).';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required.';
      }
    } else if (currentStep === 2) {
      if (!formData.identityType) {
        newErrors.identityType = 'Please select an identification type.';
      }
      if (!formData.identityNumber.trim()) {
        newErrors.identityNumber = 'Identification number is required.';
      }
    } else if (currentStep === 3) {
      if (!formData.farmName.trim() || formData.farmName.trim().length < 2) {
        newErrors.farmName = 'Farm or producer business name is required.';
      }
      if (!formData.region) {
        newErrors.region = 'Please select your farm region.';
      }
      if (!formData.woreda.trim()) {
        newErrors.woreda = 'Woreda / District is required.';
      }
    } else if (currentStep === 4) {
      if (formData.categories.length === 0) {
        newErrors.categories = 'Please select at least one produce category.';
      }
    } else if (currentStep === 5) {
      if (!formData.consentedToTerms) {
        newErrors.consentedToTerms = 'You must confirm statement accuracy and agree to terms.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submit
  const handleSubmitApplication = async () => {
    // Comprehensive prerequisite validation
    if (!formData.farmName.trim() || formData.farmName.trim().length < 2) {
      setErrors({ farmName: 'Farm name is required (at least 2 characters).', submit: 'Farm name is required (at least 2 characters). Please review Step 3.' });
      setCurrentStep(3);
      return;
    }
    if (!formData.identityType || !formData.identityNumber.trim()) {
      setErrors({ identityNumber: 'Identification number is required.', submit: 'Identification number is required. Please review Step 2.' });
      setCurrentStep(2);
      return;
    }
    if (!formData.consentedToTerms) {
      setErrors({ consentedToTerms: 'You must confirm accuracy and agree to terms.', submit: 'Declaration consent is required. Please review Step 5.' });
      setCurrentStep(5);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitRes: any = await onboardingApi.submitFarmerApplication({
        farmName: formData.farmName.trim(),
        farmDescription: formData.farmDescription.trim() || undefined,
        region: formData.region,
        woreda: formData.woreda.trim(),
        kebele: formData.kebele.trim(),
        farmLatitude: formData.farmLatitude,
        farmLongitude: formData.farmLongitude,
        farmSizeHectares: formData.farmSizeHectares,
        isOrganic: formData.isOrganic,
        categories: formData.categories,
        expectedProducts: formData.expectedProducts.trim() || 'Seasonal farm produce',
        marketId: formData.marketId,
        identityType: formData.identityType,
        identityNumber: formData.identityNumber.trim(),
        identityDocUrl: formData.identityDocUrl || undefined,
        faydaNumber: formData.faydaNumber.trim() || undefined,
        faydaDocUrl: formData.faydaDocUrl || undefined,
        landCertificateUrl: formData.landCertificateUrl || undefined,
        consentedToTerms: formData.consentedToTerms,
      });

      // Synchronously update local user cache so RouteGuard recognizes the role and status immediately
      const current = getCurrentUser();
      const updatedUser = submitRes?.user || (current ? {
        ...current,
        role: 'FARMER' as const,
        onboardingStatus: 'PENDING_VERIFICATION',
      } : null);
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }

      // Redirect to intended farmer dashboard with success flag
      router.push('/dashboard/farmer?onboardingSuccess=true');
    } catch (err: any) {
      const field = err?.field;
      const message = getHumanReadableErrorMessage(err);
      if (field) {
        setErrors({ [field]: message, submit: message });
      } else {
        setErrors({ submit: message });
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-gray-500">Loading farmer onboarding wizard...</p>
      </div>
    );
  }

  const stepTitles = [
    'Personal Information',
    'Identity Verification',
    'Farm & Location',
    'Agricultural Details',
    'Documents & Consent',
    'Review & Submit',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <Sprout className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Farmer Verification Wizard
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#11261D] dark:text-[#E8F5EF] tracking-tight">
                {stepTitles[currentStep - 1]}
              </h1>
            </div>
          </div>

          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors self-start sm:self-auto"
          >
            {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Draft Notice */}
        {draftNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{draftNotice}</span>
          </div>
        )}

        {/* Error Notice */}
        {errors.submit && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errors.submit}</span>
          </div>
        )}
      </div>

      {/* Step Form Body */}
      <div className="bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* ================= STEP 1: Personal Information ================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Contact & Profile Identity
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ensure your legal name and contact details match your government identification.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Abebe Bekele Tadesse"
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.fullName ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'
                  }`}
                />
                {errors.fullName && <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    disabled
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Verified account contact number</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="farmer@example.com"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Language for SMS & Notifications
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="English">English</option>
                  <option value="Amharic">Amharic (አማርኛ)</option>
                  <option value="Afaan Oromo">Afaan Oromoo</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Identity Verification ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Identity Verification & Fayda Support
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Marketplace compliance requires government-issued identification to prevent fraud and protect buyer payments.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Identity Document Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.identityType}
                    onChange={(e) => setFormData({ ...formData, identityType: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Kebele ID">Kebele Identification Card</option>
                    <option value="National Fayda ID">National Fayda Digital ID</option>
                    <option value="Ethiopian Passport">Ethiopian Passport</option>
                    <option value="Driver License">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ID / Document Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                    placeholder="e.g. KB-892104 or ET-90412"
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      errors.identityNumber ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'
                    }`}
                  />
                  {errors.identityNumber && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.identityNumber}</p>
                  )}
                </div>
              </div>

              {/* Fayda optional/recommended info */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    National Fayda Digital ID (Recommended)
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Fayda-verified accounts receive expedited verification and a trusted seller badge on produce listings.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Fayda Identification Number (FIN)
                  </label>
                  <input
                    type="text"
                    value={formData.faydaNumber}
                    onChange={(e) => setFormData({ ...formData, faydaNumber: e.target.value })}
                    placeholder="16-digit Fayda Number (Optional)"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#07130D] text-[#11261D] dark:text-[#E8F5EF]"
                  />
                </div>
              </div>

              {/* Document upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Upload Identity Document Image or PDF (Max 5MB)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-5 text-center bg-gray-50/50 dark:bg-white/5 space-y-2">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <label className="font-bold text-emerald-600 hover:underline cursor-pointer">
                      <span>Click to upload file</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'identityDocUrl')}
                        className="hidden"
                      />
                    </label>
                    <span className="text-gray-400"> (PNG, JPG, or PDF)</span>
                  </div>
                  {uploadingField === 'identityDocUrl' && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading document...</span>
                    </div>
                  )}
                  {formData.identityDocUrl && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Identity document attached</span>
                    </div>
                  )}
                  {errors.identityDocUrl && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.identityDocUrl}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Farm & Location ================= */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Farm Location & Cultivation Details
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Buyers and delivery workers use your farm location to calculate distance and schedule local pickups.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Farm or Producer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  placeholder="e.g. Mojo Valley Fresh Agro"
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.farmName ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'
                  }`}
                />
                {errors.farmName && <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.farmName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Region <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                  >
                    <option value="Oromia">Oromia</option>
                    <option value="Amhara">Amhara</option>
                    <option value="Addis Ababa">Addis Ababa</option>
                    <option value="Sidama">Sidama</option>
                    <option value="SNNPR">Central Ethiopia / SNNPR</option>
                    <option value="Tigray">Tigray</option>
                    <option value="Somali">Somali</option>
                    <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Woreda / District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.woreda}
                    onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                    placeholder="e.g. Mojo / Lume"
                    className={`w-full px-4 py-2.5 text-xs rounded-xl border bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] ${
                      errors.woreda ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'
                    }`}
                  />
                  {errors.woreda && <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.woreda}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Kebele / Locality
                  </label>
                  <input
                    type="text"
                    value={formData.kebele}
                    onChange={(e) => setFormData({ ...formData, kebele: e.target.value })}
                    placeholder="e.g. 02 Kebele"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                  />
                </div>
              </div>

              {/* Automated Real GPS Geolocation Card (No Manual Input Required) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-gray-50/50 to-white dark:from-[#0E261D]/40 dark:via-white/5 dark:to-[#07130D] border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                      <Radio className={`w-4 h-4 ${gpsStatus === 'detecting' ? 'animate-pulse text-amber-500' : 'text-emerald-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#11261D] dark:text-[#E8F5EF]">
                          Automated Farm Coordinates (Real GPS)
                        </span>
                        {gpsStatus === 'acquired' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-2.5 h-2.5" />
                            <span>Auto-Acquired</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Acquired directly from device satellite telemetry for courier pickup routing.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => detectRealCoordinates(true)}
                    disabled={gpsStatus === 'detecting'}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'detecting' ? 'animate-spin' : ''}`} />
                    <span>{gpsStatus === 'detecting' ? 'Acquiring GPS...' : 'Re-sync Live GPS'}</span>
                  </button>
                </div>

                {/* Detecting state banner */}
                {gpsStatus === 'detecting' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs flex items-center gap-2.5 text-amber-800 dark:text-amber-200">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-600" />
                    <span>Detecting real-world coordinates via device satellite fix. No manual typing needed...</span>
                  </div>
                )}

                {/* Error / Denied notice */}
                {errors.gps && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errors.gps}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => detectRealCoordinates(true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                      >
                        Retry GPS Detection
                      </button>
                      <span className="text-[11px] text-gray-500">or pick an agricultural zone below:</span>
                    </div>
                  </div>
                )}

                {/* Display Real Coordinates Cleanly as Read-Only Telemetry Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-[#07130D] rounded-xl border border-gray-200 dark:border-white/10 shadow-inner flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Real Latitude</span>
                      <span className="text-sm font-mono font-bold text-[#11261D] dark:text-[#E8F5EF]">
                        {formData.farmLatitude.toFixed(6)}° N
                      </span>
                    </div>
                    <Crosshair className="w-4 h-4 text-emerald-600 opacity-60" />
                  </div>

                  <div className="p-3 bg-white dark:bg-[#07130D] rounded-xl border border-gray-200 dark:border-white/10 shadow-inner flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Real Longitude</span>
                      <span className="text-sm font-mono font-bold text-[#11261D] dark:text-[#E8F5EF]">
                        {formData.farmLongitude.toFixed(6)}° E
                      </span>
                    </div>
                    <MapPin className="w-4 h-4 text-emerald-600 opacity-60" />
                  </div>
                </div>

                {/* Telemetry metadata footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <div className="flex flex-wrap items-center gap-2">
                    {gpsAccuracy !== null && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Accurate to ±{gpsAccuracy}m
                      </span>
                    )}
                    {gpsTimestamp && <span>· Fix: {gpsTimestamp}</span>}
                    {detectedAddress && (
                      <span className="text-gray-600 dark:text-gray-300 truncate max-w-xs font-medium">
                        · {detectedAddress}
                      </span>
                    )}
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${formData.farmLatitude},${formData.farmLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <span>Preview on Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* 1-Click Regional Hub Fallback Presets (Zero Typing Required) */}
                <div className="pt-2 border-t border-gray-200/70 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Quick Agricultural Zone Select (Zero Manual Input)
                    </span>
                    <span className="text-[10px] text-gray-400">Tap to calibrate farm zone</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {REGIONAL_PRESETS.map((p) => {
                      const isSelected =
                        Math.abs(formData.farmLatitude - p.lat) < 0.001 &&
                        Math.abs(formData.farmLongitude - p.lon) < 0.001;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          className={`px-2 py-1.5 rounded-lg text-left text-[11px] border transition-all ${
                            isSelected
                              ? 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-300'
                          }`}
                        >
                          <div className="truncate">{p.label}</div>
                          <div className="text-[9px] text-gray-400">{p.region}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cultivated Area & Organic Flag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Approximate Cultivated Area (Hectares)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.farmSizeHectares}
                    onChange={(e) => setFormData({ ...formData, farmSizeHectares: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isOrganic}
                      onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Farm is Organic / Chemical-Free Certified</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: Selling Details ================= */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Produce Categories & Expected Harvest
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Tell buyers what crops you produce. You do not need to list individual products yet.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Main Agricultural Categories <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'vegetables', label: 'Vegetables & Greens' },
                    { id: 'grains', label: 'Grains & Pulses' },
                    { id: 'fruits', label: 'Fresh Fruits' },
                    { id: 'coffee_spices', label: 'Coffee & Spices' },
                    { id: 'oilseeds', label: 'Oilseeds' },
                    { id: 'dairy_eggs', label: 'Dairy & Poultry' },
                  ].map((cat) => {
                    const isChecked = formData.categories.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs font-semibold transition-all ${
                          isChecked
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, categories: [...formData.categories, cat.id] });
                            } else {
                              setFormData({
                                ...formData,
                                categories: formData.categories.filter((c) => c !== cat.id),
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.categories && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.categories}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Expected Products to Sell
                </label>
                <textarea
                  rows={3}
                  value={formData.expectedProducts}
                  onChange={(e) => setFormData({ ...formData, expectedProducts: e.target.value })}
                  placeholder="e.g. Red onions, Roma tomatoes, green peppers, highland potatoes..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Primary Market Hub Destination
                </label>
                <select
                  value={formData.marketId}
                  onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                >
                  <option value="addis-central-hub">Addis Ababa Central Agro Hub</option>
                  <option value="adama-hub">Adama Regional Market</option>
                  <option value="hawassa-hub">Hawassa Agro Logistics Center</option>
                  <option value="bahir-dar-hub">Bahir Dar Agricultural Hub</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: Documents & Consent ================= */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Supporting Documents & Declaration
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Attach land ownership papers or cooperative membership if available to expedite seller approval.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Land Ownership Certificate or Agricultural Cooperative ID (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-5 text-center bg-gray-50/50 dark:bg-white/5 space-y-2">
                  <FileText className="w-6 h-6 text-gray-400 mx-auto" />
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <label className="font-bold text-emerald-600 hover:underline cursor-pointer">
                      <span>Click to upload supporting certificate</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'landCertificateUrl')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploadingField === 'landCertificateUrl' && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading document...</span>
                    </div>
                  )}
                  {formData.landCertificateUrl && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Certificate attached</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Consent Checkbox */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentedToTerms}
                    onChange={(e) => setFormData({ ...formData, consentedToTerms: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                      Declaration & Terms Confirmation <span className="text-rose-500">*</span>
                    </span>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                      I hereby certify that all information submitted is true and accurate. I agree to comply with AgriMarket quality standards, fair pricing rules, and seller policies.
                    </p>
                  </div>
                </label>
                {errors.consentedToTerms && (
                  <p className="text-[11px] text-rose-600 font-semibold pl-7">{errors.consentedToTerms}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: Review & Submit ================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Review Your Application
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Please double check all information before submitting to administrative review.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Personal Info Box */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Personal & Contact</span>
                  <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{formData.fullName}</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {formData.phone} · {formData.email || 'No email provided'}
                  </div>
                  <div className="text-gray-500 text-[11px]">Language: {formData.language}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              {/* Identity Box */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Identity Verification</span>
                  <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                    {formData.identityType}: {formData.identityNumber}
                  </div>
                  {formData.faydaNumber && (
                    <div className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                      Fayda ID: {formData.faydaNumber}
                    </div>
                  )}
                  <div className="text-gray-500 text-[11px]">
                    Document: {formData.identityDocUrl ? 'Attached' : 'Pending upload'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              {/* Farm Details Box */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Farm & Location</span>
                  <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{formData.farmName}</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {formData.region}, {formData.woreda} {formData.kebele ? `(${formData.kebele})` : ''}
                  </div>
                  <div className="text-gray-500 text-[11px] flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span>GPS Telemetry: {formData.farmLatitude.toFixed(5)}° N, {formData.farmLongitude.toFixed(5)}° E</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(Auto-Acquired)</span>
                    <span>· {formData.farmSizeHectares} Hectares</span>
                    {formData.isOrganic && <span className="text-emerald-700 font-bold">· Organic</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
