import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import { BusinessRuleError, NotFoundError, ForbiddenError } from '../../utils/errors.js';
import type { ShipmentStatus } from './types.js';

/** Valid state transitions enforced by the shipment finite state machine */
const VALID_SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  REQUESTED: ['QUOTATION_PENDING', 'AWAITING_APPROVAL', 'SCHEDULED', 'CANCELLED'],
  QUOTATION_PENDING: ['AWAITING_APPROVAL', 'SCHEDULED', 'CANCELLED'],
  AWAITING_APPROVAL: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['PICKUP_IN_PROGRESS', 'CANCELLED'],
  PICKUP_IN_PROGRESS: ['LOADING', 'FAILED', 'CANCELLED'],
  LOADING: ['READY_FOR_DISPATCH', 'PICKUP_IN_PROGRESS', 'FAILED'],
  READY_FOR_DISPATCH: ['IN_TRANSIT', 'FAILED'],
  IN_TRANSIT: ['ARRIVED', 'FAILED'],
  ARRIVED: ['UNLOADING', 'FAILED'],
  UNLOADING: ['DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED'],
  DELIVERED: [],
  PARTIALLY_DELIVERED: [],
  FAILED: ['SCHEDULED', 'CANCELLED'],
  CANCELLED: [],
};

export const shipmentService = {
  /**
   * Create a new shipment record linked to a confirmed inter-city order.
   */
  async createShipmentFromOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { listing: { include: { farmer: true } } } },
        quotationSnapshot: true,
      },
    });

    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found.`, 'ORDER_NOT_FOUND', 'orderId');
    }

    const trackingNumber = `SHP-${order.id.slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Calculate total cargo weight and volume from order items
    let totalWeightKg = 0;
    let totalVolumeM3 = 0;
    const pickupsMap = new Map<string, { farmerId: string; lat: number; lng: number; address: string; weight: number }>();

    for (const item of order.items) {
      const qty = Number(item.quantity);
      totalWeightKg += qty;
      const volPerUnit = item.listing?.cargoVolumePerUnitM3 || 0.003; // ~3 liters per kg default
      totalVolumeM3 += qty * volPerUnit;

      const farmerId = item.listing.farmerId;
      const existing = pickupsMap.get(farmerId);
      if (existing) {
        existing.weight += qty;
      } else {
        pickupsMap.set(farmerId, {
          farmerId,
          lat: item.listing.pickupLatitude,
          lng: item.listing.pickupLongitude,
          address: `${item.listing.farmer?.fullName || 'Farmer'} Farm Gate`,
          weight: qty,
        });
      }
    }

    const category = order.quotationSnapshot?.vehicleCategory || 'LIGHT_PICKUP_1T';
    const totalTransportCost = order.transportFee || order.quotationSnapshot?.totalTransportCost || 0;

    // Generate secure 6-digit delivery OTP for the buyer
    const deliveryOtp = crypto.randomInt(100000, 999999).toString();
    const deliveryOtpExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity

    return prisma.$transaction(async (tx) => {
      // Update order with OTP and status
      await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryOtp,
          deliveryOtpExpiresAt,
          tradeType: 'INTERCITY',
          fulfillmentType: 'INTERCITY_BULK',
        },
      });

      // Create shipment
      const shipment = await tx.shipment.create({
        data: {
          trackingNumber,
          requiredCategory: category,
          totalCargoWeightKg: totalWeightKg,
          totalCargoVolumeM3: totalVolumeM3,
          totalTransportCost,
          status: 'SCHEDULED',
          scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day pickup
          shipmentOrders: {
            create: {
              orderId,
              allocatedTransportCost: totalTransportCost,
              cargoWeightKg: totalWeightKg,
              cargoVolumeM3: totalVolumeM3,
              deliverySequence: 1,
              status: 'SCHEDULED',
            },
          },
          pickups: {
            create: Array.from(pickupsMap.values()).map((p) => ({
              farmerId: p.farmerId,
              pickupLatitude: p.lat,
              pickupLongitude: p.lng,
              pickupAddress: p.address,
              collectedQuantityKg: p.weight,
              status: 'PENDING',
            })),
          },
          events: {
            create: {
              status: 'SCHEDULED',
              title: 'Shipment Scheduled',
              description: `Freight shipment #${trackingNumber} created with ${pickupsMap.size} farm pickup stop(s).`,
            },
          },
        },
        include: {
          shipmentOrders: true,
          pickups: true,
        },
      });

      return shipment;
    });
  },

  /**
   * Assign a verified commercial vehicle and driver to a shipment.
   * Strictly validates payload weight and usable cargo volume capacity.
   */
  async assignShipmentToVehicle(
    shipmentId: string,
    providerId: string,
    vehicleId: string,
    driverId?: string
  ) {
    const [shipment, vehicle, driver] = await Promise.all([
      prisma.shipment.findUnique({ where: { id: shipmentId }, include: { vehicle: true } }),
      prisma.transportVehicle.findFirst({ where: { id: vehicleId, providerId } }),
      driverId ? prisma.transportDriver.findFirst({ where: { id: driverId, providerId } }) : null,
    ]);

    if (!shipment) {
      throw new NotFoundError(`Shipment ${shipmentId} not found.`, 'SHIPMENT_NOT_FOUND', 'shipmentId');
    }
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found or does not belong to provider.', 'VEHICLE_NOT_FOUND', 'vehicleId');
    }

    if (vehicle.verificationStatus !== 'VERIFIED') {
      throw new BusinessRuleError('This vehicle cannot be assigned because its verification is pending administrator approval.', 'VEHICLE_UNVERIFIED', 'vehicleId', 400);
    }

    // Vehicle Capacity Constraints: Strict physical payload & volume verification
    if (vehicle.payloadCapacityKg < shipment.totalCargoWeightKg) {
      throw new BusinessRuleError(
        `Cargo payload (${shipment.totalCargoWeightKg} kg) exceeds maximum permitted payload for vehicle ${vehicle.plateNumber} (${vehicle.payloadCapacityKg} kg).`,
        'CAPACITY_EXCEEDED_WEIGHT',
        'vehicleId',
        400
      );
    }

    if (vehicle.usableCargoVolumeM3 < shipment.totalCargoVolumeM3) {
      throw new BusinessRuleError(
        `Cargo volume (${shipment.totalCargoVolumeM3} m³) exceeds usable volume capacity for vehicle ${vehicle.plateNumber} (${vehicle.usableCargoVolumeM3} m³).`,
        'CAPACITY_EXCEEDED_VOLUME',
        'vehicleId',
        400
      );
    }

    return prisma.$transaction(async (tx) => {
      // Update vehicle status
      await tx.transportVehicle.update({
        where: { id: vehicleId },
        data: { status: 'ASSIGNED' },
      });

      // Update shipment
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          assignedProviderId: providerId,
          assignedVehicleId: vehicleId,
          assignedDriverId: driver?.id || null,
          status: 'SCHEDULED',
        },
        include: {
          vehicle: true,
          driver: true,
          provider: true,
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipmentId,
          status: 'SCHEDULED',
          title: 'Truck & Driver Assigned',
          description: `Assigned to vehicle ${vehicle.plateNumber} (${vehicle.category}) operated by driver ${driver?.fullName || 'Assigned Transporter'}.`,
        },
      });

      return updated;
    });
  },

  /**
   * Farmer or Driver confirms gate collection handover at the farm gate.
   */
  async confirmPickupHandover(
    pickupId: string,
    data: {
      collectedQuantityKg: number;
      packageCount?: number;
      cargoCondition?: string;
      photoEvidenceUrl?: string;
      notes?: string;
      farmerConfirmed?: boolean;
    }
  ) {
    const pickup = await prisma.shipmentPickup.findUnique({
      where: { id: pickupId },
      include: { shipment: { include: { pickups: true } } },
    });

    if (!pickup) {
      throw new NotFoundError('Pickup record not found.', 'PICKUP_NOT_FOUND', 'pickupId');
    }

    const updatedPickup = await prisma.$transaction(async (tx) => {
      const res = await tx.shipmentPickup.update({
        where: { id: pickupId },
        data: {
          collectedQuantityKg: data.collectedQuantityKg,
          packageCount: data.packageCount || null,
          cargoCondition: data.cargoCondition || 'GOOD',
          photoEvidenceUrl: data.photoEvidenceUrl || null,
          notes: data.notes || null,
          farmerConfirmed: data.farmerConfirmed ?? true,
          farmerConfirmedAt: new Date(),
          actualArrivalTime: new Date(),
          collectedAt: new Date(),
          status: 'LOADED',
        },
      });

      // Check if all pickups on this shipment are completed
      const allPickups = await tx.shipmentPickup.findMany({
        where: { shipmentId: pickup.shipmentId },
      });
      const allLoaded = allPickups.every((p) => p.id === pickupId || p.status === 'LOADED');

      if (allLoaded) {
        await tx.shipment.update({
          where: { id: pickup.shipmentId },
          data: { status: 'READY_FOR_DISPATCH' },
        });

        await tx.shipmentEvent.create({
          data: {
            shipmentId: pickup.shipmentId,
            status: 'READY_FOR_DISPATCH',
            title: 'All Farm Pickups Loaded',
            description: 'All produce collected and inspected. Truck is secured and ready for highway departure.',
          },
        });
      } else {
        await tx.shipment.update({
          where: { id: pickup.shipmentId },
          data: { status: 'LOADING' },
        });
      }

      return res;
    });

    return updatedPickup;
  },

  /**
   * Update shipment transportation milestone (e.g. IN_TRANSIT, ARRIVED, UNLOADING).
   */
  async updateMilestone(
    shipmentId: string,
    newStatus: ShipmentStatus,
    data: {
      title?: string;
      notes?: string;
      latitude?: number;
      longitude?: number;
      actorId?: string;
    }
  ) {
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundError(`Shipment ${shipmentId} not found.`, 'SHIPMENT_NOT_FOUND', 'shipmentId');
    }

    // Validate state machine transition
    const allowed = VALID_SHIPMENT_TRANSITIONS[shipment.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BusinessRuleError(
        `Invalid status transition from ${shipment.status} to ${newStatus}. Allowed transitions: ${allowed ? allowed.join(', ') : 'none'}.`,
        'INVALID_TRANSITION',
        'status',
        400
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: newStatus,
          ...(newStatus === 'IN_TRANSIT' ? { actualPickupDate: new Date() } : {}),
          ...(newStatus === 'ARRIVED' ? { actualDeliveryDate: new Date() } : {}),
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipmentId,
          status: newStatus,
          title: data.title || `Milestone: ${newStatus}`,
          description: data.notes || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          actorId: data.actorId || null,
        },
      });

      return updated;
    });
  },

  /**
   * Buyer Delivery Verification using 6-Digit OTP.
   * Accurately distinguishes full deliveries from partial delivery shortages.
   */
  async verifyBuyerDelivery(
    shipmentOrderId: string,
    buyerId: string,
    data: {
      otpCode: string;
      receivedQuantityKg: number;
      cargoCondition?: string;
      buyerNotes?: string;
      photoEvidenceUrl?: string;
    }
  ) {
    const shipmentOrder = await prisma.shipmentOrder.findUnique({
      where: { id: shipmentOrderId },
      include: {
        order: true,
        shipment: { include: { shipmentOrders: true } },
      },
    });

    if (!shipmentOrder) {
      throw new NotFoundError('Shipment order record not found.', 'SHIPMENT_ORDER_NOT_FOUND', 'shipmentOrderId');
    }

    // Strict Buyer ownership check
    if (shipmentOrder.order.buyerId !== buyerId) {
      throw new ForbiddenError('Only the purchasing buyer can submit delivery verification.');
    }

    // Validate OTP Code
    if (!shipmentOrder.order.deliveryOtp || shipmentOrder.order.deliveryOtp !== data.otpCode.trim()) {
      throw new BusinessRuleError('Invalid 6-digit delivery confirmation PIN. Please check your SMS/email.', 'INVALID_OTP', 'otpCode', 400);
    }

    const dispatchedWeight = shipmentOrder.cargoWeightKg;
    const receivedWeight = data.receivedQuantityKg;
    const shortageKg = Math.max(0, dispatchedWeight - receivedWeight);
    const hasDispute = shortageKg > 0;

    return prisma.$transaction(async (tx) => {
      // Create Delivery Confirmation record
      const confirmation = await tx.deliveryConfirmation.create({
        data: {
          shipmentOrderId,
          dispatchedQuantityKg: dispatchedWeight,
          receivedQuantityKg: receivedWeight,
          shortageQuantityKg: shortageKg,
          cargoCondition: data.cargoCondition || 'SATISFACTORY',
          verifiedWithOtp: true,
          buyerNotes: data.buyerNotes || null,
          hasDispute,
          photoEvidenceUrl: data.photoEvidenceUrl || null,
        },
      });

      // Update shipment order status
      await tx.shipmentOrder.update({
        where: { id: shipmentOrderId },
        data: {
          status: hasDispute ? 'PARTIALLY_DELIVERED' : 'DELIVERED',
        },
      });

      // Update customer order status
      await tx.order.update({
        where: { id: shipmentOrder.orderId },
        data: {
          status: hasDispute ? 'DELIVERED' : 'DELIVERED',
        },
      });

      // If shortage exists, automatically raise a platform dispute for admin review
      if (hasDispute) {
        await tx.dispute.create({
          data: {
            orderId: shipmentOrder.orderId,
            raisedById: buyerId,
            reason: `Weight Shortage on Inter-City Bulk Freight: Dispatched ${dispatchedWeight} kg, Received ${receivedWeight} kg (${shortageKg} kg missing).`,
            description: data.buyerNotes || 'Shortage identified during destination offloading verification.',
            status: 'OPEN',
          },
        });
      }

      // Check if all shipment orders in this physical freight run are fulfilled
      const allOrders = await tx.shipmentOrder.findMany({
        where: { shipmentId: shipmentOrder.shipmentId },
      });
      const anyDisputed = allOrders.some((o) => (o.id === shipmentOrderId ? hasDispute : o.status === 'PARTIALLY_DELIVERED'));
      const allComplete = allOrders.every((o) => o.id === shipmentOrderId || o.status === 'DELIVERED' || o.status === 'PARTIALLY_DELIVERED');

      if (allComplete) {
        const finalStatus = anyDisputed ? 'PARTIALLY_DELIVERED' : 'DELIVERED';
        await tx.shipment.update({
          where: { id: shipmentOrder.shipmentId },
          data: {
            status: finalStatus,
            actualDeliveryDate: new Date(),
          },
        });

        await tx.shipmentEvent.create({
          data: {
            shipmentId: shipmentOrder.shipmentId,
            status: finalStatus,
            title: anyDisputed ? 'Shipment Partially Delivered with Shortage' : 'Shipment Fully Delivered & Verified',
            description: anyDisputed
              ? `Delivery completed with weight shortage of ${shortageKg} kg. Dispute opened.`
              : 'All buyer orders offloaded and verified with 6-digit OTP.',
          },
        });
      }

      return confirmation;
    });
  },

  /**
   * Retrieve shipment details with events and pickups.
   */
  async getShipmentDetails(shipmentId: string) {
    return prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        provider: true,
        vehicle: true,
        driver: true,
        pickups: true,
        events: { orderBy: { occurredAt: 'desc' } },
        shipmentOrders: {
          include: {
            order: {
              include: {
                buyer: { select: { fullName: true, phone: true } },
                items: { include: { listing: true } },
              },
            },
            deliveryConfirmation: true,
          },
        },
      },
    });
  },
};
