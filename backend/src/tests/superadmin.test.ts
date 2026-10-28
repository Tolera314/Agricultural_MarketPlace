import app from '../app.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

async function runSuperadminTests() {
  console.log('🧪 Starting Superadmin RBAC & Governance Test Suite...');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Fetch SuperAdmin user
    const superadminUser = await prisma.user.findUnique({
      where: { phone: '+251911223344' },
    });
    assert(!!superadminUser, 'SuperAdmin user exists in database');
    assert(superadminUser?.role === 'SUPERADMIN', 'SuperAdmin has role=SUPERADMIN');

    // 2. Tokens
    const superadminToken = jwt.sign(
      { sub: superadminUser!.id, role: 'SUPERADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const adminToken = jwt.sign(
      { sub: 'test-ordinary-admin-id', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const buyerToken = jwt.sign(
      { sub: 'test-buyer-id', role: 'BUYER' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ─── Test 1: Authentication enforcement (401) ───
    const unauthRes = await fetch(`${baseUrl}/api/superadmin/dashboard`);
    assert(unauthRes.status === 401, 'Unauthenticated request to /api/superadmin/dashboard returns 401');

    // ─── Test 2: Role boundary: ordinary ADMIN cannot access Superadmin (403) ───
    const adminForbiddenRes = await fetch(`${baseUrl}/api/superadmin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminForbiddenRes.status === 403, 'Ordinary ADMIN role is rejected with 403 Forbidden');

    // ─── Test 3: Role boundary: BUYER cannot access Superadmin (403) ───
    const buyerForbiddenRes = await fetch(`${baseUrl}/api/superadmin/settings`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(buyerForbiddenRes.status === 403, 'BUYER role is rejected with 403 Forbidden');

    // ─── Test 4: Dashboard Overview returns 200 with platform growth & metrics ───
    const dashRes = await fetch(`${baseUrl}/api/superadmin/dashboard?period=30d`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(dashRes.status === 200, 'Superadmin Dashboard returns 200 OK');
    const dashData = (await dashRes.json()).data;
    assert(dashData.metrics.totalUsers > 0, 'Total users count is positive');
    assert(dashData.metrics.totalFarmers > 0, 'Total farmers count is positive');
    assert(dashData.metrics.totalBuyers > 0, 'Total buyers count is positive');
    assert(Array.isArray(dashData.platformGrowth) && dashData.platformGrowth.length === 4, 'Platform growth contains 4 week intervals');
    assert(Array.isArray(dashData.cityTradeOverview), 'City trade overview is an array');
    assert(Array.isArray(dashData.recentActivities), 'Recent activities is an array');

    // ─── Test 5: Users list and filtering ───
    const usersRes = await fetch(`${baseUrl}/api/superadmin/users?limit=10`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(usersRes.status === 200, 'Superadmin Users endpoint returns 200 OK');
    const usersJson = await usersRes.json();
    assert(Array.isArray(usersJson.data.users), 'Users data is an array');
    assert(usersJson.data.pagination.total > 0, 'User pagination returns total count');

    // ─── Test 6: Settings read & update ───
    const getSettingsRes = await fetch(`${baseUrl}/api/superadmin/settings`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(getSettingsRes.status === 200, 'Superadmin Settings GET returns 200 OK');
    const settingsJson = await getSettingsRes.json();
    assert(settingsJson.data.platform.currency === 'ETB', 'Settings currency is ETB');

    const patchSettingsRes = await fetch(`${baseUrl}/api/superadmin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`,
      },
      body: JSON.stringify({
        patch: {
          limits: { localMaxOrderValue: 60000 },
        },
        reason: 'Automated test updating limit',
      }),
    });
    assert(patchSettingsRes.status === 200, 'Superadmin Settings PATCH returns 200 OK');
    const patchJson = await patchSettingsRes.json();
    assert(patchJson.data.limits.localMaxOrderValue === 60000, 'Updated limit is persisted');

    // ─── Test 7: Regions & Markets ───
    const marketsRes = await fetch(`${baseUrl}/api/superadmin/markets`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(marketsRes.status === 200, 'Superadmin Markets GET returns 200 OK');
    const marketsJson = await marketsRes.json();
    assert(Array.isArray(marketsJson.data.markets), 'Markets data is an array');
    assert(Array.isArray(marketsJson.data.cities), 'Cities data is an array');

    // ─── Test 8: Intercity Routes ───
    const routesRes = await fetch(`${baseUrl}/api/superadmin/routes`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(routesRes.status === 200, 'Superadmin Routes GET returns 200 OK');
    const routesJson = await routesRes.json();
    assert(Array.isArray(routesJson.data.routes), 'Routes list is an array');

    // ─── Test 9: Commissions & Pricing Rules ───
    const commRes = await fetch(`${baseUrl}/api/superadmin/commissions`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(commRes.status === 200, 'Superadmin Commissions GET returns 200 OK');
    const commJson = await commRes.json();
    assert(Array.isArray(commJson.data), 'Pricing rules is an array');

    // ─── Test 10: Reports & Analytics ───
    const repRes = await fetch(`${baseUrl}/api/superadmin/reports?period=30d`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(repRes.status === 200, 'Superadmin Reports GET returns 200 OK');
    const repJson = await repRes.json();
    assert(repJson.data.financials.grossVolume >= 0, 'Reports gross volume is non-negative');
    assert(Array.isArray(repJson.data.userDistribution), 'User distribution breakdown exists');

    // ─── Test 11: Audit Logs ───
    const auditRes = await fetch(`${baseUrl}/api/superadmin/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(auditRes.status === 200, 'Superadmin Audit Logs GET returns 200 OK');
    const auditJson = await auditRes.json();
    assert(Array.isArray(auditJson.data.logs), 'Audit logs data is an array');

    // ─── Test 12: Security Overview ───
    const secRes = await fetch(`${baseUrl}/api/superadmin/security`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(secRes.status === 200, 'Superadmin Security Overview returns 200 OK');
    const secJson = await secRes.json();
    assert(secJson.data.posture.superadminCount >= 1, 'Security posture reports at least 1 superadmin');

    // ─── Test 13: Database Health & Backup Snapshot ───
    const healthRes = await fetch(`${baseUrl}/api/superadmin/backup/health`, {
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(healthRes.status === 200, 'Superadmin Database Health returns 200 OK');
    const healthJson = await healthRes.json();
    assert(healthJson.data.status === 'HEALTHY', 'Database status is HEALTHY');
    assert(healthJson.data.connectionLatencyMs >= 0, 'Connection latency is recorded');

    const backupRes = await fetch(`${baseUrl}/api/superadmin/backup/snapshot`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
    assert(backupRes.status === 200, 'Superadmin Backup Snapshot trigger returns 200 OK');
    const backupJson = await backupRes.json();
    assert(backupJson.data.status === 'COMPLETED', 'Backup snapshot status is COMPLETED');

    // ─── Test 14: Safeguard: Cannot deactivate or demote last active Superadmin ───
    // Selamawit Assefa is the sole active superadmin in this test run
    const deactivateSoleSuperadminRes = await fetch(`${baseUrl}/api/superadmin/users/${superadminUser!.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`,
      },
      body: JSON.stringify({
        isActive: false,
        reason: 'Should fail safeguard check',
      }),
    });
    assert(
      deactivateSoleSuperadminRes.status === 400,
      'Safeguard protects sole active Superadmin from deactivation (400)'
    );

    console.log(`\n📋 Superadmin Suite Results: ${passed} passed, ${failed} failed.`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    await prisma.$disconnect();
    if (failed > 0) process.exit(1);
  }
}

runSuperadminTests();

