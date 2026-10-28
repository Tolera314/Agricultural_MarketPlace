/**
 * Comprehensive Integration & Security Test Suite: Authentication & Session Management
 * Tests:
 * 1. Password Policy & Complexity Validation
 * 2. Ethiopian Phone Number & Email Identifier Resolution
 * 3. User Registration with In-Memory Access Token & Refresh Session
 * 4. Dual Login via Phone Number and Email
 * 5. Refresh Token Family Rotation & Reuse Detection
 * 6. Account Enumeration Prevention (Generic Forgot Password Responses)
 * 7. Single-Use Password Reset Code Verification
 * 8. Password Reset with Atomic Invalidation, Session Revocation & Token Version Increment
 */

import prisma from '../config/prisma.js';
import {
  validatePasswordStrength,
  normalizeEthiopianPhone,
  resolveUserIdentifier,
  registerUser,
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  forgotPassword,
  verifyPasswordResetCode,
  resetPasswordWithCode,
} from '../services/auth.service.js';

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

async function runAuthTests() {
  console.log('\n🧪 Starting Production Auth, Autofill, Security & Session Test Suite...\n');

  // =========================================================================
  // 1. Password Policy Enforcement
  // =========================================================================
  console.log('--- 1. Password Policy Enforcement ---');
  const shortPass = validatePasswordStrength('Ab1!');
  assert(!shortPass.valid, 'Rejects short password (< 8 chars)');

  const noUpper = validatePasswordStrength('weakpass123!');
  assert(!noUpper.valid, 'Rejects password without uppercase letter');

  const noDigit = validatePasswordStrength('WeakPassword!');
  assert(!noDigit.valid, 'Rejects password without digit');

  const noSymbol = validatePasswordStrength('WeakPassword123');
  assert(!noSymbol.valid, 'Rejects password without special symbol');

  const strongPass = validatePasswordStrength('StrongAgri2026!@#');
  assert(strongPass.valid, 'Accepts compliant password meeting all 4 requirements');

  // =========================================================================
  // 2. Ethiopian Phone Normalization & Identifier Resolution
  // =========================================================================
  console.log('\n--- 2. Phone Normalization & Identifier Resolution ---');
  assert(normalizeEthiopianPhone('0911223344') === '+251911223344', 'Normalizes local Ethio Telecom phone (09...)');
  assert(normalizeEthiopianPhone('0711223344') === '+251711223344', 'Normalizes local Safaricom phone (07...)');
  assert(normalizeEthiopianPhone('+251 91 122 3344') === '+251911223344', 'Strips spaces and symbols to canonical E.164');

  const resolvedPhone = resolveUserIdentifier('0911223344');
  assert(!resolvedPhone.isEmail && resolvedPhone.value === '+251911223344', 'Resolves phone identifier correctly');

  const resolvedEmail = resolveUserIdentifier('  Farmer.Abebe@AgriMarket.ET  ');
  assert(resolvedEmail.isEmail && resolvedEmail.value === 'farmer.abebe@agrimarket.et', 'Resolves email case-insensitively and trimmed');

  // =========================================================================
  // 3. User Registration with Cryptographic Session
  // =========================================================================
  console.log('\n--- 3. Registration & Cryptographic Refresh Session ---');
  const testPhone = `+251911${Math.floor(100000 + Math.random() * 900000)}`;
  const testEmail = `test.farmer.${Date.now()}@agrimarket.et`;
  const initialPassword = 'AgriSecurePassword2026!';

  const regResult = await registerUser(
    {
      fullName: 'Abebe Bikila',
      phone: testPhone,
      email: testEmail,
      password: initialPassword,
    },
    { ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0 Test Suite' }
  );

  assert(Boolean(regResult.accessToken), 'Registration generates short-lived access token');
  assert(Boolean(regResult.refreshToken), 'Registration issues secure refresh token');
  assert(regResult.requiresVerification === true, 'New registration requires OTP verification');

  const dbUser = await prisma.user.findUnique({ where: { phone: testPhone } });
  assert(dbUser !== null && dbUser.tokenVersion === 1, 'Database record created with tokenVersion = 1');

  // Verify user
  await prisma.user.update({
    where: { id: dbUser!.id },
    data: { isVerified: true },
  });

  // =========================================================================
  // 4. Dual Sign In (Phone & Email)
  // =========================================================================
  console.log('\n--- 4. Dual Sign In (Phone & Email) ---');
  // Login with Phone
  const phoneLogin = await loginUser(testPhone, initialPassword, { ipAddress: '127.0.0.1' });
  assert(phoneLogin.user.id === dbUser!.id, 'Authenticates successfully via phone number');
  assert(Boolean(phoneLogin.accessToken), 'Issues access token for phone login');

  // Login with Email
  const emailLogin = await loginUser(testEmail.toUpperCase(), initialPassword, { ipAddress: '127.0.0.1' });
  assert(emailLogin.user.id === dbUser!.id, 'Authenticates successfully via case-insensitive email');

  // Bad password rejection
  let badPassRejected = false;
  try {
    await loginUser(testPhone, 'WrongPassword123!');
  } catch (err: any) {
    badPassRejected = err.status === 401;
  }
  assert(badPassRejected, 'Rejects invalid password with 401 Unauthorized');

  // =========================================================================
  // 5. Refresh Token Family Rotation & Reuse Detection
  // =========================================================================
  console.log('\n--- 5. Refresh Token Family Rotation & Reuse Detection ---');
  const session1 = phoneLogin.refreshToken;

  // Rotate Session 1 -> Session 2
  const session2 = await rotateRefreshToken(session1, { ipAddress: '127.0.0.1' });
  assert(Boolean(session2.accessToken), 'Rotates refresh token and issues new access token');
  assert(session2.refreshToken !== session1, 'Rotated token is cryptographically distinct from parent');

  // REUSE DETECTION: Presenting the already-consumed session1 MUST trigger theft detection!
  let reuseDetected = false;
  try {
    await rotateRefreshToken(session1);
  } catch (err: any) {
    reuseDetected = err.status === 401 && err.message.includes('reuse');
  }
  assert(reuseDetected, 'Detects suspicious session reuse and revokes token family');

  // =========================================================================
  // 6. Account Recovery & Anti-Enumeration
  // =========================================================================
  console.log('\n--- 6. Account Recovery & Anti-Enumeration ---');
  const nonExistentRecovery = await forgotPassword('0999999999');
  assert(
    nonExistentRecovery.success === true,
    'Returns generic success message for non-existent account (prevents user enumeration)'
  );

  const existingRecovery = await forgotPassword(testPhone);
  assert(existingRecovery.success === true, 'Generates recovery OTP for registered account');

  const activeOtp = await prisma.oTPVerification.findFirst({
    where: { userId: dbUser!.id, purpose: 'PASSWORD_RESET', isUsed: false },
    orderBy: { createdAt: 'desc' },
  });
  assert(activeOtp !== null && activeOtp.code.length === 6, 'Stores 6-digit recovery OTP in database');

  // Code verification
  const validCheck = await verifyPasswordResetCode(testPhone, activeOtp!.code);
  assert(validCheck.valid === true, 'Verifies correct 6-digit recovery code');

  let badCodeRejected = false;
  try {
    await verifyPasswordResetCode(testPhone, '000000');
  } catch (err: any) {
    badCodeRejected = err.status === 400;
  }
  assert(badCodeRejected, 'Rejects incorrect recovery code with 400');

  // =========================================================================
  // 7. Password Reset, Atomic Invalidation & Session Revocation
  // =========================================================================
  console.log('\n--- 7. Password Reset, Session Revocation & Token Version Increment ---');
  const newPassword = 'BrandNewAgriPassword2026!@#';

  const resetResult = await resetPasswordWithCode(testPhone, activeOtp!.code, newPassword);
  assert(resetResult.success === true, 'Successfully resets password with verified code');

  // Verify OTP is consumed
  const consumedOtp = await prisma.oTPVerification.findUnique({ where: { id: activeOtp!.id } });
  assert(consumedOtp!.isUsed === true, 'Recovery code marked isUsed=true atomically');

  // Verify tokenVersion incremented
  const refreshedUser = await prisma.user.findUnique({ where: { id: dbUser!.id } });
  assert(refreshedUser!.tokenVersion === 2, 'user.tokenVersion incremented from 1 to 2');

  // Verify all refresh tokens revoked
  const activeSessions = await prisma.refreshToken.findMany({
    where: { userId: dbUser!.id, isRevoked: false },
  });
  assert(activeSessions.length === 0, 'All existing refresh sessions revoked on password reset');

  // Verify login with new password
  const newLogin = await loginUser(testEmail, newPassword);
  assert(newLogin.user.id === dbUser!.id, 'Signs in successfully with new password');

  // Verify old password fails
  let oldPassFailed = false;
  try {
    await loginUser(testPhone, initialPassword);
  } catch (err: any) {
    oldPassFailed = err.status === 401;
  }
  assert(oldPassFailed, 'Old password fails authentication');

  // Cleanup test user
  await prisma.refreshToken.deleteMany({ where: { userId: dbUser!.id } });
  await prisma.oTPVerification.deleteMany({ where: { userId: dbUser!.id } });
  await prisma.user.delete({ where: { id: dbUser!.id } });

  // Summary
  console.log(`\n📋 Production Auth Suite Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

