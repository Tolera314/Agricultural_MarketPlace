import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleDemoWorkerAuth,
  handleVerifyOTP,
  handleResendOTP,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", handleRegister);
router.post("/verify-otp", handleVerifyOTP);
router.post("/resend-otp", handleResendOTP);
router.post("/login", handleLogin);
router.post("/demo-worker", handleDemoWorkerAuth);

export default router;
