/**
 * Comprehensive Automated Test Suite: Google OAuth 2.0 & Identity Linking
 * Tests:
 * 1. Invalid / Malformed / Missing Google Credential Rejection
 * 2. New User Registration via Google OAuth (Safe BUYER role, PENDING_ROLE, verified email)
 * 3. Returning User Sign-In via Google OAuth
 * 4. Account Takeover Protection: Unlinked matching email triggers 409 Conflict with requiresLinkVerification
 * 5. Password-Verified Account Linking (Rejects wrong password, succeeds on correct password)
 * 6. Suspended / Deactivated User Rejection (403 Forbidden)
 * 7. Safe Handling of Google-First Users (passwordHash: null) in Password Login
 * 8. Role Escalation Prevention (Guarantees safe BUYER role on OAuth registration)
 */

import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import {
  authenticateWithGoogle,
  linkGoogleAccount,
  loginUser,
  verifyGoogleCredential,
  __setGoogleVerifierForTesting,
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

async function runGoogleAuthTests() {
  console.log('\n🧪 Starting Google OAuth, Security & Identity Linking Test Suite...\n');

  // Test identifiers to clean up
  const testSub1 = `test_goog_sub_${Date.now()}_1`;
  const testSub2 = `test_goog_sub_${Date.now()}_2`;
  const testEmail1 = `google.user.${Date.now()}@example.com`;
  const testEmail2 = `farmer.local.${Date.now()}@example.com`;
  const localPassword = 'Password123!@#';

  try {
    // =========================================================================
    // 1. Invalid / Missing Credential Rejection
    // =========================================================================
    console.log('--- 1. Invalid / Missing Google Credential Rejection ---');
    __setGoogleVerifierForTesting(null); // Real verifier
    try {
      await verifyGoogleCredential('');
      assert(false, 'Should reject empty credential');
    } catch (err: any) {
      assert(err.status === 400, 'Rejects empty credential with 400 Bad Request');
    }

    try {
      await verifyGoogleCredential('bogus.jwt.token');
      assert(false, 'Should reject invalid JWT token');
    } catch (err: any) {
      assert(err.status === 401, 'Rejects malformed/tampered JWT with 401 Unauthorized');
    }

    // =========================================================================
    // 2. New User Registration via Google OAuth
    // =========================================================================
    console.log('\n--- 2. New User Registration via Google OAuth ---');

    // Mock verified profile returned by Google Identity Services
    __setGoogleVerifierForTesting(async (token: string) => {
      if (token === 'valid_google_token_1') {
        return {
          sub: testSub1,
          email: testEmail1,
          emailVerified: true,
          name: 'Abebe Bikila',
          picture: 'https://lh3.googleusercontent.com/test-avatar-1.jpg',
          idToken: 'mocked.id.token.1',
        };
      }
      if (token === 'valid_google_token_2') {
        return {
          sub: testSub2,
          email: testEmail2, // Matches pre-existing local user!
          emailVerified: true,
          name: 'Chaltu Kebede Google',
          picture: null,
          idToken: 'mocked.id.token.2',
        };
      }
      const err = new Error('Invalid test Google token');
      (err as any).status = 401;
      throw err;
    });

    const regResult = await authenticateWithGoogle('valid_google_token_1', {
      ipAddress: '127.0.0.1',
      userAgent: 'TestBrowser/1.0',
    });

    assert(regResult.success, 'Registration with Google succeeds');
    assert(regResult.isNewUser === true, 'Identifies user as new user');
    assert(regResult.user.role === 'BUYER', 'Default customer role is BUYER');
    assert(regResult.user.onboardingStatus === 'PENDING_ROLE', 'Initial onboarding status is PENDING_ROLE');
    assert(regResult.user.isVerified === true, 'Sets isVerified to true (Google-verified email)');
    assert(Boolean(regResult.accessToken), 'Issues access token');
    assert(Boolean(regResult.refreshToken), 'Issues rotating refresh token');

    // Verify database record and linked identity
    const dbUser1 = await prisma.user.findUnique({
      where: { id: regResult.user.id },
      include: { linkedIdentities: true, userProfile: true },
    });

    assert(Boolean(dbUser1), 'User created in database');
    assert(dbUser1?.passwordHash === null, 'Google-registered user has null passwordHash (no dummy passwords)');
    assert(dbUser1?.linkedIdentities.length === 1, 'LinkedIdentity created atomically');
    const firstLinked = dbUser1?.linkedIdentities?.[0];
    assert(firstLinked?.provider === 'google', 'Provider is "google"');
    assert(firstLinked?.providerSub === testSub1, 'ProviderSub matches Google stable sub');
    assert(dbUser1?.userProfile?.avatarUrl === 'https://lh3.googleusercontent.com/test-avatar-1.jpg', 'Avatar saved in profile');

    // =========================================================================
    // 3. Returning User Sign-In via Google OAuth
    // =========================================================================
    console.log('\n--- 3. Returning User Sign-In via Google OAuth ---');

    const returnResult = await authenticateWithGoogle('valid_google_token_1', {
      ipAddress: '127.0.0.1',
      userAgent: 'TestBrowser/1.0',
    });

    assert(returnResult.success, 'Returning sign-in succeeds');
    assert(returnResult.isNewUser === false, 'Correctly flags as existing returning user');
    assert(returnResult.user.id === regResult.user.id, 'Resolves to identical existing user ID');
    assert(Boolean(returnResult.accessToken), 'Issues fresh access token');

    const userCountAfterReturn = await prisma.user.count({ where: { email: testEmail1 } });
    assert(userCountAfterReturn === 1, 'Does not create duplicate user records');

    // =========================================================================
    // 4. Safe Password-less Login Behavior for Google-First Users
    // =========================================================================
    console.log('\n--- 4. Safe Password-less Login Behavior ---');
    try {
      await loginUser(testEmail1, 'AnyPassword123!');
      assert(false, 'Should reject password login for Google-only user');
    } catch (err: any) {
      assert(err.status === 400, 'Rejects password login with 400 Bad Request');
      assert(
        err.message.includes('Google'),
        'Helpful message prompts user to continue with Google'
      );
    }

    // =========================================================================
    // 5. Account Takeover Protection (Unlinked Email Conflict Detection)
    // =========================================================================
    console.log('\n--- 5. Account Takeover Protection & Conflict Detection ---');

    // Create an existing local user with password and email testEmail2
    const passwordHash = await bcrypt.hash(localPassword, 10);
    const localUser = await prisma.user.create({
      data: {
        fullName: 'Chaltu Kebede',
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: testEmail2,
        passwordHash,
        role: 'FARMER',
        onboardingStatus: 'COMPLETED',
        isVerified: true,
        isActive: true,
      },
    });

    assert(Boolean(localUser.id), 'Created existing local password user');

    // Attacker or user tries Google login with identical email testEmail2 but sub testSub2 (not linked)
    try {
      await authenticateWithGoogle('valid_google_token_2');
      assert(false, 'Should NOT silently merge unlinked Google account');
    } catch (conflictErr: any) {
      assert(conflictErr.status === 409, 'Rejects silent takeover with 409 Conflict');
      assert(conflictErr.requiresLinkVerification === true, 'Flags requiresLinkVerification: true');
      assert(conflictErr.email === testEmail2, 'Returns conflicting email address');
      assert(conflictErr.googleSub === testSub2, 'Returns Google sub claim');
    }

    // =========================================================================
    // 6. Password-Verified Account Linking
    // =========================================================================
    console.log('\n--- 6. Password-Verified Account Linking ---');

    // Attempt linking with incorrect password
    try {
      await linkGoogleAccount('valid_google_token_2', 'WrongPassword123!');
      assert(false, 'Should reject link with incorrect password');
    } catch (linkErr: any) {
      assert(linkErr.status === 401, 'Rejects incorrect password with 401 Unauthorized');
    }

    // Attempt linking with correct password
    const linkResult = await linkGoogleAccount('valid_google_token_2', localPassword, {
      ipAddress: '127.0.0.1',
      userAgent: 'TestBrowser/1.0',
    });

    assert(linkResult.success, 'Successfully linked account with correct password');
    assert(linkResult.user.id === localUser.id, 'Maintains original user ID');
    assert(linkResult.user.role === 'FARMER', 'Preserves existing user role');
    assert(Boolean(linkResult.accessToken), 'Issues access token after linking');

    // Now test that subsequent Google sign-in works immediately without conflict
    const postLinkAuth = await authenticateWithGoogle('valid_google_token_2');
    assert(postLinkAuth.success, 'Subsequent Google auth succeeds directly');
    assert(postLinkAuth.isNewUser === false, 'Flags as returning user');
    assert(postLinkAuth.user.id === localUser.id, 'Authenticated as the linked account');

    // =========================================================================
    // 7. Suspended / Deactivated User Rejection
    // =========================================================================
    console.log('\n--- 7. Suspended / Deactivated User Rejection ---');

    await prisma.user.update({
      where: { id: localUser.id },
      data: { isActive: false },
    });

    try {
      await authenticateWithGoogle('valid_google_token_2');
      assert(false, 'Should reject suspended user');
    } catch (err: any) {
      assert(err.status === 403, 'Rejects suspended account with 403 Forbidden');
    }

    // =========================================================================
    // 8. Role Escalation Prevention
    // =========================================================================
    console.log('\n--- 8. Role Escalation Prevention ---');
    assert(regResult.user.role !== 'ADMIN', 'OAuth registration cannot self-grant ADMIN');
    assert(regResult.user.role !== 'SUPERADMIN', 'OAuth registration cannot self-grant SUPERADMIN');
    assert(regResult.user.role === 'BUYER', 'Public OAuth user is strictly BUYER');

  } catch (error) {
    console.error('Unexpected test error:', error);
    failed++;
  } finally {
    // Reset test mock
    __setGoogleVerifierForTesting(null);

    // Cleanup test users
    console.log('\n🧹 Cleaning up test database records...');
    try {
      const usersToClean = await prisma.user.findMany({
        where: { email: { in: [testEmail1, testEmail2] } },
        select: { id: true },
      });
      const ids = usersToClean.map((u) => u.id);
      if (ids.length > 0) {
        await prisma.linkedIdentity.deleteMany({ where: { userId: { in: ids } } });
        await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
        await prisma.userProfile.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup error:', cleanupErr);
    }
  }

  console.log(`\n========================================`);
  console.log(`Google Auth Tests Finished: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runGoogleAuthTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
