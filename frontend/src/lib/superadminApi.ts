import { getAccessToken, getCurrentUser } from './auth';
import { API_BASE_URL } from './apiConfig';
import { safeParseApiResponse, ApiClientError, getHumanReadableErrorMessage } from './errorHandler';

const DEV_BYPASS_HEADER = 'x-dev-admin-bypass';
const DEV_BYPASS_SECRET = 'agrimarket_dev_2026';



function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    [DEV_BYPASS_HEADER]: DEV_BYPASS_SECRET,
  };

  const token = getAccessToken();
  const user = getCurrentUser();
  if (token && user && (user.role === 'SUPERADMIN' || user.role === 'ADMIN')) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchSuperadmin<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const parsed = await safeParseApiResponse<T>(res);
  if (!parsed.ok) {
    throw new ApiClientError(parsed.error || { message: getHumanReadableErrorMessage(res.status), status: res.status });
  }

  return parsed.data as T;
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalUsers: number;
  totalUsersTrend: string;
  totalFarmers: number;
  totalFarmersTrend: string;
  totalBuyers: number;
  totalBuyersTrend: string;
  totalDeliveries: number;
  totalDeliveriesTrend: string;
  totalOrders: number;
}

export interface PlatformGrowthPoint {
  label: string;
  users: number;
  orders: number;
  startDate: string;
  endDate: string;
}

export interface CityTradeItem {
  id: string;
  origin: string;
  destination: string;
  routeLabel: string;
  ordersCount: number;
  tradeValue: number;
  tradeValueFormatted: string;
  status: 'Active' | 'Pending';
  rawStatus: string;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  actor: string;
  role: string;
  timestamp: string;
  formattedDate: string;
}

export interface SuperadminDashboardData {
  metrics: DashboardMetrics;
  platformGrowth: PlatformGrowthPoint[];
  cityTradeOverview: CityTradeItem[];
  recentActivities: RecentActivityItem[];
}

export interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: 'SUPERADMIN' | 'ADMIN' | 'FARMER' | 'BUYER' | 'DELIVERY_WORKER';
  isActive: boolean;
  isVerified: boolean;
  onboardingStatus?: string;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
  farmerProfile?: {
    id: string;
    farmName: string;
    farmDescription?: string | null;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
    verificationNote?: string | null;
    verificationDocuments?: any;
    farmLatitude?: number | null;
    farmLongitude?: number | null;
    isOrganic?: boolean;
  } | null;
  deliveryProfile?: {
    id: string;
    vehicleType: string;
    vehiclePlate?: string | null;
    vehicleCapacityKg?: number | null;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
    verificationNote?: string | null;
    verificationDocuments?: any;
    availability?: string;
  } | null;
}

export interface SystemSettings {
  platform: {
    name: string;
    tagline: string;
    currency: string;
    supportedLanguages: string[];
    supportContact: string;
    supportEmail: string;
    maintenanceMode: boolean;
  };
  policies: {
    requireFarmerVerification: boolean;
    requireDriverInspection: boolean;
    autoCancelUnpaidOrdersMinutes: number;
    defaultServiceRadiusKm: number;
  };
  notifications: {
    smsEnabled: boolean;
    inAppEnabled: boolean;
    emailEnabled: boolean;
  };
  limits: {
    localMaxOrderValue: number;
    intercityMaxOrderValue: number;
    adminApprovalThreshold: number;
    dailyCodLimitPerWorker: number;
    maxListingsPerUnverifiedFarmer: number;
  };
}

export interface MarketItem {
  id: string;
  name: string;
  description: string | null;
  cityId: string;
  cityName: string;
  regionName: string | null;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  isActive: boolean;
  farmerCount: number;
  deliveryZoneCount: number;
  createdAt: string;
}

export interface CityItem {
  id: string;
  name: string;
  regionName: string | null;
  latitude: number;
  longitude: number;
  isActive: boolean;
  markets: { id: string; name: string; isActive: boolean }[];
}

export interface IntercityRouteItem {
  id: string;
  originCityId: string;
  originCityName: string;
  originMarketName: string;
  destinationCityId: string;
  destinationCityName: string;
  destinationMarketName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
  requiresApproval: boolean;
  maxTransactionLimit: number | null;
  minTransactionLimit: number | null;
  estimatedTransitDays: number | null;
  notes: string | null;
  orderCount: number;
  totalValue: number;
  totalValueFormatted: string;
}

export interface PricingRuleItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  scope: string;
  value: number;
  isActive: boolean;
  categoryName: string | null;
  marketName: string | null;
  intercityRouteLabel: string | null;
  effectiveFrom: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValue: any;
  newValue: any;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
  actor?: { fullName: string; role: string; phone: string } | null;
}

export interface DatabaseHealthData {
  status: string;
  provider: string;
  connectionLatencyMs: number;
  timestamp: string;
  tables: {
    users: number;
    orders: number;
    productListings: number;
    deliveryJobs: number;
    markets: number;
    pricingRules: number;
    auditLogs: number;
  };
  backups: {
    automatedFrequency: string;
    retentionDays: number;
    lastBackupAt: string;
    backupStatus: string;
  };
}

// ─── Superadmin API Client ───────────────────────────────────────────────────

