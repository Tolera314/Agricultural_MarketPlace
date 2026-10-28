'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Loader2,
  Save,
  Radio,
  FileText,
} from 'lucide-react';
import { onboardingApi } from '@/lib/onboardingApi';
import { compressDocumentImage } from '@/lib/imageCompressor';

export function WorkerOnboardingForm() {
  const router = useRouter();

  // Multi-step: 1: Personal, 2: Identity, 3: Vehicle & License, 4: Coverage & Dispatch, 5: Review & Submit
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    // Step 1: Personal
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

    // Step 3: Vehicle & Transport
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: '',
    driverLicenseNumber: '',
    driverLicenseDocUrl: '',
    vehicleCapacityKg: '150',

    // Step 4: Coverage & Availability
    operatingCity: 'Addis Ababa',
    deliveryZoneId: 'zone-addis-central',
    availabilityPreference: 'FULL_TIME',
    locationConsent: true,

    // Step 5: Terms
    consentedToTerms: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Load user data & saved draft
  useEffect(() => {
    async function loadInitial() {
      try {
        const status = await onboardingApi.getStatus();
        setFormData((prev) => ({
          ...prev,
          fullName: status.fullName || prev.fullName,
          phone: status.phone || prev.phone,
          email: status.email || prev.email,
        }));

        if (status.onboardingDraft && typeof status.onboardingDraft === 'object') {
          setFormData((prev) => ({
            ...prev,
            ...status.onboardingDraft,
          }));
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

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftNotice(null);
    try {
      await onboardingApi.saveDraft(formData);
      setDraftNotice('Draft saved successfully. You can return and complete this anytime.');
      setTimeout(() => setDraftNotice(null), 3500);
    } catch (err: any) {
      setDraftNotice(err?.message || 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    setErrors((prev) => ({ ...prev, [fieldName]: '' }));

    try {
      // Compress document images client-side before network upload (handles 8-15 MB photos)
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
      setErrors((prev) => ({ ...prev, [fieldName]: err?.message || 'Upload failed.' }));
    } finally {
      setUploadingField(null);
    }
  };

  const isMotorized = ['MOTORCYCLE', 'THREE_WHEELER', 'PICKUP_TRUCK', 'TRUCK'].includes(formData.vehicleType);

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
        newErrors.identityType = 'Please select an identification document type.';
      }
      if (!formData.identityNumber.trim()) {
        newErrors.identityNumber = 'Identification number is required.';
      }
    } else if (currentStep === 3) {
      if (!formData.vehicleType) {
        newErrors.vehicleType = 'Please select a delivery vehicle method.';
      }
      if (isMotorized) {
        if (!formData.vehiclePlate.trim() || formData.vehiclePlate.trim().length < 3) {
          newErrors.vehiclePlate = 'Vehicle license plate number is required for motorized transport.';
        }
        if (!formData.driverLicenseNumber.trim()) {
          newErrors.driverLicenseNumber = 'Valid driver license number is required for motorized transport.';
        }
      }
    } else if (currentStep === 4) {
      if (!formData.operatingCity) {
        newErrors.operatingCity = 'Operating city is required.';
      }
      if (!formData.locationConsent) {
        newErrors.locationConsent = 'Location consent while on active duty is required for dispatch eligibility.';
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

  const handleSubmitApplication = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await onboardingApi.submitWorkerApplication({
        vehicleType: formData.vehicleType,
        vehiclePlate: formData.vehiclePlate.trim() || undefined,
        vehicleCapacityKg: formData.vehicleCapacityKg,
        operatingCity: formData.operatingCity,
        deliveryZoneId: formData.deliveryZoneId,
        identityType: formData.identityType,
        identityNumber: formData.identityNumber.trim(),
        identityDocUrl: formData.identityDocUrl || undefined,
        faydaNumber: formData.faydaNumber.trim() || undefined,
        faydaDocUrl: formData.faydaDocUrl || undefined,
        driverLicenseNumber: formData.driverLicenseNumber.trim() || undefined,
        driverLicenseDocUrl: formData.driverLicenseDocUrl || undefined,
        locationConsent: formData.locationConsent,
        consentedToTerms: formData.consentedToTerms,
      });

      router.push('/dashboard/worker/verification-status');
    } catch (err: any) {
      const field = err?.field;
      if (field) {
        setErrors({ [field]: err.message, submit: err.message });
      } else {
        setErrors({ submit: err?.message || 'Failed to submit worker application. Please try again.' });
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-gray-500">Loading delivery worker wizard...</p>
      </div>
    );
  }

  const stepTitles = [
    'Personal Information',
    'Identity Verification',
    'Vehicle & Transport Details',
    'Coverage & Dispatch Consent',
    'Review & Submit Application',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800">
              <Truck className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Delivery Worker Registration
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
              className="h-full bg-teal-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {draftNotice && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
            <span>{draftNotice}</span>
          </div>
        )}

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
                Courier Contact Information
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ensure your details are accurate so dispatch and customers can reach you during deliveries.
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
                  placeholder="e.g. Dawit Haile Gebrselassie"
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
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
                    placeholder="worker@example.com"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
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
                Delivery workers handle cash-on-delivery and produce shipments, requiring strict identity verification.
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
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
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
                    placeholder="e.g. KB-102945"
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF] ${
                      errors.identityNumber ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'
                    }`}
                  />
                  {errors.identityNumber && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.identityNumber}</p>
                  )}
                </div>
              </div>

              {/* Fayda ID Card */}
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-300">
                    National Fayda Digital ID (Recommended)
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Fayda Identification Number (FIN)
                  </label>
                  <input
                    type="text"
                    value={formData.faydaNumber}
                    onChange={(e) => setFormData({ ...formData, faydaNumber: e.target.value })}
                    placeholder="16-digit Fayda Number (Optional)"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#07130D]"
                  />
                </div>
              </div>

              {/* Upload ID */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Upload Identity Document Image or PDF (Max 5MB)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-5 text-center bg-gray-50/50 dark:bg-white/5 space-y-2">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <label className="font-bold text-teal-600 hover:underline cursor-pointer">
                      <span>Click to upload identity document</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'identityDocUrl')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploadingField === 'identityDocUrl' && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-teal-600 font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading document...</span>
                    </div>
                  )}
                  {formData.identityDocUrl && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-teal-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Identity document attached</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Vehicle & Transport ================= */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Transport Method & Commercial Fleet Compliance
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select your delivery transport method. Motorized vehicles require valid license and registration plate.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Vehicle Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => {
                    const vt = e.target.value;
                    let cap = '150';
                    if (vt === 'BICYCLE') cap = '25';
                    else if (vt === 'MOTORCYCLE') cap = '150';
                    else if (vt === 'THREE_WHEELER') cap = '400';
                    else if (vt === 'PICKUP_TRUCK') cap = '1200';
                    else if (vt === 'TRUCK') cap = '4000';
                    setFormData({ ...formData, vehicleType: vt, vehicleCapacityKg: cap });
                  }}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                >
                  <option value="MOTORCYCLE">Motorcycle / Scooter (Fast Urban Delivery)</option>
                  <option value="THREE_WHEELER">Three-Wheeler / Bajaj (Local Cargo)</option>
                  <option value="PICKUP_TRUCK">Pickup Truck / Isuzu (Bulk Farm Produce)</option>
                  <option value="TRUCK">Heavy Truck (Intercity Logistics)</option>
                  <option value="BICYCLE">Bicycle (Eco Urban - Non-Motorized)</option>
                  <option value="OTHER">Other Supported Transport</option>
                </select>
              </div>

              {/* Conditional Motorized Fields */}
              {isMotorized && (
                <div className="p-4 rounded-2xl bg-gray-50/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-[#11261D] dark:text-[#E8F5EF]">
                      Motorized Transport Credentials
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Vehicle Plate Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.vehiclePlate}
                        onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                        placeholder="e.g. 3-AA-98124"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#07130D] ${
                          errors.vehiclePlate ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'
                        }`}
                      />
                      {errors.vehiclePlate && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.vehiclePlate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Driving License Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.driverLicenseNumber}
                        onChange={(e) => setFormData({ ...formData, driverLicenseNumber: e.target.value })}
                        placeholder="e.g. DL-871920"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#07130D] ${
                          errors.driverLicenseNumber ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'
                        }`}
                      />
                      {errors.driverLicenseNumber && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.driverLicenseNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Upload Driver's License Document (Image or PDF)
                    </label>
                    <div className="border border-dashed border-gray-300 dark:border-white/10 rounded-xl p-3 text-center bg-white dark:bg-[#07130D] space-y-1">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        <label className="font-bold text-teal-600 hover:underline cursor-pointer">
                          <span>Click to upload license</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={(e) => handleFileUpload(e, 'driverLicenseDocUrl')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {uploadingField === 'driverLicenseDocUrl' && (
                        <div className="flex items-center justify-center gap-1 text-xs text-teal-600 font-semibold">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      )}
                      {formData.driverLicenseDocUrl && (
                        <div className="flex items-center justify-center gap-1 text-xs text-teal-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>License attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Cargo Capacity (Kilograms)
                </label>
                <input
                  type="number"
                  value={formData.vehicleCapacityKg}
                  onChange={(e) => setFormData({ ...formData, vehicleCapacityKg: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: Coverage & Dispatch ================= */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Service Coverage & Dispatch Availability
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Configure your operating zone. You will receive delivery broadcast offers based on these preferences.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Operating City Hub <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.operatingCity}
                    onChange={(e) => setFormData({ ...formData, operatingCity: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                  >
                    <option value="Addis Ababa">Addis Ababa Metropolitan</option>
                    <option value="Adama">Adama / Nazareth</option>
                    <option value="Hawassa">Hawassa</option>
                    <option value="Bahir Dar">Bahir Dar</option>
                    <option value="Dire Dawa">Dire Dawa</option>
                    <option value="Jimma">Jimma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Availability Preference
                  </label>
                  <select
                    value={formData.availabilityPreference}
                    onChange={(e) => setFormData({ ...formData, availabilityPreference: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
                  >
                    <option value="FULL_TIME">Full-Time Courier (Daily Active)</option>
                    <option value="PART_TIME">Part-Time (Morning / Evening Peak)</option>
                    <option value="WEEKEND">Weekend Dedicated</option>
                    <option value="ON_DEMAND">Flexible On-Demand</option>
                  </select>
                </div>
              </div>

              {/* Location Consent Checkbox */}
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.locationConsent}
                    onChange={(e) => setFormData({ ...formData, locationConsent: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                      Duty Location & Dispatch Consent <span className="text-rose-500">*</span>
                    </span>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                      I agree to grant location access when on active delivery duty. Live location is used strictly to match nearby farm pickup orders and route navigation, protected by strict privacy policies.
                    </p>
                  </div>
                </label>
                {errors.locationConsent && (
                  <p className="text-[11px] text-rose-600 font-semibold pl-7">{errors.locationConsent}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: Review & Submit ================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[#11261D] dark:text-[#E8F5EF]">
                Review Delivery Courier Application
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Verify all information before sending to administrator review.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Courier Info</span>
                  <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{formData.fullName}</div>
                  <div className="text-gray-600 dark:text-gray-400">{formData.phone}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Vehicle & Fleet</span>
                  <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{formData.vehicleType}</div>
                  {isMotorized && (
                    <div className="text-gray-600 dark:text-gray-400">
                      Plate: {formData.vehiclePlate} · License: {formData.driverLicenseNumber}
                    </div>
                  )}
                  <div className="text-gray-500 text-[11px]">
                    Operating in: {formData.operatingCity} · Capacity: {formData.vehicleCapacityKg} kg
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              {/* Legal Confirmation */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentedToTerms}
                    onChange={(e) => setFormData({ ...formData, consentedToTerms: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                      Fleet Compliance Declaration <span className="text-rose-500">*</span>
                    </span>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                      I certify that all credentials provided are authentic and valid. I agree to adhere to AgriMarket delivery safety guidelines, timely order handoffs, and cash-on-delivery reconciliation rules.
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
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md"
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
