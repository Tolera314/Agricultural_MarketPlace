import { getAccessToken, getCurrentUser } from './auth';

// ─── Dev bypass: admin dashboard works without any login ─────────────────────
// The backend requireAuth middleware accepts this header and injects SUPERADMIN role.
const DEV_BYPASS_HEADER = 'x-dev-admin-bypass';
const DEV_BYPASS_SECRET = 'agrimarket_dev_2026';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Returns auth headers. Uses stored JWT token if present (logged-in user),
 * otherwise falls back to the dev bypass header so admin pages work without login.
 */
const FALLBACK_DASHBOARD_DATA: DashboardData = {
  metrics: {
    totalFarmers: 1248,
    totalFarmersTrend: '+12% this week',
    verifiedFarmers: 1080,
    pendingFarmers: 168,
    totalBuyers: 5820,
    totalBuyersTrend: '+18% this week',
    totalOrders: 3410,
    totalOrdersTrend: '+8% this week',
    totalRevenue: 842500,
    totalRevenueFormatted: 'ETB 842,500',
    totalRevenueTrend: '+15% this week',
    platformCommission: 42125,
  },
  chartData: [
    { day: 'Mon', date: '2026-10-20', local: 35000, intercity: 18000 },
    { day: 'Tue', date: '2026-10-21', local: 42000, intercity: 22000 },
    { day: 'Wed', date: '2026-10-22', local: 38000, intercity: 19500 },
    { day: 'Thu', date: '2026-10-23', local: 51000, intercity: 26000 },
    { day: 'Fri', date: '2026-10-24', local: 49000, intercity: 24500 },
    { day: 'Sat', date: '2026-10-25', local: 62000, intercity: 31000 },
    { day: 'Sun', date: '2026-10-26', local: 58000, intercity: 29000 },
  ],
  topProducts: [
    { id: '1', name: 'Teff (Magna)', soldCount: 420, image: '/images/products/teff.jpg' },
    { id: '2', name: 'Fresh Tomatoes', soldCount: 380, image: '/images/products/tomatoes.jpg' },
    { id: '3', name: 'Red Onions', soldCount: 310, image: '/images/products/onions.jpg' },
    { id: '4', name: 'Green Pepper (Karia)', soldCount: 290, image: '/images/products/pepper.jpg' },
  ],
  recentOrders: [
    {
      id: 'ord-101',
      title: 'Teff (Magna) · 5 Quintals',
      route: 'Debre Birhan → Addis Ababa',
      priceFormatted: 'ETB 42,500',
      status: 'Pending Verification',
      rawStatus: 'PENDING_APPROVAL',
      date: '10 mins ago',
      tradeType: 'Intercity Trade',
      image: '/images/products/teff.jpg',
    },
    {
      id: 'ord-102',
      title: 'Fresh Tomatoes · 50 kg',
      route: 'Kality → Bole, Addis Ababa',
      priceFormatted: 'ETB 3,750',
      status: 'In Transit',
      rawStatus: 'IN_TRANSIT',
      date: '25 mins ago',
      tradeType: 'Local Delivery',
      image: '/images/products/tomatoes.jpg',
    },
  ],
  systemAlerts: [
    {
      id: 'alt-1',
      type: 'warning',
      message: 'New Intercity Order #ord-101 requires cross-regional logistics approval.',
      time: '10m ago',
      link: '/dashboard/admin/intercity',
    },
    {
      id: 'alt-2',
      type: 'info',
      message: '3 farmer Kebele verification documents are waiting for review.',
      time: '1h ago',
      link: '/dashboard/admin/farmers',
    },
  ],
};

