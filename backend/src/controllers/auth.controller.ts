import type { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  authenticateWithGoogle,
  linkGoogleAccount,
  verifyOTPUser,
  resendOTPUser,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  forgotPassword,
  verifyPasswordResetCode,
  resetPasswordWithCode,
  getUserById,
  type RegisterInput,
} from "../services/auth.service.js";
import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import { replaceCloudinaryAsset, deleteFromCloudinary, validateFileBuffer } from "../services/cloudinary.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_SECRET = process.env.JWT_SECRET || "changeme_dev_secret";
export const REFRESH_COOKIE_NAME = "agrimarket_refresh";

/**
 * Production-ready secure cookie options for rotating refresh token
 */
export function getRefreshCookieOptions(expires?: Date) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
    ...(expires ? { expires } : { maxAge: 7 * 24 * 60 * 60 * 1000 }),
  };
}

/**
 * Secure cookie options for access token (SSR & middleware access)
 */
export function getAccessCookieOptions(expires?: Date) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
    ...(expires ? { expires } : { maxAge: 15 * 60 * 1000 }), // 15 minutes
  };
}

/**
 * Extract client IP and User-Agent for audit and session tracking
 */
function extractRequestMeta(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress = (
    typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress
  ) || null;
  const userAgent = req.headers["user-agent"] || null;
  return { ipAddress, userAgent };
}

/**
 * POST /api/auth/register
 */
export async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, phone, email, password } = req.body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          field: "fullName",
          message: "Please enter your full name (at least 2 characters).",
        },
      });
    }

    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: "phone",
          message: "Phone number is required.",
        },
      });
    }

    if (email && typeof email === "string" && email.trim() !== "") {
      if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: {
            field: "email",
            message: "Please enter a valid email address.",
          },
        });
      }
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          field: "password",
          message: "Password must be at least 8 characters long.",
        },
      });
    }

    const payload: RegisterInput = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email && typeof email === "string" && email.trim() !== "" ? email.trim() : undefined,
      password,
    };

    const meta = extractRequestMeta(req);
    const result = await registerUser(payload, meta);

    // Set secure HttpOnly refresh token cookie
    if (result.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(result.expiresAt));
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        requiresVerification: result.requiresVerification,
        verificationChannel: result.verificationChannel,
        recipient: result.recipient,
        accessToken: result.accessToken,
        token: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          field: error.field,
          message: error.message,
        },
      });
    }

    if (error.message && error.message.includes("Ethiopian phone")) {
      return res.status(400).json({
        success: false,
        error: {
          field: "phone",
          message: error.message,
        },
      });
    }

    return next(error);
  }
}

/**
 * POST /api/auth/login
 * Accepts: identifier (email or phone) OR phone OR email, along with password
 */
export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, phone, email, password, rememberMe } = req.body;
    const loginIdentifier = (identifier || phone || email || "").toString().trim();

    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        error: {
          field: "identifier",
          message: "Please enter your phone number or email address.",
        },
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          field: "password",
          message: "Password is required.",
        },
      });
    }

    const meta = extractRequestMeta(req);
    const result = await loginUser(loginIdentifier, password, meta);

    // Set secure HttpOnly cookie for refresh token and access token
    const cookieOptions = getRefreshCookieOptions(rememberMe ? result.expiresAt : undefined);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    if (result.accessToken) {
      res.cookie("accessToken", result.accessToken, getAccessCookieOptions());
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken: result.accessToken,
        token: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    }

    if (error.message && error.message.includes("Ethiopian phone")) {
      return res.status(400).json({
        success: false,
        error: {
          field: "identifier",
          message: error.message,
        },
      });
    }

    return next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Silent session rotation using HttpOnly refresh cookie
 */
export async function handleRefreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
      return res.status(401).json({
        success: false,
        error: {
          message: "No active session found. Please sign in.",
        },
      });
    }

    const meta = extractRequestMeta(req);
    const result = await rotateRefreshToken(rawRefreshToken, meta);

    // Update HttpOnly cookie with new rotated refresh token and new access token
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(result.expiresAt));
    if (result.accessToken) {
      res.cookie("accessToken", result.accessToken, getAccessCookieOptions());
    }

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        token: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    // If refresh fails, clear the invalid cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { message: error.message },
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/logout
 * Revokes current refresh token and clears cookie
 */
export async function handleLogout(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (rawRefreshToken) {
      await revokeRefreshToken(rawRefreshToken);
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.clearCookie("accessToken", { path: "/" });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error: any) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.clearCookie("accessToken", { path: "/" });
    return next(error);
  }
}

