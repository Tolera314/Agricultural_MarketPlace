import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { NotificationService } from "./notification.service.js";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "changeme_dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/** Normalise an Ethiopian phone number to E.164 (+251XXXXXXXXX). */
export function normalizeEthiopianPhone(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, "");
  if (/^\+251\d{9}$/.test(digits)) return digits;
  if (/^251\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0[97]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
  if (/^[97]\d{8}$/.test(digits)) return `+251${digits}`;
  throw new Error("Invalid Ethiopian phone number format. Please use +251 9XX XXX XXX or +251 7XX XXX XXX.");
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email?: string | undefined;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const { fullName, email, password } = input;

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
      role: "BUYER", // default public signup role until role selection
      onboardingStatus: "PENDING_ROLE",
      isVerified: false,
      isActive: true,
      otpCode,
      otpExpiresAt,
    },
  });

  // Verification is sent through email if and only if user provided an email, otherwise via SMS (Ethio Telecom / Geez SMS)
  const delivery = await NotificationService.sendOTPVerification({
    phone: user.phone,
    email: user.email,
    fullName: user.fullName,
    otpCode,
  });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  );

  return {
    requiresVerification: true,
    verificationChannel: delivery.channel,
    recipient: delivery.recipient,
    token,
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
export async function verifyOTPUser(identifier: string, otpCode: string) {
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
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );
    return {
      token,
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

  // Send Welcome Notification (Brevo email if email present, SMS if no email)
  await NotificationService.sendWelcomeNotification({
    phone: updated.phone,
    email: updated.email,
    fullName: updated.fullName,
  });

  const token = jwt.sign(
    { sub: updated.id, role: updated.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  );

  return {
    token,
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

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode,
      otpExpiresAt,
    },
  });

  const delivery = await NotificationService.sendOTPVerification({
    phone: user.phone,
    email: user.email,
    fullName: user.fullName,
    otpCode,
  });

  return {
    success: true,
    channel: delivery.channel,
    recipient: delivery.recipient,
    message: `A new 6-digit verification code has been sent via ${delivery.channel === 'EMAIL' ? 'email' : 'SMS'}.`,
  };
}

export async function loginUser(phone: string, password: string) {
  const normalized = normalizeEthiopianPhone(phone);
  const user = await prisma.user.findUnique({ where: { phone: normalized } });

  if (!user || !user.isActive) {
    const err = new Error("Invalid credentials.");
    (err as any).status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid credentials.");
    (err as any).status = 401;
    throw err;
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  );

  return {
    token,
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
