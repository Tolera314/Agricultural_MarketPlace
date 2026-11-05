import type { Request, Response, NextFunction } from 'express';
import {
  initializeChapaPayment,
  verifyChapaWebhookSignature,
  verifyTransactionWithChapaApi,
  finalizePaymentSuccess,
  getPaymentDetails,
  getChapaWebhookUrl,
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
      data: {
        ...result,
        webhookUrl: getChapaWebhookUrl(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payment/chapa/webhook
 * Receives Chapa payment completion webhooks with timing-safe HMAC-SHA256 signature verification.
 * Supports direct and aliased routes.
 */
export async function handleChapaWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Extract signature from supported Chapa headers
    const signature = (
      req.headers['x-chapa-signature'] ||
      req.headers['chapa-signature']
    ) as string | undefined;

    // 2. Extract raw unparsed body buffer to prevent JSON re-serialization discrepancy
    const rawBuffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));

    // 3. Security: Cryptographic HMAC-SHA256 signature verification
    const isValid = verifyChapaWebhookSignature(rawBuffer, signature);
    if (!isValid) {
      console.warn('[Chapa Webhook Security Alert] Signature verification failed.', {
        hasSignature: Boolean(signature),
        hasSecretConfigured: Boolean(process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY),
        remoteIp: req.ip,
      });
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or unverified Chapa webhook signature.' },
      });
    }

    const payload = req.body || {};
    const txRef = payload.tx_ref || payload.trx_ref || payload.reference;
    const status = (payload.status || '').toLowerCase();
    const event = (payload.event || '').toLowerCase();

    if (!txRef) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing transaction reference in webhook payload.' },
      });
    }

    // 4. Verify transaction with Chapa Gateway before final state transition
    if (status === 'success' || event === 'charge.success') {
      const gatewayCheck = await verifyTransactionWithChapaApi(txRef);
      if (!gatewayCheck.isVerified) {
        console.warn(`[Chapa Webhook] Gateway check rejected txRef ${txRef}:`, gatewayCheck.error);
        return res.status(400).json({
          success: false,
          error: { message: gatewayCheck.error || 'Gateway verification failed.' },
        });
      }

      // 5. Finalize payment, update order status to CONFIRMED, and dispatch couriers
      await finalizePaymentSuccess(txRef, payload);
    } else {
      console.log(`[Chapa Webhook] Received non-success event for ${txRef}: ${status || event}`);
    }

    // 6. Performance: Respond 200 OK immediately to satisfy Chapa delivery timeout
    return res.status(200).json({
      success: true,
      message: 'Chapa webhook received and processed successfully.',
      txRef,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payment/chapa/verify/:txRef
 * Client return verification endpoint: Confirms payment with Chapa Gateway upon buyer return.
 */
export async function handleVerifyChapa(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRef = req.params.txRef;
    const txRef = Array.isArray(rawRef) ? rawRef[0] : rawRef;

    if (!txRef) {
      return res.status(400).json({ success: false, error: { message: 'Transaction reference is required.' } });
    }

    // 1. Verify with Chapa API server-to-server
    const verification = await verifyTransactionWithChapaApi(txRef);
    if (!verification.isVerified) {
      return res.status(400).json({
        success: false,
        error: { message: verification.error || 'Payment not verified by gateway.' },
      });
    }

    // 2. Finalize payment in database
    const result = await finalizePaymentSuccess(txRef, verification.gatewayData);

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payment/status/:orderId
 * Returns the current payment and order status for an order
 */
export async function handleGetPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = String(req.params.orderId);
    const payment = await getPaymentDetails(orderId);

    if (!payment) {
      return res.status(404).json({ success: false, error: { message: 'Payment record not found.' } });
    }

    return res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payment/simulate-success
 * Sandbox utility for local development and demo testing when outside live gateway
 */
export async function handleSimulatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { txRef } = req.body;
    if (!txRef) {
      return res.status(400).json({ success: false, error: { message: 'txRef is required.' } });
    }

    const result = await finalizePaymentSuccess(txRef, { mode: 'simulated_success', timestamp: new Date() });
    return res.json({
      success: true,
      message: 'Simulation successful. Order marked as paid and dispatched.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
