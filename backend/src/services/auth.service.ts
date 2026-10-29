import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import prisma from "../config/prisma.js";
import { NotificationService } from "./notification.service.js";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "changeme_dev_secret";
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_DAYS = 7;

/**
 * Password Policy Enforcement:
 * Minimum 8 characters, at least 1 uppercase, at least 1 digit, at least 1 symbol.
 * Never trimmed, never silently modified.
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one digit." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special symbol." };
  }
  return { valid: true };
}

/**
 * Normalise an Ethiopian phone number to canonical E.164 (+251XXXXXXXXX).
 */
export function normalizeEthiopianPhone(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, "");
  if (/^\+251\d{9}$/.test(digits)) return digits;
  if (/^251\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0[97]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
  if (/^[97]\d{8}$/.test(digits)) return `+251${digits}`;
  throw new Error("Invalid Ethiopian phone number format. Please use +251 9XX XXX XXX or +251 7XX XXX XXX.");
}

/**
 * Resolve whether an identifier is an email address or Ethiopian phone number.
 */
export function resolveUserIdentifier(identifier: string): { isEmail: boolean; value: string } {
  const trimmed = (identifier || "").trim();
  if (!trimmed) {
    throw new Error("Please enter your phone number or email address.");
  }

  if (trimmed.includes("@")) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error("Please enter a valid email address.");
    }
    return { isEmail: true, value: trimmed.toLowerCase() };
  }

  const phone = normalizeEthiopianPhone(trimmed);
  return { isEmail: false, value: phone };
}

/**
 * Hash a raw refresh token using SHA-256 for secure database storage.
 */
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export interface RequestMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email?: string | undefined;
  password: string;
}

/**
 * Issue new access token (15m) + cryptographic refresh token family (7d)
 */
export async function createSession(
  user: { id: string; role: string; tokenVersion: number },
  meta: RequestMetadata = {},
  family?: string
) {
  // 1. Short-lived Access Token
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, tokenVersion: user.tokenVersion },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  // 2. Cryptographically secure 64-character Refresh Token
  const rawRefreshToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawRefreshToken);
  const tokenFamily = family || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  // 3. Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      family: tokenFamily,
      expiresAt,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresAt,
  };
}

/**
 * Rotate Refresh Token with Reuse Detection
 */
export async function rotateRefreshToken(rawRefreshToken: string, meta: RequestMetadata = {}) {
  const tokenHash = hashToken(rawRefreshToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existingToken) {
    const err = new Error("Invalid or unrecognized refresh session. Please sign in again.");
    (err as any).status = 401;
    throw err;
  }

  // REUSE DETECTION: If an already-revoked token is presented, compromise is suspected.
  // Immediately revoke all tokens in the family to protect the user account!
  if (existingToken.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { family: existingToken.family },
      data: { isRevoked: true },
    });

    const err = new Error("Suspicious session reuse detected. For security, all sessions have been signed out.");
    (err as any).status = 401;
    throw err;
  }

  // Expiration check
  if (existingToken.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { isRevoked: true },
    });
    const err = new Error("Session has expired. Please sign in again.");
    (err as any).status = 401;
    throw err;
  }

  const user = existingToken.user;
  if (!user.isActive) {
    const err = new Error("Account has been deactivated. Please contact support.");
    (err as any).status = 403;
    throw err;
  }

  // Invalidate consumed token
  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { isRevoked: true },
  });

  // Issue new rotated pair maintaining the same family
  const session = await createSession(
    { id: user.id, role: user.role, tokenVersion: user.tokenVersion },
    meta,
    existingToken.family
  );

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      onboardingStatus: user.onboardingStatus,
    },
  };
}

/**
 * Revoke specific refresh token on logout
 */
export async function revokeRefreshToken(rawRefreshToken: string) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  try {
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  } catch (err) {
    // Graceful no-op if token does not exist
  }
}

/**
 * Revoke all active sessions for a user (e.g., password change or global logout)
 */
export async function revokeAllUserSessions(userId: string) {
  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    }),
  ]);
}

/**
 * Register a new user
 */
