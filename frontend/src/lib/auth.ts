'use client';

export type UserRole = 'BUYER' | 'FARMER' | 'DELIVERY_WORKER' | 'ADMIN' | 'SUPERADMIN';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  isVerified: boolean;
  onboardingStatus?: string;
  createdAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const USER_CACHE_KEY = 'agrimarket_user_profile';

// IN-MEMORY SECURITY: Tokens are NEVER saved in localStorage or sessionStorage
let memoryAccessToken: string | null = null;
let memoryUser: AuthUser | null = null;
let refreshPromise: Promise<string | null> | null = null;
let silentRefreshTimer: any = null;

const stateListeners = new Set<(state: AuthState) => void>();

function notifyListeners(isLoading = false) {
  const state: AuthState = {
    user: memoryUser,
    accessToken: memoryAccessToken,
    isLoading,
    isAuthenticated: Boolean(memoryAccessToken && memoryUser),
  };
  stateListeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.error('Auth state listener error:', err);
    }
  });
}

/**
 * Access token getter for API clients (In-Memory only)
 */
export function getAccessToken(): string | null {
  return memoryAccessToken;
}

/**
 * Current user getter
 */
export function getCurrentUser(): AuthUser | null {
  return memoryUser;
}

/**
 * Update in-memory access token and schedule auto-refresh before expiry
 */
export function setAccessToken(token: string | null, expiresInSeconds = 14 * 60) {
  memoryAccessToken = token;

  if (silentRefreshTimer) {
    clearTimeout(silentRefreshTimer);
    silentRefreshTimer = null;
  }

  if (token) {
    // Schedule silent refresh 1 minute before access token expiration
    const delayMs = Math.max(30 * 1000, (expiresInSeconds - 60) * 1000);
    silentRefreshTimer = setTimeout(() => {
      refreshSession().catch(() => {
        // Handled silently
      });
    }, delayMs);
  }

  notifyListeners();
}

/**
 * Store non-sensitive user profile for instant UI display
 */
export function setCurrentUser(user: AuthUser | null) {
  memoryUser = user;
  if (typeof window !== 'undefined') {
    try {
      if (user) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
        // Also remove legacy plain tokens if any existed
        localStorage.removeItem('agrimarket_token');
        localStorage.removeItem('agrimarket_user');
      }
    } catch {
      // Storage might fail in sandboxed or private mode
    }
  }
  notifyListeners();
}

/**
 * Load cached user profile on initial hydration
 */
export function getCachedUserProfile(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY) || localStorage.getItem('agrimarket_user');
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    // Graceful fallback
  }
  return null;
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuth(callback: (state: AuthState) => void): () => void {
  stateListeners.add(callback);
  callback({
    user: memoryUser,
    accessToken: memoryAccessToken,
    isLoading: false,
    isAuthenticated: Boolean(memoryAccessToken && memoryUser),
  });
  return () => {
    stateListeners.delete(callback);
  };
}

/**
 * Perform silent refresh using HttpOnly cookie `agrimarket_refresh`
 */
export async function refreshSession(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Includes HttpOnly refresh cookie
      });

      if (!res.ok) {
        // Refresh token expired or revoked
        setAccessToken(null);
        setCurrentUser(null);
        return null;
      }

      const json = await res.json();
      const accessToken = json.data?.accessToken || json.data?.token;
      const user = json.data?.user;

      if (accessToken) {
        setAccessToken(accessToken);
      }
      if (user) {
        setCurrentUser(user);
      }

      return accessToken || null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Restore user session on app load / page reload
 */
export async function restoreSession(): Promise<AuthUser | null> {
  notifyListeners(true);

  // Initialize from cached user profile for instant UI responsiveness
  if (!memoryUser) {
    const cached = getCachedUserProfile();
    if (cached) {
      memoryUser = cached;
    }
  }

  try {
    const token = await refreshSession();
    if (!token && !memoryUser) {
      notifyListeners(false);
      return null;
    }

    // If we have token, optionally fetch fresh user details
    if (token) {
      try {
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.data?.user) {
            setCurrentUser(meData.data.user);
          }
        }
      } catch {
        // Keep cached user if /me network glitches
      }
    }

    notifyListeners(false);
    return memoryUser;
  } catch {
    notifyListeners(false);
    return null;
  }
}

