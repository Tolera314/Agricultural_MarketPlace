import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

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