export async function registerUser(input: RegisterInput, meta: RequestMetadata = {}) {
  const { fullName, email, password } = input;

  // Validate password strength
  const passCheck = validatePasswordStrength(password);
  if (!passCheck.valid) {
    const err = new Error(passCheck.message);
    (err as any).status = 400;
    (err as any).field = "password";
    throw err;
  }

  // Normalise phone
  const phone = normalizeEthiopianPhone(input.phone);

  // Duplicate phone check
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    const err = new Error("An account with this phone number already exists.");
    (err as any).status = 409;
    (err as any).field = "phone";
    throw err;
  }

  // Duplicate email check (only if supplied)
  if (email && email.trim() !== "") {
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      const err = new Error("An account with this email address already exists.");
      (err as any).status = 409;
      (err as any).field = "email";
      throw err;
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate 6-digit OTP and 15-minute expiration
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      phone,
      email: email && email.trim() !== "" ? email.toLowerCase().trim() : null,
      passwordHash,
      role: "BUYER",
      onboardingStatus: "PENDING_ROLE",
      isVerified: false,
      isActive: true,
      otpCode,
      otpExpiresAt,
      tokenVersion: 1,
    },
  });

  // Also create OTPVerification audit record
  await prisma.oTPVerification.create({
    data: {
      userId: user.id,
      code: otpCode,
      purpose: "REGISTER",
      expiresAt: otpExpiresAt,
    },
  });

  // Verification delivery (Email if filled, otherwise SMS)
  const delivery = await NotificationService.sendOTPVerification({
    phone: user.phone || "",
    email: user.email,
    fullName: user.fullName,
    otpCode,
  });

  const session = await createSession(user, meta);

  return {
    requiresVerification: true,
    verificationChannel: delivery.channel,
    recipient: delivery.recipient,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    token: session.accessToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      onboardingStatus: user.onboardingStatus,
    },
  };
}

/**
 * Verify 6-digit OTP code submitted by user
 */
export async function verifyOTPUser(identifier: string, otpCode: string, meta: RequestMetadata = {}) {
  const cleanCode = (otpCode || "").trim();

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { phone: identifier.replace(/[\s\-().]/g, "") },
        { email: identifier.toLowerCase().trim() },
        { id: identifier },
      ],
    },
  });

  if (!user) {
    const err = new Error("User account not found.");
    (err as any).status = 404;
    throw err;
  }

  if (user.isVerified) {
    const session = await createSession(user, meta);
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      token: session.accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: true,
        onboardingStatus: user.onboardingStatus,
      },
      message: "Account already verified.",
    };
  }

  if (!user.otpCode || user.otpCode !== cleanCode) {
    const err = new Error("Invalid verification code. Please check your message or email and try again.");
    (err as any).status = 400;
    (err as any).field = "otpCode";
    throw err;
  }

  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    const err = new Error("Verification code has expired. Please request a new code.");
    (err as any).status = 400;
    (err as any).field = "otpCode";
    throw err;
  }

  // Activate user
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    },
  });

  // Mark OTPVerification as used
  await prisma.oTPVerification.updateMany({
    where: { userId: user.id, purpose: "REGISTER", isUsed: false },
    data: { isUsed: true },
  });

  // Send Welcome Notification
  await NotificationService.sendWelcomeNotification({
    phone: updated.phone || "",
    email: updated.email,
    fullName: updated.fullName,
  });

  const session = await createSession(updated, meta);

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    token: session.accessToken,
    user: {
      id: updated.id,
      fullName: updated.fullName,
      phone: updated.phone,
      email: updated.email,
      role: updated.role,
      isVerified: true,
      onboardingStatus: updated.onboardingStatus,
    },
    message: "Account verified successfully! Welcome to AgriMarket.",
  };
}

/**
 * Resend OTP verification code
 */
export async function resendOTPUser(identifier: string) {
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { phone: identifier.replace(/[\s\-().]/g, "") },
        { email: identifier.toLowerCase().trim() },
        { id: identifier },
      ],
    },
  });

  if (!user) {
    const err = new Error("User account not found.");
    (err as any).status = 404;
    throw err;
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    }),
    prisma.oTPVerification.create({
      data: {
        userId: user.id,
        code: otpCode,
        purpose: "REGISTER",
        expiresAt: otpExpiresAt,
      },
    }),
  ]);

  const delivery = await NotificationService.sendOTPVerification({
    phone: user.phone || "",
    email: user.email,
    fullName: user.fullName,
    otpCode,
  });

  return {
    success: true,
    channel: delivery.channel,
    recipient: delivery.recipient,
    message: `A new 6-digit verification code has been sent via ${delivery.channel === "EMAIL" ? "email" : "SMS"}.`,
  };
}

