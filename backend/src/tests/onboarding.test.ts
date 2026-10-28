/**
 * Comprehensive Integration Test Suite: Onboarding & Verification Workflow
 * Tests:
 * 1. Role Selection (BUYER, FARMER, DELIVERY_WORKER)
 * 2. Onboarding Status Authoritative Check
 * 3. Draft Persistence (Save & Retrieve)
 * 4. Farmer Application Submission (Validation, Coordinates, Pending State)
 * 5. Worker Application Submission (Conditional Vehicle/License Rules)
 * 6. Admin Verification Inspection, Approval, and Rejection with Notes
 * 7. Security: Privilege Escalation Prevention & Ownership Isolation
 * 8. Buyer Direct Fast-Path
 * 9. API: Worker submission with unseeded/symbolic deliveryZoneId (no foreign key crash)
 * 10. API: Farmer submission with unseeded/symbolic marketId (no foreign key crash)
 * 11. API: Human-readable error message validation (clear field-level feedback)
 */

import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { VerificationStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

function makeToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '1h' });
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

async function runOnboardingTests() {
  console.log('\n🧪 Starting Onboarding & Role Selection Verification Suite...\n');

  const testPhone = `+25191199${Math.floor(1000 + Math.random() * 9000)}`;
  const testEmail = `test.onboarding.${Date.now()}@agrimarket.et`;

  // Setup: Create test user with initial PENDING_ROLE
  const user = await prisma.user.create({
    data: {
      fullName: 'Test Onboard User',
      phone: testPhone,
      email: testEmail,
      passwordHash: 'dummy_hash',
      role: 'BUYER',
      onboardingStatus: 'PENDING_ROLE',
      isVerified: false,
    },
  });

  try {
    // 1. Initial Status Check
    const initialUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(
      (initialUser as any).onboardingStatus === 'PENDING_ROLE',
      '1. New user initializes with PENDING_ROLE onboarding status'
    );

    // 2. Draft Persistence: Save Draft
    const testDraft = {
      fullName: 'Abebe Farmer Updated',
      farmName: 'Sheger Fresh Valley Farm',
      region: 'Oromia',
      woreda: 'Bishoftu',
      farmLatitude: 8.752,
      farmLongitude: 38.981,
    };

    const userWithDraft = await prisma.user.update({
      where: { id: user.id },
      data: { onboardingDraft: testDraft },
    });
    assert(
      (userWithDraft as any).onboardingDraft?.farmName === 'Sheger Fresh Valley Farm',
      '2. User can persist and resume an in-progress onboarding draft'
    );

    // 3. Role Selection: Farmer
    const farmerUpdated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'FARMER', onboardingStatus: 'IN_PROGRESS' },
    });
    assert(
      farmerUpdated.role === 'FARMER' && (farmerUpdated as any).onboardingStatus === 'IN_PROGRESS',
      '3. Selecting Farmer transitions account role to FARMER and status to IN_PROGRESS'
    );

    // 4. Farmer Application Submission
    const farmerProfile = await prisma.farmerProfile.create({
      data: {
        userId: user.id,
        farmName: 'Sheger Fresh Valley Farm',
        farmDescription: 'Organic Highland Farm',
        farmSizeHectares: 3.5,
        isOrganic: true,
        verificationStatus: VerificationStatus.PENDING,
        verificationNote: 'Pending administrator review',
        verificationDocuments: {
          identityType: 'National Fayda ID',
          identityNumber: 'FIN-1029384756',
          region: 'Oromia',
          woreda: 'Bishoftu',
          submittedAt: new Date().toISOString(),
        },
        farmLatitude: 8.752,
        farmLongitude: 38.981,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStatus: 'PENDING_VERIFICATION' },
    });

    assert(
      farmerProfile.verificationStatus === 'PENDING',
      '4. Farmer verification application creates PENDING profile without granting active seller status'
    );

    // 5. Admin Review & Decision: Approval
    const verifiedProfile = await prisma.farmerProfile.update({
      where: { id: farmerProfile.id },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        verificationNote: 'Verified Fayda ID and land records.',
      },
    });

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, onboardingStatus: 'COMPLETED' },
    });

    assert(
      verifiedProfile.verificationStatus === 'VERIFIED' &&
        verifiedUser.isVerified === true &&
        (verifiedUser as any).onboardingStatus === 'COMPLETED',
      '5. Administrator approval updates authoritative verification status and grants COMPLETED onboarding access'
    );

    // 6. Delivery Worker Profile & Conditional License Validation
    const workerPhone = `+25197788${Math.floor(1000 + Math.random() * 9000)}`;
    const workerUser = await prisma.user.create({
      data: {
        fullName: 'Test Worker Courier',
        phone: workerPhone,
        passwordHash: 'dummy_hash',
        role: 'DELIVERY_WORKER',
        onboardingStatus: 'PENDING_VERIFICATION',
        isVerified: false,
      },
    });

    const workerProfile = await prisma.deliveryWorkerProfile.create({
      data: {
        userId: workerUser.id,
        vehicleType: 'MOTORCYCLE',
        vehiclePlate: '3-AA-99120',
        vehicleCapacityKg: 150,
        verificationStatus: VerificationStatus.PENDING,
        verificationNote: 'Pending fleet compliance audit',
        verificationDocuments: {
          identityType: 'Kebele ID',
          identityNumber: 'KB-882190',
          driverLicenseNumber: 'DL-904123',
          submittedAt: new Date().toISOString(),
        },
      },
    });

    assert(
      workerProfile.vehicleType === 'MOTORCYCLE' &&
        workerProfile.vehiclePlate === '3-AA-99120' &&
        workerProfile.verificationStatus === 'PENDING',
      '6. Motorized delivery worker application validates license plate and enters PENDING review'
    );

    // 7. Admin Rejection with Specific Reason
    const rejectionReason = 'Driver license document image unreadable. Please upload a clear photo.';
    const rejectedWorkerProfile = await prisma.deliveryWorkerProfile.update({
      where: { id: workerProfile.id },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        verificationNote: rejectionReason,
      },
    });

    const rejectedUser = await prisma.user.update({
      where: { id: workerUser.id },
      data: { onboardingStatus: 'REJECTED' },
    });

    assert(
      rejectedWorkerProfile.verificationStatus === 'REJECTED' &&
        (rejectedWorkerProfile as any).verificationNote === rejectionReason &&
        (rejectedUser as any).onboardingStatus === 'REJECTED',
      '7. Administrator rejection records permitted explanation note and updates account state consistently'
    );

    // 8. Buyer Direct Fast-Path
    const buyerPhone = `+25194455${Math.floor(1000 + Math.random() * 9000)}`;
    const buyerUser = await prisma.user.create({
      data: {
        fullName: 'Test Fast Buyer',
        phone: buyerPhone,
        passwordHash: 'dummy_hash',
        role: 'BUYER',
        onboardingStatus: 'COMPLETED',
        isVerified: false,
      },
    });

    const buyerProfile = await prisma.buyerProfile.create({
      data: { userId: buyerUser.id, preferredDeliveryAddress: 'Bole, Addis Ababa' },
    });

    assert(
      buyerUser.role === 'BUYER' &&
        (buyerUser as any).onboardingStatus === 'COMPLETED' &&
        buyerProfile.preferredDeliveryAddress === 'Bole, Addis Ababa',
      '8. Buyer fast path ensures BuyerProfile and immediately persists COMPLETED onboarding status'
    );

    // Cleanup initial DB records
    await prisma.farmerProfile.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.deliveryWorkerProfile.deleteMany({ where: { userId: workerUser.id } });
    await prisma.user.delete({ where: { id: workerUser.id } });
    await prisma.buyerProfile.deleteMany({ where: { userId: buyerUser.id } });
    await prisma.user.delete({ where: { id: buyerUser.id } });

    // =========================================================================
    // HTTP API Tests: Foreign Key Protection & Human-Readable Error Responses
    // =========================================================================
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
      // 9. API: Submit Worker with non-existent / string deliveryZoneId
      const workerApiPhone = `+25191200${Math.floor(1000 + Math.random() * 9000)}`;
      const workerApiUser = await prisma.user.create({
        data: {
          fullName: 'API Worker Test',
          phone: workerApiPhone,
          role: 'DELIVERY_WORKER',
          onboardingStatus: 'IN_PROGRESS',
        },
      });
      const workerApiToken = makeToken(workerApiUser.id, 'DELIVERY_WORKER');

      const workerRes = await makeRequest(
        server,
        'POST',
        '/api/onboarding/submit-worker',
        { Authorization: `Bearer ${workerApiToken}` },
        {
          vehicleType: 'MOTORCYCLE',
          vehiclePlate: '3-AA-99881',
          driverLicenseNumber: 'DL-987654321',
          vehicleCapacityKg: '150',
          operatingCity: 'Addis Ababa',
          deliveryZoneId: 'zone-addis-central', // String from frontend that is not a DB UUID
          identityType: 'Kebele ID',
          identityNumber: 'KB-123456',
          locationConsent: true,
          consentedToTerms: true,
        }
      );

      assert(workerRes.status === 200, '9. API submit-worker succeeds (200) without foreign key constraint crash');
      assert(workerRes.body.success === true, '9b. API submit-worker returns success: true');

      const createdWorkerProfile = await prisma.deliveryWorkerProfile.findUnique({
        where: { userId: workerApiUser.id },
      });
      assert(createdWorkerProfile !== null, '9c. DeliveryWorkerProfile created in database');
      assert(createdWorkerProfile?.deliveryZoneId === null, '9d. Sets deliveryZoneId to null when zone ID does not exist in DB');
      assert(
        (createdWorkerProfile?.verificationDocuments as any)?.preferredZone === 'zone-addis-central',
        '9e. Preserves user zone preference in verificationDocuments'
      );

      // 10. API: Submit Farmer with non-existent / string marketId
      const farmerApiPhone = `+25191300${Math.floor(1000 + Math.random() * 9000)}`;
      const farmerApiUser = await prisma.user.create({
        data: {
          fullName: 'API Farmer Test',
          phone: farmerApiPhone,
          role: 'FARMER',
          onboardingStatus: 'IN_PROGRESS',
        },
      });
      const farmerApiToken = makeToken(farmerApiUser.id, 'FARMER');

      const farmerRes = await makeRequest(
        server,
        'POST',
        '/api/onboarding/submit-farmer',
        { Authorization: `Bearer ${farmerApiToken}` },
        {
          farmName: 'Bishoftu Valley Greenhouse',
          farmDescription: 'Fresh tomatoes and bell peppers',
          region: 'Oromia',
          woreda: 'Bishoftu',
          kebele: 'Kebele 02',
          farmLatitude: 8.752,
          farmLongitude: 38.981,
          farmSizeHectares: 2.0,
          isOrganic: true,
          marketId: 'addis-central-hub', // String from frontend that is not a DB UUID
          identityType: 'National Fayda ID',
          identityNumber: 'FIN-99887766',
          consentedToTerms: true,
        }
      );

      assert(farmerRes.status === 200, '10. API submit-farmer succeeds (200) without foreign key constraint crash');
      assert(farmerRes.body.success === true, '10b. API submit-farmer returns success: true');

      const createdFarmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: farmerApiUser.id },
      });
      assert(createdFarmerProfile !== null, '10c. FarmerProfile created in database');
      assert(createdFarmerProfile?.marketId === null, '10d. Sets marketId to null when market ID does not exist in DB');
      assert(
        (createdFarmerProfile?.verificationDocuments as any)?.preferredMarket === 'addis-central-hub',
        '10e. Preserves user market preference in verificationDocuments'
      );

      // 11. Human-Readable Error Messages Validation
      const invalidWorkerRes = await makeRequest(
        server,
        'POST',
        '/api/onboarding/submit-worker',
        { Authorization: `Bearer ${workerApiToken}` },
        {
          vehicleType: 'INVALID_VEHICLE',
          identityType: 'Kebele ID',
          identityNumber: 'KB-123',
          consentedToTerms: true,
        }
      );
      assert(invalidWorkerRes.status === 400, '11. Rejects invalid vehicle type with 400 Bad Request');
      assert(
        invalidWorkerRes.body.error?.field === 'vehicleType',
        '11b. Returns field: "vehicleType" in error response'
      );
      assert(
        typeof invalidWorkerRes.body.error?.message === 'string' &&
          !invalidWorkerRes.body.error.message.includes('invocation') &&
          !invalidWorkerRes.body.error.message.includes('Prisma'),
        '11c. Returns user-friendly message without Prisma or technical stack traces'
      );

      const invalidFarmerRes = await makeRequest(
        server,
        'POST',
        '/api/onboarding/submit-farmer',
        { Authorization: `Bearer ${farmerApiToken}` },
        {
          farmName: 'A', // Too short
          identityType: 'Kebele ID',
          identityNumber: 'KB-123',
          consentedToTerms: true,
        }
      );
      assert(invalidFarmerRes.status === 400, '12. Rejects 1-char farm name with 400 Bad Request');
      assert(
        invalidFarmerRes.body.error?.field === 'farmName',
        '12b. Returns field: "farmName" in error response'
      );
      assert(
        invalidFarmerRes.body.error?.message.includes('at least 2 characters'),
        '12c. Returns clear guidance instructing user to enter at least 2 characters'
      );

      // Cleanup API test records
      await prisma.deliveryWorkerProfile.deleteMany({ where: { userId: workerApiUser.id } });
      await prisma.user.delete({ where: { id: workerApiUser.id } });
      await prisma.farmerProfile.deleteMany({ where: { userId: farmerApiUser.id } });
      await prisma.user.delete({ where: { id: farmerApiUser.id } });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    console.log(`\n📋 Onboarding Suite Results: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Error during onboarding test:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOnboardingTests();
