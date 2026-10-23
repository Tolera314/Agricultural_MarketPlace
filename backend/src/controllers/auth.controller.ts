import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
import type { RegisterInput } from "../services/auth.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
