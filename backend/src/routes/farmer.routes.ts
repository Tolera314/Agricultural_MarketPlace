import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import {
  getFarmerDashboard,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getFarmerOrders,
  updateFarmerOrderStatus,
  getFarmerEarnings,
  requestFarmerWithdrawal,
  getFarmerDeliveries,
  getFarmerReviews,
  replyFarmerReview,
  updateFarmerProfile,
  getFarmerSettings,
  updateFarmerSettings,
} from '../controllers/farmer.controller.js';

const router = Router();

// All routes require authentication + FARMER (or ADMIN / SUPERADMIN) role
router.use(requireAuth, requireRole('FARMER', 'ADMIN', 'SUPERADMIN'));

router.get('/dashboard', getFarmerDashboard);
router.get('/products', getMyProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getFarmerOrders);
router.patch('/orders/:id/status', updateFarmerOrderStatus);
router.get('/earnings', getFarmerEarnings);
router.post('/withdraw', requestFarmerWithdrawal);
router.get('/deliveries', getFarmerDeliveries);
router.get('/reviews', getFarmerReviews);
router.post('/reviews/:id/reply', replyFarmerReview);
router.put('/profile', updateFarmerProfile);
router.get('/settings', getFarmerSettings);
router.put('/settings', updateFarmerSettings);

export default router;

