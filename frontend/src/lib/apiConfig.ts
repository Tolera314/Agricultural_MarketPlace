/**
 * AgriMarket - Centralized Dynamic API Configuration
 *
 * Sourced dynamically from NEXT_PUBLIC_API_URL in .env.
 * Automatically strips trailing slashes and handles browser/hosted fallbacks safely.
 */

export function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // When running in the browser on a hosted domain (e.g. Render, Vercel, Railway)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }

  // Local development fallback
  return 'http://localhost:5000';
}

export const API_BASE_URL = resolveApiBaseUrl();
export default API_BASE_URL;

