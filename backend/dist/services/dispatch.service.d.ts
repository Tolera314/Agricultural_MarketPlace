import type { VehicleType, TradeType } from '@prisma/client';
/** Haversine distance in km between two lat/lon pairs */
export declare function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
export interface DispatchCandidate {
    workerId: string;
    fullName: string;
    phone: string;
    distanceKm: number;
    vehicleType: VehicleType;
    vehicleCapacityKg: number;
}
export interface DispatchResult {
    jobId: string;
    orderId: string;
    tradeType: TradeType;
    eligibleWorkerCount: number;
    offersCreatedCount: number;
    candidates: DispatchCandidate[];
}
/**
 * Dispatch Engine: Identifies eligible delivery workers and broadcasts time-limited offers.
 *
 * Enforces business rules:
 * 1. Order status must be ready for delivery (CONFIRMED or PREPARING).
 * 2. Cross-city (INTERCITY): validates approved route and administrative approval.
 * 3. Worker eligibility:
 *    - verificationStatus === 'VERIFIED'
 *    - availability === 'ONLINE'
 *    - activeJobCount < maxActiveJobs (default 3)
 *    - vehicleCapacityKg >= order total weight
 *    - Location within broadcast radius (default 25km) and fresh.
 */
export declare function dispatchOrder(orderId: string, options?: {
    broadcastRadiusKm?: number;
    expirySeconds?: number;
}): Promise<DispatchResult>;
/**
 * Demo Seed Helper: Creates a complete valid confirmed order with farmer listing,
 * buyer, items, and delivery fee, then dispatches it so delivery workers immediately
 * have real live orders to test and evaluate in the dashboard.
 */
export declare function seedDemoOrderAndDispatch(buyerId?: string): Promise<{
    orderId: string;
    dispatchResult: DispatchResult;
}>;
//# sourceMappingURL=dispatch.service.d.ts.map