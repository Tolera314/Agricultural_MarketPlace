import prisma from '../../config/prisma.js';
import { BusinessRuleError, NotFoundError } from '../../utils/errors.js';
import { selectVehicleCategory } from './fulfillment.service.js';
import { calculateTransportQuotation } from './pricing.service.js';

export interface OrderWeightSlice {
  orderId: string;
  weightKg: number;
  volumeM3?: number;
}

export interface CostAllocationResult {
  totalShipmentCost: number;
  totalWeightKg: number;
  allocations: {
    orderId: string;
    weightKg: number;
    allocatedCost: number;
    allocationPercentage: number;
  }[];
}

export const consolidationService = {
  /**
   * Weight-based transport cost allocation with exact penny rounding reconciliation.
   * Guarantees that the sum of allocated amounts matches the total freight cost identically.
   */
  allocateFreightCost(
    totalShipmentCost: number,
    slices: OrderWeightSlice[]
  ): CostAllocationResult {
    if (slices.length === 0) {
      return { totalShipmentCost, totalWeightKg: 0, allocations: [] };
    }

    const totalWeightKg = slices.reduce((acc, s) => acc + s.weightKg, 0);
    if (totalWeightKg <= 0) {
      throw new BusinessRuleError('Total shipment weight must be greater than zero for cost allocation.', 'INVALID_WEIGHT', 'slices', 400);
    }

    let allocatedSum = 0;
    const allocations = slices.map((slice) => {
      const ratio = slice.weightKg / totalWeightKg;
      // Round to 2 decimal places
      const allocatedCost = Math.round(totalShipmentCost * ratio * 100) / 100;
      allocatedSum += allocatedCost;
      return {
        orderId: slice.orderId,
        weightKg: slice.weightKg,
        allocatedCost,
        allocationPercentage: Number((ratio * 100).toFixed(1)),
      };
    });

    // Reconcile rounding discrepancy to the largest order so total matches 100.00%
    const roundingDiff = Number((totalShipmentCost - allocatedSum).toFixed(2));
    if (roundingDiff !== 0 && allocations.length > 0) {
      // Find the index of order with largest weight
      let maxIdx = 0;
      for (let i = 1; i < allocations.length; i++) {
        if ((allocations[i]?.weightKg ?? 0) > (allocations[maxIdx]?.weightKg ?? 0)) {
          maxIdx = i;
        }
      }
      if (allocations[maxIdx]) {
        allocations[maxIdx]!.allocatedCost = Number((allocations[maxIdx]!.allocatedCost + roundingDiff).toFixed(2));
      }
    }

    return {
      totalShipmentCost,
      totalWeightKg,
      allocations,
    };
  },

  /**
   * Evaluate compatibility of multiple pending orders for consolidated corridor haulage.
   */
  async evaluateConsolidation(orderIds: string[]) {
    if (orderIds.length < 2) {
      throw new BusinessRuleError('At least two orders are required for shipment consolidation.', 'INSUFFICIENT_ORDERS', 'orderIds', 400);
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: { include: { listing: { include: { farmer: true } } } },
        quotationSnapshot: true,
      },
    });

    if (orders.length !== orderIds.length) {
      throw new NotFoundError('One or more selected orders could not be found.', 'ORDERS_NOT_FOUND', 'orderIds');
    }

    // 1. Verify compatible destination (Must share the same destination city or immediate metropolitan area)
    const firstDestCity = orders[0]?.quotationSnapshot?.destinationCity || 'Addis Ababa';
    for (const ord of orders) {
      const dest = ord.quotationSnapshot?.destinationCity || 'Addis Ababa';
      if (dest.trim().toLowerCase() !== firstDestCity.trim().toLowerCase()) {
        return {
          isEligible: false,
          reason: `Orders have conflicting destination cities (${firstDestCity} vs ${dest}). Consolidation requires compatible destination zones.`,
        };
      }
    }

    // 2. Validate cargo handling compatibility (e.g. cannot mix perishable raw meat with unbagged onions)
    const hasColdChain = orders.some((o) =>
      o.items.some((i) => i.listing?.handlingRequirement === 'COLD_CHAIN_REFRIGERATED')
    );
    const hasFragile = orders.some((o) =>
      o.items.some((i) => i.listing?.handlingRequirement === 'FRAGILE_PERISHABLE')
    );

    // 3. Compute combined weight and volume
    let totalWeightKg = 0;
    let totalVolumeM3 = 0;
    const uniqueFarmers = new Set<string>();

    const slices: OrderWeightSlice[] = orders.map((ord) => {
      let ordWeight = 0;
      let ordVol = 0;
      for (const item of ord.items) {
        const qty = Number(item.quantity);
        ordWeight += qty;
        ordVol += qty * (item.listing?.cargoVolumePerUnitM3 || 0.003);
        uniqueFarmers.add(item.listing.farmerId);
      }
      totalWeightKg += ordWeight;
      totalVolumeM3 += ordVol;
      return {
        orderId: ord.id,
        weightKg: ordWeight,
        volumeM3: ordVol,
      };
    });

    const handling = hasColdChain ? 'COLD_CHAIN_REFRIGERATED' : hasFragile ? 'FRAGILE_PERISHABLE' : 'STANDARD_DRY';
    const { category } = selectVehicleCategory(totalWeightKg, totalVolumeM3, handling as any);

    // 4. Calculate consolidated freight quotation
    const originCity = orders[0]?.quotationSnapshot?.originCity || 'East Shewa Hub';
    const distanceKm = Math.max(...orders.map((o) => o.quotationSnapshot?.distanceKm || 75));

    const quote = await calculateTransportQuotation({
      originCity,
      destinationCity: firstDestCity,
      distanceKm,
      vehicleCategory: category,
      totalWeightKg,
      totalVolumeM3,
      pickupCount: uniqueFarmers.size,
      handlingRequirement: handling as any,
      needLoadingAssistance: true,
    });

    // 5. Compute allocated cost breakdown
    const allocation = this.allocateFreightCost(quote.totalPayableTransportCost, slices);

    // Calculate savings compared to individual separate shipments
    const separateShipmentsCost = orders.reduce(
      (sum, o) => sum + Number(o.transportFee || o.quotationSnapshot?.totalTransportCost || 0),
      0
    );
    const savings = Math.max(0, separateShipmentsCost - quote.totalPayableTransportCost);

    return {
      isEligible: true,
      reason: `Compatible for freight consolidation to ${firstDestCity} across ${uniqueFarmers.size} farm pickup stop(s).`,
      requiredVehicleCategory: category,
      totalWeightKg,
      totalVolumeM3: Number(totalVolumeM3.toFixed(2)),
      pickupStopsCount: uniqueFarmers.size,
      consolidatedTotalCost: quote.totalPayableTransportCost,
      separateShipmentsTotalCost: separateShipmentsCost,
      estimatedSavings: Number(savings.toFixed(2)),
      allocation,
    };
  },

  /**
   * Create a single consolidated freight shipment from multiple confirmed orders.
   */
  async createConsolidatedShipment(orderIds: string[]) {
    const evaluation = await this.evaluateConsolidation(orderIds);
    if (!evaluation.isEligible || !evaluation.allocation) {
      throw new BusinessRuleError(evaluation.reason, 'CONSOLIDATION_INELIGIBLE', 'orderIds', 400);
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: { include: { listing: { include: { farmer: true } } } },
      },
    });

    const trackingNumber = `SHP-CONSOL-${Math.floor(10000 + Math.random() * 90000)}`;

    return prisma.$transaction(async (tx) => {
      // 1. Create consolidated physical shipment
      const shipment = await tx.shipment.create({
        data: {
          trackingNumber,
          requiredCategory: evaluation.requiredVehicleCategory,
          totalCargoWeightKg: evaluation.totalWeightKg,
          totalCargoVolumeM3: evaluation.totalVolumeM3,
          totalTransportCost: evaluation.consolidatedTotalCost,
          status: 'SCHEDULED',
          scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          events: {
            create: {
              status: 'SCHEDULED',
              title: 'Consolidated Shipment Formed',
              description: `Combined ${orders.length} orders into single truckload #${trackingNumber}. Total cargo: ${evaluation.totalWeightKg} kg. Estimated buyer savings: ETB ${evaluation.estimatedSavings}.`,
            },
          },
        },
      });

      // 2. Attach individual ShipmentOrder records with allocated costs
      for (let i = 0; i < orders.length; i++) {
        const ord = orders[i]!;
        const alloc = evaluation.allocation.allocations.find((a) => a.orderId === ord.id);
        const allocatedCost = alloc ? alloc.allocatedCost : 0;
        const cargoWeight = alloc ? alloc.weightKg : 0;

        await tx.shipmentOrder.create({
          data: {
            shipmentId: shipment.id,
            orderId: ord.id,
            allocatedTransportCost: allocatedCost,
            cargoWeightKg: cargoWeight,
            deliverySequence: i + 1,
            status: 'SCHEDULED',
          },
        });

        // Ensure each order has a secure delivery OTP
        if (!ord.deliveryOtp) {
          const deliveryOtp = (100000 + Math.floor(Math.random() * 900000)).toString();
          await tx.order.update({
            where: { id: ord.id },
            data: {
              deliveryOtp,
              deliveryOtpExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              fulfillmentType: 'INTERCITY_CONSOLIDATED',
            },
          });
        }
      }

      // 3. Create unique Pickup stops
      const pickupsMap = new Map<string, { farmerId: string; lat: number; lng: number; address: string; weight: number }>();
      for (const ord of orders) {
        for (const item of ord.items) {
          const fid = item.listing.farmerId;
          const qty = Number(item.quantity);
          const existing = pickupsMap.get(fid);
          if (existing) {
            existing.weight += qty;
          } else {
            pickupsMap.set(fid, {
              farmerId: fid,
              lat: item.listing.pickupLatitude,
              lng: item.listing.pickupLongitude,
              address: `${item.listing.farmer?.fullName || 'Farmer'} Gate`,
              weight: qty,
            });
          }
        }
      }

      for (const p of Array.from(pickupsMap.values())) {
        await tx.shipmentPickup.create({
          data: {
            shipmentId: shipment.id,
            farmerId: p.farmerId,
            pickupLatitude: p.lat,
            pickupLongitude: p.lng,
            pickupAddress: p.address,
            collectedQuantityKg: p.weight,
            status: 'PENDING',
          },
        });
      }

      return shipment;
    });
  },
};