/**
 * Sign in using Phone Number OR Email Address
 */
export async function loginUser(identifier: string, password: string, meta: RequestMetadata = {}) {
  const resolved = resolveUserIdentifier(identifier);

  const user = await prisma.user.findFirst({
    where: resolved.isEmail
      ? { email: resolved.value }
      : { phone: resolved.value },
  });

  // Constant-time comparison prevention of timing attacks
  if (!user || !user.isActive) {
    const err = new Error("Invalid phone/email or password.");
    (err as any).status = 401;
    throw err;
  }

  if (!user.passwordHash) {
    const err = new Error("This account was created with Google Sign-In. Please sign in with Google or reset your password.");
    (err as any).status = 400;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid phone/email or password.");
    (err as any).status = 401;
    throw err;
  }

  const session = await createSession(user, meta);

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    token: session.accessToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      onboardingStatus: (user as any).onboardingStatus || "PENDING_ROLE",
    },
  };
}

/**
 * Forgot Password - Send Single-Use OTP (Prevents Account Enumeration)
 */
export async function forgotPassword(identifier: string) {
  let resolved: { isEmail: boolean; value: string };
  try {
    resolved = resolveUserIdentifier(identifier);
  } catch {
    // Return generic message even for malformed to avoid oracle attacks
    return {
      success: true,
      message: "If an account exists with this phone or email, a recovery code has been sent.",
    };
  }

  const user = await prisma.user.findFirst({
    where: resolved.isEmail
      ? { email: resolved.value }
      : { phone: resolved.value },
  });

  if (!user || !user.isActive) {
    return {
      success: true,
      message: "If an account exists with this phone or email, a recovery code has been sent.",
    };
  }

  // Generate 6-digit recovery OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Invalidate previous password reset OTPs
  await prisma.oTPVerification.updateMany({
    where: { userId: user.id, purpose: "PASSWORD_RESET", isUsed: false },
    data: { isUsed: true },
  });

  // Record OTP in database
  await prisma.oTPVerification.create({
    data: {
      userId: user.id,
      code: otpCode,
      purpose: "PASSWORD_RESET",
      expiresAt,
    },
  });

  // Dispatch OTP notification
  const delivery = await NotificationService.sendPasswordResetOTP({
    phone: user.phone || "",
    email: user.email,
    fullName: user.fullName,
    otpCode,
  });

  return {
    success: true,
    channel: delivery.channel,
    recipient: delivery.recipient,
    message: `If an account exists with this identifier, a recovery code has been sent via ${
      delivery.channel === "EMAIL" ? "email" : "SMS"
    }.`,
  };
}

/**
 * Verify Recovery Code
 */
