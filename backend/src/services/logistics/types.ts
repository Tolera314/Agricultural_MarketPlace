export type FulfillmentType =
  | 'LOCAL_DELIVERY'
  | 'INTERCITY_BULK'
  | 'INTERCITY_CONSOLIDATED'
  | 'UNFULFILLABLE';

export type VehicleCategory =
  | 'LIGHT_PICKUP_1T'
  | 'MEDIUM_TRUCK_ISUZU_5T'
  | 'HEAVY_TRUCK_15T'
  | 'HEAVY_TRUCK_30T'
  | 'REEFER_VAN_COLD_CHAIN'
  | 'REEFER_TRUCK_COLD_CHAIN';

export type CargoHandlingRequirement =
  | 'STANDARD_DRY'
  | 'VENTILATED_CRATE'
  | 'COLD_CHAIN_REFRIGERATED'
  | 'FRAGILE_PERISHABLE'
  | 'BULK_GRAIN_SACK';

export type CarrierVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type ShipmentStatus =
  | 'REQUESTED'
  | 'QUOTATION_PENDING'
  | 'AWAITING_APPROVAL'
  | 'SCHEDULED'
  | 'PICKUP_IN_PROGRESS'
  | 'LOADING'
  | 'READY_FOR_DISPATCH'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'UNLOADING'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface FulfillmentEvaluationParams {
  originCity: string;
  destinationCity: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  totalWeightKg: number;
  totalVolumeM3?: number;
  handlingRequirement?: CargoHandlingRequirement;
  intercityEligible?: boolean;
  minBulkOrderQty?: number;
}

export interface FulfillmentDecision {
  fulfillmentType: FulfillmentType;
  isEligible: boolean;
  reason: string;
  estimatedDistanceKm: number;
  roadDistanceKm: number;
  requiredVehicleCategory: VehicleCategory;
  requiresColdChain: boolean;
  requiresAdminApproval: boolean;
  suggestedAction?: string;
}

export interface TransportQuotationBreakdown {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  vehicleCategory: VehicleCategory;
  basePickupFee: number;
  distanceCharge: number;
  weightCharge: number;
  volumeCharge: number;
  multiStopSurcharge: number;
  handlingSurcharge: number;
  subtotalTransport: number;
  platformLogisticsCommission: number;
  totalPayableTransportCost: number;
  pricingPolicyVersion: string;
  expiresAt: string;
  quotationToken: string;
}

export interface QuotationContext {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  vehicleCategory: VehicleCategory;
  totalWeightKg: number;
  totalVolumeM3?: number;
  pickupCount?: number;
  handlingRequirement?: CargoHandlingRequirement;
  needLoadingAssistance?: boolean;
}

export interface ITransportPricingStrategy {
  calculateQuotation(ctx: QuotationContext): Promise<TransportQuotationBreakdown>;
}
