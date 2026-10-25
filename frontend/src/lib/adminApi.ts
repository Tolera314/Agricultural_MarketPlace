// ─── Dev bypass: admin dashboard works without any login ─────────────────────
// The backend requireAuth middleware accepts this header and injects SUPERADMIN role.
const DEV_BYPASS_HEADER = 'x-dev-admin-bypass';
const DEV_BYPASS_SECRET = 'agrimarket_dev_2026';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Returns auth headers. Uses stored JWT token if present (logged-in user),
 * otherwise falls back to the dev bypass header so admin pages work without login.
 */
function getAuthHeaders(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('agrimarket_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  // Dev bypass — works in both browser and SSR (SSR returns no data anyway)
  return { [DEV_BYPASS_HEADER]: DEV_BYPASS_SECRET };
}

async function fetchAdmin<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || json.message || `Request failed: ${res.status}`);
  }

  return json.data;
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
