import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { dispatchOrder } from './dispatch.service.js';

/**
 * Utility to cleanly extract configuration values, stripping comments and trailing whitespace
 */
function getCleanEnv(val?: string, fallback = ''): string {
  if (!val) return fallback;
  const part = val.split('#')[0];
  return part ? part.trim() : fallback;
}

const CHAPA_BASE_URL = getCleanEnv(process.env.CHAPA_BASE_URL, 'https://api.chapa.co/v1').replace(/\/+$/, '');
const CHAPA_SECRET_KEY = getCleanEnv(process.env.CHAPA_SECRET_KEY, '');
const CHAPA_PUBLIC_KEY = getCleanEnv(process.env.CHAPA_PUBLIC_KEY, '');
const CHAPA_WEBHOOK_SECRET = getCleanEnv(process.env.CHAPA_WEBHOOK_SECRET, '');
const BACKEND_URL = getCleanEnv(process.env.BACKEND_URL, 'http://localhost:5000').replace(/\/+$/, '');
const FRONTEND_URL = getCleanEnv(process.env.FRONTEND_URL, 'http://localhost:3000').replace(/\/+$/, '');

// Dynamic Webhook URL: Uses explicit CHAPA_WEBHOOK_URL if defined, otherwise resolves from BACKEND_URL
export function getChapaWebhookUrl(): string {
  const configured = getCleanEnv(process.env.CHAPA_WEBHOOK_URL);
  if (configured) return configured;
  return `${BACKEND_URL}/api/payment/chapa/webhook`;
}

export interface InitializePaymentResult {
  checkoutUrl: string;
  txRef: string;
  status: 'INITIALIZED' | 'SIMULATED';
  orderId: string;
  amount: number;
  currency: string;
}

export interface ChapaVerificationResult {
  isVerified: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  txRef?: string;
  gatewayData?: any;
  error?: string;
}

/**
 * Initializes a Chapa payment checkout session for a given order.
 * Strictly adheres to Chapa API specifications with automatic callback and return URL configuration.
 */
export async function initializeChapaPayment(
  orderId: string,
  returnUrl?: string
): Promise<InitializePaymentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      payment: true,
    },
  });

  if (!order) {
    throw Object.assign(new Error(`Order not found: ${orderId}`), { status: 404 });
  }

  if (order.paymentStatus === 'COMPLETED') {
    throw Object.assign(new Error(`Order #${orderId.slice(-6).toUpperCase()} is already paid.`), { status: 400 });
  }

  const txRef = `AGRI-CHAPA-${order.id.slice(-6).toUpperCase()}-${Date.now()}`;
  const amountNumber = Number(order.totalAmount);
  const amountStr = amountNumber.toFixed(2);

  const buyerName = (order.buyer?.fullName || 'AgriMarket Customer').trim();
  const nameParts = buyerName.split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'Buyer';

  // Chapa requires valid email format. Fallback generates a customer address from phone
  const cleanPhone = (order.buyer?.phone || '').replace(/[^0-9]/g, '');
  const email = order.buyer?.email && order.buyer.email.includes('@')
    ? order.buyer.email.trim()
    : `${cleanPhone || 'customer'}@agrimarket.et`;

  const webhookUrl = getChapaWebhookUrl();
  const finalReturnUrl =
    returnUrl ||
    `${FRONTEND_URL}/dashboard/buyer?tab=orders&tx_ref=${txRef}&payment=success&orderId=${order.id}`;

  // 1. Real Chapa API integration when secret key is provided
  if (CHAPA_SECRET_KEY && CHAPA_SECRET_KEY.startsWith('CHASECK')) {
    try {
      const payload = {
        amount: amountStr,
        currency: 'ETB',
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: order.buyer?.phone || cleanPhone || undefined,
        tx_ref: txRef,
        callback_url: webhookUrl,
        return_url: finalReturnUrl,
        'customization[title]': 'AgriMarket Ethiopia',
        'customization[description]': `Payment for order #${order.id.slice(-6).toUpperCase()}`,
      };

      const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = (await response.json()) as any;

      if (resData.status === 'success' && resData.data?.checkout_url) {
        // Record pending payment in database
        await prisma.payment.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            amount: amountNumber,
            paymentMethod: 'CHAPA',
            status: 'PENDING',
            gatewayReference: txRef,
            gatewayResponse: resData,
          },
          update: {
            gatewayReference: txRef,
            gatewayResponse: resData,
            status: 'PENDING',
          },
        });

        // Set order status to pending payment
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentMethod: 'CHAPA',
            paymentStatus: 'PENDING',
            status: 'PENDING_PAYMENT',
          },
        });

        return {
          checkoutUrl: resData.data.checkout_url,
          txRef,
          status: 'INITIALIZED',
          orderId: order.id,
          amount: amountNumber,
          currency: 'ETB',
        };
      } else {
        console.warn('[Chapa API Live Call Response Warning]:', resData);
      }
    } catch (apiErr: any) {
      console.warn('[Chapa API Live Call Exception, using fallback sandbox]:', apiErr?.message);
    }
  }

  // 2. Fallback / Test Sandbox Mode Simulation
  const simulatedCheckoutUrl = `${FRONTEND_URL}/checkout/simulate-chapa?tx_ref=${txRef}&orderId=${order.id}&amount=${amountStr}`;

  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      amount: amountNumber,
      paymentMethod: 'CHAPA',
      status: 'PENDING',
      gatewayReference: txRef,
    },
    update: {
      gatewayReference: txRef,
      status: 'PENDING',
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: 'CHAPA',
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT',
    },
  });

  return {
    checkoutUrl: simulatedCheckoutUrl,
    txRef,
    status: 'SIMULATED',
    orderId: order.id,
    amount: amountNumber,
    currency: 'ETB',
  };
}

