import app from '../app.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';

async function runTests() {
  console.log('--- Starting Messaging & Verification Automated Tests ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Fetch test actors
    const superadmin = await prisma.user.findUnique({
      where: { phone: '+251911223344' },
    });
    const farmer = await prisma.user.findFirst({
      where: { role: 'FARMER', farmerProfile: { isNot: null } },
      include: { farmerProfile: true },
    });
    const buyer = await prisma.user.findFirst({
      where: { role: 'BUYER' },
    });
    const worker = await prisma.user.findFirst({
      where: { role: 'DELIVERY_WORKER', deliveryProfile: { isNot: null } },
      include: { deliveryProfile: true },
    });

    assert(!!superadmin, 'Superadmin actor exists in DB');
    assert(!!farmer, 'Farmer actor exists in DB');
    assert(!!buyer, 'Buyer actor exists in DB');
    assert(!!worker, 'Delivery worker actor exists in DB');

    const superadminToken = jwt.sign(
      { sub: superadmin!.id, role: superadmin!.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const buyerToken = jwt.sign(
      { sub: buyer!.id, role: buyer!.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const farmerToken = jwt.sign(
      { sub: farmer!.id, role: farmer!.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Messaging: Unauthorized access without token -> 401
    const unauthRes = await fetch(`${baseUrl}/api/messages/conversations`);
    assert(unauthRes.status === 401, 'Unauthenticated request to messages returns 401');

    // 3. Messaging: Buyer starts conversation with farmer
    const startRes = await fetch(`${baseUrl}/api/messages/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        farmerId: farmer!.id,
        initialMessage: 'Hello Ato Farmer! Are your organic tomatoes available for delivery today?',
      }),
    });
    const startData = await startRes.json();
    assert(startRes.status === 201 && startData.success, 'Buyer can initiate conversation with farmer');
    const conversationId = startData.data?.id;
    assert(!!conversationId, 'Conversation ID generated successfully');

    // 4. Messaging: Self-messaging blocked
    const selfRes = await fetch(`${baseUrl}/api/messages/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        farmerId: buyer!.id,
      }),
    });
    assert(selfRes.status === 400, 'Self-messaging is rejected with 400 Bad Request');

    // 5. Messaging: Farmer retrieves conversation list
    const convListRes = await fetch(`${baseUrl}/api/messages/conversations`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const convListData = await convListRes.json();
    assert(convListRes.status === 200 && Array.isArray(convListData.data), 'Farmer can retrieve conversations list');
    const hasConv = convListData.data.some((c: any) => c.id === conversationId);
    assert(hasConv, 'Newly initiated conversation appears in farmer inbox');

    // 6. Messaging: Farmer replies in conversation
    const replyRes = await fetch(`${baseUrl}/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        content: 'Greetings! Yes, our vine-ripened tomatoes were harvested this morning at 6 AM.',
      }),
    });
    const replyData = await replyRes.json();
    assert(replyRes.status === 201 && replyData.success, 'Farmer can send message reply');

    // 7. Messaging: Empty message content rejected
    const emptyMsgRes = await fetch(`${baseUrl}/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ content: '   ' }),
    });
    assert(emptyMsgRes.status === 400, 'Empty message content is rejected');

    // 8. Messaging: Fetch thread messages
    const threadRes = await fetch(`${baseUrl}/api/messages/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const threadData = await threadRes.json();
    assert(threadRes.status === 200 && threadData.data?.messages?.length >= 2, 'Message history contains buyer and farmer messages');

    // 9. Messaging: Mark messages as read
    const readRes = await fetch(`${baseUrl}/api/messages/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const readData = await readRes.json();
    assert(readRes.status === 200 && readData.success, 'Messages marked as read successfully');

    // 10. Superadmin Approval: Superadmin approves farmer
    const verifyFarmerRes = await fetch(`${baseUrl}/api/superadmin/farmers/${farmer!.farmerProfile!.id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        note: 'Superadmin compliance and land certificate audit approved.',
      }),
    });
    const verifyFarmerData = await verifyFarmerRes.json();
    assert(verifyFarmerRes.status === 200 && verifyFarmerData.success, 'Superadmin can approve farmer verification');

    // 11. Superadmin Approval: Non-admin role blocked
    const forbiddenVerifyRes = await fetch(`${baseUrl}/api/superadmin/farmers/${farmer!.farmerProfile!.id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    assert(forbiddenVerifyRes.status === 403, 'Non-superadmin is blocked from superadmin verify endpoint with 403');

    // 12. Superadmin Approval: Superadmin approves worker
    const verifyWorkerRes = await fetch(`${baseUrl}/api/superadmin/workers/${worker!.deliveryProfile!.id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        reason: 'Superadmin verified commercial driver license and vehicle plate.',
      }),
    });
    const verifyWorkerData = await verifyWorkerRes.json();
    assert(verifyWorkerRes.status === 200 && verifyWorkerData.success, 'Superadmin can approve delivery worker verification');

  } catch (err) {
    console.error('Test execution failed with error:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n--- Test Results: ${passed} passed, ${failed} failed ---`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

