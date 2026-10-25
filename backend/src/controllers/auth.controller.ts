import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
import type { RegisterInput } from "../services/auth.service.js";
import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_SECRET = process.env.JWT_SECRET || "changeme_dev_secret";

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

    const result = await registerUser(payload);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
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

    // Validation or formatting error
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

export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Phone number and password are required.",
        },
      });
    }

    const result = await loginUser(phone, password);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
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

    return next(error);
  }
}

/** Authenticate or provision the demo delivery worker (Abebe Mekonnen) */
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
      { sub: worker.id, role: worker.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Demo delivery worker authenticated successfully.",
      data: {
        token,
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
