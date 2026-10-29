/**
 * AgriMarket - Centralized Dynamic API Configuration
 *
 * Sourced dynamically from NEXT_PUBLIC_API_URL in .env.
 * Automatically resolves production backend URL when hosted on Vercel/Render,
 * preventing 'localhost:5000' ERR_CONNECTION_REFUSED on remote browsers.
 */

export const DEFAULT_PRODUCTION_API_URL = 'https://agricultural-marketplace-hthx.onrender.com';

export function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const cleanEnv = envUrl ? envUrl.split('#')[0].trim().replace(/\/+$/, '') : '';

  // 1. Browser runtime: detect if running on localhost or hosted domain
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';

    if (isLocal) {
      return cleanEnv || 'http://localhost:5000';
    }

    // Hosted in the cloud (e.g. *.vercel.app, *.onrender.com)
    // Never allow a stale 'localhost' or empty string to break hosted fetch calls
    if (cleanEnv && !cleanEnv.includes('localhost') && !cleanEnv.includes('127.0.0.1')) {
      return cleanEnv;
    }

    return DEFAULT_PRODUCTION_API_URL;
  }

  // 2. Server-side / SSR / Build-time
  if (cleanEnv && !cleanEnv.includes('localhost') && !cleanEnv.includes('127.0.0.1')) {
    return cleanEnv;
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PRODUCTION_API_URL;
  }

  return cleanEnv || 'http://localhost:5000';
}

/** Dynamic getter function */
export const getApiBaseUrl = (): string => resolveApiBaseUrl();

/**
 * Dynamic string proxy: when interpolated in `${API_BASE_URL}`,
 * JavaScript invokes `.toString()` dynamically at fetch execution time.
 */
export const API_BASE_URL = {
  toString: () => resolveApiBaseUrl(),
  valueOf: () => resolveApiBaseUrl(),
} as unknown as string;

export default API_BASE_URL;

