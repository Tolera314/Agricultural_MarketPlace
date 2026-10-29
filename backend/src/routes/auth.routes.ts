import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleRefreshToken,
  handleLogout,
  handleLogoutAll,
  handleVerifyOTP,
  handleResendOTP,
  handleForgotPassword,
  handleVerifyResetCode,
  handleResetPassword,
  handleGetMe,
  handleDemoWorkerAuth,
  handleGoogleAuth,
  handleGoogleLink,
  handleUploadAvatar,
  handleDeleteAvatar,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { handleSingleUpload, uploadMemoryImage } from "../middleware/upload.js";
import {
  authRateLimiter,
  passwordRecoveryLimiter,
  otpVerificationLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();

// Standard registration and OTP authentication
router.post("/register", authRateLimiter, handleRegister);
router.post("/verify-otp", otpVerificationLimiter, handleVerifyOTP);
router.post("/resend-otp", otpVerificationLimiter, handleResendOTP);

// Session authentication and management
router.post("/login", authRateLimiter, handleLogin);
router.post("/refresh", handleRefreshToken);
router.post("/logout", handleLogout);
router.post("/logout-all", requireAuth, handleLogoutAll);
router.get("/me", requireAuth, handleGetMe);

// Password recovery and reset
router.post("/forgot-password", passwordRecoveryLimiter, handleForgotPassword);
router.post("/verify-reset-code", otpVerificationLimiter, handleVerifyResetCode);
router.post("/reset-password", passwordRecoveryLimiter, handleResetPassword);

// Demo worker login (development)
router.post("/demo-worker", handleDemoWorkerAuth);

// Google OAuth authentication & account linking
router.post("/google", authRateLimiter, handleGoogleAuth);
router.post("/google/link", authRateLimiter, handleGoogleLink);

// Cloudinary Avatar Profile Management
router.post("/profile/avatar", requireAuth, handleSingleUpload("avatar", uploadMemoryImage), handleUploadAvatar);
router.delete("/profile/avatar", requireAuth, handleDeleteAvatar);

export default router;
