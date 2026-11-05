import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  handleInitializeChapa,
  handleChapaWebhook,
  handleVerifyChapa,
  handleGetPaymentStatus,
  handleSimulatePayment,
} from '../controllers/payment.controller.js';

const router = Router();

// Initialize payment session with Chapa gateway
router.post('/chapa/initialize', requireAuth, handleInitializeChapa);

// Webhook endpoint (public with timing-safe HMAC-SHA256 signature verification)
router.post('/chapa/webhook', handleChapaWebhook);

// Webhook alias for /api/payment/webhook
router.post('/webhook', handleChapaWebhook);

// Client return verification endpoint
router.get('/chapa/verify/:txRef', handleVerifyChapa);

// Check payment status for an order
router.get('/status/:orderId', requireAuth, handleGetPaymentStatus);

// Development Sandbox Simulation endpoint
router.post('/simulate-success', handleSimulatePayment);

export default router;
