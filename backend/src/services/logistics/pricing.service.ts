import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import type {
  ITransportPricingStrategy,
  QuotationContext,
  TransportQuotationBreakdown,
  VehicleCategory,
} from './types.js';

/** Secret used for tamper-evident quotation verification */
const QUOTATION_SIGNING_SECRET = process.env.QUOTATION_SIGNING_SECRET || 'agrimarket_logistics_quotation_v1_secret';

/** Standard baseline rates for Ethiopian commercial agricultural corridors */
const DEFAULT_RATE_MATRIX: Record<
  VehicleCategory,
  {
    baseFee: number;
    perKm: number;
    perKg: number;
    perM3: number;
    extraStop: number;
    loadingFee: number;
  }
> = {
  LIGHT_PICKUP_1T: {
    baseFee: 250,
    perKm: 18,
    perKg: 0.15,
    perM3: 20,
    extraStop: 100,
    loadingFee: 150,
  },
  MEDIUM_TRUCK_ISUZU_5T: {
    baseFee: 650,
    perKm: 32,
    perKg: 0.12,
    perM3: 25,
    extraStop: 200,
    loadingFee: 300,
  },
  HEAVY_TRUCK_15T: {
    baseFee: 1500,
    perKm: 55,
    perKg: 0.08,
    perM3: 30,
    extraStop: 350,
    loadingFee: 600,
  },
  HEAVY_TRUCK_30T: {
    baseFee: 2800,
    perKm: 85,
    perKg: 0.06,
    perM3: 35,
    extraStop: 500,
    loadingFee: 1000,
  },
  REEFER_VAN_COLD_CHAIN: {
    baseFee: 500,
    perKm: 28,
    perKg: 0.22,
    perM3: 40,
    extraStop: 150,
    loadingFee: 200,
  },
  REEFER_TRUCK_COLD_CHAIN: {
    baseFee: 1200,
    perKm: 48,
    perKg: 0.18,
    perM3: 45,
    extraStop: 300,
    loadingFee: 450,
  },
};

/**
 * Generate a cryptographically signed quotation token to prevent tampering.
 */
export function signQuotationToken(payload: {
  originCity: string;
  destCity: string;
  totalCost: number;
  expiresAt: string;
}): string {
  const data = `${payload.originCity}|${payload.destCity}|${payload.totalCost.toFixed(2)}|${payload.expiresAt}`;
  const hmac = crypto.createHmac('sha256', QUOTATION_SIGNING_SECRET);
  hmac.update(data);
  return `${Buffer.from(data).toString('base64url')}.${hmac.digest('hex').substring(0, 16)}`;
}

/**
 * Verify quotation token integrity and expiration.
 */
export function verifyQuotationToken(token: string): {
  isValid: boolean;
  isExpired: boolean;
  originCity?: string;
  destCity?: string;
  totalCost?: number;
} {
  try {
    const [encodedData, signature] = token.split('.');
    if (!encodedData || !signature) return { isValid: false, isExpired: true };

    const data = Buffer.from(encodedData, 'base64url').toString('utf8');
    const [originCity, destCity, costStr, expiresAtStr] = data.split('|');
    if (!originCity || !destCity || !costStr || !expiresAtStr) return { isValid: false, isExpired: true };

    const hmac = crypto.createHmac('sha256', QUOTATION_SIGNING_SECRET);
    hmac.update(data);
    const expectedSig = hmac.digest('hex').substring(0, 16);

    if (signature !== expectedSig) {
      return { isValid: false, isExpired: true };
    }

    const expiresAt = new Date(expiresAtStr);
    const isExpired = Date.now() > expiresAt.getTime();

    return {
      isValid: true,
      isExpired,
      originCity,
      destCity,
      totalCost: parseFloat(costStr),
    };
  } catch {
    return { isValid: false, isExpired: true };
  }
}

/**
 * Active V1: Fixed-Price Transportation Pricing Strategy.
 * Computes deterministic quotations using admin-configured rate matrices.
 */
