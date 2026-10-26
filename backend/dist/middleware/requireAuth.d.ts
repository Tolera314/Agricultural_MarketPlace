import type { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    sub: string;
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
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/** Middleware factory: allow only specific roles */
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=requireAuth.d.ts.map