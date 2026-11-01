import type { Request, Response, NextFunction } from 'express';
import {
  initializeChapaPayment,
  verifyChapaWebhookSignature,
  finalizePaymentSuccess,
} from '../services/payment.service.js';

/**
 * POST /api/payment/chapa/initialize
 * Initiates payment with Chapa for an order.
 */
export async function handleInitializeChapa(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, returnUrl } = req.body;
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID is required to initialize payment.' },
      });
    }

    const result = await initializeChapaPayment(orderId, returnUrl);
    return res.json({
      success: true,
      message: 'Payment session initialized.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payment/chapa/webhook
 * Receives Chapa payment completion webhooks with HMAC-SHA256 signature verification.
 */
export async function handleChapaWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-chapa-signature'] as string | undefined;
    const rawPayload = JSON.stringify(req.body);

    // If production or if secret configured, verify HMAC signature
    if (process.env.NODE_ENV === 'production' && process.env.CHAPA_WEBHOOK_SECRET) {
      const isValid = verifyChapaWebhookSignature(rawPayload, signature);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid webhook signature.' },
        });
      }
    }

    const { tx_ref, status } = req.body;

    if (status === 'success' && tx_ref) {
      await finalizePaymentSuccess(tx_ref, req.body);
    }

    return res.json({ success: true, message: 'Webhook received.' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payment/chapa/verify/:txRef
 * Manually confirms payment verification from client return.
 */
export async function handleVerifyChapa(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRef = req.params.txRef;
    const txRef = Array.isArray(rawRef) ? rawRef[0] : rawRef;

    if (!txRef) {
      return res.status(400).json({ success: false, error: { message: 'Transaction reference is required.' } });
    }

    const result = await finalizePaymentSuccess(txRef);
    return res.json({
      success: true,
      message: 'Payment verified and order confirmed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