/**
 * Authenticated Fetch wrapper with automatic Bearer injection and 401 silent retry
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If 401 Unauthorized, attempt a single silent refresh
  if (res.status === 401) {
    const newToken = await refreshSession();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return res;
}

/**
 * Sign In
 */
export async function loginWithCredentials(
  identifier: string,
  password: string,
  rememberMe = false
): Promise<{ success: boolean; user?: AuthUser; error?: string; field?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
        rememberMe,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message || 'Invalid credentials.',
        field: data.error?.field,
      };
    }

    const { accessToken, token, user } = data.data || {};
    const effectiveToken = accessToken || token;

    if (effectiveToken) {
      setAccessToken(effectiveToken);
    }
    if (user) {
      setCurrentUser(user);
    }

    return { success: true, user };
  } catch {
    return {
      success: false,
      error: 'Could not connect to the server. Please check your internet connection.',
    };
  }
}

/**
 * Sign Out (revokes refresh token and clears memory)
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch {
    // Proceed with client cleanup regardless
  } finally {
    setAccessToken(null);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

/**
 * Sign Out All Devices (global session revocation)
 */
export async function logoutAll(): Promise<void> {
  try {
    await authFetch('/api/auth/logout-all', { method: 'POST' });
  } catch {
    // Proceed
  } finally {
    setAccessToken(null);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

/**
 * Password Policy Validation matching backend
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  label: string;
  color: string;
  requirements: { length: boolean; uppercase: boolean; number: boolean; symbol: boolean };
} {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const metCount = Object.values(requirements).filter(Boolean).length;
  let score = 0;
  let label = 'Very Weak';
  let color = 'bg-rose-500';

  if (metCount === 1) {
    score = 25;
    label = 'Weak';
    color = 'bg-rose-500';
  } else if (metCount === 2) {
    score = 50;
    label = 'Fair';
    color = 'bg-amber-500';
  } else if (metCount === 3) {
    score = 75;
    label = 'Good';
    color = 'bg-emerald-500';
  } else if (metCount === 4) {
    score = 100;
    label = 'Strong';
    color = 'bg-emerald-600';
  }

  return {
    valid: metCount === 4,
    score,
    label,
    color,
    requirements,
  };
}

export interface GoogleAuthResult {
  success: boolean;
  user?: AuthUser;
  redirectUrl?: string;
  requiresLinkVerification?: boolean;
  email?: string;
  error?: string;
}

/**
 * Sign In or Sign Up with Google credential (ID token or OAuth authorization code)
 */
export async function loginWithGoogle(credential: string): Promise<GoogleAuthResult> {
  try {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409 && data.requiresLinkVerification) {
        return {
          success: false,
          requiresLinkVerification: true,
          email: data.email,
          error: data.message || 'An existing account with this email was found. Please enter your password to link your Google account.',
        };
      }

      return {
        success: false,
        error: data.error?.message || 'Google authentication failed.',
      };
    }

    const { accessToken, token, user, redirectUrl } = data.data || {};
    const effectiveToken = accessToken || token;

    if (effectiveToken) {
      setAccessToken(effectiveToken);
    }
    if (user) {
      setCurrentUser(user);
    }

    return { success: true, user, redirectUrl };
  } catch {
    return {
      success: false,
      error: 'Could not connect to the server for Google authentication.',
    };
  }
}

/**
 * Link Google identity to existing account by verifying existing password
 */
export async function linkGoogleAccount(
  credential: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; redirectUrl?: string; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/google/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message || 'Failed to link Google account. Please verify your password.',
      };
    }

    const { accessToken, token, user, redirectUrl } = data.data || {};
    const effectiveToken = accessToken || token;

    if (effectiveToken) {
      setAccessToken(effectiveToken);
    }
    if (user) {
      setCurrentUser(user);
    }

    return { success: true, user, redirectUrl };
  } catch {
    return {
      success: false,
      error: 'Could not connect to the server. Please try again.',
    };
  }
}

