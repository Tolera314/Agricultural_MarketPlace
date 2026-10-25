import { Router } from "express";
import { handleRegister, handleLogin, handleDemoWorkerAuth } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/demo-worker", handleDemoWorkerAuth);

export default router;
