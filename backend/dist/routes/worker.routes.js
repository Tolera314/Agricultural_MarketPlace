import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { getDashboard, getMyOffers, acceptOffer, rejectOffer, getMyDeliveries, updateDeliveryStatus, getEarnings, getWorkerProfile, updateWorkerProfile, getNotifications, } from '../controllers/worker.controller.js';
const router = Router();
// All routes require authentication + DELIVERY_WORKER role
router.use(requireAuth, requireRole('DELIVERY_WORKER'));
router.get('/dashboard', getDashboard);
router.get('/offers', getMyOffers);
router.post('/offers/:offerId/accept', acceptOffer);
router.post('/offers/:offerId/reject', rejectOffer);
router.get('/deliveries', getMyDeliveries);
router.patch('/deliveries/:jobId/status', updateDeliveryStatus);
router.get('/earnings', getEarnings);
router.get('/profile', getWorkerProfile);
router.patch('/profile', updateWorkerProfile);
router.get('/notifications', getNotifications);
export default router;
//# sourceMappingURL=worker.routes.js.map