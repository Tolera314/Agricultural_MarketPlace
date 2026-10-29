/**
 * Centralized Application Error Classes & Error Catalog — AgriMarket
 *
 * Implements production-grade, human-readable, plain-English error definitions
 * with stable error codes, categories, HTTP statuses, and field-level mapping.
 * Protects database constraints, internal paths, and sensitive infrastructure.
 */

export type ErrorCategory =
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE'
  | 'FILE_UPLOAD'
  | 'NOTIFICATION'
  | 'NETWORK'
  | 'SERVER';

export interface FieldErrors {
  [fieldName: string]: string;
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly field?: string | undefined;
  public readonly fieldErrors?: FieldErrors | undefined;
  public readonly isOperational: boolean;

  constructor(options: {
    message: string;
    statusCode?: number | undefined;
    code?: string | undefined;
    category?: ErrorCategory | undefined;
    field?: string | undefined;
    fieldErrors?: FieldErrors | undefined;
    isOperational?: boolean | undefined;
  }) {
    super(options.message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = options.statusCode || 500;
    this.code = options.code || 'INTERNAL_ERROR';
    this.category = options.category || 'SERVER';
    this.field = options.field;
    this.fieldErrors = options.fieldErrors;
    this.isOperational = options.isOperational ?? true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request — Input & Form Validation Errors
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string, fieldErrors?: FieldErrors, code = 'VALIDATION_ERROR') {
    super({
      message,
      statusCode: 400,
      code,
      category: 'VALIDATION',
      field,
      fieldErrors,
    });
  }
}

/**
 * 401 Unauthorized — Authentication Failures & Session Expirations
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Please sign in to continue.', code = 'AUTH_REQUIRED', field = 'auth') {
    super({
      message,
      statusCode: 401,
      code,
      category: 'AUTHENTICATION',
      field,
    });
  }
}

/**
 * 403 Forbidden — Insufficient Permissions & Role Guard Violations
 */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.', code = 'FORBIDDEN_ROLE') {
    super({
      message,
      statusCode: 403,
      code,
      category: 'AUTHORIZATION',
    });
  }
}

/**
 * 404 Not Found — Resource Lookup Failures
 */
export class NotFoundError extends AppError {
  constructor(resourceName = 'item', code = 'NOT_FOUND', field?: string) {
    const plainName = resourceName.toLowerCase().replace(/[-_]/g, ' ');
    super({
      message: `The requested ${plainName} could not be found. Please check your link or choose another.`,
      statusCode: 404,
      code,
      category: 'NOT_FOUND',
      field,
    });
  }
}

/**
 * 409 Conflict — Unique Constraints, State Collisions & In-Transit Locks
 */
export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT', field?: string) {
    super({
      message,
      statusCode: 409,
      code,
      category: 'CONFLICT',
      field,
    });
  }
}

/**
 * 400 / 422 Business Rule Error — Inventory, Order State & Domain Rules
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, code = 'BUSINESS_RULE_VIOLATION', field?: string, statusCode = 400) {
    super({
      message,
      statusCode,
      code,
      category: 'BUSINESS_RULE',
      field,
    });
  }
}

/**
 * 400 File Upload Error — Size, Format, or Storage Rejection
 */
export class FileUploadError extends AppError {
  constructor(message: string, code = 'FILE_UPLOAD_ERROR', field = 'file') {
    super({
      message,
      statusCode: 400,
      code,
      category: 'FILE_UPLOAD',
      field,
    });
  }
}

/**
 * 503 Service Unavailable — Database connection or third-party outage
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'This service is temporarily unavailable. Please try again shortly.', code = 'SERVICE_UNAVAILABLE') {
    super({
      message,
      statusCode: 503,
      code,
      category: 'SERVER',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Database & Third-Party Error Translators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Translates Prisma & PostgreSQL errors into safe, plain-English AppError instances.
 * Guarantees zero leakage of SQL tables, column names, or ORM internal stack traces.
 */
