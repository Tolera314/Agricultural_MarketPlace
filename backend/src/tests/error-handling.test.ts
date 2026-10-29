import {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  FileUploadError,
  ServiceUnavailableError,
  translateDatabaseError,
  translateMulterError,
} from '../utils/errors.js';
import { errorHandler, sanitizeRequestLog } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import type { Request, Response, NextFunction } from 'express';

// Test harness state
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

interface MockResponse {
  statusCode: number;
  data: any;
  status: (code: number) => MockResponse;
  json: (body: any) => MockResponse;
  send: (body: any) => MockResponse;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.data = body;
      return this;
    },
    send(body: any) {
      this.data = body;
      return this;
    },
  };
  return res;
}

function createMockReq(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  auth?: { sub: string; role: string; phone?: string };
}): Request {
  return {
    method: options.method || 'GET',
    url: options.url || '/',
    path: options.url || '/',
    body: options.body || {},
    headers: options.headers || {},
    auth: options.auth,
  } as unknown as Request;
}

async function runErrorHandlingTests() {
  console.log('🧪 Starting AgriMarket Centralized Human-Readable Error Handling Test Suite...\n');

  // =========================================================================
  // 1. Centralized Error Classes & Taxonomy
  // =========================================================================
  console.log('--- 1. Application Error Hierarchy & Status Codes ---');
  {
    const valErr = new ValidationError('Please enter a valid phone number.', 'phone', { phone: 'Invalid format' });
    assert(valErr.statusCode === 400, 'ValidationError has 400 status');
    assert(valErr.code === 'VALIDATION_ERROR', 'ValidationError has VALIDATION_ERROR code');
    assert(valErr.category === 'VALIDATION', 'ValidationError category is VALIDATION');
    assert(valErr.field === 'phone', 'ValidationError captures target field');
    assert(valErr.fieldErrors?.phone === 'Invalid format', 'ValidationError captures structured fieldErrors');

    const authErr = new AuthenticationError('Please sign in to place an order.', 'AUTH_REQUIRED');
    assert(authErr.statusCode === 401, 'AuthenticationError has 401 status');
    assert(authErr.code === 'AUTH_REQUIRED', 'AuthenticationError carries AUTH_REQUIRED code');

    const forbidErr = new ForbiddenError('Only registered Farmers can list agricultural harvests.');
    assert(forbidErr.statusCode === 403, 'ForbiddenError has 403 status');
    assert(forbidErr.code === 'FORBIDDEN_ROLE', 'ForbiddenError carries FORBIDDEN_ROLE code');

    const notFoundErr = new NotFoundError('Teff Grain Product');
    assert(notFoundErr.statusCode === 404, 'NotFoundError has 404 status');
    assert(notFoundErr.message.includes('teff grain product could not be found'), 'NotFoundError formats natural entity name in plain English');

    const conflictErr = new ConflictError('This phone number is already registered.', 'PHONE_EXISTS', 'phone');
    assert(conflictErr.statusCode === 409, 'ConflictError has 409 status');
    assert(conflictErr.field === 'phone', 'ConflictError tracks conflicting field');

    const bizErr = new BusinessRuleError('This harvest listing only has 4 quintals remaining in stock.', 'INSUFFICIENT_STOCK', 'quantity');
    assert(bizErr.statusCode === 400, 'BusinessRuleError has 400 status');
    assert(bizErr.code === 'INSUFFICIENT_STOCK', 'BusinessRuleError carries specific domain code');

    const uploadErr = new FileUploadError('Government ID documents must be in JPEG, PNG, or PDF format.', 'UNSUPPORTED_FILE_TYPE', 'document');
    assert(uploadErr.statusCode === 400, 'FileUploadError has 400 status');
    assert(uploadErr.code === 'UNSUPPORTED_FILE_TYPE', 'FileUploadError carries UNSUPPORTED_FILE_TYPE');

    const serviceErr = new ServiceUnavailableError();
    assert(serviceErr.statusCode === 503, 'ServiceUnavailableError has 503 status');
  }

  // =========================================================================
  // 2. Centralized Error Middleware Response Formatting & Envelope
  // =========================================================================
  console.log('\n--- 2. Error Middleware Envelope & Client Protection ---');
  {
    const req = createMockReq({ url: '/api/buyer/orders', method: 'POST' });
    const res = createMockRes();

    const appErr = new BusinessRuleError('You cannot cancel an order that is already in transit with a courier.', 'ORDER_IN_TRANSIT');
    errorHandler(appErr, req, res as unknown as Response, () => {});

    assert(res.statusCode === 400, 'Middleware sets matching HTTP status code on response');
    assert(res.data.success === false, 'Envelope contains standard success: false');
    assert(res.data.error.code === 'ORDER_IN_TRANSIT', 'Envelope contains stable machine-readable error code');
    assert(res.data.error.message.includes('in transit with a courier'), 'Envelope contains plain-English user message');
    assert(res.data.error.status === 400, 'Envelope contains numeric status code');
    assert(res.data.error.stack === undefined, 'Middleware never leaks stack traces to the public client');
  }

  // =========================================================================
  // 3. Database Error Translation (Prisma P2002 Unique Constraints)
  // =========================================================================
  console.log('\n--- 3. Database Error Translation: P2002 Unique Constraints ---');
  {
    // 3a. Phone number collision
    const prismaPhoneError: any = new Error('Unique constraint failed on the fields: (`phone`)');
    prismaPhoneError.code = 'P2002';
    prismaPhoneError.meta = { target: ['users_phone_key'] };

    const translatedPhone = translateDatabaseError(prismaPhoneError);
    assert(translatedPhone.statusCode === 409, 'P2002 phone returns 409 Conflict');
    assert(translatedPhone.field === 'phone', 'P2002 phone maps to field: phone');
    assert(
      translatedPhone.message.includes('phone number is already associated with an account'),
      'P2002 phone provides polite sign-in advice without database jargon'
    );
    assert(!translatedPhone.message.includes('users_phone_key'), 'P2002 phone strips raw constraint name');

    // 3b. Email collision
    const prismaEmailError: any = new Error('Unique constraint failed on the fields: (`email`)');
    prismaEmailError.code = 'P2002';
    prismaEmailError.meta = { target: ['users_email_key'] };

    const translatedEmail = translateDatabaseError(prismaEmailError);
    assert(translatedEmail.statusCode === 409, 'P2002 email returns 409 Conflict');
    assert(translatedEmail.field === 'email', 'P2002 email maps to field: email');
    assert(
      translatedEmail.message.includes('email address is already associated with an account'),
      'P2002 email provides plain-English explanation'
    );

    // 3c. Driver license plate collision
    const prismaPlateError: any = new Error('Unique constraint failed on the fields: (`vehiclePlateNumber`)');
    prismaPlateError.code = 'P2002';
    prismaPlateError.meta = { target: ['delivery_profiles_vehiclePlateNumber_key'] };

    const translatedPlate = translateDatabaseError(prismaPlateError);
    assert(translatedPlate.field === 'vehiclePlate', 'P2002 plate maps to vehiclePlate field');
    assert(translatedPlate.message.includes('license plate is already registered'), 'P2002 plate explains vehicle collision');

    // 3d. National ID / Kebele collision
    const prismaIdError: any = new Error('Unique constraint failed on the fields: (`identityNumber`)');
    prismaIdError.code = 'P2002';
    prismaIdError.meta = { target: ['farmer_profiles_identityNumber_key'] };

    const translatedId = translateDatabaseError(prismaIdError);
    assert(translatedId.message.includes('identification number is already registered'), 'P2002 ID explains identity document collision');
  }

  // =========================================================================
  // 4. Database Error Translation: Foreign Keys (P2003) & Not Found (P2025)
  // =========================================================================
  console.log('\n--- 4. Database Error Translation: P2003 Foreign Keys & P2025 ---');
  {
    // 4a. Market Foreign Key (The reported incident: farmer_profiles_marketId_fkey)
    const prismaMarketError: any = new Error('Foreign key constraint violated on the constraint: farmer_profiles_marketId_fkey');
    prismaMarketError.code = 'P2003';
    prismaMarketError.meta = { field_name: 'farmer_profiles_marketId_fkey' };

    const translatedMarket = translateDatabaseError(prismaMarketError);
    assert(translatedMarket.statusCode === 400, 'P2003 returns 400 Bad Request');
    assert(translatedMarket.field === 'marketId', 'P2003 marketId maps to field: marketId');
    assert(
      translatedMarket.message.includes('selected local market could not be found'),
      'P2003 marketId translates into plain-English market guidance'
    );
    assert(!translatedMarket.message.includes('farmer_profiles_marketId_fkey'), 'P2003 marketId strips internal Prisma constraint');

    // 4b. Record Not Found (P2025)
    const prismaNotFoundError: any = new Error('An operation failed because it depends on one or more records that were required but not found.');
    prismaNotFoundError.code = 'P2025';

    const translatedNotFound = translateDatabaseError(prismaNotFoundError);
    assert(translatedNotFound.statusCode === 404, 'P2025 maps to 404 Not Found');
    assert(translatedNotFound.message.includes('could not be found'), 'P2025 translates to polite plain English');
  }

  // =========================================================================
  // 5. Database Connection Pool & Serverless Timeout (P1001, P1002, P1017)
  // =========================================================================
  console.log('\n--- 5. Serverless Database Connection Timeouts ---');
  {
    const prismaTimeoutError: any = new Error("Can't reach database server at `ep-aged-grass-1234.us-east-2.aws.neon.tech`");
    prismaTimeoutError.code = 'P1001';

    const translatedTimeout = translateDatabaseError(prismaTimeoutError);
    assert(translatedTimeout.statusCode === 503, 'P1001 returns 503 Service Unavailable');
    assert(translatedTimeout.code === 'DATABASE_UNAVAILABLE', 'P1001 carries DATABASE_UNAVAILABLE code');
    assert(
      translatedTimeout.message.includes('preserved. Please try again in a few moments'),
      'P1001 reassures user that data is safe without exposing hostnames'
    );
    assert(!translatedTimeout.message.includes('neon.tech'), 'P1001 hides cloud database hostname and credentials');
  }

  // =========================================================================
  // 6. Multer File Upload Error Translations
  // =========================================================================
  console.log('\n--- 6. Multer File Upload Errors ---');
  {
    const multerSizeError: any = new Error('File too large');
    multerSizeError.name = 'MulterError';
    multerSizeError.code = 'LIMIT_FILE_SIZE';

    const translatedSize = translateMulterError(multerSizeError);
    assert(translatedSize.statusCode === 400, 'File size limit returns 400 Bad Request');
    assert(translatedSize.code === 'FILE_TOO_LARGE', 'File size limit carries FILE_TOO_LARGE code');
    assert(translatedSize.message.includes('5 MB maximum size limit'), 'File size limit specifies clear 5MB boundary');

    const multerCountError: any = new Error('Too many files');
    multerCountError.name = 'MulterError';
    multerCountError.code = 'LIMIT_FILE_COUNT';

    const translatedCount = translateMulterError(multerCountError);
    assert(translatedCount.message.includes('one document at a time'), 'File count limit explains single file requirement');
  }

  // =========================================================================
  // 7. Authentication & RBAC Authorization Middleware Messages
  // =========================================================================
  console.log('\n--- 7. Authentication & Role-Based Authorization Messages ---');
  {
    // 7a. Missing token on protected endpoint
    const reqNoToken = createMockReq({ url: '/api/buyer/orders', headers: {} });
    const resNoToken = createMockRes();
    let authNextCalled = false;

    requireAuth(reqNoToken, resNoToken as unknown as Response, (err?: any) => {
      authNextCalled = true;
    });

    assert(!authNextCalled, 'requireAuth halts execution when token is missing');
    assert(resNoToken.statusCode === 401, 'requireAuth returns 401 Unauthorized');
    assert(resNoToken.data.error.code === 'AUTH_REQUIRED', 'requireAuth returns AUTH_REQUIRED code');
    assert(
      resNoToken.data.error.message.includes('Authentication required. Please sign in to access this resource'),
      'requireAuth returns plain English sign-in prompt'
    );

    // 7b. Role mismatch (Buyer trying to access Courier dispatch)
    const reqWrongRole = createMockReq({
      url: '/api/worker/assignments',
      auth: { sub: 'buyer-uuid', role: 'BUYER' },
    });
    const resWrongRole = createMockRes();
    const workerGuard = requireRole('DELIVERY_WORKER');
    let roleNextCalled = false;

    workerGuard(reqWrongRole, resWrongRole as unknown as Response, () => {
      roleNextCalled = true;
    });

    assert(!roleNextCalled, 'requireRole halts execution when role is insufficient');
    assert(resWrongRole.statusCode === 403, 'requireRole returns 403 Forbidden');
    assert(resWrongRole.data.error.code === 'FORBIDDEN_ROLE', 'requireRole returns FORBIDDEN_ROLE code');
    assert(
      resWrongRole.data.error.message.includes('Delivery Courier accounts'),
      'requireRole presents natural, friendly role titles instead of raw enums'
    );
  }

  // =========================================================================
  // 8. Sensitive Data Redaction in Request Logs
  // =========================================================================
  console.log('\n--- 8. Security & Privacy: Credential Redaction in Diagnostics ---');
  {
    const sensitivePayload = {
      phone: '+251911223344',
      password: 'SuperSecretPassword123!',
      confirmPassword: 'SuperSecretPassword123!',
      token: 'jwt-header.payload.signature',
      refreshToken: 'refresh-token-value',
      nationalIdNumber: 'ETH-12345678',
    };

    const redacted = sanitizeRequestLog(sensitivePayload);
    assert(redacted.password === '[REDACTED]', 'Redacts password field');
    assert(redacted.confirmPassword === '[REDACTED]', 'Redacts confirmPassword field');
    assert(redacted.token === '[REDACTED]', 'Redacts token field');
    assert(redacted.refreshToken === '[REDACTED]', 'Redacts refreshToken field');
    assert(redacted.phone === '+251911223344', 'Preserves non-sensitive troubleshooting context');
  }

  // =========================================================================
  // 9. Structured Field Validation Errors
  // =========================================================================
  console.log('\n--- 9. Form Validation & Structured Field Errors ---');
  {
    const fieldErrors = {
      fullName: 'Please enter your full legal name as shown on your Kebele ID.',
      phone: 'Please enter a valid Ethiopian phone number starting with +251, 09, or 07.',
      password: 'Password must be at least 8 characters long and include numbers.',
    };

    const valErr = new ValidationError('Please correct the highlighted fields to continue.', undefined, fieldErrors);
    const req = createMockReq({ url: '/api/auth/register', method: 'POST' });
    const res = createMockRes();

    errorHandler(valErr, req, res as unknown as Response, () => {});

    assert(res.statusCode === 400, 'Validation returns 400');
    assert(res.data.error.fieldErrors !== undefined, 'Includes fieldErrors map');
    assert(
      res.data.error.fieldErrors.fullName.includes('Kebele ID'),
      'Field error for fullName provides concrete instructions'
    );
    assert(
      res.data.error.fieldErrors.phone.includes('+251'),
      'Field error for phone provides format instructions'
    );
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`\n======================================================`);
  console.log(`All Error Handling Tests: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runErrorHandlingTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
