import prisma from '../../config/prisma.js';
import type {
  FulfillmentEvaluationParams,
  FulfillmentDecision,
  VehicleCategory,
  CargoHandlingRequirement,
} from './types.js';

/** Haversine formula for straight-line geodetic distance in kilometers */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

/** Known verified highway arterial road distances in Ethiopia */
const VERIFIED_HIGHWAY_DISTANCES: Record<string, number> = {
  'addis ababa:mojo': 72,
  'mojo:addis ababa': 72,
  'addis ababa:bishoftu': 48,
  'bishoftu:addis ababa': 48,
  'addis ababa:adama': 98,
  'adama:addis ababa': 98,
  'addis ababa:hawassa': 275,
  'hawassa:addis ababa': 275,
  'addis ababa:shashamane': 245,
  'shashamane:addis ababa': 245,
  'addis ababa:ambor': 120,
  'ambor:addis ababa': 120,
  'addis ababa:debre birhan': 130,
  'debre birhan:addis ababa': 130,
  'adama:mojo': 26,
  'mojo:adama': 26,
  'adama:hawassa': 180,
  'hawassa:adama': 180,
};

/** Get highway road distance estimate with arterial winding factor fallback */
export function getEstimatedRoadDistance(
  originCity: string,
  destCity: string,
  straightLineKm: number
): number {
  const normKey = `${originCity.trim().toLowerCase()}:${destCity.trim().toLowerCase()}`;
  if (VERIFIED_HIGHWAY_DISTANCES[normKey]) {
    return VERIFIED_HIGHWAY_DISTANCES[normKey]!;
  }
  // Standard highway winding factor for Ethiopian topography is ~1.22 - 1.30x of Haversine
  return Number((straightLineKm * 1.25).toFixed(1));
}

/** Determine the required vehicle category based on cargo mass, volume, and cold chain */
export function selectVehicleCategory(
  weightKg: number,
  volumeM3 = 0,
  handling?: CargoHandlingRequirement
): { category: VehicleCategory; requiresColdChain: boolean } {
  const requiresColdChain = handling === 'COLD_CHAIN_REFRIGERATED';

  if (requiresColdChain) {
    if (weightKg <= 1200 && volumeM3 <= 5.0) {
      return { category: 'REEFER_VAN_COLD_CHAIN', requiresColdChain: true };
    }
    return { category: 'REEFER_TRUCK_COLD_CHAIN', requiresColdChain: true };
  }

  if (weightKg <= 1200 && volumeM3 <= 4.0) {
    return { category: 'LIGHT_PICKUP_1T', requiresColdChain: false };
  }
  if (weightKg <= 5000 && volumeM3 <= 16.0) {
    return { category: 'MEDIUM_TRUCK_ISUZU_5T', requiresColdChain: false };
  }
  if (weightKg <= 15000 && volumeM3 <= 40.0) {
    return { category: 'HEAVY_TRUCK_15T', requiresColdChain: false };
  }
  return { category: 'HEAVY_TRUCK_30T', requiresColdChain: false };
}

/**
 * Centralized Fulfillment Classification & Eligibility Engine.
 * Single source of truth for routing orders between Local Courier vs Inter-City Freight.
 */
export async function evaluateFulfillmentEligibility(
  params: FulfillmentEvaluationParams
): Promise<FulfillmentDecision> {
  const {
    originCity,
    destinationCity,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    totalWeightKg,
    totalVolumeM3 = 0,
    handlingRequirement = 'STANDARD_DRY',
    intercityEligible = false,
    minBulkOrderQty,
  } = params;

  const straightLineKm = haversineKm(originLat, originLng, destinationLat, destinationLng);
  const roadDistanceKm = getEstimatedRoadDistance(originCity, destinationCity, straightLineKm);

  const isSameCity = originCity.trim().toLowerCase() === destinationCity.trim().toLowerCase();
  const { category, requiresColdChain } = selectVehicleCategory(totalWeightKg, totalVolumeM3, handlingRequirement);

  // Business policy threshold: 50 km or cross-city boundary triggers inter-city logistics
  const INTERCITY_DISTANCE_THRESHOLD_KM = 50.0;
  const LOCAL_MAX_WEIGHT_KG = 300.0; // Two-wheelers & bajajs maximum capacity

  // Scenario 1: Same city, short distance, light parcel
  if (isSameCity && roadDistanceKm < INTERCITY_DISTANCE_THRESHOLD_KM && totalWeightKg <= LOCAL_MAX_WEIGHT_KG) {
    return {
      fulfillmentType: 'LOCAL_DELIVERY',
      isEligible: true,
      reason: `Eligible for local intracity courier dispatch within ${originCity} (${roadDistanceKm} km).`,
      estimatedDistanceKm: straightLineKm,
      roadDistanceKm,
      requiredVehicleCategory: category,
      requiresColdChain,
      requiresAdminApproval: false,
    };
  }

  // Scenario 2: Cross-city or bulk freight requires Inter-City logistics
  // Validate farmer inter-city enablement
  if (!intercityEligible) {
    return {
      fulfillmentType: 'UNFULFILLABLE',
      isEligible: false,
      reason: `This farmer has not enabled inter-city transport for this product. Inter-city transport requires delivery from ${originCity} to ${destinationCity} (${roadDistanceKm} km).`,
      estimatedDistanceKm: straightLineKm,
      roadDistanceKm,
      requiredVehicleCategory: category,
      requiresColdChain,
      requiresAdminApproval: false,
      suggestedAction: 'Please select a local supplier within your city or ask the farmer to enable inter-city delivery.',
    };
  }

  // Validate minimum bulk quantity requirement if farmer configured one
  if (minBulkOrderQty && totalWeightKg < minBulkOrderQty) {
    return {
      fulfillmentType: 'UNFULFILLABLE',
      isEligible: false,
      reason: `Minimum inter-city order quantity for this item is ${minBulkOrderQty} kg. Current order is ${totalWeightKg} kg.`,
      estimatedDistanceKm: straightLineKm,
      roadDistanceKm,
      requiredVehicleCategory: category,
      requiresColdChain,
      requiresAdminApproval: false,
      suggestedAction: `Increase order quantity to at least ${minBulkOrderQty} kg to qualify for bulk freight haulage.`,
    };
  }

  // Check highway arterial route feasibility in DB if available
  let requiresAdminApproval = false;
  try {
    const route = await prisma.intercityRoute.findFirst({
      where: {
        originCity: { name: { equals: originCity, mode: 'insensitive' } },
        destinationCity: { name: { equals: destinationCity, mode: 'insensitive' } },
        status: 'ACTIVE',
      },
    });

    if (route && route.requiresApproval) {
      requiresAdminApproval = true;
    }
  } catch {
    // If DB check not possible, continue with policy heuristics
  }

  // Large commercial orders (> 10,000 kg) trigger administrative capacity review
  if (totalWeightKg >= 10000) {
    requiresAdminApproval = true;
  }

  return {
    fulfillmentType: 'INTERCITY_BULK',
    isEligible: true,
    reason: `Eligible for inter-city bulk freight from ${originCity} to ${destinationCity} (${roadDistanceKm} km highway corridor).`,
    estimatedDistanceKm: straightLineKm,
    roadDistanceKm,
    requiredVehicleCategory: category,
    requiresColdChain,
    requiresAdminApproval,
  };
}
