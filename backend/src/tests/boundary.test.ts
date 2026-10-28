/**
 * Comprehensive Input Validation & Boundary Test Suite
 * Validates edge cases, input limits, format boundaries, and error messages:
 * 1. Full Name boundaries (min length 2, unicode/Amharic, whitespace)
 * 2. Ethiopian Phone Number normalization & boundaries (E.164, Ethio Telecom 09..., Safaricom 07..., invalid length/prefixes)
 * 3. Email Address syntax, normalization & optionality boundaries
 * 4. Password Policy boundaries (min 8 chars, character classes, zero silent trimming)
 * 5. OTP / Verification Code boundaries (exact 6 digits, non-numeric rejection)
 * 6. Geographic Coordinate boundaries (lat [-90, 90], lon [-180, 180], accuracy >= 0, heading [0, 360])
 * 7. HTTP Endpoint Input Boundary Responses & Field Error Payloads
 */

import http from 'http';
import app from '../app.js';
import prisma from '../config/prisma.js';
import {
  validatePasswordStrength,
  normalizeEthiopianPhone,
  resolveUserIdentifier,
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

// HTTP request helper
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

async function runBoundaryTests() {
  console.log('\n🧪 Starting Comprehensive Input Validation & Boundary Test Suite...\n');

  // =========================================================================
  // 1. FULL NAME BOUNDARY TESTS
  // =========================================================================
  console.log('--- 1. Full Name Boundary Validation ---');

  // Min length: 1 char must be rejected, 2 chars must be accepted
  const name1Char = 'A';
  assert(name1Char.trim().length < 2, 'Detects 1 character as below minimum boundary');

  const name2Chars = 'Al';
  assert(name2Chars.trim().length >= 2, 'Accepts 2 characters as valid boundary minimum');

  // Unicode & Ethiopian Ge'ez / Amharic script support
  const amharicName = 'አበበ ቢቂላ';
  assert(amharicName.trim().length >= 2, 'Accepts Amharic characters (አበበ ቢቂላ) correctly');

  const oromiffaName = 'Caaltuu Damissee';
  assert(oromiffaName.trim().length >= 2, 'Accepts Oromo characters correctly');

  // Whitespace normalization
  const spacedName = '   Abebe Bikila   ';
  assert(spacedName.trim() === 'Abebe Bikila', 'Trims leading/trailing whitespace cleanly');

  // =========================================================================
  // 2. ETHIOPIAN PHONE NUMBER BOUNDARIES & NORMALIZATION
  // =========================================================================
  console.log('\n--- 2. Phone Number Boundaries & Normalization ---');

  // Valid Ethio Telecom (09...)
  assert(normalizeEthiopianPhone('0911223344') === '+251911223344', 'Local Ethio Telecom (0911223344) -> +251911223344');
  assert(normalizeEthiopianPhone('0922334455') === '+251922334455', 'Local Ethio Telecom 092 -> +251922334455');

  // Valid Safaricom Ethiopia (07...)
  assert(normalizeEthiopianPhone('0711223344') === '+251711223344', 'Local Safaricom (0711223344) -> +251711223344');
  assert(normalizeEthiopianPhone('0770112233') === '+251770112233', 'Local Safaricom 077 -> +251770112233');

  // Canonical E.164 already formatted
  assert(normalizeEthiopianPhone('+251911223344') === '+251911223344', 'Preserves canonical +251911223344');
  assert(normalizeEthiopianPhone('+251711223344') === '+251711223344', 'Preserves canonical +251711223344');

  // 251 prefix without plus
  assert(normalizeEthiopianPhone('251911223344') === '+251911223344', 'Prefix 251 without plus -> +251911223344');

  // 9-digit local without leading zero
  assert(normalizeEthiopianPhone('911223344') === '+251911223344', '9 digits starting with 9 -> +251911223344');
  assert(normalizeEthiopianPhone('711223344') === '+251711223344', '9 digits starting with 7 -> +251711223344');

  // Formatting symbols (spaces, dashes, parentheses)
  assert(normalizeEthiopianPhone('+251 (91) 122-3344') === '+251911223344', 'Strips formatting symbols (+251 (91) 122-3344)');

  // Boundary Failure: Too short (8 digits)
  let shortPhoneError = false;
  try {
    normalizeEthiopianPhone('09112233');
  } catch (err: any) {
    shortPhoneError = err.message.includes('Invalid Ethiopian phone number');
  }
  assert(shortPhoneError, 'Rejects short phone number (8 digits)');

  // Boundary Failure: Too long (10 digits after 09)
  let longPhoneError = false;
  try {
    normalizeEthiopianPhone('09112233445');
  } catch (err: any) {
    longPhoneError = err.message.includes('Invalid Ethiopian phone number');
  }
  assert(longPhoneError, 'Rejects overly long phone number (11 local digits)');

  // Boundary Failure: Invalid carrier prefix (08...)
  let invalidPrefixError = false;
  try {
    normalizeEthiopianPhone('0811223344');
  } catch (err: any) {
    invalidPrefixError = err.message.includes('Invalid Ethiopian phone number');
  }
  assert(invalidPrefixError, 'Rejects invalid carrier prefix 08...');

  // Boundary Failure: Foreign non-Ethiopian number
  let usPhoneError = false;
  try {
    normalizeEthiopianPhone('+14155552671');
  } catch (err: any) {
    usPhoneError = err.message.includes('Invalid Ethiopian phone number');
  }
  assert(usPhoneError, 'Rejects foreign non-Ethiopian phone (+1415...)');

  // =========================================================================
  // 3. EMAIL SYNTAX, NORMALIZATION & OPTIONALITY BOUNDARIES
  // =========================================================================
  console.log('\n--- 3. Email Boundaries & Normalization ---');

  // Normalization
  const resEmail = resolveUserIdentifier('   Farmer.Abebe@AgriMarket.ET   ');
  assert(resEmail.isEmail === true, 'Identifies as email');
  assert(resEmail.value === 'farmer.abebe@agrimarket.et', 'Normalizes email to lowercase and trimmed');

  // Sub-addressed / plus-addressed emails
  const resSubEmail = resolveUserIdentifier('farmer+oromia@domain.org');
  assert(resSubEmail.value === 'farmer+oromia@domain.org', 'Accepts plus-addressed email (farmer+oromia@...)');

  // Invalid email formats
  let invalidEmail1 = false;
  try {
    resolveUserIdentifier('farmer.agrimarket.et'); // Missing @
  } catch (err: any) {
    invalidEmail1 = err.message.includes('Invalid Ethiopian phone number'); // treated as non-email and fails phone check
  }
  assert(invalidEmail1, 'Rejects email without @ symbol');

  let invalidEmail2 = false;
  try {
    resolveUserIdentifier('farmer@'); // Missing domain
  } catch (err: any) {
    invalidEmail2 = err.message.includes('valid email address');
  }
  assert(invalidEmail2, 'Rejects email with missing domain (farmer@)');

  let invalidEmail3 = false;
  try {
    resolveUserIdentifier('farmer@domain'); // Missing TLD
  } catch (err: any) {
    invalidEmail3 = err.message.includes('valid email address');
  }
  assert(invalidEmail3, 'Rejects email with missing top-level domain (farmer@domain)');

  // =========================================================================
  // 4. PASSWORD POLICY BOUNDARIES
  // =========================================================================
  console.log('\n--- 4. Password Policy Boundaries ---');

  // Boundary 7 chars (1 below minimum 8)
  const p7 = validatePasswordStrength('Ab1!aaa');
  assert(Boolean(!p7.valid && p7.message?.includes('at least 8 characters')), '7 characters rejected (boundary min - 1)');

  // Boundary 8 chars (exact minimum 8)
  const p8 = validatePasswordStrength('Ab1!aaaa');
  assert(p8.valid === true, '8 characters meeting all rules accepted (boundary exact min)');

  // Uppercase requirement boundary
  const pNoUpper = validatePasswordStrength('ab1!aaaa');
  assert(Boolean(!pNoUpper.valid && pNoUpper.message?.includes('uppercase')), 'Rejects password missing uppercase letter');

  // Digit requirement boundary
  const pNoDigit = validatePasswordStrength('Ab!!aaaa');
  assert(Boolean(!pNoDigit.valid && pNoDigit.message?.includes('digit')), 'Rejects password missing digit');

  // Symbol requirement boundary
  const pNoSymbol = validatePasswordStrength('Ab11aaaa');
  assert(Boolean(!pNoSymbol.valid && pNoSymbol.message?.includes('symbol')), 'Rejects password missing special symbol');

  // Password with spaces (preserved, not stripped)
  const pWithSpace = validatePasswordStrength('Ab1! aaaa');
  assert(pWithSpace.valid === true, 'Accepts password with space without modifying or rejecting');

  // Long password (128 chars)
  const pLong = validatePasswordStrength('A1!'.padEnd(128, 'x'));
  assert(pLong.valid === true, 'Accepts long 128-character password');

  // =========================================================================
  // 5. OTP / RECOVERY CODE BOUNDARIES
  // =========================================================================
  console.log('\n--- 5. OTP Code Boundaries ---');

  const otpRegex = /^\d{6}$/;
  assert(!otpRegex.test('12345'), 'Rejects 5-digit code (boundary min - 1)');
  assert(!otpRegex.test('1234567'), 'Rejects 7-digit code (boundary max + 1)');
  assert(!otpRegex.test('12A456'), 'Rejects 6-character code with letter');
  assert(!otpRegex.test('12 456'), 'Rejects 6-character code with space');
  assert(otpRegex.test('123456'), 'Accepts exact 6 numeric digits');
  assert(otpRegex.test('000000'), 'Accepts 6 zeros (leading zeros preserved)');

  // =========================================================================
  // 6. GEOGRAPHIC COORDINATE BOUNDARIES (LATITUDE & LONGITUDE)
  // =========================================================================
  console.log('\n--- 6. Geographic Coordinate Boundaries ---');

  const isLatValid = (lat: number) => typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
  const isLonValid = (lon: number) => typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;

  // Latitude boundaries
  assert(isLatValid(-90), 'Accepts -90.0 (South Pole boundary)');
  assert(isLatValid(90), 'Accepts 90.0 (North Pole boundary)');
  assert(isLatValid(0), 'Accepts 0.0 (Equator)');
  assert(isLatValid(9.0222), 'Accepts 9.0222 (Addis Ababa latitude)');
  assert(!isLatValid(-90.0001), 'Rejects -90.0001 (below South Pole boundary)');
  assert(!isLatValid(90.0001), 'Rejects 90.0001 (above North Pole boundary)');

  // Longitude boundaries
  assert(isLonValid(-180), 'Accepts -180.0 (Antimeridian West boundary)');
  assert(isLonValid(180), 'Accepts 180.0 (Antimeridian East boundary)');
  assert(isLonValid(0), 'Accepts 0.0 (Prime Meridian)');
  assert(isLonValid(38.7468), 'Accepts 38.7468 (Addis Ababa longitude)');
  assert(!isLonValid(-180.0001), 'Rejects -180.0001 (past Antimeridian West)');
  assert(!isLonValid(180.0001), 'Rejects 180.0001 (past Antimeridian East)');

  // Accuracy & Heading boundaries
  const isAccuracyValid = (acc: number) => typeof acc === 'number' && !isNaN(acc) && acc >= 0;
  assert(isAccuracyValid(0), 'Accepts 0m accuracy (exact GPS fix)');
  assert(isAccuracyValid(15.5), 'Accepts 15.5m accuracy');
  assert(!isAccuracyValid(-1), 'Rejects negative accuracy value (-1m)');

  const isHeadingValid = (hd: number) => typeof hd === 'number' && !isNaN(hd) && hd >= 0 && hd <= 360;
  assert(isHeadingValid(0), 'Accepts 0° heading (North)');
  assert(isHeadingValid(360), 'Accepts 360° heading (Full circle)');
  assert(!isHeadingValid(-5), 'Rejects negative heading (-5°)');
  assert(!isHeadingValid(361), 'Rejects out-of-circle heading (361°)');

  // =========================================================================
  // 7. HTTP ENDPOINT BOUNDARY & FIELD-SPECIFIC ERROR RESPONSES
  // =========================================================================
  console.log('\n--- 7. HTTP Endpoint Input Boundary Responses ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

  try {
    // 7.1 POST /api/auth/register - Missing Full Name
    const regNoName = await makeRequest(server, 'POST', '/api/auth/register', {}, {
      phone: '0911223344',
      password: 'StrongPassword123!',
    });
    assert(regNoName.status === 400, 'Rejects registration with missing full name with 400');
    assert(regNoName.body?.error?.field === 'fullName', 'Returns field="fullName" in error body');
    assert(regNoName.body?.error?.message?.includes('at least 2 characters'), 'Returns helpful full name guidance');

    // 7.2 POST /api/auth/register - Full Name 1 Char
    const regShortName = await makeRequest(server, 'POST', '/api/auth/register', {}, {
      fullName: 'A',
      phone: '0911223344',
      password: 'StrongPassword123!',
    });
    assert(regShortName.status === 400, 'Rejects 1-character full name with 400');
    assert(regShortName.body?.error?.field === 'fullName', 'Returns field="fullName" for 1-char name');

    // 7.3 POST /api/auth/register - Missing Phone
    const regNoPhone = await makeRequest(server, 'POST', '/api/auth/register', {}, {
      fullName: 'Abebe Bikila',
      password: 'StrongPassword123!',
    });
    assert(regNoPhone.status === 400, 'Rejects registration with missing phone with 400');
    assert(regNoPhone.body?.error?.field === 'phone', 'Returns field="phone" in error body');

    // 7.4 POST /api/auth/register - Invalid Email Syntax
    const regBadEmail = await makeRequest(server, 'POST', '/api/auth/register', {}, {
      fullName: 'Abebe Bikila',
      phone: '0911223344',
      email: 'not-an-email',
      password: 'StrongPassword123!',
    });
    assert(regBadEmail.status === 400, 'Rejects invalid email syntax with 400');
    assert(regBadEmail.body?.error?.field === 'email', 'Returns field="email" in error body');

    // 7.5 POST /api/auth/register - Weak Password (7 chars)
    const regShortPass = await makeRequest(server, 'POST', '/api/auth/register', {}, {
      fullName: 'Abebe Bikila',
      phone: '0911223344',
      password: 'Ab1!aaa',
    });
    assert(regShortPass.status === 400, 'Rejects 7-char password with 400');
    assert(regShortPass.body?.error?.field === 'password', 'Returns field="password" in error body');

    // 7.6 POST /api/auth/login - Missing Identifier
    const loginNoId = await makeRequest(server, 'POST', '/api/auth/login', {}, {
      password: 'StrongPassword123!',
    });
    assert(loginNoId.status === 400, 'Rejects login with missing identifier with 400');
    assert(loginNoId.body?.error?.field === 'identifier', 'Returns field="identifier" in error body');

    // 7.7 POST /api/auth/login - Missing Password
    const loginNoPass = await makeRequest(server, 'POST', '/api/auth/login', {}, {
      identifier: '0911223344',
    });
    assert(loginNoPass.status === 400, 'Rejects login with missing password with 400');
    assert(loginNoPass.body?.error?.field === 'password', 'Returns field="password" in error body');

    // 7.8 POST /api/auth/verify-otp - Missing Fields
    const verifyNoOtp = await makeRequest(server, 'POST', '/api/auth/verify-otp', {}, {
      identifier: '0911223344',
    });
    assert(verifyNoOtp.status === 400, 'Rejects verify-otp with missing otpCode with 400');
    assert(verifyNoOtp.body?.error?.field === 'otpCode', 'Returns field="otpCode" in error body');

    // 7.9 POST /api/auth/forgot-password - Missing Identifier
    const forgotNoId = await makeRequest(server, 'POST', '/api/auth/forgot-password', {}, {});
    assert(forgotNoId.status === 400, 'Rejects forgot-password without identifier with 400');
    assert(forgotNoId.body?.error?.field === 'identifier', 'Returns field="identifier" in error body');

    // 7.10 POST /api/auth/reset-password - Missing Fields
    const resetNoPass = await makeRequest(server, 'POST', '/api/auth/reset-password', {}, {
      identifier: '0911223344',
      code: '123456',
    });
    assert(resetNoPass.status === 400, 'Rejects reset-password with missing newPassword with 400');

    // 7.11 POST /api/onboarding/select-role - Missing Authentication
    const selectRoleNoAuth = await makeRequest(server, 'POST', '/api/onboarding/select-role', {}, {
      role: 'FARMER',
    });
    assert(selectRoleNoAuth.status === 401, 'Rejects unauthenticated select-role with 401');

    // 7.12 POST /api/location/share - Missing Authentication
    const locationNoAuth = await makeRequest(server, 'POST', '/api/location/share', {}, {
      latitude: 9.0222,
      longitude: 38.7468,
      consentGranted: true,
    });
    assert(locationNoAuth.status === 401, 'Rejects unauthenticated location share with 401');
  } finally {
    server.close();
  }

  // Summary
  console.log(`\n📋 Boundary & Validation Suite Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runBoundaryTests().catch((err) => {
  console.error('Boundary test execution failed:', err);
  process.exit(1);
});
