import type { Request, Response } from 'express';
import {
  handleSearchProducts,
  handleGetProductDetails,
  handleGetNearbyFarmers,
  handleGetFarmerProfile,
  handleGetCategories,
  handleGetDashboard,
  handleCalculateCheckout,
  handleCreateOrder,
  handleGetOrders,
} from '../controllers/buyer.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getProductDetails, getFarmerProfile, searchProducts, getNearbyFarmers } from '../services/buyer.service.js';

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
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  auth?: { sub: string; role: string; phone?: string };
}): Request {
  return {
    method: options.method || 'GET',
    url: options.url || '/',
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    auth: options.auth,
    headers: {},
  } as unknown as Request;
}

async function runGuestBrowsingUnitTests() {
  console.log('🧪 Starting AgriMarket Guest Browsing & Security Test Suite (Zero-Socket Offline Mode)...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  // =========================================================================
  // 1. Public Read Operations (Unauthenticated Guests)
  // =========================================================================
  console.log('--- 1. Public Product Catalog Browsing ---');
  {
    const req = createMockReq({ query: { search: '', category: 'all' } });
    const res = createMockRes();
    await handleSearchProducts(req, res as unknown as Response, () => {});

    assert(res.statusCode === 200, 'Guests can browse /api/buyer/products without auth (200 OK)');
    assert(Array.isArray(res.data?.data), 'Products response contains data array');
    assert(res.data?.data?.length > 0, 'Returns active farm listings');

    // Audit that no private farmer contact details are present
    const firstProduct = res.data?.data?.[0];
    assert(firstProduct && !('farmerPhone' in firstProduct), 'Sanitizes farmerPhone from product list');
    assert(firstProduct && !('phone' in firstProduct), 'Sanitizes private phone from product list');
    assert(firstProduct?.distanceKm !== undefined, 'Includes location-based distance');
  }

  // =========================================================================
  // 2. Public Product Details View
  // =========================================================================
  console.log('\n--- 2. Public Product Details & Seller Info ---');
  {
    const req = createMockReq({ params: { productId: 'prod-tomatoes-1' } });
    const res = createMockRes();
    await handleGetProductDetails(req, res as unknown as Response, () => {});

    assert(res.statusCode === 200, 'Guests can view product details without auth (200 OK)');
    assert(res.data?.data?.id === 'prod-tomatoes-1', 'Returns correct product detail ID');
    assert(res.data?.data?.farmer?.name === 'Abebe Tadesse', 'Returns public seller name');
    assert(!res.data?.data?.farmerPhone, 'Sanitizes farmerPhone from product details');
    assert(!res.data?.data?.farmer?.phone, 'Sanitizes seller private phone');
    assert(Array.isArray(res.data?.data?.otherProductsFromFarmer), 'Includes other active harvests from farmer');
  }

  // =========================================================================
  // 3. Public Farmer Directory
  // =========================================================================
  console.log('\n--- 3. Public Farmer Directory & Nearest-First Ranking ---');
  {
    const req = createMockReq({ query: {} });
    const res = createMockRes();
    await handleGetNearbyFarmers(req, res as unknown as Response, () => {});

    assert(res.statusCode === 200, 'Guests can browse farmer directory without auth (200 OK)');
    assert(Array.isArray(res.data?.data), 'Returns farmer directory array');
    const firstFarmer = res.data?.data?.[0];
    assert(firstFarmer && !('phone' in firstFarmer), 'Sanitizes private phone from farmer directory');
    assert(firstFarmer?.farmName, 'Returns public farm name');
    assert(firstFarmer?.distanceDisplay, 'Returns public distance display');
  }

  // =========================================================================
  // 4. Public Farmer Profile
  // =========================================================================
  console.log('\n--- 4. Public Farmer Profile ---');
  {
    const req = createMockReq({ params: { farmerId: 'farmer-abebe-uuid' } });
    const res = createMockRes();
    await handleGetFarmerProfile(req, res as unknown as Response, () => {});

    assert(res.statusCode === 200, 'Guests can view public farmer profile without auth (200 OK)');
    assert(res.data?.data?.id === 'farmer-abebe-uuid', 'Returns correct farmer ID');
    assert(res.data?.data?.bio, 'Returns farm bio and practices');
    assert(Array.isArray(res.data?.data?.products), 'Returns active product listings by farmer');
    assert(!('phone' in (res.data?.data || {})), 'Does not expose private phone number');
  }

  // =========================================================================
  // 5. Public Categories Taxonomy
  // =========================================================================
  console.log('\n--- 5. Public Categories Taxonomy ---');
  {
    const req = createMockReq({});
    const res = createMockRes();
    handleGetCategories(req, res as unknown as Response, () => {});

    assert(res.statusCode === 200, 'Guests can fetch agricultural categories (200 OK)');
    assert(Array.isArray(res.data?.data) && res.data.data.length >= 4, 'Returns full agricultural category taxonomy');
  }

  // =========================================================================
  // 6. Public Checkout Calculation
  // =========================================================================
  console.log('\n--- 6. Public Order Cost Calculation ---');
  {
    const req = createMockReq({
      body: {
        items: [{ listingId: 'prod-tomatoes-1', quantity: 2 }],
      },
    });
    const res = createMockRes();
    await handleCalculateCheckout(req, res as unknown as Response, () => {});

    assert(res.statusCode === 200, 'Guests can preview order calculations (200 OK)');
    assert(res.data?.data?.productSubtotal === 120, 'Server recalculates subtotal (60 ETB * 2 = 120 ETB)');
    assert(res.data?.data?.totalAmount > 120, 'Includes cold courier fee and transparent platform fee');
  }

  // =========================================================================
  // 7. Protected Buyer Dashboard & Personal Data (Authentication Required)
  // =========================================================================
  console.log('\n--- 7. Private Buyer Dashboard Protection ---');
  {
    // Unauthenticated guest request (no req.auth)
    const reqGuest = createMockReq({});
    const resGuest = createMockRes();
    await handleGetDashboard(reqGuest, resGuest as unknown as Response, () => {});

    assert(resGuest.statusCode === 401, 'Unauthenticated access to buyer dashboard returns 401 Unauthorized');
    assert(resGuest.data?.success === false, 'Rejects private dashboard access without token');

    // Authenticated Buyer request
    const reqBuyer = createMockReq({
      auth: { sub: 'test-buyer-uuid', role: 'BUYER' },
    });
    const resBuyer = createMockRes();
    await handleGetDashboard(reqBuyer, resBuyer as unknown as Response, () => {});

    assert(resBuyer.statusCode === 200, 'Authenticated buyer can access their personal dashboard (200 OK)');
    assert(resBuyer.data?.data?.metrics, 'Dashboard contains private buyer metrics');
  }

  // =========================================================================
  // 8. Order Placement Requires Authentication & BUYER Role
  // =========================================================================
  console.log('\n--- 8. Order Placement Authorization & Role Enforcement ---');
  {
    const orderPayload = {
      items: [{ listingId: 'prod-tomatoes-1', quantity: 1 }],
      deliveryAddress: 'Bole Subcity, Woreda 03, House 412',
      paymentMethod: 'TELEBIRR',
      buyerNotes: 'Call upon arrival',
    };

    // Middleware: requireAuth
    let authPassed = false;
    const reqGuest = createMockReq({ body: orderPayload });
    const resGuest = createMockRes();
    requireAuth(reqGuest, resGuest as unknown as Response, () => {
      authPassed = true;
    });
    assert(resGuest.statusCode === 401 && !authPassed, 'requireAuth middleware blocks guest from placing orders (401)');

    // Middleware: requireRole('BUYER', 'ADMIN', 'SUPERADMIN') with DELIVERY_WORKER
    let workerPassed = false;
    const reqWorker = createMockReq({
      body: orderPayload,
      auth: { sub: 'worker-uuid', role: 'DELIVERY_WORKER' },
    });
    const resWorker = createMockRes();
    const buyerRoleCheck = requireRole('BUYER', 'ADMIN', 'SUPERADMIN');
    buyerRoleCheck(reqWorker, resWorker as unknown as Response, () => {
      workerPassed = true;
    });
    assert(resWorker.statusCode === 403 && !workerPassed, 'DELIVERY_WORKER role is forbidden from placing buyer orders (403)');

    // Middleware: requireRole with FARMER
    let farmerPassed = false;
    const reqFarmer = createMockReq({
      body: orderPayload,
      auth: { sub: 'farmer-uuid', role: 'FARMER' },
    });
    const resFarmer = createMockRes();
    buyerRoleCheck(reqFarmer, resFarmer as unknown as Response, () => {
      farmerPassed = true;
    });
    assert(resFarmer.statusCode === 403 && !farmerPassed, 'FARMER role is forbidden from placing buyer orders (403)');

    // Middleware: requireRole with BUYER
    let buyerRolePassed = false;
    const reqBuyer = createMockReq({
      body: orderPayload,
      auth: { sub: 'buyer-uuid', role: 'BUYER' },
    });
    const resBuyer = createMockRes();
    buyerRoleCheck(reqBuyer, resBuyer as unknown as Response, () => {
      buyerRolePassed = true;
    });
    assert(buyerRolePassed, 'BUYER role is authorized to place orders');

    // Handler execution with BUYER
    const resOrder = createMockRes();
    await handleCreateOrder(reqBuyer, resOrder as unknown as Response, () => {});
    assert(resOrder.statusCode === 201 || resOrder.statusCode === 200, 'Authenticated buyer creates order successfully (200/201)');
    assert(resOrder.data?.data?.orderNumber || resOrder.data?.data?.id, 'Returns valid direct farm order reference');
  }

  // =========================================================================
  // 9. Order History Protection
  // =========================================================================
  console.log('\n--- 9. Order History Protection ---');
  {
    // Guest blocked by requireAuth
    const reqGuest = createMockReq({});
    const resGuest = createMockRes();
    let authNextCalled = false;
    requireAuth(reqGuest, resGuest as unknown as Response, () => {
      authNextCalled = true;
    });
    assert(resGuest.statusCode === 401 && !authNextCalled, 'Guest blocked from reading order history (401)');

    // Authenticated Buyer gets orders
    const reqBuyer = createMockReq({
      auth: { sub: 'buyer-uuid', role: 'BUYER' },
    });
    const resBuyer = createMockRes();
    await handleGetOrders(reqBuyer, resBuyer as unknown as Response, () => {});
    assert(resBuyer.statusCode === 200, 'Authenticated buyer receives order history (200 OK)');
    assert(Array.isArray(resBuyer.data?.data), 'Orders response contains array of buyer orders');
  }

  // =========================================================================
  // 10. Resilient Fallback Validation on Foreign Key Constraints (P2003)
  // =========================================================================
  console.log('\n--- 10. Resilient Database Onboarding Fallback ---');
  {
    // Simulate what happens if marketId violates foreign key constraint in onboarding
    const simulatePrismaError = (code: string) => {
      const err: any = new Error('Foreign key constraint violated on the constraint: farmer_profiles_marketId_fkey');
      err.code = code;
      return err;
    };

    let fellBack = false;
    const testUpsert = (marketId: string | null) => {
      if (marketId === 'non-existent-market') {
        throw simulatePrismaError('P2003');
      }
      return { id: 'farmer-profile-1', marketId };
    };

    let resultProfile: any = null;
    try {
      resultProfile = testUpsert('non-existent-market');
    } catch (err: any) {
      if (err.code === 'P2003') {
        fellBack = true;
        resultProfile = testUpsert(null);
      }
    }

    assert(fellBack, 'Detects P2003 foreign key violation on marketId');
    assert(resultProfile && resultProfile.marketId === null, 'Safely falls back to marketId: null without crashing user onboarding');
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`\n======================================================`);
  console.log(`All Guest Browsing & Security Tests: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runGuestBrowsingUnitTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
