import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { handleGetDashboard, handleGetNearbyFarmers, handleSearchProducts, handleCalculateCheckout, handleCreateOrder, handleGetOrders, handleGetOrderDetails, handleCancelOrder, handleGetDeliveryTracking, handleGetAddresses, handleCreateAddress, handleUpdateAddress, handleDeleteAddress, handleToggleSavedFarmer, handleGetSavedFarmers, handleToggleFavorite, handleGetFavorites, handleGetNotifications, handleMarkNotificationRead, handleCreateSupportTicket, } from '../controllers/buyer.controller.js';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';
/** Optional auth middleware: sets req.auth if valid token present, otherwise proceeds */
function optionalAuth(req, res, next) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        const token = header.slice(7);
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.auth = payload;
        }
        catch {
            // ignore invalid token for optional endpoints
        }
    }
    next();
}
const router = Router();
// Public / Semi-Public Browsing (supports guest previews and authenticated buyers)
router.get('/dashboard', optionalAuth, handleGetDashboard);
router.get('/farmers/nearby', optionalAuth, handleGetNearbyFarmers);
router.get('/products', optionalAuth, handleSearchProducts);
router.post('/checkout/calculate', optionalAuth, handleCalculateCheckout);
// Authenticated Buyer Actions (Strict RBAC: BUYER role required)
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
//# sourceMappingURL=buyer.routes.js.map