import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { VerificationStatus, AuditAction, VehicleType, Prisma } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'verification_docs');

// Ensure upload directory exists securely
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 1. GET /api/onboarding/status
 * Authoritative check of user's role, account status, onboarding progress, and profile verification.
 */
export async function getOnboardingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        farmerProfile: true,
        deliveryProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User account not found.' } });
    }

    return res.json({
      success: true,
      data: {
        userId: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        onboardingStatus: (user as any).onboardingStatus || 'COMPLETED',
        onboardingDraft: (user as any).onboardingDraft || null,
        farmerProfile: user.farmerProfile
          ? {
              id: user.farmerProfile.id,
              farmName: user.farmerProfile.farmName,
              farmDescription: user.farmerProfile.farmDescription,
              verificationStatus: user.farmerProfile.verificationStatus,
              verificationNote: user.farmerProfile.verificationNote,
              verificationDocuments: (user.farmerProfile as any).verificationDocuments || null,
              farmLatitude: user.farmerProfile.farmLatitude,
              farmLongitude: user.farmerProfile.farmLongitude,
              createdAt: user.farmerProfile.createdAt,
              updatedAt: user.farmerProfile.updatedAt,
            }
          : null,
        deliveryProfile: user.deliveryProfile
          ? {
              id: user.deliveryProfile.id,
              vehicleType: user.deliveryProfile.vehicleType,
              vehiclePlate: user.deliveryProfile.vehiclePlate,
              vehicleCapacityKg: user.deliveryProfile.vehicleCapacityKg,
              availability: user.deliveryProfile.availability,
              verificationStatus: user.deliveryProfile.verificationStatus,
              verificationNote: (user.deliveryProfile as any).verificationNote || null,
              verificationDocuments: (user.deliveryProfile as any).verificationDocuments || null,
              activeJobCount: user.deliveryProfile.activeJobCount,
              createdAt: user.deliveryProfile.createdAt,
              updatedAt: user.deliveryProfile.updatedAt,
            }
          : null,
        buyerProfile: user.buyerProfile
          ? {
              id: user.buyerProfile.id,
              preferredDeliveryAddress: user.buyerProfile.preferredDeliveryAddress,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. POST /api/onboarding/select-role
 * Server-authoritative role selection.
 * - Customer / Buyer: ensures buyer profile, immediately marks COMPLETED.
 * - Farmer / Delivery Worker: sets role, marks IN_PROGRESS to begin wizard.
 */
export async function selectRole(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const { role } = req.body;
    const allowedRoles = ['BUYER', 'FARMER', 'DELIVERY_WORKER'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid role selection. Must be BUYER, FARMER, or DELIVERY_WORKER.' },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    // Protection: Prevent switching if already fully completed with verified profile
    if ((user as any).onboardingStatus === 'COMPLETED' && user.role !== 'BUYER' && user.role !== role) {
      return res.status(403).json({
        success: false,
        error: { message: 'Role changes for verified operational accounts require administrator authorization.' },
      });
    }

    let updatedUser: any;
    let nextOnboardingStatus: string;

    if (role === 'BUYER') {
      nextOnboardingStatus = 'COMPLETED';
      updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: {
            role: 'BUYER',
            onboardingStatus: 'COMPLETED',
          },
        });

        // Ensure BuyerProfile exists idempotently
        await tx.buyerProfile.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });

        return u;
      });
    } else {
      nextOnboardingStatus = 'IN_PROGRESS';
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: role as any,
          onboardingStatus: 'IN_PROGRESS',
        },
      });
    }

    // Refresh JWT with the newly assigned role
    const token = jwt.sign(
      { sub: updatedUser.id, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    return res.json({
      success: true,
      message: `Role assigned as ${role}.`,
      data: {
        token,
        user: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          phone: updatedUser.phone,
          email: updatedUser.email,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
          onboardingStatus: nextOnboardingStatus,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. POST /api/onboarding/draft
 * Persists onboarding draft state so user can resume anytime.
 */
export async function saveDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const { draft } = req.body;
    if (!draft || typeof draft !== 'object') {
      return res.status(400).json({ success: false, error: { message: 'Draft data is required.' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { onboardingDraft: draft },
    });

    // Send SMS for Draft Resumption (Ethio Telecom / Geez SMS)
    if (updatedUser.phone) {
      NotificationService.sendDraftResumptionSMS({
        phone: updatedUser.phone,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
      }).catch((e) => console.warn('[Draft Resumption SMS Failed]', e));
    }

    return res.json({
      success: true,
      message: 'Draft saved successfully. A resumption link has been sent to your phone via SMS.',
      data: { savedAt: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. GET /api/onboarding/draft
 * Retrieves saved draft.
 */
export async function getDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingDraft: true },
    });

    return res.json({
      success: true,
      data: { draft: (user as any)?.onboardingDraft || null },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. POST /api/onboarding/upload
 * Secure document upload handler.
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file was uploaded.' } });
    }

    const file = req.file;
    const documentUrl = `/api/onboarding/documents/${file.filename}`;

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: {
        documentUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. GET /api/onboarding/documents/:filename
 * Secure document retrieval with authentication and ownership validation.
 */
export async function serveDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    const userRole = req.auth?.role;
    const rawParam = req.params.filename;
    const cleanParam = (Array.isArray(rawParam) ? rawParam[0] : rawParam) || '';
    const filename = path.basename(String(cleanParam)); // Sanitize filename against traversal

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { message: 'Document not found.' } });
    }

    // Ownership or admin check: Admin can access any document.
    // If not admin, check if filename matches user's uploaded documents.
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { farmerProfile: true, deliveryProfile: true },
      });

      const userDocs = JSON.stringify({
        draft: (user as any)?.onboardingDraft,
        farmerDocs: (user?.farmerProfile as any)?.verificationDocuments,
        workerDocs: (user?.deliveryProfile as any)?.verificationDocuments,
      });

      if (!userDocs.includes(filename)) {
        return res.status(403).json({ success: false, error: { message: 'Access denied to this document.' } });
      }
    }

    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

/**
 * 7. POST /api/onboarding/submit-farmer
 * Submits the Farmer Onboarding & Verification Application.
 */
export async function submitFarmerApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const {
      farmName,
      farmDescription,
      region,
      woreda,
      kebele,
      farmLatitude,
      farmLongitude,
      farmSizeHectares,
      isOrganic,
      categories,
      expectedProducts,
      marketId,
      identityType,
      identityNumber,
      identityDocUrl,
      faydaNumber,
      faydaDocUrl,
      landCertificateUrl,
      consentedToTerms,
    } = req.body;

    // Validation
    if (!farmName || typeof farmName !== 'string' || farmName.trim().length < 2) {
      return res.status(400).json({ success: false, error: { field: 'farmName', message: 'Farm name is required.' } });
    }

    if (!identityType || !identityNumber) {
      return res.status(400).json({
        success: false,
        error: { field: 'identityNumber', message: 'Identity document type and identification number are required.' },
      });
    }

    if (!consentedToTerms) {
      return res.status(400).json({
        success: false,
        error: { field: 'consent', message: 'You must confirm the accuracy of your application and agree to terms.' },
      });
    }

    const lat = typeof farmLatitude === 'number' && !isNaN(farmLatitude) ? farmLatitude : 9.0222;
    const lon = typeof farmLongitude === 'number' && !isNaN(farmLongitude) ? farmLongitude : 38.7468;
    const sizeHectares = farmSizeHectares ? parseFloat(farmSizeHectares) : 1.0;

    const verificationDocs = {
      identityType,
      identityNumber,
      identityDocUrl: identityDocUrl || null,
      faydaNumber: faydaNumber || null,
      faydaDocUrl: faydaDocUrl || null,
      landCertificateUrl: landCertificateUrl || null,
      region: region || 'Oromia',
      woreda: woreda || 'Local Woreda',
      kebele: kebele || 'Local Kebele',
      categories: categories || ['vegetables'],
      expectedProducts: expectedProducts || 'Fresh agricultural produce',
      submittedAt: new Date().toISOString(),
    };

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure user has role FARMER and status PENDING_VERIFICATION
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role: 'FARMER',
          onboardingStatus: 'PENDING_VERIFICATION',
          onboardingDraft: Prisma.DbNull, // Clear completed draft
        },
      });

      // 2. Upsert FarmerProfile
      const profile = await tx.farmerProfile.upsert({
        where: { userId },
        create: {
          userId,
          farmName: farmName.trim(),
          farmDescription: farmDescription ? farmDescription.trim() : null,
          farmSizeHectares: sizeHectares,
          isOrganic: Boolean(isOrganic),
          certifications: isOrganic ? ['Organic Certified'] : [],
          verificationStatus: VerificationStatus.PENDING,
          verificationNote: 'Pending administrator document verification.',
          verificationDocuments: verificationDocs as any,
          farmLatitude: lat,
          farmLongitude: lon,
          marketId: marketId || null,
        },
        update: {
          farmName: farmName.trim(),
          farmDescription: farmDescription ? farmDescription.trim() : null,
          farmSizeHectares: sizeHectares,
          isOrganic: Boolean(isOrganic),
          verificationStatus: VerificationStatus.PENDING,
          verificationNote: 'Resubmitted — pending administrator review.',
          verificationDocuments: verificationDocs as any,
          farmLatitude: lat,
          farmLongitude: lon,
          marketId: marketId || null,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: AuditAction.CREATE,
          entityType: 'FarmerProfile',
          entityId: profile.id,
          newValue: {
            farmName: profile.farmName,
            verificationStatus: 'PENDING',
            submittedAt: verificationDocs.submittedAt,
          },
        },
      });

      return { user, profile };
    });

    return res.status(200).json({
      success: true,
      message: 'Farmer verification application submitted successfully. Administrator review is pending.',
      data: {
        profileId: result.profile.id,
        verificationStatus: result.profile.verificationStatus,
        submittedAt: verificationDocs.submittedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. POST /api/onboarding/submit-worker
 * Submits the Delivery Worker Onboarding & Verification Application.
 */
export async function submitWorkerApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const {
      vehicleType,
      vehiclePlate,
      vehicleCapacityKg,
      operatingCity,
      deliveryZoneId,
      identityType,
      identityNumber,
      identityDocUrl,
      faydaNumber,
      faydaDocUrl,
      driverLicenseNumber,
      driverLicenseDocUrl,
      locationConsent,
      consentedToTerms,
    } = req.body;

    // Validate transport method
    const validVehicleTypes: VehicleType[] = [
      'BICYCLE',
      'MOTORCYCLE',
      'THREE_WHEELER',
      'PICKUP_TRUCK',
      'TRUCK',
      'OTHER',
    ];

    if (!vehicleType || !validVehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        error: { field: 'vehicleType', message: 'Valid delivery vehicle type is required.' },
      });
    }

    // Conditional rule: motorized vehicles require plate and driver license
    const isMotorized = ['MOTORCYCLE', 'THREE_WHEELER', 'PICKUP_TRUCK', 'TRUCK'].includes(vehicleType);
    if (isMotorized) {
      if (!vehiclePlate || typeof vehiclePlate !== 'string' || vehiclePlate.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: { field: 'vehiclePlate', message: 'Vehicle plate number is required for motorized transport.' },
        });
      }
      if (!driverLicenseNumber || typeof driverLicenseNumber !== 'string') {
        return res.status(400).json({
          success: false,
          error: { field: 'driverLicenseNumber', message: 'Valid driving license is required for motorized transport.' },
        });
      }
    }

    if (!identityType || !identityNumber) {
      return res.status(400).json({
        success: false,
        error: { field: 'identityNumber', message: 'Identification document and number are required.' },
      });
    }

    if (!consentedToTerms) {
      return res.status(400).json({
        success: false,
        error: { field: 'consent', message: 'You must confirm the accuracy of your application and agree to terms.' },
      });
    }

    const capacityKg = vehicleCapacityKg ? parseFloat(vehicleCapacityKg) : isMotorized ? 150 : 25;

    const verificationDocs = {
      identityType,
      identityNumber,
      identityDocUrl: identityDocUrl || null,
      faydaNumber: faydaNumber || null,
      faydaDocUrl: faydaDocUrl || null,
      driverLicenseNumber: driverLicenseNumber || null,
      driverLicenseDocUrl: driverLicenseDocUrl || null,
      operatingCity: operatingCity || 'Addis Ababa',
      submittedAt: new Date().toISOString(),
    };

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure user has role DELIVERY_WORKER and status PENDING_VERIFICATION
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role: 'DELIVERY_WORKER',
          onboardingStatus: 'PENDING_VERIFICATION',
          onboardingDraft: Prisma.DbNull,
        },
      });

      // 2. Upsert DeliveryWorkerProfile
      const profile = await tx.deliveryWorkerProfile.upsert({
        where: { userId },
        create: {
          userId,
          vehicleType: vehicleType as VehicleType,
          vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null,
          vehicleCapacityKg: capacityKg,
          verificationStatus: VerificationStatus.PENDING,
          verificationNote: 'Pending administrator fleet compliance review.',
          verificationDocuments: verificationDocs as any,
          deliveryZoneId: deliveryZoneId || null,
          locationConsentGranted: Boolean(locationConsent),
          locationConsentAt: locationConsent ? new Date() : null,
        },
        update: {
          vehicleType: vehicleType as VehicleType,
          vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null,
          vehicleCapacityKg: capacityKg,
          verificationStatus: VerificationStatus.PENDING,
          verificationNote: 'Resubmitted — pending administrator fleet compliance review.',
          verificationDocuments: verificationDocs as any,
          deliveryZoneId: deliveryZoneId || null,
          locationConsentGranted: Boolean(locationConsent),
          locationConsentAt: locationConsent ? new Date() : null,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: AuditAction.CREATE,
          entityType: 'DeliveryWorkerProfile',
          entityId: profile.id,
          newValue: {
            vehicleType: profile.vehicleType,
            verificationStatus: 'PENDING',
            submittedAt: verificationDocs.submittedAt,
          },
        },
      });

      return { user, profile };
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery Worker application submitted successfully. Administrator review is pending.',
      data: {
        profileId: result.profile.id,
        verificationStatus: result.profile.verificationStatus,
        submittedAt: verificationDocs.submittedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
