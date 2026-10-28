/**
 * Onboarding API client for AgriMarket.
 * Handles role selection, draft persistence, document upload, and farmer/worker verification submissions.
 */

import { getAccessToken, setAccessToken, setCurrentUser } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    const res = await fetch(`${API_BASE}/api/onboarding/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to fetch onboarding status.');
    }

    return json.data;
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
    const res = await fetch(`${API_BASE}/api/onboarding/select-role`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to select account role.');
    }

    if (json.data?.token || json.data?.accessToken) {
      setAccessToken(json.data.accessToken || json.data.token);
      setCurrentUser(json.data.user);
    }

    return json.data;
  },

  /**
   * Save onboarding form draft
   */
  async saveDraft(draft: any): Promise<{ savedAt: string }> {
    const res = await fetch(`${API_BASE}/api/onboarding/draft`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ draft }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to save draft.');
    }

    return json.data;
  },

  /**
   * Retrieve saved draft
   */
  async getDraft(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/onboarding/draft`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to retrieve draft.');
    }

    return json.data?.draft;
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

    const res = await fetch(`${API_BASE}/api/onboarding/upload`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'File upload failed.');
    }

    return json.data;
  },

  /**
   * Submit Farmer application
   */
  async submitFarmerApplication(data: any): Promise<{
    profileId: string;
    verificationStatus: string;
    submittedAt: string;
  }> {
    const res = await fetch(`${API_BASE}/api/onboarding/submit-farmer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to submit farmer application.');
    }

    return json.data;
  },

  /**
   * Submit Delivery Worker application
   */
  async submitWorkerApplication(data: any): Promise<{
    profileId: string;
    verificationStatus: string;
    submittedAt: string;
  }> {
    const res = await fetch(`${API_BASE}/api/onboarding/submit-worker`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to submit worker application.');
    }

    return json.data;
  },
};