/**
 * POST /api/auth/logout-all
 * Revokes all sessions for user and increments tokenVersion
 */
export async function handleLogoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required." },
      });
    }

    await revokeAllUserSessions(userId);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });

    return res.status(200).json({
      success: true,
      message: "All sessions have been signed out.",
    });
  } catch (error: any) {
    return next(error);
  }
}

/**
 * POST /api/auth/verify-otp
 */
export async function handleVerifyOTP(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, otpCode } = req.body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        error: { field: "identifier", message: "Account phone, email, or user identifier is required." },
      });
    }

    if (!otpCode || typeof otpCode !== "string" || !otpCode.trim()) {
      return res.status(400).json({
        success: false,
        error: { field: "otpCode", message: "6-digit verification code is required." },
      });
    }

    const meta = extractRequestMeta(req);
    const result = await verifyOTPUser(identifier.trim(), otpCode.trim(), meta);

    if (result.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        accessToken: result.accessToken,
        token: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          field: error.field,
          message: error.message,
        },
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/resend-otp
 */
export async function handleResendOTP(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier } = req.body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        error: { field: "identifier", message: "Account phone or email is required." },
      });
    }

    const result = await resendOTPUser(identifier.trim());

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          field: error.field,
          message: error.message,
        },
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function handleForgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier } = req.body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          field: "identifier",
          message: "Please enter your registered phone number or email address.",
        },
      });
    }

    const result = await forgotPassword(identifier.trim());

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { message: error.message },
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/verify-reset-code
 */
export async function handleVerifyResetCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, code } = req.body;

    if (!identifier || !code) {
      return res.status(400).json({
        success: false,
        error: { message: "Identifier and recovery code are required." },
      });
    }

    const result = await verifyPasswordResetCode(identifier.trim(), code.trim());

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { message: error.message },
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function handleResetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, code, newPassword } = req.body;

    if (!identifier || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: "Identifier, verification code, and new password are required." },
      });
    }

    const result = await resetPasswordWithCode(identifier.trim(), code.trim(), newPassword);

    // Clear refresh cookie since all sessions are revoked on password change
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          field: error.field,
          message: error.message,
        },
      });
    }
    return next(error);
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
export async function handleGetMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required." },
      });
    }

    const user = await getUserById(userId);

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { message: error.message },
      });
    }
    return next(error);
  }
}

/**
 * Demo worker login (development)
 */
export async function handleDemoWorkerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const demoPhone = "+251911234567";
    let worker = await prisma.user.findUnique({
      where: { phone: demoPhone },
      include: { deliveryProfile: true },
    });

    if (!worker) {
      worker = await prisma.user.create({
        data: {
          fullName: "Abebe Mekonnen",
          phone: demoPhone,
          email: "abebe.delivery@agrimarket.et",
          passwordHash: "$2a$12$e8YjT3O/tZ8lM5B1T5x8g.8m9PzW6f9g3VqM5v1K.9q",
          role: "DELIVERY_WORKER",
          isVerified: true,
          isActive: true,
          tokenVersion: 1,
          deliveryProfile: {
            create: {
              vehicleType: "MOTORCYCLE",
              vehiclePlate: "3-A45129 ET",
              vehicleCapacityKg: 50.0,
              availability: "ONLINE",
              verificationStatus: "VERIFIED",
              lastLatitude: 9.012,
              lastLongitude: 38.755,
              lastAccuracy: 12.0,
              lastLocationAt: new Date(),
              locationConsentGranted: true,
              locationConsentAt: new Date(),
            },
          },
        },
        include: { deliveryProfile: true },
      });
    } else if (!worker.deliveryProfile) {
      const profile = await prisma.deliveryWorkerProfile.create({
        data: {
          userId: worker.id,
          vehicleType: "MOTORCYCLE",
          vehiclePlate: "3-A45129 ET",
          vehicleCapacityKg: 50.0,
          availability: "ONLINE",
          verificationStatus: "VERIFIED",
          lastLatitude: 9.012,
          lastLongitude: 38.755,
          lastAccuracy: 12.0,
          lastLocationAt: new Date(),
          locationConsentGranted: true,
          locationConsentAt: new Date(),
        },
      });
      (worker as any).deliveryProfile = profile;
    }

    const token = jwt.sign(
      { sub: worker.id, role: worker.role, tokenVersion: worker.tokenVersion },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Demo delivery worker authenticated successfully.",
      data: {
        token,
        accessToken: token,
        user: {
          id: worker.id,
          fullName: worker.fullName,
          phone: worker.phone,
          email: worker.email,
          role: worker.role,
          isVerified: worker.isVerified,
        },
        profile: worker.deliveryProfile,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/google
 * Handles Google Sign-In and Google Sign-Up using verified ID token or OAuth code.
 */
export async function handleGoogleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const credential = req.body.credential || req.body.idToken || req.body.code;
    const redirectUri = req.body.redirectUri;

    if (!credential || typeof credential !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          field: "credential",
          message: "Google credential token or authorization code is required.",
        },
      });
    }

    const meta = extractRequestMeta(req);
    const result = await authenticateWithGoogle(credential.trim(), meta, redirectUri);

    // Set secure HttpOnly cookies for refresh token and access token
    if (result.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(result.expiresAt));
    }
    if (result.accessToken) {
      res.cookie("accessToken", result.accessToken, getAccessCookieOptions());
    }

    const redirectUrl = result.isNewUser
      ? "/onboarding/select-role"
      : (result.user.onboardingStatus === "COMPLETED" ? "/dashboard" : "/onboarding/select-role");

    return res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      message: result.isNewUser ? "Welcome to AgriMarket! Account created with Google." : "Signed in with Google successfully.",
      isNewUser: result.isNewUser,
      data: {
        accessToken: result.accessToken,
        token: result.accessToken,
        user: result.user,
        redirectUrl,
      },
    });
  } catch (error: any) {
    if (error.status === 409 && error.requiresLinkVerification) {
      return res.status(409).json({
        success: false,
        requiresLinkVerification: true,
        email: error.email,
        googleSub: error.googleSub,
        message: error.message,
      });
    }

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          field: error.field,
          message: error.message,
        },
      });
    }

    return next(error);
  }
}

