/**
 * Onboarding API client for AgriMarket.
 * Handles role selection, draft persistence, document upload, and farmer/worker verification submissions.
 */

import { getAccessToken, setAccessToken, setCurrentUser, getCurrentUser } from './auth';
import { API_BASE_URL } from './apiConfig';
import { safeParseApiResponse, ApiClientError, getHumanReadableErrorMessage } from './errorHandler';

const API_BASE = API_BASE_URL;

function getAuthHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export interface OnboardingStatusData {
  userId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: 'BUYER' | 'FARMER' | 'DELIVERY_WORKER' | 'ADMIN' | 'SUPERADMIN';
  isVerified: boolean;
  isActive: boolean;
  onboardingStatus: 'PENDING_ROLE' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'COMPLETED' | 'REJECTED';
  onboardingDraft?: any;
  farmerProfile?: {
    id: string;
    farmName: string;
    farmDescription?: string | null;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
    verificationNote?: string | null;
    verificationDocuments?: any;
    farmLatitude: number;
    farmLongitude: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  deliveryProfile?: {
    id: string;
    vehicleType: string;
    vehiclePlate?: string | null;
    vehicleCapacityKg?: number | null;
    availability: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
    verificationNote?: string | null;
    verificationDocuments?: any;
    activeJobCount: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  buyerProfile?: {
    id: string;
    preferredDeliveryAddress?: string | null;
  } | null;
}

export const onboardingApi = {
  /**
   * Authoritative check of onboarding status and profiles
   */
  async getStatus(): Promise<OnboardingStatusData> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/onboarding/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
    } catch (netErr: any) {
      throw new ApiClientError({
        code: 'NETWORK_ERROR',
        message: getHumanReadableErrorMessage(netErr),
        status: 0,
      });
    }

    const parsed = await safeParseApiResponse<OnboardingStatusData>(res);
    if (!parsed.ok) {
      throw new ApiClientError(parsed.error || {
        message: 'Unable to retrieve your onboarding status. Please refresh the page.',
        status: res.status,
      });
    }

    return parsed.data as OnboardingStatusData;
  },

  /**
   * Submit role selection
   */
  async selectRole(role: 'BUYER' | 'FARMER' | 'DELIVERY_WORKER'): Promise<{
    token: string;
    user: {
      id: string;
      fullName: string;
      phone: string;
      email?: string;
      role: string;
      isVerified: boolean;
      onboardingStatus: string;
    };
  }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/onboarding/select-role`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      });
    } catch (netErr: any) {
      throw new ApiClientError({
        code: 'NETWORK_ERROR',
        message: getHumanReadableErrorMessage(netErr),
        status: 0,
      });
    }

    const parsed = await safeParseApiResponse<any>(res);
    if (!parsed.ok) {
      throw new ApiClientError(parsed.error || {
        message: 'Failed to update your account role. Please try again.',
        status: res.status,
      });
    }

    const data = parsed.data;
    if (data?.token || data?.accessToken) {
      setAccessToken(data.accessToken || data.token);
      setCurrentUser(data.user);
    }

    return data;
  },

  /**
   * Save onboarding form draft
   */
  async saveDraft(draft: any): Promise<{ savedAt: string }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/onboarding/draft`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ draft }),
      });
    } catch (netErr: any) {
      throw new ApiClientError({
        code: 'NETWORK_ERROR',
        message: getHumanReadableErrorMessage(netErr),
        status: 0,
      });
    }

    const parsed = await safeParseApiResponse<{ savedAt: string }>(res);
    if (!parsed.ok) {
      throw new ApiClientError(parsed.error || {
        message: 'Could not save your draft at this moment. Your entries remain on screen.',
        status: res.status,
      });
    }

    return parsed.data as { savedAt: string };
  },

  /**
   * Retrieve saved draft
   */
  async getDraft(): Promise<any> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/onboarding/draft`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
    } catch (netErr: any) {
      throw new ApiClientError({
        code: 'NETWORK_ERROR',
        message: getHumanReadableErrorMessage(netErr),
        status: 0,
      });
    }

    const parsed = await safeParseApiResponse<{ draft: any }>(res);
    if (!parsed.ok) {
      throw new ApiClientError(parsed.error || {
        message: 'Could not retrieve your saved draft. You can continue filling out the form.',
        status: res.status,
      });
    }

    return parsed.data?.draft;
  },

  /**
   * Upload verification document securely
   */
  async uploadDocument(file: File): Promise<{
    documentUrl: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/onboarding/upload`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData,
      });
    } catch (netErr: any) {
      throw new ApiClientError({
        code: 'NETWORK_ERROR',
        message: getHumanReadableErrorMessage(netErr),
        status: 0,
      });
    }

    const parsed = await safeParseApiResponse<any>(res);
    if (!parsed.ok) {
      throw new ApiClientError(parsed.error || {
        message: 'Document upload failed. Please ensure your file is under 5 MB.',
        status: res.status,
      });
    }

    return parsed.data;
  },

  /**
   * Submit Farmer application
   */
  async submitFarmerApplication(data: any): Promise<{
    profileId: string;
    verificationStatus: string;
    submittedAt: string;
  }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/onboarding/submit-farmer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
    } catch (netErr: any) {
      throw new ApiClientError({
        code: 'NETWORK_ERROR',
        message: getHumanReadableErrorMessage(netErr),
        status: 0,
      });
    }

    const parsed = await safeParseApiResponse<any>(res);
    if (!parsed.ok) {
      throw new ApiClientError(parsed.error || {
        message: 'Unable to submit your farmer application. Please verify your information and try again.',
        status: res.status,
      });
    }

    const payload = parsed.data?.data !== undefined ? parsed.data.data : parsed.data;

    if (payload?.token || payload?.accessToken) {
      setAccessToken(payload.token || payload.accessToken);
    }

    if (payload?.user) {
      setCurrentUser(payload.user);
    } else {
      const current = getCurrentUser();
      if (current) {
        setCurrentUser({
          ...current,
          role: 'FARMER',
          onboardingStatus: 'PENDING_VERIFICATION',
        });
      }
    }

    return payload;
  },

  /**
   * Submit Delivery Worker application
   */
  async submitWorkerApplication(data: any): Promise<{
    profileId: string;
    verificationStatus: string;
    submittedAt: string;
  }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/onboarding/submit-worker`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
    } catch (netErr: any) {
      throw new ApiClientError({
        code: 'NETWORK_ERROR',
        message: getHumanReadableErrorMessage(netErr),
        status: 0,
      });
    }

    const parsed = await safeParseApiResponse<any>(res);
    if (!parsed.ok) {
      throw new ApiClientError(parsed.error || {
        message: 'Unable to submit your delivery courier application. Please verify your information and try again.',
        status: res.status,
      });
    }

    const payload = parsed.data?.data !== undefined ? parsed.data.data : parsed.data;

    if (payload?.token || payload?.accessToken) {
      setAccessToken(payload.token || payload.accessToken);
    }

    if (payload?.user) {
      setCurrentUser(payload.user);
    } else {
      const current = getCurrentUser();
      if (current) {
        setCurrentUser({
          ...current,
          role: 'DELIVERY_WORKER',
          onboardingStatus: 'PENDING_VERIFICATION',
        });
      }
    }

    return payload;
  },
};
