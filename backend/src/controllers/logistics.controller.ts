import type { Request, Response, NextFunction } from 'express';
import { evaluateFulfillmentEligibility } from '../services/logistics/fulfillment.service.js';
import { calculateTransportQuotation } from '../services/logistics/pricing.service.js';
import { providerService } from '../services/logistics/provider.service.js';
import { shipmentService } from '../services/logistics/shipment.service.js';
import { consolidationService } from '../services/logistics/consolidation.service.js';
import prisma from '../config/prisma.js';

export const logisticsController = {
  /**
   * POST /api/logistics/fulfillment/evaluate
   * Centralized evaluation of order routing: Local Courier vs Inter-City Bulk Freight.
   */
  async evaluateFulfillment(req: Request, res: Response, next: NextFunction) {
    try {
      const decision = await evaluateFulfillmentEligibility(req.body);
      res.json({ success: true, data: decision });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/quotations/calculate
   * Calculate transparent fixed-price transportation quotation with signed token.
   */
  async calculateQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const breakdown = await calculateTransportQuotation(req.body);
      res.json({ success: true, data: breakdown });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/providers/profile
   * Retrieve the transport provider profile for the authenticated carrier.
   */
  async getProviderProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.sub;
      const profile = await providerService.getProfileByUserId(userId);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/providers/register
   * Onboard as a commercial transport provider.
   */
  async registerProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.sub;
      const profile = await providerService.registerProvider(userId, req.body);
      res.status(201).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/providers/vehicles
   */
  async getVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.sub;
      const profile = await providerService.getProfileByUserId(userId);
      if (!profile) {
        return res.json({ success: true, data: [] });
      }
      const vehicles = await providerService.getVehicles(profile.id);
      res.json({ success: true, data: vehicles });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/providers/vehicles
   */
  async addVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.sub;
      let providerId: string;
      const existing = await providerService.getProfileByUserId(userId);
      if (existing) {
        providerId = existing.id;
      } else {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const created = await providerService.registerProvider(userId, {
          companyName: `${user?.fullName || 'Transporter'} Fleet`,
          contactPhone: user?.phone || '+251911000000',
          operatingCities: ['Addis Ababa'],
        });
        providerId = created.id;
      }
      const vehicle = await providerService.addVehicle(providerId, req.body);
      res.status(201).json({ success: true, data: vehicle });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/shipments/available
   * View pending fixed-price freight shipments eligible for assignment.
   */
  async getAvailableShipments(req: Request, res: Response, next: NextFunction) {
    try {
      const shipments = await prisma.shipment.findMany({
        where: {
          status: { in: ['REQUESTED', 'SCHEDULED'] },
          assignedVehicleId: null,
        },
        include: {
          shipmentOrders: { include: { order: { select: { deliveryAddress: true } } } },
          pickups: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: shipments });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/shipments/:id/accept
   * Transporter accepts a fixed-price shipment assignment with a verified vehicle.
   */
  async acceptShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.sub;
      const profile = await providerService.getProfileByUserId(userId);
      if (!profile) {
        return res.status(403).json({ success: false, error: { message: 'Transport provider profile required.' } });
      }
      const shipmentId = req.params.id as string;
      const { vehicleId, driverId } = req.body;

      const updated = await shipmentService.assignShipmentToVehicle(shipmentId, profile.id, vehicleId, driverId);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/shipments/:id/pickups/:pickupId/confirm
   * Farmer or transporter verifies produce collection at the farm gate.
   */
  async confirmPickup(req: Request, res: Response, next: NextFunction) {
    try {
      const pickupId = req.params.pickupId as string;
      const updated = await shipmentService.confirmPickupHandover(pickupId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/shipments/:id/milestone
   * Update highway transit status.
   */
  async updateMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentId = req.params.id as string;
      const { status, title, notes, latitude, longitude } = req.body;
      const updated = await shipmentService.updateMilestone(shipmentId, status, {
        title,
        notes,
        latitude,
        longitude,
        actorId: req.auth!.sub,
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/shipments/:id/deliver
   * Buyer verifies physical offloading with 6-digit OTP.
   */
  async verifyDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.auth!.sub;
      const { shipmentOrderId, otpCode, receivedQuantityKg, cargoCondition, buyerNotes, photoEvidenceUrl } = req.body;

      const confirmation = await shipmentService.verifyBuyerDelivery(shipmentOrderId, buyerId, {
        otpCode,
        receivedQuantityKg,
        cargoCondition,
        buyerNotes,
        photoEvidenceUrl,
      });
      res.json({ success: true, data: confirmation });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/shipments/:id
   */
  async getShipmentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentId = req.params.id as string;
      const shipment = await shipmentService.getShipmentDetails(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, error: { message: 'Shipment not found.' } });
      }
      res.json({ success: true, data: shipment });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/buyer/shipment/:orderId
   * Tracking endpoint for buyers.
   */
  async getBuyerShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId as string;
      const shipmentOrder = await prisma.shipmentOrder.findFirst({
        where: { orderId },
        include: {
          shipment: {
            include: {
              vehicle: { select: { plateNumber: true, category: true, hasRefrigeration: true } },
              driver: { select: { fullName: true, phone: true } },
              events: { orderBy: { occurredAt: 'desc' } },
            },
          },
          order: { select: { deliveryOtp: true, status: true } },
          deliveryConfirmation: true,
        },
      });

      if (!shipmentOrder) {
        return res.json({ success: true, data: null });
      }

      res.json({
        success: true,
        data: {
          shipmentOrderId: shipmentOrder.id,
          trackingNumber: shipmentOrder.shipment.trackingNumber,
          status: shipmentOrder.shipment.status,
          orderStatus: shipmentOrder.status,
          vehicle: shipmentOrder.shipment.vehicle,
          driver: shipmentOrder.shipment.driver,
          events: shipmentOrder.shipment.events,
          deliveryOtp: shipmentOrder.order.deliveryOtp,
          confirmation: shipmentOrder.deliveryConfirmation,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/farmer/orders
   * Inter-city bulk orders and scheduled pickups for farmers.
   */
  async getFarmerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = req.auth!.sub;
      const pickups = await prisma.shipmentPickup.findMany({
        where: { farmerId },
        include: {
          shipment: {
            include: {
              vehicle: true,
              driver: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: pickups });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/admin/overview
   * Administrative logistics KPIs and metrics.
   */
  async getAdminOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalShipments,
        activeShipments,
        deliveredShipments,
        pendingProviders,
        totalVehicles,
      ] = await Promise.all([
        prisma.shipment.count(),
        prisma.shipment.count({ where: { status: { in: ['SCHEDULED', 'PICKUP_IN_PROGRESS', 'LOADING', 'IN_TRANSIT'] } } }),
        prisma.shipment.count({ where: { status: 'DELIVERED' } }),
        prisma.transportProviderProfile.count({ where: { verificationStatus: 'PENDING' } }),
        prisma.transportVehicle.count(),
      ]);

      res.json({
        success: true,
        data: {
          totalShipments,
          activeShipments,
          deliveredShipments,
          pendingProviders,
          totalVehicles,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/admin/shipments
   */
  async getAdminShipments(req: Request, res: Response, next: NextFunction) {
    try {
      const shipments = await prisma.shipment.findMany({
        include: {
          provider: true,
          vehicle: true,
          driver: true,
          shipmentOrders: { include: { order: { select: { id: true, totalAmount: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: shipments });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/admin/consolidate
   */
  async adminConsolidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderIds } = req.body;
      const consolidated = await consolidationService.createConsolidatedShipment(orderIds);
      res.status(201).json({ success: true, data: consolidated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logistics/admin/rates
   */
  async getAdminRates(req: Request, res: Response, next: NextFunction) {
    try {
      const rates = await prisma.transportRate.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: rates });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/logistics/admin/rates
   */
  async saveAdminRate(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await prisma.transportRate.create({
        data: req.body,
      });
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/logistics/admin/providers/:id/verify
   */
  async adminVerifyProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = req.params.id as string;
      const { status, note } = req.body;
      const updated = await providerService.adminVerifyProvider(providerId, status, note);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/logistics/admin/vehicles/:id/verify
   */
  async adminVerifyVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = req.params.id as string;
      const { status } = req.body;
      const updated = await providerService.adminVerifyVehicle(vehicleId, status);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};
