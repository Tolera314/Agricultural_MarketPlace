import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import {
  handleGetDashboard,
  handleGetNearbyFarmers,
  handleGetFarmerProfile,
  handleSearchProducts,
  handleGetProductDetails,
  handleGetCategories,
  handleCalculateCheckout,
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderDetails,
  handleCancelOrder,
  handleGetDeliveryTracking,
  handleGetAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleDeleteAddress,
  handleToggleSavedFarmer,
  handleGetSavedFarmers,
  handleToggleFavorite,
  handleGetFavorites,
  handleGetNotifications,
  handleMarkNotificationRead,
  handleCreateSupportTicket,
} from '../controllers/buyer.controller.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

/** Optional auth middleware: sets req.auth if valid token present, otherwise proceeds */
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      req.auth = payload;
    } catch {
      // ignore invalid token for optional endpoints
    }
  }
  next();
}

const router = Router();

// ============================================================
// 1. Public Guest Browsing Endpoints (No forced login or wall)
// ============================================================
router.get('/products', optionalAuth, handleSearchProducts);
router.get('/products/:productId', optionalAuth, handleGetProductDetails);
router.get('/farmers', optionalAuth, handleGetNearbyFarmers);
router.get('/farmers/nearby', optionalAuth, handleGetNearbyFarmers);
router.get('/farmers/:farmerId', optionalAuth, handleGetFarmerProfile);
router.get('/categories', optionalAuth, handleGetCategories);
router.post('/checkout/calculate', optionalAuth, handleCalculateCheckout);

// ============================================================
// 2. Authenticated Buyer Actions (Strict RBAC: BUYER role required)
// ============================================================
// Personal Buyer Dashboard Overview (Protected: No unauthenticated preview)
router.get('/dashboard', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetDashboard);

// Orders & Checkout (Protected)
router.post('/orders', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleCreateOrder);
router.get('/orders', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetOrders);
router.get('/orders/:orderId', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetOrderDetails);
router.post('/orders/:orderId/cancel', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleCancelOrder);
router.get('/orders/:orderId/tracking', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetDeliveryTracking);

// Delivery Addresses
router.get('/addresses', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetAddresses);
router.post('/addresses', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleCreateAddress);
router.put('/addresses/:addressId', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleUpdateAddress);
router.delete('/addresses/:addressId', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleDeleteAddress);

// Saved Farmers & Favorites
router.get('/saved-farmers', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetSavedFarmers);
router.post('/saved-farmers/:farmerId/toggle', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleToggleSavedFarmer);
router.get('/favorites', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetFavorites);
router.post('/favorites/:listingId/toggle', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleToggleFavorite);

// Notifications & Support
router.get('/notifications', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleGetNotifications);
router.patch('/notifications/:notifId/read', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleMarkNotificationRead);
router.post('/support', requireAuth, requireRole('BUYER', 'ADMIN', 'SUPERADMIN'), handleCreateSupportTicket);

export default router;
