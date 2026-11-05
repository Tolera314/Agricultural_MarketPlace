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

  return {
    success: true,
    data: parsed.data,
    ...(typeof parsed.data === 'object' && parsed.data !== null ? parsed.data : {}),
  } as T;
}

export interface FarmerDashboardData {
  farmer: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
  };
  profile: {
    farmName: string;
    farmDescription?: string | null;
    farmSizeHectares?: number | null;
    isOrganic: boolean;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
    verificationNote?: string | null;
    isVerified: boolean;
  };
  metrics: {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders?: number;
  };
}

export const farmerApi = {
  getDashboard(): Promise<{ data: FarmerDashboardData }> {
    return apiFetch<{ data: FarmerDashboardData }>('/api/farmer/dashboard');
  },

  getMyProducts(): Promise<any> {
    return apiFetch('/api/farmer/products');
  },

  createProduct(data: {
    name: string;
    description?: string;
    categoryId?: string;
    pricePerUnit: number;
    unit?: string;
    stockQuantity: number;
    minOrderQty?: number;
    maxOrderQty?: number;
    qualityGrade?: string;
    intercityEligible?: boolean;
    pickupLatitude?: number;
    pickupLongitude?: number;
  }): Promise<any> {
    return apiFetch('/api/farmer/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct(id: string, data: Partial<{
    name: string;
    description: string;
    pricePerUnit: number;
    stockQuantity: number;
    unit: string;
    status: string;
    qualityGrade: string;
    intercityEligible: boolean;
  }>): Promise<any> {
    return apiFetch(`/api/farmer/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteProduct(id: string): Promise<any> {
    return apiFetch(`/api/farmer/products/${id}`, {
      method: 'DELETE',
    });
  },

  getOrders(): Promise<any> {
    return apiFetch('/api/farmer/orders');
  },

  updateOrderStatus(orderId: string, status: string): Promise<any> {
    return apiFetch(`/api/farmer/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getEarnings(): Promise<any> {
    return apiFetch('/api/farmer/earnings');
  },

  requestWithdrawal(amount: number, destination: string): Promise<any> {
    return apiFetch('/api/farmer/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, destination }),
    });
  },

  getDeliveries(): Promise<any> {
    return apiFetch('/api/farmer/deliveries');
  },

  getReviews(): Promise<any> {
    return apiFetch('/api/farmer/reviews');
  },

  replyReview(reviewId: string, reply: string): Promise<any> {
    return apiFetch(`/api/farmer/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    });
  },

  updateProfile(data: {
    farmName?: string;
    farmDescription?: string;
    fullName?: string;
    phone?: string;
    region?: string;
    woreda?: string;
    specialties?: string[];
  }): Promise<any> {
    return apiFetch('/api/farmer/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getSettings(): Promise<any> {
    return apiFetch('/api/farmer/settings');
  },

  updateSettings(data: {
    smsOnNewOrder?: boolean;
    courierArrivalNotice?: boolean;
    marketIntelligenceUpdates?: boolean;
    defaultPayout?: any;
  }): Promise<any> {
    return apiFetch('/api/farmer/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