export function translateDatabaseError(err: any): AppError {
  if (err instanceof AppError) {
    return err;
  }

  // 1. Prisma P2002 — Unique Constraint Violation
  if (err?.code === 'P2002') {
    const target = Array.isArray(err.meta?.target)
      ? err.meta.target.join(' ').toLowerCase()
      : String(err.meta?.target || '').toLowerCase();

    if (target.includes('phone') || target.includes('phonenumber')) {
      return new ConflictError(
        'This phone number is already associated with an account. Please sign in or use another number.',
        'PHONE_ALREADY_REGISTERED',
        'phone'
      );
    }
    if (target.includes('email')) {
      return new ConflictError(
        'This email address is already associated with an account. Please sign in or use another email.',
        'EMAIL_ALREADY_REGISTERED',
        'email'
      );
    }
    if (target.includes('plate') || target.includes('vehicle')) {
      return new ConflictError(
        'This vehicle license plate is already registered to another courier profile.',
        'VEHICLE_PLATE_CONFLICT',
        'vehiclePlate'
      );
    }
    if (target.includes('identity') || target.includes('nationalid') || target.includes('fayda')) {
      return new ConflictError(
        'This identification number is already registered with another account.',
        'IDENTITY_NUMBER_CONFLICT',
        'identityNumber'
      );
    }

    return new ConflictError(
      'An account or record with this information already exists. Please review your entries.',
      'RECORD_ALREADY_EXISTS'
    );
  }

  // 2. Prisma P2003 — Foreign Key Constraint Violation
  if (err?.code === 'P2003') {
    const fieldName = String(err.meta?.field_name || '').toLowerCase();
    if (fieldName.includes('market')) {
      return new ValidationError(
        'The selected local market could not be found. Please choose an active market from the list.',
        'marketId',
        undefined,
        'INVALID_MARKET'
      );
    }
    if (fieldName.includes('zone') || fieldName.includes('city') || fieldName.includes('woreda')) {
      return new ValidationError(
        'The selected delivery zone or location does not exist. Please check your selections.',
        'location',
        undefined,
        'INVALID_LOCATION'
      );
    }
    return new ValidationError(
      'A selected reference record does not exist. Please review your selections and try again.',
      undefined,
      undefined,
      'INVALID_REFERENCE'
    );
  }

  // 3. Prisma P2025 — Record Not Found
  if (err?.code === 'P2025') {
    return new NotFoundError('record', 'RECORD_NOT_FOUND');
  }

  // 4. Prisma Database Connection / Pooler Failures (Neon Serverless timeouts)
  if (
    err?.code === 'P1001' || // Can't reach database server
    err?.code === 'P1002' || // Database server timed out
    err?.code === 'P1008' || // Operations timed out
    err?.code === 'P1017' || // Server has closed the connection
    err?.code === 'P2024' || // Timed out fetching a new connection from the connection pool
    err?.message?.includes('timed out') ||
    err?.message?.includes('Timed out') ||
    err?.message?.includes('Server has closed the connection') ||
    err?.message?.includes('Connection pool') ||
    err?.message?.includes('terminating connection')
  ) {
    return new ServiceUnavailableError(
      'Database connection timed out. Your information has been preserved. Please try again in a few moments.',
      'DATABASE_UNAVAILABLE'
    );
  }

  // 5. General fallback
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return new AppError({
    message: isDevelopment && err?.message
      ? err.message
      : 'An unexpected error occurred while processing your request. Please try again.',
    statusCode: err?.status || 500,
    code: 'UNEXPECTED_DATABASE_ERROR',
    category: 'SERVER',
    isOperational: false,
  });
}

/**
 * Translates Multer file upload errors into clear, actionable plain English.
 */
export function translateMulterError(err: any): FileUploadError {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return new FileUploadError(
      'The uploaded file exceeds the 5 MB maximum size limit. Please choose a smaller document or photo.',
      'FILE_TOO_LARGE',
      'file'
    );
  }
  if (err?.code === 'LIMIT_FILE_COUNT') {
    return new FileUploadError(
      'Too many files were uploaded at once. Please upload one document at a time.',
      'TOO_MANY_FILES',
      'file'
    );
  }
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return new FileUploadError(
      'Unexpected file upload field. Please use the designated upload field in the form.',
      'UNEXPECTED_FILE_FIELD',
      'file'
    );
  }

  return new FileUploadError(
    err?.message || 'We could not process this file upload. Please ensure the file is an accepted document format.',
    'FILE_UPLOAD_FAILED',
    'file'
  );
}
