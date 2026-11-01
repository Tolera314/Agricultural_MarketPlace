import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  handleInitializeChapa,
  handleChapaWebhook,
  handleVerifyChapa,
} from '../controllers/payment.controller.js';

const router = Router();

// Initialize payment (requires logged-in user or buyer)
router.post('/chapa/initialize', requireAuth, handleInitializeChapa);

// Webhook endpoint (public with HMAC-SHA256 signature check)
router.post('/chapa/webhook', handleChapaWebhook);

// Client return verification endpoint
router.get('/chapa/verify/:txRef', handleVerifyChapa);

export default router;
