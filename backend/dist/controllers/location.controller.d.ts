import type { Request, Response, NextFunction } from 'express';
/**
 * POST /api/location/share
 * Authenticated endpoint for explicitly consented user location sharing.
 * Strictly extracts the authenticated user ID from req.auth.sub.
 */
export declare function shareLocation(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/location/my-latest
 * Retrieves the authenticated user's current consented location status.
 */
export declare function getMyLatestLocation(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * DELETE /api/location/my-history
 * Privacy & retention control: Allows users to revoke consent and revoke/purge their location history.
 */
export declare function revokeLocationConsent(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/location/admin/records
 * RBAC: Restricted to ADMIN and SUPERADMIN.
 * Displays only location records that users knowingly consented to share.
 */
export declare function getAdminLocationRecords(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * DELETE /api/location/admin/records/:id
 * RBAC: Restricted to ADMIN / SUPERADMIN for GDPR / data retention compliance.
 */
export declare function deleteLocationRecordAdmin(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=location.controller.d.ts.map