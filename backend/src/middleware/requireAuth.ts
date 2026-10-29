import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

// Dev bypass: strictly disabled in production
const DEV_BYPASS_HEADER = 'x-dev-admin-bypass';
const DEV_BYPASS_SECRET = process.env.DEV_BYPASS_SECRET || 'agrimarket_dev_2026';

export interface AuthPayload {
  sub: string;   // user ID
  role: string;
  tokenVersion?: number;
}

/** Extend Express Request to carry the verified auth payload */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

/**
 * Verifies JWT from Authorization Bearer header or secure cookie
 * and attaches verified auth payload to req.auth
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Dev bypass only allowed in non-production when explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';
  const allowDevBypass = !isProduction && process.env.ENABLE_DEV_ADMIN_BYPASS === 'true';

  if (allowDevBypass) {
    const bypassHeader = req.headers[DEV_BYPASS_HEADER];
    if (bypassHeader === DEV_BYPASS_SECRET) {
      req.auth = { sub: 'dev-admin', role: 'SUPERADMIN' };
      return next();
    }
  }

  // 1. Extract token from Authorization Bearer header
  let token: string | null = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  }

  // 2. Fallback to HttpOnly cookie if header is not present
  if (!token && (req as any).cookies) {
    token = (req as any).cookies.accessToken || (req as any).cookies.token || null;
  }

  // 3. Fallback to query parameter token (e.g., media/document links opened in new browser tabs)
  if (!token && req.query?.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required. Please sign in to access this resource.',
        status: 401,
      },
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = payload;
    return next();
  } catch (err: any) {
    const isExpired = err?.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired
          ? 'Your session has expired. Please refresh your session or sign in again.'
          : 'Invalid or tampered authentication token.',
      },
    });
  }
}

function formatRoleName(role: string): string {
  switch (role) {
    case 'BUYER': return 'Customer (Buyer)';
    case 'FARMER': return 'Farmer (Seller)';
    case 'DELIVERY_WORKER': return 'Delivery Courier';
    case 'ADMIN': return 'Administrator';
    case 'SUPERADMIN': return 'System Administrator';
    default: return role;
  }
}

/**
 * Middleware factory: Enforce role-based access control (RBAC)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Please sign in to access this feature.',
          status: 401,
        },
      });
    }

    if (!roles.includes(req.auth.role)) {
      const friendlyRoles = roles.map(formatRoleName).join(' or ');
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Access denied. This feature is reserved for ${friendlyRoles} accounts.`,
          status: 403,
        },
      });
    }

    return next();
  };
}

/**
 * Standard alias for backwards compatibility
 */
export const authMiddleware = requireAuth;
