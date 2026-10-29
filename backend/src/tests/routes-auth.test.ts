/**
 * Comprehensive Integration Test Suite: Route Protection, RBAC, and Authentication Enforcement
 * ==============================================================================================
 * Tests:
 * 1. Anonymous Request Rejection (401 across Admin, Superadmin, Worker, Buyer, Onboarding, Location)
 * 2. Role-Based Access Control (403 Forbidden across cross-role operations)
 * 3. Strict Superadmin Privilege Gate (Ordinary Admin cannot access Superadmin endpoints)
 * 4. Token Validation & Tamper Rejection (Garbage tokens, expired tokens)
 * 5. Cookie-Based Access Token Extraction (Cookie header authentication fallback)
 * 6. Production Dev Bypass Hardening (Bypass header strictly ignored when disabled)
 * 7. Open Redirect Prevention (Sanitizing safe redirect destinations)
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

function makeToken(userId: string, role: string, expiresIn: any = '1h'): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn });
}

function makeRequest(
  server: http.Server,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const address = server.address() as { port: number };
    const payload = body ? JSON.stringify(body) : undefined;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    failed++;
  }
}

// Redirect sanitization test helper matching frontend middleware
function sanitizeRedirect(pathname: string, search = ''): string {
  if (pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.startsWith('/\\') && !pathname.includes('://')) {
    return pathname + (search || '');
  }
  return '/dashboard';
}

async function runRouteProtectionTests() {
  console.log('\n🛡️  Starting Route Protection, RBAC & CI/CD Security Test Suite...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  // Create test actors
  const buyerId = `test-buyer-${Date.now()}`;
  const farmerId = `test-farmer-${Date.now()}`;
  const workerId = `test-worker-${Date.now()}`;
  const adminId = `test-admin-${Date.now()}`;
  const superadminId = `test-superadmin-${Date.now()}`;

  const buyerToken = makeToken(buyerId, 'BUYER');
  const farmerToken = makeToken(farmerId, 'FARMER');
  const workerToken = makeToken(workerId, 'DELIVERY_WORKER');
  const adminToken = makeToken(adminId, 'ADMIN');
  const superadminToken = makeToken(superadminId, 'SUPERADMIN');

  try {
    // =========================================================================
    // 1. ANONYMOUS ACCESS REJECTION (401 across all sensitive endpoints)
    // =========================================================================
    console.log('--- 1. Anonymous Access Rejection (401) ---');

    const unauthAdmin = await makeRequest(server, 'GET', '/api/admin/dashboard');
    assert(unauthAdmin.status === 401, 'Rejects unauthenticated GET /api/admin/dashboard with 401');

    const unauthSuperadmin = await makeRequest(server, 'GET', '/api/superadmin/dashboard');
    assert(unauthSuperadmin.status === 401, 'Rejects unauthenticated GET /api/superadmin/dashboard with 401');

    const unauthWorker = await makeRequest(server, 'GET', '/api/worker/deliveries');
    assert(unauthWorker.status === 401, 'Rejects unauthenticated GET /api/worker/deliveries with 401');

    const unauthBuyerOrders = await makeRequest(server, 'GET', '/api/buyer/orders');
    assert(unauthBuyerOrders.status === 401, 'Rejects unauthenticated GET /api/buyer/orders with 401');

    const unauthCreateOrder = await makeRequest(server, 'POST', '/api/buyer/orders', {}, { listingId: 'any' });
    assert(unauthCreateOrder.status === 401, 'Rejects unauthenticated POST /api/buyer/orders with 401');

    const unauthOnboarding = await makeRequest(server, 'GET', '/api/onboarding/status');
    assert(unauthOnboarding.status === 401, 'Rejects unauthenticated GET /api/onboarding/status with 401');

    const unauthLocation = await makeRequest(server, 'POST', '/api/location/share', {}, { latitude: 9.0, longitude: 38.7 });
    assert(unauthLocation.status === 401, 'Rejects unauthenticated POST /api/location/share with 401');

    // =========================================================================
    // 2. ROLE-BASED ACCESS CONTROL (403 Forbidden across cross-role operations)
    // =========================================================================
    console.log('\n--- 2. Role-Based Access Control (403 Forbidden) ---');

    // Buyer trying to access Admin
    const buyerToAdmin = await makeRequest(server, 'GET', '/api/admin/dashboard', {
      Authorization: `Bearer ${buyerToken}`,
    });
    assert(buyerToAdmin.status === 403, 'Rejects BUYER attempting to access /api/admin/dashboard with 403 Forbidden');
    assert(buyerToAdmin.body?.error?.code === 'FORBIDDEN_ROLE', 'Returns error code FORBIDDEN_ROLE');

    // Buyer trying to access Worker deliveries
    const buyerToWorker = await makeRequest(server, 'GET', '/api/worker/deliveries', {
      Authorization: `Bearer ${buyerToken}`,
    });
    assert(buyerToWorker.status === 403, 'Rejects BUYER attempting to access /api/worker/deliveries with 403 Forbidden');

    // Farmer trying to access SuperAdmin governance
    const farmerToSuper = await makeRequest(server, 'GET', '/api/superadmin/dashboard', {
      Authorization: `Bearer ${farmerToken}`,
    });
    assert(farmerToSuper.status === 403, 'Rejects FARMER attempting to access /api/superadmin/dashboard with 403 Forbidden');

    // Delivery Worker trying to perform Buyer checkout
    const workerToOrder = await makeRequest(server, 'POST', '/api/buyer/orders', {
      Authorization: `Bearer ${workerToken}`,
    }, { items: [] });
    assert(workerToOrder.status === 403, 'Rejects DELIVERY_WORKER attempting to access /api/buyer/orders with 403 Forbidden');

    // =========================================================================
    // 3. STRICT SUPERADMIN PRIVILEGE GATE
    // =========================================================================
    console.log('\n--- 3. Strict Superadmin Privilege Gate ---');

    // Ordinary ADMIN trying to access SuperAdmin endpoints
    const adminToSuper = await makeRequest(server, 'GET', '/api/superadmin/dashboard', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminToSuper.status === 403, 'Rejects ordinary ADMIN accessing /api/superadmin/dashboard with 403 Forbidden');

    const adminToSettings = await makeRequest(server, 'PATCH', '/api/superadmin/settings', {
      Authorization: `Bearer ${adminToken}`,
    }, { maxTransactionAmount: 50000 });
    assert(adminToSettings.status === 403, 'Rejects ordinary ADMIN modifying /api/superadmin/settings with 403 Forbidden');

    // SUPERADMIN can access both admin and superadmin endpoints
    const superToAdmin = await makeRequest(server, 'GET', '/api/admin/dashboard', {
      Authorization: `Bearer ${superadminToken}`,
    });
    assert(superToAdmin.status === 200, 'Allows SUPERADMIN access to /api/admin/dashboard');

    const superToSuper = await makeRequest(server, 'GET', '/api/superadmin/dashboard', {
      Authorization: `Bearer ${superadminToken}`,
    });
    assert(superToSuper.status === 200, 'Allows SUPERADMIN access to /api/superadmin/dashboard');

    // =========================================================================
    // 4. TOKEN VALIDATION & TAMPER REJECTION
    // =========================================================================
    console.log('\n--- 4. Token Validation & Tamper Rejection ---');

    const garbageRes = await makeRequest(server, 'GET', '/api/onboarding/status', {
      Authorization: 'Bearer invalid.tampered.token',
    });
    assert(garbageRes.status === 401, 'Rejects malformed token with 401');
    assert(garbageRes.body?.error?.code === 'INVALID_TOKEN', 'Identifies code as INVALID_TOKEN');

    const expiredToken = makeToken(buyerId, 'BUYER', '-1s');
    const expiredRes = await makeRequest(server, 'GET', '/api/onboarding/status', {
      Authorization: `Bearer ${expiredToken}`,
    });
    assert(expiredRes.status === 401, 'Rejects expired token with 401');
    assert(expiredRes.body?.error?.code === 'TOKEN_EXPIRED', 'Identifies code as TOKEN_EXPIRED');

    // =========================================================================
    // 5. COOKIE-BASED ACCESS TOKEN AUTHENTICATION
    // =========================================================================
    console.log('\n--- 5. Cookie-Based Access Token Authentication ---');

    const cookieAuthRes = await makeRequest(server, 'GET', '/api/onboarding/status', {
      Cookie: `accessToken=${buyerToken}`,
    });
    assert(cookieAuthRes.status === 200 || cookieAuthRes.status === 404, 'Accepts access token from HttpOnly Cookie header');

    // =========================================================================
    // 6. PRODUCTION DEV BYPASS HARDENING
    // =========================================================================
    console.log('\n--- 6. Dev Bypass Header Security ---');

    const originalEnv = process.env.NODE_ENV;
    const originalBypass = process.env.ENABLE_DEV_ADMIN_BYPASS;

    try {
      // In production, bypass must be strictly ignored
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEV_ADMIN_BYPASS = 'true';

      const prodBypassRes = await makeRequest(server, 'GET', '/api/admin/dashboard', {
        'x-dev-admin-bypass': 'agrimarket_dev_2026',
      });
      assert(prodBypassRes.status === 401, 'Strictly ignores dev bypass header in production (401)');
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.ENABLE_DEV_ADMIN_BYPASS = originalBypass;
    }

    // =========================================================================
    // 7. OPEN REDIRECT SANITIZATION
    // =========================================================================
    console.log('\n--- 7. Open Redirect Sanitization Logic ---');

    assert(sanitizeRedirect('/dashboard/farmer') === '/dashboard/farmer', 'Preserves internal relative path');
    assert(sanitizeRedirect('/dashboard/buyer/products', '?q=tomatoes') === '/dashboard/buyer/products?q=tomatoes', 'Preserves internal path with query parameters');
    assert(sanitizeRedirect('//evil.com') === '/dashboard', 'Rejects protocol-relative //evil.com -> defaults to /dashboard');
    assert(sanitizeRedirect('/\\evil.com') === '/dashboard', 'Rejects backslash evasion /\\evil.com -> defaults to /dashboard');
    assert(sanitizeRedirect('https://attacker.com/malicious') === '/dashboard', 'Rejects absolute external URL -> defaults to /dashboard');
    assert(sanitizeRedirect('javascript:alert(1)') === '/dashboard', 'Rejects javascript: scheme -> defaults to /dashboard');

    console.log(`\n📋 Route Protection & RBAC Results: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) process.exit(1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

runRouteProtectionTests();