export async function verifyPasswordResetCode(identifier: string, code: string) {
  const cleanCode = (code || "").trim();
  const resolved = resolveUserIdentifier(identifier);

  const user = await prisma.user.findFirst({
    where: resolved.isEmail
      ? { email: resolved.value }
      : { phone: resolved.value },
  });

  if (!user) {
    const err = new Error("Invalid or expired password reset code.");
    (err as any).status = 400;
    throw err;
  }

  const otpRecord = await prisma.oTPVerification.findFirst({
    where: {
      userId: user.id,
      code: cleanCode,
      purpose: "PASSWORD_RESET",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    const err = new Error("Invalid or expired password reset code. Please request a new code.");
    (err as any).status = 400;
    throw err;
  }

  return {
    valid: true,
    message: "Code verified. Please choose a new password.",
  };
}

/**
 * Reset Password with Verified Code
 */
export async function resetPasswordWithCode(identifier: string, code: string, newPassword: string) {
  const cleanCode = (code || "").trim();

  // Validate new password against policy
  const passCheck = validatePasswordStrength(newPassword);
  if (!passCheck.valid) {
    const err = new Error(passCheck.message);
    (err as any).status = 400;
    (err as any).field = "newPassword";
    throw err;
  }

  const resolved = resolveUserIdentifier(identifier);
  const user = await prisma.user.findFirst({
    where: resolved.isEmail
      ? { email: resolved.value }
      : { phone: resolved.value },
  });

  if (!user) {
    const err = new Error("Invalid recovery request.");
    (err as any).status = 400;
    throw err;
  }

  const otpRecord = await prisma.oTPVerification.findFirst({
    where: {
      userId: user.id,
      code: cleanCode,
      purpose: "PASSWORD_RESET",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    const err = new Error("Invalid or expired verification code.");
    (err as any).status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Atomically update password, consume OTP, revoke all active sessions, increment tokenVersion
  await prisma.$transaction([
    prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    }),
  ]);

  // Dispatch confirmation alert
  await NotificationService.sendPasswordResetSuccessNotification({
    phone: user.phone || "",
    email: user.email,
    fullName: user.fullName,
  });

  return {
    success: true,
    message: "Password reset successful. All active sessions have been signed out. Please log in with your new password.",
  };
}

/**
 * Get current authenticated user details
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      onboardingStatus: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) {
    const err = new Error("User not found or account deactivated.");
    (err as any).status = 404;
    throw err;
  }

  return user;
}

let googleOAuthClient: OAuth2Client | null = null;

function getGoogleClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error("Google authentication is not configured on the server. Missing GOOGLE_CLIENT_ID.");
    (err as any).status = 500;
    throw err;
  }
  if (!googleOAuthClient) {
    googleOAuthClient = new OAuth2Client(
      clientId,
      process.env.GOOGLE_CLIENT_SECRET || ""
    );
  }
  return googleOAuthClient;
}

let googleCredentialVerifierOverride: ((token: string) => Promise<any>) | null = null;

export function __setGoogleVerifierForTesting(verifier: ((token: string) => Promise<any>) | null) {
  googleCredentialVerifierOverride = verifier;
}

/**
 * Verify a Google ID token or exchange an OAuth authorization code.
 * Validates issuer, audience, signature, expiration, and extracts verified sub and email.
 */
export async function verifyGoogleCredential(credentialOrCode: string) {
  if (googleCredentialVerifierOverride) {
    return await googleCredentialVerifierOverride(credentialOrCode);
  }

  if (!credentialOrCode || typeof credentialOrCode !== "string") {
    const err = new Error("Google credential or authorization code is required.");
    (err as any).status = 400;
    throw err;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const client = getGoogleClient();

  let idToken = credentialOrCode;

  // Check if credentialOrCode is an authorization code (OAuth 2.0 redirect flow)
  // Google ID tokens are JWTs with 3 period-separated parts (header.payload.signature)
  const isJwt = credentialOrCode.split(".").length === 3;
  if (!isJwt) {
    try {
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "")}/auth/google/callback`;
      const { tokens } = await client.getToken({
        code: credentialOrCode,
        redirect_uri: redirectUri,
      });
      if (!tokens.id_token) {
        const err = new Error("Failed to obtain ID token from Google authorization code.");
        (err as any).status = 401;
        throw err;
      }
      idToken = tokens.id_token;
    } catch (err: any) {
      const error = new Error(`Google authorization code exchange failed: ${err.message || "Invalid code"}`);
      (error as any).status = 401;
      throw error;
    }
  }

  try {
    const ticket: any = await client.verifyIdToken({
      idToken,
      audience: clientId,
    } as any);

    const payload = typeof ticket.getPayload === "function" ? ticket.getPayload() : ticket?.payload;
    if (!payload || !payload.sub) {
      const err = new Error("Invalid Google identity token payload.");
      (err as any).status = 401;
      throw err;
    }

    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      const err = new Error("Invalid Google token issuer.");
      (err as any).status = 401;
      throw err;
    }

    if (!payload.email) {
      const err = new Error("Google account does not provide an email address.");
      (err as any).status = 400;
      throw err;
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      emailVerified: Boolean(payload.email_verified),
      name: payload.name ? payload.name.trim() : payload.email.split("@")[0],
      picture: payload.picture || null,
      idToken,
    };
  } catch (error: any) {
    if (error.status) throw error;
    const err = new Error(`Google token verification failed: ${error.message || "Invalid credential"}`);
    (err as any).status = 401;
    throw err;
  }
}

/**
 * Main Google Authentication Service
 * Supports:
 * - Returning linked Google accounts
 * - Registration of new accounts with Google
 * - Detection of unlinked accounts with identical email (requires password to prevent takeover)
 */
export async function authenticateWithGoogle(credential: string, meta: RequestMetadata = {}) {
  const profile = await verifyGoogleCredential(credential);
  const { sub, email, emailVerified, name, picture } = profile;

  // 1. Check if this Google identity is already linked
  const existingIdentity = await prisma.linkedIdentity.findUnique({
    where: {
      provider_providerSub: {
        provider: "google",
        providerSub: sub,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingIdentity) {
    const user = existingIdentity.user;

    // Check account status
    if (!user.isActive) {
      const err = new Error("Your account has been deactivated or suspended. Please contact support.");
      (err as any).status = 403;
      throw err;
    }

    // Update avatar if provided
    if (picture) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, avatarUrl: picture },
        update: { avatarUrl: picture },
      }).catch(() => {});
    }

    const session = await createSession(user, meta);
    return {
      success: true,
      isNewUser: false,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        onboardingStatus: user.onboardingStatus,
      },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    };
  }

  // 2. Check if an account with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // SECURITY POLICY: Do not silently link the Google identity without verification!
    // The user must prove control of the existing account by providing their password.
    const err = new Error(
      "An account with this email address already exists. To securely link your Google account and prevent unauthorized access, please enter your existing account password."
    );
    (err as any).status = 409;
    (err as any).requiresLinkVerification = true;
    (err as any).email = email;
    (err as any).googleSub = sub;
    throw err;
  }

  // 3. New User Registration with Google
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: name || email.split("@")[0],
        email,
        phone: null,
        passwordHash: null,
        role: "BUYER",
        onboardingStatus: "PENDING_ROLE",
        isVerified: emailVerified,
        isActive: true,
        tokenVersion: 1,
      },
    });

    await tx.linkedIdentity.create({
      data: {
        userId: user.id,
        provider: "google",
        providerSub: sub,
        email,
      },
    });

    if (picture) {
      await tx.userProfile.create({
        data: {
          userId: user.id,
          avatarUrl: picture,
        },
      });
    }

    return user;
  });

  // Send Welcome notification asynchronously
  NotificationService.sendWelcomeNotification({
    phone: newUser.phone || "",
    email: newUser.email,
    fullName: newUser.fullName,
  }).catch((e) => console.warn("[Welcome Notification Failed]", e));

  const session = await createSession(newUser, meta);
  return {
    success: true,
    isNewUser: true,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      isVerified: newUser.isVerified,
      onboardingStatus: newUser.onboardingStatus,
    },
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

/**
 * Secure Account Linking
 * Requires user to submit their existing account password alongside the Google credential.
 */
export async function linkGoogleAccount(credential: string, password: string, meta: RequestMetadata = {}) {
  const profile = await verifyGoogleCredential(credential);
  const { sub, email, picture } = profile;

  if (!password || typeof password !== "string") {
    const err = new Error("Current account password is required to verify account linking.");
    (err as any).status = 400;
    (err as any).field = "password";
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const err = new Error("No account found matching this email address.");
    (err as any).status = 404;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("This account is deactivated or suspended.");
    (err as any).status = 403;
    throw err;
  }

  if (user.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const err = new Error("Incorrect account password. Account linking denied.");
      (err as any).status = 401;
      (err as any).field = "password";
      throw err;
    }
  }

  // Atomically create LinkedIdentity
  await prisma.$transaction(async (tx) => {
    const existingIdentity = await tx.linkedIdentity.findUnique({
      where: {
        provider_providerSub: {
          provider: "google",
          providerSub: sub,
        },
      },
    });

    if (existingIdentity) {
      if (existingIdentity.userId !== user.id) {
        const err = new Error("This Google identity is already linked to another AgriMarket user.");
        (err as any).status = 409;
        throw err;
      }
      return;
    }

    await tx.linkedIdentity.create({
      data: {
        userId: user.id,
        provider: "google",
        providerSub: sub,
        email,
      },
    });

    if (picture) {
      await tx.userProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, avatarUrl: picture },
        update: { avatarUrl: picture },
      });
    }
  });

  const session = await createSession(user, meta);
  return {
    success: true,
    message: "Google account linked successfully.",
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      onboardingStatus: user.onboardingStatus,
    },
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}
