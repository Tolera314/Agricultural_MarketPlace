import app from '../app.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';
async function runTests() {
    console.log('--- Starting Admin API Automated Tests ---');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const baseUrl = `http://localhost:${address.port}`;
    let passed = 0;
    let failed = 0;
    function assert(condition, testName) {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        }
        else {
            console.error(`[FAIL] ${testName}`);
            failed++;
        }
    }
    try {
        // 1. Fetch Superadmin user
        const adminUser = await prisma.user.findUnique({
            where: { phone: '+251911223344' },
        });
        assert(!!adminUser, 'SuperAdmin Selamawit Assefa exists in DB');
        assert(adminUser?.role === 'SUPERADMIN', 'SuperAdmin role is SUPERADMIN');
        // 2. Generate valid admin token
        const adminToken = jwt.sign({ sub: adminUser.id, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });
        // 3. Test Unauthorized request (no token) -> 401
        const unauthRes = await fetch(`${baseUrl}/api/admin/dashboard`);
        assert(unauthRes.status === 401, 'Request without token returns 401 Unauthorized');
        // 4. Test Forbidden request (buyer role) -> 403
        const buyerToken = jwt.sign({ sub: 'random-buyer-id', role: 'BUYER' }, JWT_SECRET, { expiresIn: '1h' });
        const forbiddenRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
            headers: { Authorization: `Bearer ${buyerToken}` },
        });
        assert(forbiddenRes.status === 403, 'Request with non-admin role returns 403 Forbidden');
        // 5. Test Admin Dashboard Overview -> 200
        const dashRes = await fetch(`${baseUrl}/api/admin/dashboard?period=7d`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(dashRes.status === 200, 'Admin Dashboard endpoint returns 200 OK');
        const dashJson = await dashRes.json();
        assert(dashJson.success === true, 'Dashboard returns success: true');
        assert(dashJson.data.metrics.totalFarmers > 0, 'Total Farmers count is positive');
        assert(dashJson.data.metrics.totalBuyers > 0, 'Total Buyers count is positive');
        assert(dashJson.data.metrics.totalOrders > 0, 'Total Orders count is positive');
        assert(dashJson.data.chartData.length === 7, 'Chart data contains 7 day points');
        assert(dashJson.data.topProducts.length > 0, 'Top products list is populated');
        assert(dashJson.data.recentOrders.length > 0, 'Recent orders list is populated');
        assert(dashJson.data.systemAlerts.length > 0, 'System alerts list is populated');
        // 6. Test Products list -> 200
        const prodRes = await fetch(`${baseUrl}/api/admin/products`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(prodRes.status === 200, 'Admin Products endpoint returns 200');
        const prodJson = await prodRes.json();
        assert(Array.isArray(prodJson.data), 'Products data is an array');
        // 7. Test Farmers list -> 200
        const farmerRes = await fetch(`${baseUrl}/api/admin/farmers`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(farmerRes.status === 200, 'Admin Farmers endpoint returns 200');
        // 8. Test Intercity Approvals list -> 200
        const apprRes = await fetch(`${baseUrl}/api/admin/intercity/approvals`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(apprRes.status === 200, 'Admin Intercity Approvals endpoint returns 200');
        // 9. Test Markets & Cities -> 200
        const marketRes = await fetch(`${baseUrl}/api/admin/markets`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(marketRes.status === 200, 'Admin Markets endpoint returns 200');
        // 10. Test Transactions Ledger -> 200
        const txnRes = await fetch(`${baseUrl}/api/admin/transactions`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(txnRes.status === 200, 'Admin Transactions endpoint returns 200');
        console.log(`\n--- Test Results: ${passed} passed, ${failed} failed ---`);
    }
    catch (err) {
        console.error('Test execution error:', err);
        failed++;
    }
    finally {
        server.close();
        await prisma.$disconnect();
        if (failed > 0)
            process.exit(1);
    }
}
runTests();
//# sourceMappingURL=admin.test.js.map