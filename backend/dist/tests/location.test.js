import app from '../app.js';
import jwt from 'jsonwebtoken';
import http from 'http';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';
// Helper to make local HTTP requests to the Express app
function makeRequest(server, method, path, headers = {}, body) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const payload = body ? JSON.stringify(body) : undefined;
        const req = http.request({
            hostname: '127.0.0.1',
            port: address.port,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers,
            },
        }, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                }
                catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode || 500, body: parsed });
            });
        });
        req.on('error', reject);
        if (payload)
            req.write(payload);
        req.end();
    });
}
// Generate test tokens
const workerToken = jwt.sign({ sub: 'test-worker-uuid-1234', role: 'DELIVERY_WORKER' }, JWT_SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ sub: 'test-admin-uuid-5678', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
async function runTests() {
    console.log('🧪 Starting Consent-Based Geolocation API Test Suite...\n');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let passed = 0;
    let failed = 0;
    function assert(condition, testName, detail) {
        if (condition) {
            console.log(`  ✅ PASS: ${testName}`);
            passed++;
        }
        else {
            console.error(`  ❌ FAIL: ${testName}`);
            if (detail)
                console.error(`     Detail: ${detail}`);
            failed++;
        }
    }
    try {
        // 1. Unauthenticated Request
        {
            const res = await makeRequest(server, 'POST', '/api/location/share', {}, {
                latitude: 9.012,
                longitude: 38.752,
                consentGranted: true,
            });
            assert(res.status === 401 && res.body?.success === false, '1. Rejects unauthenticated location share request with 401', JSON.stringify(res.body));
        }
        // 2. Missing Explicit Consent
        {
            const res = await makeRequest(server, 'POST', '/api/location/share', { Authorization: `Bearer ${workerToken}` }, {
                latitude: 9.012,
                longitude: 38.752,
                consentGranted: false, // User did not consent!
            });
            assert(res.status === 400 && res.body?.error?.code === 'CONSENT_REQUIRED', '2. Enforces explicit consent (rejects consentGranted=false with 400)', JSON.stringify(res.body));
        }
        // 3. Invalid Coordinates Types
        {
            const res = await makeRequest(server, 'POST', '/api/location/share', { Authorization: `Bearer ${workerToken}` }, {
                latitude: 'invalid_lat',
                longitude: 38.752,
                consentGranted: true,
            });
            assert(res.status === 400 && res.body?.error?.code === 'INVALID_COORDINATES', '3. Validates coordinate types (rejects non-numeric latitude with 400)', JSON.stringify(res.body));
        }
        // 4. Latitude Out of Range
        {
            const res = await makeRequest(server, 'POST', '/api/location/share', { Authorization: `Bearer ${workerToken}` }, {
                latitude: 105.4, // invalid > 90
                longitude: 38.752,
                consentGranted: true,
            });
            assert(res.status === 400 && res.body?.error?.code === 'LATITUDE_OUT_OF_RANGE', '4. Validates latitude range [-90, 90] with 400', JSON.stringify(res.body));
        }
        // 5. Longitude Out of Range
        {
            const res = await makeRequest(server, 'POST', '/api/location/share', { Authorization: `Bearer ${workerToken}` }, {
                latitude: 9.012,
                longitude: -195.0, // invalid < -180
                consentGranted: true,
            });
            assert(res.status === 400 && res.body?.error?.code === 'LONGITUDE_OUT_OF_RANGE', '5. Validates longitude range [-180, 180] with 400', JSON.stringify(res.body));
        }
        // 6. Invalid Accuracy
        {
            const res = await makeRequest(server, 'POST', '/api/location/share', { Authorization: `Bearer ${workerToken}` }, {
                latitude: 9.012,
                longitude: 38.752,
                accuracy: -5.0, // negative accuracy is invalid
                consentGranted: true,
            });
            assert(res.status === 400 && res.body?.error?.code === 'INVALID_ACCURACY', '6. Rejects negative accuracy value with 400', JSON.stringify(res.body));
        }
        // 7. Unauthorized Admin Access
        {
            const res = await makeRequest(server, 'GET', '/api/location/admin/records', { Authorization: `Bearer ${workerToken}` } // Worker is NOT an Admin
            );
            assert(res.status === 403 && res.body?.success === false, '7. Enforces RBAC (rejects non-admin from admin location records with 403)', JSON.stringify(res.body));
        }
        // 8. Unauthenticated Admin Access
        {
            const res = await makeRequest(server, 'GET', '/api/location/admin/records', {});
            assert(res.status === 401, '8. Rejects unauthenticated request to admin location records with 401', JSON.stringify(res.body));
        }
    }
    finally {
        server.close();
    }
    console.log(`\n📋 Test Results: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0)
        process.exit(1);
}
runTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
//# sourceMappingURL=location.test.js.map