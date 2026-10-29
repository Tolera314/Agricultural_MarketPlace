'use client';

import { getAccessToken, setAccessToken, setCurrentUser } from './auth';
import { API_BASE_URL } from './apiConfig';
import { safeParseApiResponse, ApiClientError, getHumanReadableErrorMessage } from './errorHandler';

const API = API_BASE_URL;

function getToken(): string | null {
  return getAccessToken();
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // If there's no auth token, avoid a doomed fetch and cleanly throw a user-friendly error
  if (!token) {
    throw new ApiClientError({
      code: 'AUTH_REQUIRED',
      message: 'Please sign in with a Delivery Courier account to view your deliveries.',
      status: 401,
    });
  }

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
  } catch (netErr: any) {
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: getHumanReadableErrorMessage(netErr),
      status: 0,
    });
  }

  const parsed = await safeParseApiResponse<T>(res);

  if (!parsed.ok) {
    throw new ApiClientError(parsed.error || {
      message: getHumanReadableErrorMessage(res.status),
      status: res.status,
    });
  }

  return parsed.data as T;
}

export const workerApi = {
  /** Log in or auto-provision the demo delivery worker (Abebe Mekonnen) and store token */
  demoAuth: async () => {
    let res: Response;
    try {
      res = await fetch(`${API}/api/auth/demo-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        message: 'Unable to start demo courier session. Please try again shortly.',
        status: res.status,
      });
    }

    const data = parsed.data;
    if (data?.data?.accessToken || data?.data?.token) {
      setAccessToken(data.data.accessToken || data.data.token);
      setCurrentUser(data.data.user);
    }
    return data;
  },

  dashboard: () => apiFetch<any>('/api/worker/dashboard'),
  offers: () => apiFetch<any>('/api/worker/offers'),
  acceptOffer: (offerId: string) =>
    apiFetch<any>(`/api/worker/offers/${offerId}/accept`, { method: 'POST' }),
  rejectOffer: (offerId: string, reason?: string) =>
    apiFetch<any>(`/api/worker/offers/${offerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  deliveries: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<any>(`/api/worker/deliveries?${q}`);
  },
  activeDelivery: () => apiFetch<any>('/api/worker/deliveries/active'),
  updateStatus: (
    jobId: string,
    status: string,
    opts?: {
      notes?: string;
      latitude?: number;
      longitude?: number;
      proofOfDeliveryCode?: string;
      proofOfDeliveryUrl?: string;
    }
  ) =>
    apiFetch<any>(`/api/worker/deliveries/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...opts }),
    }),
  reportIncident: (
    jobId: string,
    payload: {
      reasonCode: string;
      description: string;
      evidenceUrl?: string;
      latitude?: number;
      longitude?: number;
      terminateJob?: boolean;
    }
  ) =>
    apiFetch<any>(`/api/worker/deliveries/${jobId}/incident`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  earnings: (period: 'today' | 'week' | 'month') =>
    apiFetch<any>(`/api/worker/earnings?period=${period}`),
  reconciliations: () => apiFetch<any>('/api/worker/reconciliations'),
  submitReconciliation: (payload: {
    reconciliationIds: string[];
    paymentService?: string;
    referenceNumber?: string;
    notes?: string;
  }) =>
    apiFetch<any>('/api/worker/reconciliations/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  profile: () => apiFetch<any>('/api/worker/profile'),
  updateProfile: (data: object) =>
    apiFetch<any>('/api/worker/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  notifications: () => apiFetch<any>('/api/worker/notifications'),
  seedDemoOrder: () => apiFetch<any>('/api/worker/seed-demo-order', { method: 'POST' }),
};
