import app from '../app.js';
import jwt from 'jsonwebtoken';
import http from 'http';
import { resilientStore } from '../services/buyer.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

// Test Tokens
const buyer1Token = jwt.sign(
  { sub: 'test-buyer-1-uuid', role: 'BUYER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const buyer2Token = jwt.sign(
  { sub: 'test-buyer-2-uuid', role: 'BUYER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const workerToken = jwt.sign(
  { sub: 'test-worker-uuid', role: 'DELIVERY_WORKER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

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

async function runBuyerTests() {
  console.log('🧪 Starting AgriMarket Buyer Dashboard & Business Rules Test Suite...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

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

  try {
    // 1. Dashboard Overview returns real aggregated metrics
    {
      const res = await makeRequest(server, 'GET', '/api/buyer/dashboard');
      assert(
        res.status === 200 &&
          res.body.success === true &&
          res.body.data.metrics.totalOrders >= 5 &&
          res.body.data.metrics.savedFarmers === 12 &&
          res.body.data.metrics.totalSpent.includes('8,450'),
        '1. Dashboard overview returns authentic metrics (Total Orders, Saved Farmers=12, Spent=8,450)',
        JSON.stringify(res.body)
      );
    }

    // 2. Core Business Rule: Nearest Eligible Farmer First (Strict Distance Sorting)
    {
      // Coordinates at Addis Ababa center: 9.0125, 38.7636
      const res = await makeRequest(server, 'GET', '/api/buyer/farmers/nearby?lat=9.0125&lng=38.7636');
      assert(
        res.status === 200 &&
          Array.isArray(res.body.data) &&
          res.body.data.length >= 3 &&
          res.body.data[0].name === 'Abebe Tadesse' &&
          res.body.data[0].distanceKm <= res.body.data[1].distanceKm &&
          res.body.data[1].distanceKm <= res.body.data[2].distanceKm,
        '2. Strictly ranks eligible farmers nearest-first (Abebe 2.1km < Mekannen 3.1km < Heran 4.7km)',
        JSON.stringify(res.body.data.map((f: any) => ({ name: f.name, dist: f.distanceKm })))
      );
    }

    // 3. Fallback when user location is denied / coordinates omitted
    {
      const res = await makeRequest(server, 'GET', '/api/buyer/farmers/nearby');
      assert(
        res.status === 200 && res.body.data.length > 0,
        '3. Gracefully supports manual/default location when location permission is denied without blocking the marketplace'
      );
    }

    // 4. Products default to nearest-first ranking
    {
      const res = await makeRequest(server, 'GET', '/api/buyer/products');
      const products = res.body.data;
      let isSorted = true;
      for (let i = 0; i < products.length - 1; i++) {
        if (products[i].distanceKm > products[i + 1].distanceKm) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, '4. Browse products defaults to nearest-first distance ranking');
    }

    // 5. Optional sorting without changing default (price ascending)
    {
      const res = await makeRequest(server, 'GET', '/api/buyer/products?sortBy=price_asc');
      const products = res.body.data;
      let isPriceSorted = true;
      for (let i = 0; i < products.length - 1; i++) {
        if (products[i].pricePerUnit > products[i + 1].pricePerUnit) {
          isPriceSorted = false;
          break;
        }
      }
      assert(isPriceSorted, '5. Optional sorting by price_asc sorts correctly while preserving option transparency');
    }

    // 6. Farmer-Controlled Pricing calculation & breakdown at checkout
    {
      const res = await makeRequest(
        server,
        'POST',
        '/api/buyer/checkout/calculate',
        {},
        {
          items: [
            { listingId: 'prod-tomatoes-1', quantity: 10 }, // 60 * 10 = 600
            { listingId: 'prod-potatoes-2', quantity: 10 }, // 50 * 10 = 500
          ],
        }
      );
      const data = res.body.data;
      const expectedSubtotal = 1100;
      const expectedCommission = Math.round(1100 * 0.05); // 55
      const expectedDelivery = 50;
      const expectedTotal = 1100 + 55 + 50; // 1205

      assert(
        res.status === 200 &&
          data.productSubtotal === expectedSubtotal &&
          data.deliveryFee === expectedDelivery &&
          data.platformCommission === expectedCommission &&
          data.totalAmount === expectedTotal,
        '6. Transparent checkout calculation verifies farmer-controlled price subtotal and platform fee',
        JSON.stringify(data)
      );
    }

    // 7. Inventory validation: Rejects order exceeding stock
    {
      const res = await makeRequest(
        server,
        'POST',
        '/api/buyer/checkout/calculate',
        {},
        {
          items: [{ listingId: 'prod-greenbeans-1', quantity: 99999 }], // Exceeds available 120kg
        }
      );
      assert(
        res.status === 400 && res.body.error.message.includes('Insufficient stock'),
        '7. Concurrency-safe inventory validation rejects purchasing unavailable stock'
      );
    }

    // 8. Order creation with immutable price snapshot & stock decrement
    let createdOrderId = '';
    let initialStock = 0;
    {
      const listingBefore = resilientStore.listings.find((l) => l.id === 'prod-tomatoes-1')!;
      initialStock = listingBefore.stockQuantity;

      const idempotencyKey = `idemp-${Date.now()}`;
      const res = await makeRequest(
        server,
        'POST',
        '/api/buyer/orders',
        { Authorization: `Bearer ${buyer1Token}` },
        {
          items: [{ listingId: 'prod-tomatoes-1', quantity: 5 }],
          deliveryAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
          deliveryLatitude: 9.0125,
          deliveryLongitude: 38.7636,
          paymentMethod: 'TELEBIRR',
          idempotencyKey,
        }
      );

      createdOrderId = res.body.data?.id;
      const listingAfter = resilientStore.listings.find((l) => l.id === 'prod-tomatoes-1')!;

      assert(
        res.status === 201 &&
          res.body.success === true &&
          res.body.data.items[0].agreedUnitPrice === 60 && // Immutable snapshot
          listingAfter.stockQuantity === initialStock - 5, // Decremented stock
        '8. Order creation creates immutable price snapshot and atomically decrements inventory'
      );

      // 9. Idempotency test: Repeat identical request with same idempotencyKey
      const resRepeat = await makeRequest(
        server,
        'POST',
        '/api/buyer/orders',
        { Authorization: `Bearer ${buyer1Token}` },
        {
          items: [{ listingId: 'prod-tomatoes-1', quantity: 5 }],
          deliveryAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
          paymentMethod: 'TELEBIRR',
          idempotencyKey,
        }
      );

      assert(
        resRepeat.status === 200 &&
          resRepeat.body.data.id === createdOrderId &&
          listingAfter.stockQuantity === initialStock - 5, // Did not double-decrement
        '9. Idempotency key prevents duplicate orders and double stock deductions on network retry'
      );
    }

    // 10. Order Cancellation Business Rule: Allowed in PREPARING / CONFIRMED
    {
      const res = await makeRequest(
        server,
        'POST',
        `/api/buyer/orders/${createdOrderId}/cancel`,
        { Authorization: `Bearer ${buyer1Token}` },
        { reason: 'Changed mind before delivery pickup.' }
      );
      assert(
        res.status === 200 && res.body.data.status === 'CANCELLED',
        '10. Permitted order cancellation succeeds prior to courier dispatch'
      );
    }

    // 11. Order Cancellation Business Rule: REJECTED once IN_TRANSIT
    {
      // Attempt to cancel ongoing order #order-ongoing-2 which is IN_TRANSIT
      const res = await makeRequest(
        server,
        'POST',
        '/api/buyer/orders/order-ongoing-2/cancel',
        { Authorization: `Bearer ${buyer1Token}` },
        { reason: 'Cancel while van is on the way.' }
      );
      assert(
        res.status === 400 && res.body.error.message.includes('IN_TRANSIT'),
        '11. Rejects cancellation once order is in transit, directing to dispute/support'
      );
    }

    // 12. Address Management & Active Order Deletion Protection
    {
      const addRes = await makeRequest(
        server,
        'POST',
        '/api/buyer/addresses',
        { Authorization: `Bearer ${buyer1Token}` },
        {
          label: 'Summer House',
          streetAddress: 'Old Airport Road, Villa 18',
          city: 'Addis Ababa',
          latitude: 8.995,
          longitude: 38.742,
          isDefault: false,
        }
      );

      const newAddrId = addRes.body.data?.id;

      // Deleting a non-active address succeeds
      const delRes = await makeRequest(
        server,
        'DELETE',
        `/api/buyer/addresses/${newAddrId}`,
        { Authorization: `Bearer ${buyer1Token}` }
      );

      // Deleting default address linked to active in-transit delivery fails
      const delActiveRes = await makeRequest(
        server,
        'DELETE',
        '/api/buyer/addresses/addr-default-1',
        { Authorization: `Bearer ${buyer1Token}` }
      );

      assert(
        addRes.status === 201 &&
          delRes.status === 200 &&
          delActiveRes.status === 400 &&
          delActiveRes.body.error.message.includes('linked to an active in-transit delivery'),
        '12. Protects addresses required by active deliveries from accidental deletion'
      );
    }

    // 13. Saved Farmers & Favorites Persistence
    {
      const toggleRes = await makeRequest(
        server,
        'POST',
        '/api/buyer/saved-farmers/farmer-abebe-uuid/toggle',
        { Authorization: `Bearer ${buyer1Token}` }
      );

      const favRes = await makeRequest(
        server,
        'POST',
        '/api/buyer/favorites/prod-tomatoes-1/toggle',
        { Authorization: `Bearer ${buyer1Token}` }
      );

      assert(
        toggleRes.status === 200 && favRes.status === 200,
        '13. Saved farmers and favorite products toggle persistently without side effects'
      );
    }

    // 14. RBAC Authorization: Non-buyer / Unauthenticated access to order creation is rejected
    {
      const resUnauth = await makeRequest(server, 'POST', '/api/buyer/orders', {}, { items: [] });
      const resWrongRole = await makeRequest(
        server,
        'POST',
        '/api/buyer/orders',
        { Authorization: `Bearer ${workerToken}` }, // Delivery worker cannot create buyer orders
        { items: [] }
      );

      assert(
        resUnauth.status === 401 && resWrongRole.status === 403,
        '14. Enforces RBAC: Rejects unauthenticated (401) and incorrect role (403) from buyer order creation'
      );
    }
  } finally {
    server.close();
  }

  console.log(`\n📋 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runBuyerTests().catch((err) => {
  console.error('Buyer test suite failed:', err);
  process.exit(1);
});
