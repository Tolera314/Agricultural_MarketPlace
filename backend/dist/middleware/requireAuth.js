import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';
/** Verifies JWT and attaches auth payload to req.auth */
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }
    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.auth = payload;
        next();
    }
    catch {
        return res.status(401).json({ success: false, error: { message: 'Invalid or expired token.' } });
    }
}
/** Middleware factory: allow only specific roles */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
        }
        if (!roles.includes(req.auth.role)) {
            return res.status(403).json({ success: false, error: { message: 'Access denied: insufficient role.' } });
        }
        next();
    };
}
//# sourceMappingURL=requireAuth.js.map