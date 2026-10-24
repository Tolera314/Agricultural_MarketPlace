// ─── Delivery Worker API types ────────────────────────────────────────────────

export type WorkerAvailability = 'ONLINE' | 'BUSY' | 'OFFLINE';
export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'THREE_WHEELER' | 'PICKUP_TRUCK' | 'TRUCK' | 'OTHER';
export type DeliveryStatus =
  | 'UNASSIGNED' | 'BROADCASTING' | 'ASSIGNED'
  | 'HEADING_TO_PICKUP' | 'PICKED_UP' | 'EN_ROUTE'
  | 'DELIVERED' | 'FAILED' | 'CANCELLED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';

export interface WorkerProfile {
  vehicleType: VehicleType;
  vehiclePlate: string | null;
  vehicleCapacityKg: number | null;
  availability: WorkerAvailability;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocationAt: string | null;
  activeJobCount: number;
  verificationStatus: string;
}

export interface DashboardMetrics {
  availableOrders: number;
  todayDeliveries: number;
  completedToday: number;
  todayEarnings: number;
  rating: number | null;
  ratingCount: number;
}

export interface JobSummary {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  product: string;
  quantityKg: number | null;
  deliveryFee: string | null;
}

export interface ActivityItem {
  id: string;
  status: DeliveryStatus;
  occurredAt: string;
  notes: string | null;
  jobId: string;
  product: string;
  dropoffAddress: string | null;
  deliveryFee: string | null;
}

export interface DashboardData {
  worker: { id: string; fullName: string; phone: string; email: string | null };
  profile: WorkerProfile;
  metrics: DashboardMetrics;
  todayJobs: JobSummary[];
  activeJob: JobSummary | null;
  recentActivity: ActivityItem[];
}

export interface DeliveryOffer {
  offerId: string;
  jobId: string;
  orderId: string;
  status: OfferStatus;
  offeredAt: string;
  expiresAt: string;
  secondsLeft: number;
  product: string;
  productImage: string | null;
  quantityKg: number | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  distanceKm: number | null;
  routeDistKm: number | null;
  deliveryFee: string | null;
  requiredVehicleType: VehicleType | null;
  requiredCapacityKg: number | null;
  paymentMethod: string;
}

export interface DeliveryJob {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  product: string;
  productImage: string | null;
  quantityKg: number | null;
  deliveryFee: string | null;
  paymentMethod: string;
  cashCollected: string | null;
  createdAt: string;
  events: { id: string; status: DeliveryStatus; occurredAt: string; notes: string | null }[];
}

export interface EarningsData {
  period: string;
  from: string;
  totalEarnings: number;
  deliveryCount: number;
  deliveries: {
    jobId: string;
    orderId: string;
    deliveryFee: string | null;
    paymentMethod: string;
    deliveredAt: string | null;
    dropoffAddress: string | null;
  }[];
}
