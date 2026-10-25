'use client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  try {
    return localStorage.getItem('agrimarket_token');
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export interface ShareLocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  consentGranted: boolean;
  consentPurpose?: string;
  consentVersion?: string;
}

export interface ShareLocationResponse {
  success: boolean;
  message: string;
  data: {
    recordId: string;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    capturedAt: string;
    purpose: string;
  };
}

export interface LatestLocationResponse {
  success: boolean;
  data: {
    latestRecord: {
      id: string;
      latitude: number;
      longitude: number;
      accuracy: number | null;
      consentPurpose: string;
      capturedAt: string;
    } | null;
    deliveryProfileLocation: {
      lastLatitude: number | null;
      lastLongitude: number | null;
      lastAccuracy: number | null;
      lastLocationAt: string | null;
      locationConsentGranted: boolean;
      locationConsentAt: string | null;
    } | null;
    hasConsented: boolean;
  };
}

export interface AdminLocationRecordItem {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
    phone: string;
    vehicle: string | null;
  };
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  consent: {
    granted: boolean;
    purpose: string;
    version: string;
  };
  isRevoked: boolean;
  revokedAt: string | null;
  capturedAt: string;
}

export interface AdminLocationsResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    records: AdminLocationRecordItem[];
  };
}

export const locationApi = {
  /** Explicitly share GPS coordinates with consent */
  shareLocation: (payload: ShareLocationPayload) =>
    apiFetch<ShareLocationResponse>('/api/location/share', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Retrieve the authenticated user's active consented location */
  getMyLatest: () =>
    apiFetch<LatestLocationResponse>('/api/location/my-latest'),

  /** Revoke consent and delete/revoke user location history */
  revokeHistory: () =>
    apiFetch<{ success: boolean; message: string; revokedRecordsCount: number }>('/api/location/my-history', {
      method: 'DELETE',
    }),

  /** RBAC Admin: View audit trail of user-consented locations */
  getAdminRecords: (params?: { page?: number; limit?: number; workerId?: string; purpose?: string; includeRevoked?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.workerId) q.set('workerId', params.workerId);
    if (params?.purpose) q.set('purpose', params.purpose);
    if (params?.includeRevoked !== undefined) q.set('includeRevoked', String(params.includeRevoked));
    return apiFetch<AdminLocationsResponse>(`/api/location/admin/records?${q}`);
  },

  /** RBAC Admin: Purge an individual record */
  deleteAdminRecord: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/location/admin/records/${id}`, {
      method: 'DELETE',
    }),
};
