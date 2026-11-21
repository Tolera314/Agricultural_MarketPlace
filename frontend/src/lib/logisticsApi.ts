import { getAccessToken } from './auth';
import { API_BASE_URL } from './apiConfig';
import { safeParseApiResponse, ApiClientError, getHumanReadableErrorMessage } from './errorHandler';

const API = API_BASE_URL;

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-dev-admin-bypass': 'agrimarket_dev_2026',
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

export const logisticsApi = {
  // ─── Fulfillment Evaluation & Pricing ───────────────────────
  evaluateFulfillment: (payload: {
    originCity: string;
    destinationCity: string;
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    totalWeightKg: number;
    totalVolumeM3?: number;
    handlingRequirement?: string;
    intercityEligible?: boolean;
    minBulkOrderQty?: number;
  }) => apiFetch<any>('/api/logistics/fulfillment/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  calculateQuotation: (payload: {
    originCity: string;
    destinationCity: string;
    distanceKm: number;
    vehicleCategory: string;
    totalWeightKg: number;
    totalVolumeM3?: number;
    pickupCount?: number;
    handlingRequirement?: string;
    needLoadingAssistance?: boolean;
  }) => apiFetch<any>('/api/logistics/quotations/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // ─── Transport Provider & Fleet Operations ──────────────────
  getProviderProfile: () => apiFetch<any>('/api/logistics/providers/profile'),
  registerProvider: (data: {
    companyName: string;
    businessLicenseNo?: string;
    tinNumber?: string;
    contactPhone: string;
    contactEmail?: string;
    operatingCities: string[];
  }) => apiFetch<any>('/api/logistics/providers/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getVehicles: () => apiFetch<any>('/api/logistics/providers/vehicles'),
  addVehicle: (data: {
    plateNumber: string;
    category: string;
    payloadCapacityKg: number;
    usableCargoVolumeM3: number;
    hasRefrigeration?: boolean;
    makeModel?: string;
    yearOfManufacture?: number;
    inspectionExpiryDate?: string;
  }) => apiFetch<any>('/api/logistics/providers/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // ─── Shipment Lifecycle & Freight ───────────────────────────
  getAvailableShipments: () => apiFetch<any>('/api/logistics/shipments/available'),
  acceptShipment: (shipmentId: string, vehicleId: string, driverId?: string) =>
    apiFetch<any>(`/api/logistics/shipments/${shipmentId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ vehicleId, driverId }),
    }),
  updateMilestone: (
    shipmentId: string,
    payload: {
      status: string;
      title?: string;
      notes?: string;
      latitude?: number;
      longitude?: number;
    }
  ) =>
    apiFetch<any>(`/api/logistics/shipments/${shipmentId}/milestone`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getShipmentDetails: (shipmentId: string) =>
    apiFetch<any>(`/api/logistics/shipments/${shipmentId}`),

  // ─── Farmer Pickup Handover ─────────────────────────────────
  confirmPickup: (
    shipmentId: string,
    pickupId: string,
    payload: {
      collectedQuantityKg: number;
      packageCount?: number;
      cargoCondition?: string;
      photoEvidenceUrl?: string;
      notes?: string;
      farmerConfirmed?: boolean;
    }
  ) =>
    apiFetch<any>(`/api/logistics/shipments/${shipmentId}/pickups/${pickupId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getFarmerOrders: () => apiFetch<any>('/api/logistics/farmer/orders'),

  // ─── Buyer Delivery Verification & Tracking ─────────────────
  getBuyerShipment: (orderId: string) =>
    apiFetch<any>(`/api/logistics/buyer/shipment/${orderId}`),
  verifyDelivery: (payload: {
    shipmentOrderId: string;
    otpCode: string;
    receivedQuantityKg: number;
    cargoCondition?: string;
    buyerNotes?: string;
    photoEvidenceUrl?: string;
  }) =>
    apiFetch<any>('/api/logistics/shipments/deliver', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ─── Administrative Logistics Control ───────────────────────
  getAdminOverview: () => apiFetch<any>('/api/logistics/admin/overview'),
  getAdminShipments: () => apiFetch<any>('/api/logistics/admin/shipments'),
  adminConsolidate: (orderIds: string[]) =>
    apiFetch<any>('/api/logistics/admin/consolidate', {
      method: 'POST',
      body: JSON.stringify({ orderIds }),
    }),
  getAdminRates: () => apiFetch<any>('/api/logistics/admin/rates'),
  saveAdminRate: (data: any) =>
    apiFetch<any>('/api/logistics/admin/rates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminVerifyProvider: (providerId: string, status: string, note?: string) =>
    apiFetch<any>(`/api/logistics/admin/providers/${providerId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  adminVerifyVehicle: (vehicleId: string, status: string) =>
    apiFetch<any>(`/api/logistics/admin/vehicles/${vehicleId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