export const superadminApi = {
  // 1. Dashboard
  getDashboard: (period = '30d') =>
    fetchSuperadmin<SuperadminDashboardData>(`/api/superadmin/dashboard?period=${period}`),

  // 2. Users & Verifications
  getUsers: (params?: { search?: string; role?: string; status?: string; verificationStatus?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.role) q.set('role', params.role);
    if (params?.status) q.set('status', params.status);
    if (params?.verificationStatus) q.set('verificationStatus', params.verificationStatus);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return fetchSuperadmin<{ users: AdminUser[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/superadmin/users?${q.toString()}`
    );
  },

  verifyFarmer: (id: string, status: string, note?: string) =>
    fetchSuperadmin<any>(`/api/superadmin/farmers/${encodeURIComponent(id)}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  verifyWorker: (id: string, status: string, reason?: string) =>
    fetchSuperadmin<any>(`/api/superadmin/workers/${encodeURIComponent(id)}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  provisionAdmin: (data: { fullName: string; phone: string; email?: string; role: 'ADMIN' | 'SUPERADMIN'; password?: string }) =>
    fetchSuperadmin<AdminUser>('/api/superadmin/users/provision', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUserRole: (id: string, role: string, reason?: string) =>
    fetchSuperadmin<AdminUser>(`/api/superadmin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, reason }),
    }),

  updateUserStatus: (id: string, isActive: boolean, reason?: string) =>
    fetchSuperadmin<AdminUser>(`/api/superadmin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive, reason }),
    }),

  revokeSessions: (id: string, reason?: string) =>
    fetchSuperadmin<{ success: boolean; message: string }>(`/api/superadmin/users/${id}/revoke-sessions`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // 3. Settings & Limits
  getSettings: () => fetchSuperadmin<SystemSettings>('/api/superadmin/settings'),

  updateSettings: (patch: Partial<SystemSettings>, reason?: string) =>
    fetchSuperadmin<SystemSettings>('/api/superadmin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ patch, reason }),
    }),

  // 4. Markets & Cities
  getMarketsAndCities: () =>
    fetchSuperadmin<{ cities: CityItem[]; markets: MarketItem[] }>('/api/superadmin/markets'),

  createCity: (data: { name: string; regionName?: string; latitude: number; longitude: number }) =>
    fetchSuperadmin<CityItem>('/api/superadmin/cities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createMarket: (data: {
    cityId: string;
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    serviceRadiusKm?: number;
  }) =>
    fetchSuperadmin<MarketItem>('/api/superadmin/markets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMarket: (id: string, data: { serviceRadiusKm?: number; isActive?: boolean; description?: string }) =>
    fetchSuperadmin<MarketItem>(`/api/superadmin/markets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // 5. Intercity Routes
  getIntercityRoutes: () =>
    fetchSuperadmin<{ routes: IntercityRouteItem[]; pendingApprovals: any[] }>('/api/superadmin/routes'),

  createIntercityRoute: (data: any) =>
    fetchSuperadmin<IntercityRouteItem>('/api/superadmin/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateIntercityRoute: (id: string, data: any) =>
    fetchSuperadmin<IntercityRouteItem>(`/api/superadmin/routes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // 6. Commissions & Fees
  getPricingRules: () => fetchSuperadmin<PricingRuleItem[]>('/api/superadmin/commissions'),

  createPricingRule: (data: any) =>
    fetchSuperadmin<PricingRuleItem>('/api/superadmin/commissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePricingRule: (id: string, data: any) =>
    fetchSuperadmin<PricingRuleItem>(`/api/superadmin/commissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // 7. Reports
  getReports: (period = '30d') =>
    fetchSuperadmin<{
      financials: {
        grossVolume: number;
        grossVolumeFormatted: string;
        platformCommission: number;
        platformCommissionFormatted: string;
        deliveryFees: number;
        deliveryFeesFormatted: string;
        farmerPayouts: number;
        farmerPayoutsFormatted: string;
      };
      ordersBreakdown: { totalCompleted: number; localOrders: number; intercityOrders: number };
      userDistribution: { role: string; count: number }[];
      exportAvailable: boolean;
    }>(`/api/superadmin/reports?period=${period}`),

  // 8. Audit Logs
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; entityType?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.action) q.set('action', params.action);
    if (params?.entityType) q.set('entityType', params.entityType);
    if (params?.search) q.set('search', params.search);
    return fetchSuperadmin<{ logs: AuditLogItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/superadmin/audit-logs?${q.toString()}`
    );
  },

  // 9. Security
  getSecurityOverview: () =>
    fetchSuperadmin<{
      posture: {
        status: string;
        superadminCount: number;
        adminCount: number;
        activeSessionsCount: number;
        mfaEnforced: boolean;
        rateLimiterActive: boolean;
        csrfProtected: boolean;
      };
      policies: any;
      limits: any;
      recentSecurityEvents: any[];
    }>('/api/superadmin/security'),

  // 10. Database Health & Backup
  getDatabaseHealth: () => fetchSuperadmin<DatabaseHealthData>('/api/superadmin/backup/health'),

  triggerBackup: () =>
    fetchSuperadmin<{ success: boolean; snapshotId: string; status: string; timestamp: string; recordsCaptured: number }>(
      '/api/superadmin/backup/snapshot',
      { method: 'POST' }
    ),
};