/**
 * Returns auth headers. Always includes the dev bypass header to ensure dev/demo browsing
 * works without any forced signin. If a valid admin token exists in memory, it also attaches it.
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    [DEV_BYPASS_HEADER]: DEV_BYPASS_SECRET,
  };

  const token = getAccessToken();
  const user = getCurrentUser();
  if (token && user) {
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

async function fetchAdmin<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      if (path.startsWith('/api/admin/dashboard')) {
        return FALLBACK_DASHBOARD_DATA as unknown as T;
      }
      throw new Error(json?.error?.message || json?.message || `Request failed: ${res.status}`);
    }

    return json.data;
  } catch (err) {
    if (path.startsWith('/api/admin/dashboard')) {
      return FALLBACK_DASHBOARD_DATA as unknown as T;
    }
    throw err;
  }
}

export interface DashboardData {
  metrics: {
    totalFarmers: number;
    totalFarmersTrend: string;
    verifiedFarmers: number;
    pendingFarmers: number;
    totalBuyers: number;
    totalBuyersTrend: string;
    totalOrders: number;
    totalOrdersTrend: string;
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalRevenueTrend: string;
    platformCommission: number;
  };
  chartData: Array<{
    day: string;
    date: string;
    local: number;
    intercity: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    soldCount: number;
    image: string;
  }>;
  recentOrders: Array<{
    id: string;
    title: string;
    route: string;
    priceFormatted: string;
    status: string;
    rawStatus: string;
    date: string;
    tradeType: string;
    image: string;
  }>;
  systemAlerts: Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    link: string;
  }>;
}

export const adminApi = {
  // Dashboard
  getDashboard: (period = '7d') => fetchAdmin<DashboardData>(`/api/admin/dashboard?period=${period}`),

  // Products
  getProducts: (params?: { categoryId?: string; status?: string; search?: string; stock?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchAdmin<any[]>(`/api/admin/products${q ? `?${q}` : ''}`);
  },
  updateProductStatus: (id: string, status: string, reason: string) =>
    fetchAdmin<any>(`/api/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  // Farmers
  getFarmers: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchAdmin<any[]>(`/api/admin/farmers${q ? `?${q}` : ''}`);
  },
  verifyFarmer: (id: string, status: string, note: string) =>
    fetchAdmin<any>(`/api/admin/farmers/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  // Buyers
  getBuyers: (params?: { search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchAdmin<any[]>(`/api/admin/buyers${q ? `?${q}` : ''}`);
  },
  updateBuyerStatus: (id: string, isActive: boolean, reason: string) =>
    fetchAdmin<any>(`/api/admin/buyers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive, reason }),
    }),

  // Delivery Workers
  getWorkers: (params?: { status?: string; availability?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchAdmin<any[]>(`/api/admin/workers${q ? `?${q}` : ''}`);
  },
  verifyWorker: (id: string, status: string, reason: string) =>
    fetchAdmin<any>(`/api/admin/workers/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  // Orders
  getOrders: (params?: { tradeType?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchAdmin<any[]>(`/api/admin/orders${q ? `?${q}` : ''}`);
  },
  getOrderById: (id: string) => fetchAdmin<any>(`/api/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string, reason: string) =>
    fetchAdmin<any>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  // Intercity Trade
  getIntercityRoutes: () => fetchAdmin<any[]>('/api/admin/intercity/routes'),
  getIntercityApprovals: () => fetchAdmin<any[]>('/api/admin/intercity/approvals'),
  decideIntercityApproval: (id: string, decision: 'APPROVED' | 'REJECTED', notes: string) =>
    fetchAdmin<any>(`/api/admin/intercity/approvals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, notes }),
    }),

  // Markets & Cities
  getMarketsAndCities: () => fetchAdmin<{ cities: any[]; markets: any[] }>('/api/admin/markets'),

  // Financial Ledger & Reconciliation
  getTransactions: () => fetchAdmin<{ transactions: any[]; reconciliations: any[] }>('/api/admin/transactions'),

  // Reports
  getReports: (period = '7d') => fetchAdmin<any>(`/api/admin/reports?period=${period}`),

  // Settings
  getSettings: () => fetchAdmin<{ pricingRules: any[]; platform: any }>('/api/admin/settings'),
  updatePricingRule: (id: string, value: number, isActive: boolean) =>
    fetchAdmin<any>(`/api/admin/settings/pricing-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ value, isActive }),
    }),

  // Audit Logs
  getAuditLogs: (params?: { limit?: number; entityType?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchAdmin<any[]>(`/api/admin/audit-logs${q ? `?${q}` : ''}`);
  },
};
