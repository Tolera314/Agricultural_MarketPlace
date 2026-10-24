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
  dashboard: () => apiFetch<any>('/api/worker/dashboard'),
  offers: () => apiFetch<any>('/api/worker/offers'),
  acceptOffer: (offerId: string) =>
    apiFetch<any>(`/api/worker/offers/${offerId}/accept`, { method: 'POST' }),
  rejectOffer: (offerId: string, reason?: string) =>
    apiFetch<any>(`/api/worker/offers/${offerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  deliveries: (params?: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    return apiFetch<any>(`/api/worker/deliveries?${q}`);
  },
  updateStatus: (jobId: string, status: string, opts?: { notes?: string; latitude?: number; longitude?: number }) =>
    apiFetch<any>(`/api/worker/deliveries/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...opts }),
    }),
  earnings: (period: 'today' | 'week' | 'month') =>
    apiFetch<any>(`/api/worker/earnings?period=${period}`),
  profile: () => apiFetch<any>('/api/worker/profile'),
  updateProfile: (data: object) =>
    apiFetch<any>('/api/worker/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  notifications: () => apiFetch<any>('/api/worker/notifications'),
};
