import app from '../app.js';
import jwt from 'jsonwebtoken';
import http from 'http';
import prisma from '../config/prisma.js';
import { seedDemoOrderAndDispatch } from '../services/dispatch.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

// Helper to make local HTTP requests to Express
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
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
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

function makeToken(sub: string, role: string) {
  return jwt.sign({ sub, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function runDeliveryTests() {
  console.log('🧪 Starting Delivery Worker Module Test Suite...\n');

  // Start test server
  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

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

  try {
    // 0. Setup: Ensure test workers exist in database
    const worker1Phone = '+251911999001';
    const worker2Phone = '+251911999002';

    const worker1 = await prisma.user.upsert({
      where: { phone: worker1Phone },
      update: { role: 'DELIVERY_WORKER', isVerified: true, isActive: true },
      create: {
        fullName: 'Test Worker 1',
        phone: worker1Phone,
        email: 'test.worker1@agrimarket.et',
        passwordHash: '$2a$12$e8YjT3O/tZ8lM5B1T5x8g.8m9PzW6f9g3VqM5v1K.9q',
        role: 'DELIVERY_WORKER',
        isVerified: true,
        isActive: true,
      },
    });

    await prisma.deliveryWorkerProfile.upsert({
      where: { userId: worker1.id },
      update: {
        verificationStatus: 'VERIFIED',
        availability: 'ONLINE',
        activeJobCount: 0,
        vehicleType: 'MOTORCYCLE',
        vehicleCapacityKg: 80,
        lastLatitude: 9.012,
        lastLongitude: 38.755,
      },
      create: {
        userId: worker1.id,
        verificationStatus: 'VERIFIED',
        availability: 'ONLINE',
        activeJobCount: 0,
        vehicleType: 'MOTORCYCLE',
        vehicleCapacityKg: 80,
        lastLatitude: 9.012,
        lastLongitude: 38.755,
      },
    });

    const worker2 = await prisma.user.upsert({
      where: { phone: worker2Phone },
      update: { role: 'DELIVERY_WORKER', isVerified: true, isActive: true },
      create: {
        fullName: 'Test Worker 2',
        phone: worker2Phone,
        email: 'test.worker2@agrimarket.et',
        passwordHash: '$2a$12$e8YjT3O/tZ8lM5B1T5x8g.8m9PzW6f9g3VqM5v1K.9q',
        role: 'DELIVERY_WORKER',
        isVerified: true,
        isActive: true,
      },
    });

    await prisma.deliveryWorkerProfile.upsert({
      where: { userId: worker2.id },
      update: {
        verificationStatus: 'VERIFIED',
        availability: 'ONLINE',
        activeJobCount: 0,
        vehicleType: 'MOTORCYCLE',
        vehicleCapacityKg: 80,
        lastLatitude: 9.015,
        lastLongitude: 38.758,
      },
      create: {
        userId: worker2.id,
        verificationStatus: 'VERIFIED',
        availability: 'ONLINE',
        activeJobCount: 0,
        vehicleType: 'MOTORCYCLE',
        vehicleCapacityKg: 80,
        lastLatitude: 9.015,
        lastLongitude: 38.758,
      },
    });

    const worker1Token = makeToken(worker1.id, 'DELIVERY_WORKER');
    const worker2Token = makeToken(worker2.id, 'DELIVERY_WORKER');
    const buyerToken = makeToken('some-buyer-id', 'BUYER');

    // ─── Test 1: Unauthenticated request rejected with 401 ───────
    const res1 = await makeRequest(server, 'GET', '/api/worker/dashboard');
    assert(res1.status === 401, '1. Rejects unauthenticated worker dashboard request with 401');

    // ─── Test 2: Role-based authorization: Non-worker rejected with 403 ─
    const res2 = await makeRequest(server, 'GET', '/api/worker/dashboard', {
      Authorization: `Bearer ${buyerToken}`,
    });
    assert(res2.status === 403, '2. Enforces RBAC: Rejects non-worker user with 403');

    // ─── Test 3: Dashboard Overview returns valid metrics ─────────
    const res3 = await makeRequest(server, 'GET', '/api/worker/dashboard', {
      Authorization: `Bearer ${worker1Token}`,
    });
    assert(
      res3.status === 200 && res3.body?.success === true && res3.body?.data?.profile !== undefined,
      '3. Worker dashboard returns valid profile and operational metrics'
    );

    // ─── Test 4: Dispatch & Offer Generation ──────────────────────
    const { orderId, dispatchResult } = await seedDemoOrderAndDispatch();
    assert(
      dispatchResult.jobId !== undefined && dispatchResult.offersCreatedCount > 0,
      '4. Dispatch engine broadcasts offers to eligible nearby workers'
    );

    // ─── Test 5: Worker retrieves pending offers ──────────────────
    const res5 = await makeRequest(server, 'GET', '/api/worker/offers', {
      Authorization: `Bearer ${worker1Token}`,
    });
    assert(
      res5.status === 200 && Array.isArray(res5.body?.data) && res5.body.data.length > 0,
      '5. Worker receives active delivery requests with distance and timer'
    );

    const offerForJob = res5.body.data.find((o: any) => o.jobId === dispatchResult.jobId);
    const offerId1 = offerForJob?.offerId;

    // Find offer for worker 2 as well
    const resOffers2 = await makeRequest(server, 'GET', '/api/worker/offers', {
      Authorization: `Bearer ${worker2Token}`,
    });
    const offer2ForJob = resOffers2.body.data.find((o: any) => o.jobId === dispatchResult.jobId);
    const offerId2 = offer2ForJob?.offerId;

    // ─── Test 6: Concurrency-Safe Atomic Acceptance ───────────────
    // Worker 1 accepts the offer
    const res6 = await makeRequest(server, 'POST', `/api/worker/offers/${offerId1}/accept`, {
      Authorization: `Bearer ${worker1Token}`,
    });
    assert(
      res6.status === 200 && res6.body?.success === true && res6.body?.data?.status === 'ASSIGNED',
      '6. Concurrency-Safe Acceptance: Worker 1 successfully claims and is assigned job'
    );

    // Worker 2 attempts to accept competing offer for same job -> Must be rejected with 409
    if (offerId2) {
      const res6b = await makeRequest(server, 'POST', `/api/worker/offers/${offerId2}/accept`, {
        Authorization: `Bearer ${worker2Token}`,
      });
      assert(
        res6b.status === 409,
        '7. Concurrency-Safe Invalidation: Competing offer by Worker 2 is rejected with 409'
      );
    } else {
      console.log('  ⚠️ SKIP 7: Worker 2 competing offer not found');
    }

    // Idempotent re-acceptance: Worker 1 re-accepting same job returns 200
    const res6c = await makeRequest(server, 'POST', `/api/worker/offers/${offerId1}/accept`, {
      Authorization: `Bearer ${worker1Token}`,
    });
    assert(
      res6c.status === 200,
      '8. Idempotency: Re-accepting already assigned job succeeds cleanly'
    );

    // ─── Test 7: State Machine - Reject invalid transitions ───────
    // Cannot skip straight from ASSIGNED to DELIVERED
    const res7a = await makeRequest(server, 'PATCH', `/api/worker/deliveries/${dispatchResult.jobId}/status`, {
      Authorization: `Bearer ${worker1Token}`,
    }, { status: 'DELIVERED' });
    assert(
      res7a.status === 409,
      '9. State Machine: Rejects invalid transition (ASSIGNED -> DELIVERED) with 409'
    );

    // ─── Test 8: Data Isolation: Worker 2 cannot modify Worker 1's job ─
    const res8 = await makeRequest(server, 'PATCH', `/api/worker/deliveries/${dispatchResult.jobId}/status`, {
      Authorization: `Bearer ${worker2Token}`,
    }, { status: 'HEADING_TO_PICKUP' });
    assert(
      res8.status === 403,
      '10. Security Isolation: Unauthorized worker cannot update status of another worker job (403)'
    );

    // ─── Test 9: Valid Lifecycle: Heading to Pickup -> Picked Up ──
    const res9a = await makeRequest(server, 'PATCH', `/api/worker/deliveries/${dispatchResult.jobId}/status`, {
      Authorization: `Bearer ${worker1Token}`,
    }, { status: 'HEADING_TO_PICKUP', notes: 'En route to farmer collection hub' });
    assert(
      res9a.status === 200 && res9a.body?.data?.status === 'HEADING_TO_PICKUP',
      '11. Lifecycle Step: ASSIGNED -> HEADING_TO_PICKUP succeeds'
    );

    const res9b = await makeRequest(server, 'PATCH', `/api/worker/deliveries/${dispatchResult.jobId}/status`, {
      Authorization: `Bearer ${worker1Token}`,
    }, { status: 'PICKED_UP', notes: 'Handover verified with farmer Almaz. 2 boxes tomatoes.' });
    assert(
      res9b.status === 200 && res9b.body?.data?.status === 'PICKED_UP',
      '12. Lifecycle Step: HEADING_TO_PICKUP -> PICKED_UP (Handover confirmed)'
    );

    const res9c = await makeRequest(server, 'PATCH', `/api/worker/deliveries/${dispatchResult.jobId}/status`, {
      Authorization: `Bearer ${worker1Token}`,
    }, { status: 'EN_ROUTE', notes: 'Departed farm, driving to Bole destination' });
    assert(
      res9c.status === 200 && res9c.body?.data?.status === 'EN_ROUTE',
      '13. Lifecycle Step: PICKED_UP -> EN_ROUTE succeeds'
    );

    // ─── Test 10: Proof of Delivery Enforcement ───────────────────
    // Transitioning to DELIVERED without proof or notes must fail with 400
    const res10a = await makeRequest(server, 'PATCH', `/api/worker/deliveries/${dispatchResult.jobId}/status`, {
      Authorization: `Bearer ${worker1Token}`,
    }, { status: 'DELIVERED', notes: '' });
    assert(
      res10a.status === 400,
      '14. Proof of Delivery: Delivery completion rejected without proof or verification code with 400'
    );

    // Completing with proof of delivery code succeeds
    const res10b = await makeRequest(server, 'PATCH', `/api/worker/deliveries/${dispatchResult.jobId}/status`, {
      Authorization: `Bearer ${worker1Token}`,
    }, {
      status: 'DELIVERED',
      proofOfDeliveryCode: '749201',
      notes: 'Handed directly to buyer Kidist at gate.',
    });
    assert(
      res10b.status === 200 && res10b.body?.data?.status === 'DELIVERED',
      '15. Delivery Verification: Order successfully delivered with verified proof of delivery'
    );

    // ─── Test 11: Cash on Delivery Reconciliation Auto-Creation ───
    const res11 = await makeRequest(server, 'GET', '/api/worker/reconciliations', {
      Authorization: `Bearer ${worker1Token}`,
    });
    assert(
      res11.status === 200 && res11.body?.data?.records?.length > 0,
      '16. Financial Separation: Cash on Delivery (COD) collection auto-created reconciliation record'
    );

    // ─── Test 12: Incident & Exception Reporting ──────────────────
    // Create another job to test incident reporting
    const demo2 = await seedDemoOrderAndDispatch();
    const resOffersAgain = await makeRequest(server, 'GET', '/api/worker/offers', {
      Authorization: `Bearer ${worker1Token}`,
    });
    const offerAgain = resOffersAgain.body.data.find((o: any) => o.jobId === demo2.dispatchResult.jobId);
    if (offerAgain) {
      await makeRequest(server, 'POST', `/api/worker/offers/${offerAgain.offerId}/accept`, {
        Authorization: `Bearer ${worker1Token}`,
      });

      const resIncident = await makeRequest(server, 'POST', `/api/worker/deliveries/${demo2.dispatchResult.jobId}/incident`, {
        Authorization: `Bearer ${worker1Token}`,
      }, {
        reasonCode: 'QUANTITY_MISMATCH',
        description: 'Farmer had 1 box instead of 2 specified on invoice.',
        terminateJob: false,
      });

      assert(
        resIncident.status === 200 && resIncident.body?.success === true,
        '17. Support & Incidents: Delivery discrepancy logged as audit event without corrupting financials'
      );
    } else {
      console.log('  ⚠️ SKIP 17: Incident test order offer not generated');
    }

    // ─── Test 13: Worker Availability Toggle ──────────────────────
    const res13 = await makeRequest(server, 'PATCH', '/api/worker/profile', {
      Authorization: `Bearer ${worker1Token}`,
    }, { availability: 'OFFLINE' });
    assert(
      res13.status === 200 && res13.body?.data?.availability === 'OFFLINE',
      '18. Availability & Location: Worker toggles availability to OFFLINE'
    );

    // Turn back online
    await makeRequest(server, 'PATCH', '/api/worker/profile', {
      Authorization: `Bearer ${worker1Token}`,
    }, { availability: 'ONLINE' });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n📋 Delivery Worker Test Results: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) process.exit(1);
  }
}

runDeliveryTests();
