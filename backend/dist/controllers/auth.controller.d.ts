import type { Request, Response, NextFunction } from "express";
export declare function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
/** Authenticate or provision the demo delivery worker (Abebe Mekonnen) */
export declare function handleDemoWorkerAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.controller.d.ts.map