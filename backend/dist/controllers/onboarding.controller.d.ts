import type { Request, Response, NextFunction } from 'express';
export declare const UPLOAD_DIR: string;
/**
 * 1. GET /api/onboarding/status
 * Authoritative check of user's role, account status, onboarding progress, and profile verification.
 */
export declare function getOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 2. POST /api/onboarding/select-role
 * Server-authoritative role selection.
 * - Customer / Buyer: ensures buyer profile, immediately marks COMPLETED.
 * - Farmer / Delivery Worker: sets role, marks IN_PROGRESS to begin wizard.
 */
export declare function selectRole(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 3. POST /api/onboarding/draft
 * Persists onboarding draft state so user can resume anytime.
 */
export declare function saveDraft(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 4. GET /api/onboarding/draft
 * Retrieves saved draft.
 */
export declare function getDraft(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 5. POST /api/onboarding/upload
 * Secure document upload handler.
 */
export declare function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 6. GET /api/onboarding/documents/:filename
 * Secure document retrieval with authentication and ownership validation.
 */
export declare function serveDocument(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
/**
 * 7. POST /api/onboarding/submit-farmer
 * Submits the Farmer Onboarding & Verification Application.
 */
export declare function submitFarmerApplication(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 8. POST /api/onboarding/submit-worker
 * Submits the Delivery Worker Onboarding & Verification Application.
 */
export declare function submitWorkerApplication(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=onboarding.controller.d.ts.map