/**
 * POST /api/auth/google/link
 * Securely links a Google identity to an existing account after verifying account password.
 */
export async function handleGoogleLink(req: Request, res: Response, next: NextFunction) {
  try {
    const credential = req.body.credential || req.body.idToken;
    const password = req.body.password;
    const redirectUri = req.body.redirectUri;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: { field: "credential", message: "Google credential is required." },
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: { field: "password", message: "Account password is required to link identity." },
      });
    }

    const meta = extractRequestMeta(req);
    const result = await linkGoogleAccount(credential.trim(), password, meta, redirectUri);

    if (result.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(result.expiresAt));
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        accessToken: result.accessToken,
        token: result.accessToken,
        user: result.user,
        redirectUrl: result.user.onboardingStatus === "COMPLETED" ? "/dashboard" : "/onboarding/select-role",
      },
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          field: error.field,
          message: error.message,
        },
      });
    }
    return next(error);
  }
}


/**
 * POST /api/auth/profile/avatar
 * Uploads/replaces user profile avatar in Cloudinary directly from memory buffer.
 */
export async function handleUploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { field: "auth", message: "Authentication required to update avatar." },
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: { field: "avatar", message: "Please select an image file to upload as your avatar." },
      });
    }

    const detectedMime = validateFileBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        allowedMimes: ["image/jpeg", "image/png", "image/webp"],
        maxSizeBytes: 3 * 1024 * 1024,
        fieldName: "avatar",
      }
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userProfile: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { field: "user", message: "User account could not be found." },
      });
    }

    // Replace old avatar in Cloudinary (uploads new first, deletes old afterwards)
    const uploaded = await replaceCloudinaryAsset(
      user.userProfile?.avatarPublicId,
      req.file.buffer,
      {
        folder: "agrimarket/avatars",
        resourceType: "image",
        tags: ["avatar", `user_${userId}`],
      }
    );

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        avatarUrl: uploaded.secureUrl,
        avatarPublicId: uploaded.publicId,
      },
      update: {
        avatarUrl: uploaded.secureUrl,
        avatarPublicId: uploaded.publicId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      data: {
        avatarUrl: updatedProfile.avatarUrl,
        avatarPublicId: updatedProfile.avatarPublicId,
      },
    });
  } catch (error: any) {
    return next(error);
  }
}

/**
 * DELETE /api/auth/profile/avatar
 * Deletes user profile avatar from Cloudinary and clears database fields.
 */
export async function handleDeleteAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { field: "auth", message: "Authentication required." },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userProfile: true },
    });

    if (!user || !user.userProfile) {
      return res.status(200).json({
        success: true,
        message: "No avatar to remove.",
      });
    }

    if (user.userProfile.avatarPublicId) {
      await deleteFromCloudinary(user.userProfile.avatarPublicId, "image");
    }

    await prisma.userProfile.update({
      where: { userId },
      data: {
        avatarUrl: null,
        avatarPublicId: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Avatar removed successfully.",
    });
  } catch (error: any) {
    return next(error);
  }
}
