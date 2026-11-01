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

export default router;

