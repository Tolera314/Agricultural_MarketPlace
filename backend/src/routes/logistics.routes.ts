import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { logisticsController } from '../controllers/logistics.controller.js';

const router = Router();

// ─── Public / Evaluative Logistics Capabilities ─────────────────────────────
// Buyers & checkout flows need to evaluate fulfillment eligibility & transport quotations
router.post('/fulfillment/evaluate', logisticsController.evaluateFulfillment);
router.post('/quotations/calculate', logisticsController.calculateQuotation);

// ─── Transport Provider & Fleet Management ──────────────────────────────────
router.get(
  '/providers/profile',
  requireAuth,
  logisticsController.getProviderProfile
);
router.post(
  '/providers/register',
  requireAuth,
  logisticsController.registerProvider
);
router.get(
  '/providers/vehicles',
  requireAuth,
  requireRole('TRANSPORT_PROVIDER', 'DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.getVehicles
);
router.post(
  '/providers/vehicles',
  requireAuth,
  requireRole('TRANSPORT_PROVIDER', 'DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.addVehicle
);

// ─── Shipment Lifecycle & Freight Assignments ────────────────────────────────
router.get(
  '/shipments/available',
  requireAuth,
  requireRole('TRANSPORT_PROVIDER', 'DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.getAvailableShipments
);
router.post(
  '/shipments/:id/accept',
  requireAuth,
  requireRole('TRANSPORT_PROVIDER', 'DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.acceptShipment
);
router.post(
  '/shipments/:id/milestone',
  requireAuth,
  requireRole('TRANSPORT_PROVIDER', 'DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.updateMilestone
);
router.get(
  '/shipments/:id',
  requireAuth,
  logisticsController.getShipmentDetails
);

// ─── Farmer Pickup Handover & Intercity Visibility ──────────────────────────
router.post(
  '/shipments/:id/pickups/:pickupId/confirm',
  requireAuth,
  requireRole('FARMER', 'TRANSPORT_PROVIDER', 'DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.confirmPickup
);
router.get(
  '/farmer/orders',
  requireAuth,
  requireRole('FARMER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.getFarmerOrders
);

// ─── Buyer Delivery Verification & Tracking ─────────────────────────────────
router.post(
  '/shipments/deliver',
  requireAuth,
  requireRole('BUYER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.verifyDelivery
);
router.post(
  '/shipments/:id/deliver',
  requireAuth,
  requireRole('BUYER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.verifyDelivery
);
router.get(
  '/buyer/shipment/:orderId',
  requireAuth,
  requireRole('BUYER', 'ADMIN', 'SUPERADMIN'),
  logisticsController.getBuyerShipment
);

// ─── Administrative Logistics Governance ────────────────────────────────────
router.get(
  '/admin/overview',
  requireAuth,
  requireRole('ADMIN', 'SUPERADMIN'),
  logisticsController.getAdminOverview
);
router.get(
  '/admin/shipments',
  requireAuth,
  requireRole('ADMIN', 'SUPERADMIN'),
  logisticsController.getAdminShipments
);
router.post(
  '/admin/consolidate',
  requireAuth,
  requireRole('ADMIN', 'SUPERADMIN'),
  logisticsController.adminConsolidate
);
router.get(
  '/admin/rates',
  requireAuth,
  requireRole('ADMIN', 'SUPERADMIN'),
  logisticsController.getAdminRates
);
router.post(
  '/admin/rates',
  requireAuth,
  requireRole('ADMIN', 'SUPERADMIN'),
  logisticsController.saveAdminRate
);
router.patch(
  '/admin/providers/:id/verify',
  requireAuth,
  requireRole('ADMIN', 'SUPERADMIN'),
  logisticsController.adminVerifyProvider
);
router.patch(
  '/admin/vehicles/:id/verify',
  requireAuth,
  requireRole('ADMIN', 'SUPERADMIN'),
  logisticsController.adminVerifyVehicle
);

export default router;
