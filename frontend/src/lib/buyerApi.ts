'use client';

import { getAccessToken } from './auth';
import { API_BASE_URL } from './apiConfig';
import { safeParseApiResponse, ApiClientError, getHumanReadableErrorMessage } from './errorHandler';

const API = API_BASE_URL;

function getToken(): string | null {
  return getAccessToken();
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      credentials: 'include',
      headers,
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

  // Return the full envelope (or data) preserving callers' expectations
  return {
    success: true,
    data: parsed.data,
    ...(typeof parsed.data === 'object' && parsed.data !== null ? parsed.data : {}),
  } as T;
}

export const buyerApi = {
  getDashboard: (lat?: number, lng?: number) => {
    const q = new URLSearchParams();
    if (lat !== undefined) q.set('lat', String(lat));
    if (lng !== undefined) q.set('lng', String(lng));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiFetch<any>(`/api/buyer/dashboard${qs}`);
  },

  getNearbyFarmers: (lat?: number, lng?: number, radius?: number) => {
    const q = new URLSearchParams();
    if (lat !== undefined) q.set('lat', String(lat));
    if (lng !== undefined) q.set('lng', String(lng));
    if (radius !== undefined) q.set('radius', String(radius));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiFetch<any>(`/api/buyer/farmers/nearby${qs}`);
  },

  getFarmerProfile: (farmerId: string, lat?: number, lng?: number) => {
    const q = new URLSearchParams();
    if (lat !== undefined) q.set('lat', String(lat));
    if (lng !== undefined) q.set('lng', String(lng));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiFetch<any>(`/api/buyer/farmers/${encodeURIComponent(farmerId)}${qs}`);
  },

  searchProducts: (params?: {
    search?: string;
    category?: string;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    lat?: number;
    lng?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category) q.set('category', params.category);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.minPrice !== undefined) q.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice));
    if (params?.lat !== undefined) q.set('lat', String(params.lat));
    if (params?.lng !== undefined) q.set('lng', String(params.lng));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiFetch<any>(`/api/buyer/products${qs}`);
  },

  getProductDetails: (productId: string, lat?: number, lng?: number) => {
    const q = new URLSearchParams();
    if (lat !== undefined) q.set('lat', String(lat));
    if (lng !== undefined) q.set('lng', String(lng));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiFetch<any>(`/api/buyer/products/${encodeURIComponent(productId)}${qs}`);
  },

  getCategories: () => apiFetch<any>('/api/buyer/categories'),

  calculateCheckout: (items: { listingId: string; quantity: number }[], deliveryAddressId?: string) =>
    apiFetch<any>('/api/buyer/checkout/calculate', {
      method: 'POST',
      body: JSON.stringify({ items, deliveryAddressId }),
    }),

  createOrder: (data: {
    items: { listingId: string; quantity: number }[];
    deliveryAddress: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    paymentMethod: string;
    idempotencyKey?: string;
    buyerNotes?: string;
  }) =>
    apiFetch<any>('/api/buyer/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrders: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<any>(`/api/buyer/orders${q}`);
  },

  getOrderDetails: (orderId: string) =>
    apiFetch<any>(`/api/buyer/orders/${encodeURIComponent(orderId)}`),

  cancelOrder: (orderId: string, reason?: string) =>
    apiFetch<any>(`/api/buyer/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getDeliveryTracking: (orderId: string) =>
    apiFetch<any>(`/api/buyer/orders/${encodeURIComponent(orderId)}/tracking`),

  getAddresses: () => apiFetch<any>('/api/buyer/addresses'),

  createAddress: (data: {
    label: string;
    streetAddress: string;
    city: string;
    subcity?: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
    deliveryNotes?: string;
  }) =>
    apiFetch<any>('/api/buyer/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAddress: (id: string, data: any) =>
    apiFetch<any>(`/api/buyer/addresses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAddress: (id: string) =>
    apiFetch<any>(`/api/buyer/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getSavedFarmers: () => apiFetch<any>('/api/buyer/saved-farmers'),

  toggleSavedFarmer: (farmerId: string) =>
    apiFetch<any>(`/api/buyer/saved-farmers/${encodeURIComponent(farmerId)}/toggle`, {
      method: 'POST',
    }),

  getFavorites: () => apiFetch<any>('/api/buyer/favorites'),

  toggleFavorite: (listingId: string) =>
    apiFetch<any>(`/api/buyer/favorites/${encodeURIComponent(listingId)}/toggle`, {
      method: 'POST',
    }),

  getNotifications: () => apiFetch<any>('/api/buyer/notifications'),

  markNotificationRead: (notifId: string) =>
    apiFetch<any>(`/api/buyer/notifications/${encodeURIComponent(notifId)}/read`, {
      method: 'PATCH',
    }),

  createSupportTicket: (data: { orderId?: string; subject: string; message: string; category?: string }) =>
    apiFetch<any>('/api/buyer/support', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
