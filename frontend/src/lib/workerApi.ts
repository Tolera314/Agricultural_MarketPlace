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

  // If there's no auth token, avoid a doomed 401/404 fetch and cleanly throw
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  try {
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
  } catch (err: any) {
    throw err;
  }
}

export const workerApi = {
  /** Log in or auto-provision the demo delivery worker (Abebe Mekonnen) and store token */
  demoAuth: async () => {
    const res = await fetch(`${API}/api/auth/demo-worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message || 'Failed to authenticate demo worker');
    if (data?.data?.token) {
      localStorage.setItem('agrimarket_token', data.data.token);
      localStorage.setItem('agrimarket_user', JSON.stringify(data.data.user));
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