export class FixedPriceTransportStrategy implements ITransportPricingStrategy {
  async calculateQuotation(ctx: QuotationContext): Promise<TransportQuotationBreakdown> {
    const {
      originCity,
      destinationCity,
      distanceKm,
      vehicleCategory,
      totalWeightKg,
      totalVolumeM3 = 0,
      pickupCount = 1,
      handlingRequirement = 'STANDARD_DRY',
      needLoadingAssistance = true,
    } = ctx;

    // 1. Fetch active admin-configured rate rule from database
    let basePickupFee: number;
    let ratePerKm: number;
    let ratePerKg: number;
    let ratePerM3: number;
    let extraStopFee: number;
    let loadingUnloadingFee: number;
    let coldMultiplier = 1.0;
    let policyVersion = 'V1-FIXED-DEFAULT';

    try {
      const dbRate = await prisma.transportRate.findFirst({
        where: {
          vehicleCategory: vehicleCategory as any,
          isActive: true,
          OR: [
            {
              maxDistanceKm: null,
              minDistanceKm: { lte: distanceKm },
            },
            {
              minDistanceKm: { lte: distanceKm },
              maxDistanceKm: { gte: distanceKm },
            },
          ],
        },
        orderBy: { version: 'desc' },
      });

      if (dbRate) {
        basePickupFee = Number(dbRate.basePickupFee);
        ratePerKm = Number(dbRate.ratePerKm);
        ratePerKg = Number(dbRate.ratePerKg);
        ratePerM3 = Number(dbRate.ratePerM3);
        extraStopFee = Number(dbRate.additionalPickupFee);
        loadingUnloadingFee = Number(dbRate.loadingUnloadingFee);
        coldMultiplier = dbRate.coldChainMultiplier || 1.0;
        policyVersion = `V1-POLICY-R${dbRate.version}`;
      } else {
        const fallback = DEFAULT_RATE_MATRIX[vehicleCategory];
        basePickupFee = fallback.baseFee;
        ratePerKm = fallback.perKm;
        ratePerKg = fallback.perKg;
        ratePerM3 = fallback.perM3;
        extraStopFee = fallback.extraStop;
        loadingUnloadingFee = fallback.loadingFee;
      }
    } catch {
      const fallback = DEFAULT_RATE_MATRIX[vehicleCategory];
      basePickupFee = fallback.baseFee;
      ratePerKm = fallback.perKm;
      ratePerKg = fallback.perKg;
      ratePerM3 = fallback.perM3;
      extraStopFee = fallback.extraStop;
      loadingUnloadingFee = fallback.loadingFee;
    }

    // 2. Compute individual pricing components
    const distanceCharge = Number((distanceKm * ratePerKm).toFixed(2));
    const weightCharge = Number((totalWeightKg * ratePerKg).toFixed(2));
    const volumeCharge = Number((totalVolumeM3 * ratePerM3).toFixed(2));
    const multiStopSurcharge = pickupCount > 1 ? (pickupCount - 1) * extraStopFee : 0;
    const handlingSurcharge = needLoadingAssistance ? loadingUnloadingFee : 0;

    let subtotal =
      basePickupFee +
      distanceCharge +
      weightCharge +
      volumeCharge +
      multiStopSurcharge +
      handlingSurcharge;

    // Apply cold chain temperature maintenance surcharge
    if (handlingRequirement === 'COLD_CHAIN_REFRIGERATED') {
      subtotal = Number((subtotal * coldMultiplier).toFixed(2));
    }

    // Platform logistics coordination fee: 5% of transportation subtotal
    const platformLogisticsCommission = Number((subtotal * 0.05).toFixed(2));
    const totalPayableTransportCost = Number((subtotal + platformLogisticsCommission).toFixed(2));

    // Quotation validity window: 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const quotationToken = signQuotationToken({
      originCity,
      destCity: destinationCity,
      totalCost: totalPayableTransportCost,
      expiresAt,
    });

    return {
      originCity,
      destinationCity,
      distanceKm,
      vehicleCategory,
      basePickupFee,
      distanceCharge,
      weightCharge,
      volumeCharge,
      multiStopSurcharge,
      handlingSurcharge,
      subtotalTransport: subtotal,
      platformLogisticsCommission,
      totalPayableTransportCost,
      pricingPolicyVersion: policyVersion,
      expiresAt,
      quotationToken,
    };
  }
}

/**
 * V2 Competitive Bidding Transport Strategy (Stub for future release).
 * Kept isolated so introducing competitive quotes in V2 requires zero refactoring of core models.
 */
export class CompetitiveBiddingTransportStrategy implements ITransportPricingStrategy {
  async calculateQuotation(_ctx: QuotationContext): Promise<TransportQuotationBreakdown> {
    throw new Error('Competitive transport quotations are scheduled for Release V2. V1 operates under Fixed-Price policy.');
  }
}

// Active pricing strategy instance (swappable in V2 via configuration)
const activeStrategy: ITransportPricingStrategy = new FixedPriceTransportStrategy();

/**
 * Public facade to calculate a transparent fixed-price transportation quotation.
 */
export async function calculateTransportQuotation(
  ctx: QuotationContext
): Promise<TransportQuotationBreakdown> {
  return activeStrategy.calculateQuotation(ctx);
}
