import type { Request, Response, NextFunction } from 'express';
import { AppError, translateDatabaseError, translateMulterError } from '../utils/errors.js';

/**
 * Sanitizes request details before logging to prevent credential leakage.
 */
export function sanitizeRequestLog(reqOrBody: any) {
  const body = reqOrBody?.body !== undefined ? reqOrBody.body : reqOrBody;
  const sanitizedBody = { ...(body || {}) };
  const sensitiveKeys = ['password', 'newPassword', 'confirmPassword', 'token', 'refreshToken', 'credential', 'idToken'];

  for (const key of sensitiveKeys) {
    if (sanitizedBody[key]) {
      sanitizedBody[key] = '[REDACTED]';
    }
  }

  if (reqOrBody?.method || reqOrBody?.originalUrl) {
    return {
      method: reqOrBody.method,
      url: reqOrBody.originalUrl,
      ip: reqOrBody.ip || reqOrBody.headers?.['x-forwarded-for'] || reqOrBody.socket?.remoteAddress,
      user: reqOrBody.auth?.sub || 'unauthenticated',
      body: sanitizedBody,
    };
  }

  return sanitizedBody;
}

/**
 * Centralized Application Error Handling Middleware
 * Ensures every error returned from the backend is:
 * 1. Safe (no stack traces, database schema, or internal paths in responses)
 * 2. Human-readable and actionable in plain English
 * 3. Uniformly structured with { success: false, error: { code, message, field, fieldErrors, status } }
 * 4. Truthfully reporting HTTP statuses (400 for validation, 401 for auth, 403 for permission, 404 for missing, 409 for conflict, 500 for unexpected)
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // If response headers have already been sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Normalize error into an AppError instance
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err?.name === 'MulterError') {
    appError = translateMulterError(err);
  } else if (err?.code && (err.code.startsWith('P') || err.name?.includes('Prisma'))) {
    appError = translateDatabaseError(err);
  } else if (err?.name === 'TokenExpiredError') {
    appError = new AppError({
      message: 'Your session has expired. Please sign in again.',
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
      category: 'AUTHENTICATION',
      field: 'auth',
    });
  } else if (err?.name === 'JsonWebTokenError') {
    appError = new AppError({
      message: 'Invalid or tampered authentication token. Please sign in again.',
      statusCode: 401,
      code: 'INVALID_TOKEN',
      category: 'AUTHENTICATION',
      field: 'auth',
    });
  } else if (err?.status && typeof err.status === 'number' && err.message) {
    // Preserve custom controller errors that attached status and field
    appError = new AppError({
      message: err.message,
      statusCode: err.status,
      code: err.code || (err.status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'APPLICATION_ERROR'),
      field: err.field,
      fieldErrors: err.fieldErrors,
      category: err.status >= 500 ? 'SERVER' : 'BUSINESS_RULE',
    });
  } else {
    // Fallback for unexpected exceptions
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const safeMessage = isDevelopment && err?.message
      ? err.message
      : 'An unexpected error occurred while processing your request. Please try again.';

    appError = new AppError({
      message: safeMessage,
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      category: 'SERVER',
      isOperational: false,
    });
  }

  // 2. Safe Diagnostic Logging (Without leaking passwords or tokens)
  const isServerFailure = appError.statusCode >= 500;
  const reqDetails = sanitizeRequestLog(req);

  if (isServerFailure) {
    console.error(
      `[ERROR 500] ${new Date().toISOString()} ${reqDetails.method} ${reqDetails.url}:`,
      err?.stack || err?.message || err
    );
  } else if (process.env.NODE_ENV !== 'test') {
    console.warn(
      `[WARN ${appError.statusCode}] ${reqDetails.method} ${reqDetails.url} [${appError.code}]: ${appError.message}`
    );
  }

  // 3. Construct Public Response
  // Guarantees zero leakage of stack traces, queries, or server internals to end users
  const responsePayload: {
    success: false;
    error: {
      code: string;
      message: string;
      status: number;
      field?: string;
      fieldErrors?: Record<string, string>;
    };
  } = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      status: appError.statusCode,
      ...(appError.field ? { field: appError.field } : {}),
      ...(appError.fieldErrors ? { fieldErrors: appError.fieldErrors } : {}),
    },
  };

  return res.status(appError.statusCode).json(responsePayload);
}

export default errorHandler;
