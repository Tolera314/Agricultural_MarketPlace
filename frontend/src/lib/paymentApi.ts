import { API_BASE_URL } from './apiConfig';
import { getAccessToken } from './auth';

export interface InitializeChapaResponse {
  success: boolean;
  message: string;
  data: {
    checkoutUrl: string;
    txRef: string;
    status: 'INITIALIZED' | 'SIMULATED';
    orderId: string;
    amount: number;
    currency: string;
    webhookUrl?: string;
  };
}

export interface VerifyChapaResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    orderId: string;
    txRef: string;
    alreadyProcessed?: boolean;
    message?: string;
  };
}

export const paymentApi = {
  /**
   * Initializes a Chapa checkout session for a specific order
   */
  initializeChapa: async (orderId: string, returnUrl?: string): Promise<InitializeChapaResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/payment/chapa/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ orderId, returnUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to initialize Chapa payment session.');
    }
    return res.json();
  },

  /**
   * Client-side return verification with Chapa gateway
   */
  verifyChapaPayment: async (txRef: string): Promise<VerifyChapaResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/payment/chapa/verify/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to verify transaction with payment gateway.');
    }
    return res.json();
  },

  /**
   * Check live payment record status for an order
   */
  getPaymentStatus: async (orderId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/payment/status/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch payment status.');
    }
    return res.json();
  },

  /**
   * Sandbox simulation helper
   */
  simulatePaymentSuccess: async (txRef: string) => {
    const res = await fetch(`${API_BASE_URL}/api/payment/simulate-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txRef }),
    });
    return res.json();
  },
};

