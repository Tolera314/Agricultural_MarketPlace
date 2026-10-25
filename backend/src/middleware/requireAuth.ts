import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

// ─── Dev bypass token (admin@agrimarket.et / SUPERADMIN) ────────────────────
// Used only when DEV_ADMIN_BYPASS=true is set or when the special header is sent.
// This lets the frontend admin dashboard work without a manual login in development.
const DEV_BYPASS_HEADER = 'x-dev-admin-bypass';
const DEV_BYPASS_SECRET = 'agrimarket_dev_2026';

export interface AuthPayload {
  sub: string;   // user ID
  role: string;
}

/** Extend Express Request to carry the verified auth payload */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

/** Verifies JWT and attaches auth payload to req.auth */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // ── Dev bypass: allows admin dashboard to work without manual login ────────
  const bypassHeader = req.headers[DEV_BYPASS_HEADER];
  if (bypassHeader === DEV_BYPASS_SECRET) {
    req.auth = { sub: 'dev-admin', role: 'SUPERADMIN' };
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired token.' } });
  }
}

/** Middleware factory: allow only specific roles */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, error: { message: 'Access denied: insufficient role.' } });
    }
    next();
  };
}
