import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "changeme_dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
/** Normalise an Ethiopian phone number to E.164 (+251XXXXXXXXX). */
function normalizeEthiopianPhone(raw) {
    const digits = raw.replace(/[\s\-().]/g, "");
    if (/^\+251\d{9}$/.test(digits))
        return digits;
    if (/^251\d{9}$/.test(digits))
        return `+${digits}`;
    if (/^0[97]\d{8}$/.test(digits))
        return `+251${digits.slice(1)}`;
    if (/^[97]\d{8}$/.test(digits))
        return `+251${digits}`;
    throw new Error("Invalid Ethiopian phone number format. Please use +251 9XX XXX XXX or +251 7XX XXX XXX.");
}
export async function registerUser(input) {
    const { fullName, email, password } = input;
    // Normalise phone
    const phone = normalizeEthiopianPhone(input.phone);
    // Duplicate phone check
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
        const err = new Error("An account with this phone number already exists.");
        err.status = 409;
        err.field = "phone";
        throw err;
    }
    // Duplicate email check (only if supplied)
    if (email && email.trim() !== "") {
        const existingEmail = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (existingEmail) {
            const err = new Error("An account with this email address already exists.");
            err.status = 409;
            err.field = "email";
            throw err;
        }
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    // Create user in a transaction (buyer profile will be created upon buyer role confirmation)
    const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
            data: {
                fullName: fullName.trim(),
                phone,
                email: email && email.trim() !== "" ? email.toLowerCase().trim() : null,
                passwordHash,
                role: "BUYER", // default public signup role until role selection
                onboardingStatus: "PENDING_ROLE",
                isVerified: false,
                isActive: true,
            },
        });
        return created;
    });
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return {
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            onboardingStatus: user.onboardingStatus || "PENDING_ROLE",
        },
    };
}
export async function loginUser(phone, password) {
    const normalized = normalizeEthiopianPhone(phone);
    const user = await prisma.user.findUnique({ where: { phone: normalized } });
    if (!user || !user.isActive) {
        const err = new Error("Invalid credentials.");
        err.status = 401;
        throw err;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        const err = new Error("Invalid credentials.");
        err.status = 401;
        throw err;
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return {
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            onboardingStatus: user.onboardingStatus || "COMPLETED",
        },
    };
}
//# sourceMappingURL=auth.service.js.map