/**
 * Validates HMAC-SHA256 signature for incoming Chapa webhooks.
 * Uses constant-time equality check to prevent timing attacks.
 * Supports both raw Buffer and string payloads.
 */
export function verifyChapaWebhookSignature(rawBody: Buffer | string, signature?: string): boolean {
  if (!signature) return false;

  const candidateSecrets = [CHAPA_WEBHOOK_SECRET, CHAPA_SECRET_KEY].filter(Boolean);
  if (candidateSecrets.length === 0) {
    // In development without configured secrets, allow test webhook
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }

  const cleanSig = signature.trim().toLowerCase();

  for (const secret of candidateSecrets) {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(rawBody);
      const computedHex = hmac.digest('hex').toLowerCase();

      // Timing-safe constant-time comparison
      const computedBuf = Buffer.from(computedHex, 'utf8');
      const sigBuf = Buffer.from(cleanSig, 'utf8');

      if (computedBuf.length === sigBuf.length && crypto.timingSafeEqual(computedBuf, sigBuf)) {
        return true;
      }
    } catch (err: any) {
      console.warn('[Webhook signature check warning]:', err?.message);
    }
  }

  return false;
}

/**
 * Performs Server-to-Server Verification directly with Chapa Gateway API:
 * GET https://api.chapa.co/v1/transaction/verify/:tx_ref
 */
export async function verifyTransactionWithChapaApi(txRef: string): Promise<ChapaVerificationResult> {
  if (!CHAPA_SECRET_KEY || !CHAPA_SECRET_KEY.startsWith('CHASECK')) {
    // In test sandbox without real live API key, accept valid txRef format
    return {
      isVerified: true,
      status: 'success',
      txRef,
      gatewayData: { mode: 'sandbox_simulation', tx_ref: txRef, status: 'success' },
    };
  }

  try {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as any;

    if (data.status === 'success' && data.data) {
      const txStatus = (data.data.status || '').toLowerCase();
      const isPaid = txStatus === 'success' || txStatus === 'paid';

      return {
        isVerified: isPaid,
        status: data.data.status,
        amount: Number(data.data.amount),
        currency: data.data.currency,
        txRef: data.data.tx_ref || txRef,
        gatewayData: data.data,
      };
    }

    return {
      isVerified: false,
      status: data.status,
      error: data.message || 'Transaction verification unsuccessful at gateway.',
      gatewayData: data,
    };
  } catch (err: any) {
    console.error('[Chapa verify API exception]:', err.message);
    return {
      isVerified: false,
      error: err.message,
    };
  }
}

/**
 * Finalizes order confirmation and courier dispatch upon verified payment.
 * Employs idempotent atomic transactions to avoid double-crediting or duplicate courier jobs.
 */
export async function finalizePaymentSuccess(txRef: string, gatewayResponse?: any) {
  const payment = await prisma.payment.findFirst({
    where: { gatewayReference: txRef },
    include: { order: true },
  });

  if (!payment) {
    // Fallback: search by orderId if txRef contained order ID
    const rawSuffix = txRef.replace(/^AGRI-CHAPA-/, '').split('-')[0];
    const possibleOrderId = rawSuffix || '';
    const orderFallback = await prisma.order.findFirst({
      where: {
        OR: [
          ...(possibleOrderId ? [{ id: { endsWith: possibleOrderId } }] : []),
          { id: txRef },
        ],
      },
      include: { payment: true },
    });

    if (orderFallback) {
      return finalizePaymentSuccessById(orderFallback.id, txRef, gatewayResponse);
    }

    throw Object.assign(new Error(`No payment record found matching gateway reference: ${txRef}`), { status: 404 });
  }

  // Idempotency: If already completed, return immediately without re-dispatching
  if (payment.status === 'COMPLETED' && payment.order.paymentStatus === 'COMPLETED') {
    return {
      success: true,
      orderId: payment.orderId,
      txRef,
      alreadyProcessed: true,
      message: 'Payment was previously processed and confirmed.',
    };
  }

  // Atomic database update in transaction
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        gatewayResponse: gatewayResponse || payment.gatewayResponse,
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        confirmedAt: new Date(),
      },
    });
  });

  // High performance: Dispatch nearby couriers asynchronously (non-blocking)
  setImmediate(() => {
    dispatchOrder(payment.orderId).catch((err: any) => {
      console.warn(`[Courier dispatch after payment for order ${payment.orderId}]:`, err?.message);
    });
  });

  return {
    success: true,
    orderId: payment.orderId,
    txRef,
    alreadyProcessed: false,
    message: 'Payment confirmed and order dispatched to delivery workers.',
  };
}

async function finalizePaymentSuccessById(orderId: string, txRef: string, gatewayResponse?: any) {
  await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        amount: 0,
        paymentMethod: 'CHAPA',
        status: 'COMPLETED',
        gatewayReference: txRef,
        paidAt: new Date(),
        gatewayResponse,
      },
      update: {
        status: 'COMPLETED',
        paidAt: new Date(),
        gatewayReference: txRef,
        gatewayResponse,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        confirmedAt: new Date(),
      },
    });
  });

  setImmediate(() => {
    dispatchOrder(orderId).catch((err: any) => {
      console.warn(`[Courier dispatch fallback for order ${orderId}]:`, err?.message);
    });
  });

  return {
    success: true,
    orderId,
    txRef,
    alreadyProcessed: false,
    message: 'Payment confirmed successfully.',
  };
}

/**
 * Retrieves payment status and associated order summary
 */
export async function getPaymentDetails(orderId: string) {
  return prisma.payment.findUnique({
    where: { orderId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          confirmedAt: true,
          deliveryAddress: true,
        },
      },
    },
  });
}
