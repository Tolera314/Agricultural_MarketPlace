import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { handleSingleUpload, uploadMemoryImage } from '../middleware/upload.js';
import {
  getDashboard,
  getMyOffers,
  acceptOffer,
  rejectOffer,
  getMyDeliveries,
  getActiveDelivery,
  updateDeliveryStatus,
  reportDeliveryIncident,
  getEarnings,
  getCashReconciliations,
  submitCashReconciliation,
  getWorkerProfile,
  updateWorkerProfile,
  getNotifications,
  dispatchOrderAction,
  seedDemoOrderAction,
  uploadProofOfDelivery,
} from '../controllers/worker.controller.js';

const router = Router();

// All routes require authentication + DELIVERY_WORKER role
router.use(requireAuth, requireRole('DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN'));

router.get('/dashboard', getDashboard);
router.get('/offers', getMyOffers);
router.post('/offers/:offerId/accept', acceptOffer);
router.post('/offers/:offerId/reject', rejectOffer);

router.get('/deliveries', getMyDeliveries);
router.get('/deliveries/active', getActiveDelivery);
router.patch('/deliveries/:jobId/status', updateDeliveryStatus);
router.post('/deliveries/:jobId/incident', reportDeliveryIncident);
router.post('/deliveries/upload-proof', handleSingleUpload('file', uploadMemoryImage), uploadProofOfDelivery);

router.get('/earnings', getEarnings);
router.get('/reconciliations', getCashReconciliations);
router.post('/reconciliations/submit', submitCashReconciliation);

router.get('/profile', getWorkerProfile);
router.patch('/profile', updateWorkerProfile);

router.get('/notifications', getNotifications);

// Operational Dispatch & Testing actions
router.post('/dispatch/:orderId', dispatchOrderAction);
router.post('/seed-demo-order', seedDemoOrderAction);

export default router;
