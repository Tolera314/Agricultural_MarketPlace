import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import {
  getDashboardOverview,
  getProducts,
  updateProductStatus,
  getFarmers,
  verifyFarmer,
  getBuyers,
  updateBuyerStatus,
  getWorkers,
  verifyWorker,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getIntercityRoutes,
  getIntercityApprovals,
  decideIntercityApproval,
  getMarketsAndCities,
  getTransactions,
  getReports,
  getSettings,
  updatePricingRule,
  getAuditLogs,
} from '../controllers/admin.controller.js';

const router = Router();

// Protect ALL admin routes with Auth & Role check (ADMIN or SUPERADMIN)
router.use(requireAuth, requireRole('ADMIN', 'SUPERADMIN'));

// Dashboard Overview
router.get('/dashboard', getDashboardOverview);

// Products Moderation
router.get('/products', getProducts);
router.patch('/products/:id/status', updateProductStatus);

// Farmers Administration
router.get('/farmers', getFarmers);
router.patch('/farmers/:id/verify', verifyFarmer);

// Buyers Administration
router.get('/buyers', getBuyers);
router.patch('/buyers/:id/status', updateBuyerStatus);

// Delivery Workers Fleet
router.get('/workers', getWorkers);
router.patch('/workers/:id/verify', verifyWorker);

// Orders Lifecycles
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

// Intercity Trade Routes & Authorization
router.get('/intercity/routes', getIntercityRoutes);
router.get('/intercity/approvals', getIntercityApprovals);
router.patch('/intercity/approvals/:id', decideIntercityApproval);

// Geographic Markets & Cities
router.get('/markets', getMarketsAndCities);

// Financial Ledger & COD Reconciliation
router.get('/transactions', getTransactions);

// Operational & Financial Reports
router.get('/reports', getReports);

// Platform Configuration & Pricing Rules
router.get('/settings', getSettings);
router.patch('/settings/pricing-rules/:id', updatePricingRule);

// Immutable Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
