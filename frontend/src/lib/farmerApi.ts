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
};

