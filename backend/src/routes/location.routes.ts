import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import {
  shareLocation,
  getMyLatestLocation,
  revokeLocationConsent,
  getAdminLocationRecords,
  deleteLocationRecordAdmin,
} from '../controllers/location.controller.js';

const router = Router();

// User routes (any authenticated role: DELIVERY_WORKER, FARMER, BUYER, ADMIN)
router.post('/share', requireAuth, shareLocation);
router.get('/my-latest', requireAuth, getMyLatestLocation);
router.delete('/my-history', requireAuth, revokeLocationConsent);

// Administrative audit routes (RBAC: ADMIN & SUPERADMIN only)
router.get('/admin/records', requireAuth, requireRole('ADMIN', 'SUPERADMIN'), getAdminLocationRecords);
router.delete('/admin/records/:id', requireAuth, requireRole('ADMIN', 'SUPERADMIN'), deleteLocationRecordAdmin);

export default router;
