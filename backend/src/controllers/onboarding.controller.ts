import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadToCloudinary, validateFileBuffer, inMemoryAssetStore } from '../services/cloudinary.service.js';
import { VerificationStatus, AuditAction, VehicleType, Prisma } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 1. GET /api/onboarding/status
 * Authoritative check of user's role, account status, onboarding progress, and profile verification.
 */
export async function getOnboardingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Please sign in to view your onboarding status.' },
      });
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
      return res.status(404).json({
        success: false,
        error: { field: 'user', message: 'User account could not be found. Please sign in again.' },
      });
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
  } catch (err: any) {
    return next(err);
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
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Authentication required. Please sign in to choose an account role.' },
      });
    }

    const { role } = req.body;
    const allowedRoles = ['BUYER', 'FARMER', 'DELIVERY_WORKER'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'role',
          message: 'Please choose a valid account role: Customer (Buyer), Farmer (Seller), or Delivery Courier.',
        },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { field: 'user', message: 'User account could not be found. Please sign in again.' },
      });
    }

    // Protection: Prevent switching if already fully completed with verified profile
    if ((user as any).onboardingStatus === 'COMPLETED' && user.role !== 'BUYER' && user.role !== role) {
      return res.status(403).json({
        success: false,
        error: {
          field: 'role',
          message: 'Your account is already verified and active. Changing your primary role requires administrator authorization.',
        },
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
      message: `Role assigned successfully as ${role}.`,
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
  } catch (err: any) {
    return next(err);
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
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Authentication required. Please sign in to save your draft.' },
      });
    }

    const { draft } = req.body;
    if (!draft || typeof draft !== 'object') {
      return res.status(400).json({
        success: false,
        error: { field: 'draft', message: 'Draft information is required to save your progress.' },
      });
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
  } catch (err: any) {
    return next(err);
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
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Authentication required. Please sign in to resume your draft.' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingDraft: true },
    });

    return res.json({
      success: true,
      data: { draft: (user as any)?.onboardingDraft || null },
    });
  } catch (err: any) {
    return next(err);
  }
}

/**
 * 5. POST /api/onboarding/upload
 * Secure document upload handler:
 * Streams directly from memory buffer into Cloudinary (zero local disk persistence).
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Authentication required. Please sign in to upload verification files.' },
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: { field: 'file', message: 'Please select a photo or document file to upload.' },
      });
    }

    const detectedMime = validateFileBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        maxSizeBytes: 5 * 1024 * 1024,
        fieldName: 'file',
      }
    );

    const isPdf = detectedMime === 'application/pdf';
    const extension = isPdf ? 'pdf' : (detectedMime.split('/')[1] || 'jpg');
    const safeBaseId = `${Date.now()}-${crypto.randomUUID()}`;
    const filename = `${safeBaseId}.${extension}`;

    // Upload memory buffer directly to Cloudinary
    const uploaded = await uploadToCloudinary(req.file.buffer, {
      folder: 'agrimarket/documents',
      publicId: safeBaseId,
      resourceType: isPdf ? 'raw' : 'image',
      tags: ['verification_doc', `user_${userId}`],
    });

    const documentUrl = `/api/onboarding/documents/${filename}`;

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: {
        documentUrl,
        secureUrl: uploaded.secureUrl,
        publicId: uploaded.publicId,
        filename,
        originalName: req.file.originalname,
        mimeType: detectedMime,
        sizeBytes: uploaded.bytes,
      },
    });
  } catch (err: any) {
    return next(err);
  }
}

/**
 * 6. GET /api/onboarding/documents/:filename
 * Secure document retrieval with authentication and ownership validation.
 * Redirects authorized callers directly to the Cloudinary asset.
 */
export async function serveDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    const userRole = req.auth?.role;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Authentication required to access documents.' },
      });
    }

    const rawFilename = req.params.filename;
    const filename = Array.isArray(rawFilename) ? rawFilename[0] : rawFilename;
    if (!filename || typeof filename !== 'string' || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: { field: 'filename', message: 'Invalid document filename requested.' },
      });
    }

    // Role-based authorization: Admins can inspect all verification documents; regular users can only inspect their own
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
    if (!isAdmin) {
      const isOwner = await prisma.user.findFirst({
        where: {
          id: userId,
          OR: [
            {
              farmerProfile: {
                verificationDocuments: {
                  path: ['identityDocUrl'],
                  string_contains: filename,
                },
              },
            },
            {
              farmerProfile: {
                verificationDocuments: {
                  path: ['faydaDocUrl'],
                  string_contains: filename,
                },
              },
            },
            {
              farmerProfile: {
                verificationDocuments: {
                  path: ['landCertificateUrl'],
                  string_contains: filename,
                },
              },
            },
            {
              deliveryProfile: {
                verificationDocuments: {
                  path: ['identityDocUrl'],
                  string_contains: filename,
                },
              },
            },
            {
              deliveryProfile: {
                verificationDocuments: {
                  path: ['faydaDocUrl'],
                  string_contains: filename,
                },
              },
            },
            {
              deliveryProfile: {
                verificationDocuments: {
                  path: ['driverLicenseDocUrl'],
                  string_contains: filename,
                },
              },
            },
          ],
        },
      });

      if (!isOwner) {
        // Also check if user has this document in their active onboarding draft
        const userWithDraft = await prisma.user.findUnique({
          where: { id: userId },
          select: { onboardingDraft: true },
        });

        const draftString = JSON.stringify(userWithDraft?.onboardingDraft || {});
        if (!draftString.includes(filename)) {
          return res.status(403).json({
            success: false,
            error: { message: 'You do not have permission to view this verification document.' },
          });
        }
      }
    }

    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const publicId = `agrimarket/documents/${filenameWithoutExt}`;

    // 1. If stored in resilient in-memory buffer, serve directly
    const memoryAsset = inMemoryAssetStore.get(publicId);
    if (memoryAsset) {
      res.setHeader('Content-Type', memoryAsset.mime);
      res.setHeader('Content-Length', memoryAsset.bytes);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.end(memoryAsset.buffer);
    }

    // 2. If Cloudinary is configured, redirect to the CDN asset URL
    if (isCloudinaryConfigured()) {
      const redirectUrl = cloudinary.url(publicId, {
        secure: true,
        resource_type: isPdf ? 'raw' : 'image',
        format: isPdf ? 'pdf' : undefined,
      });
      return res.redirect(302, redirectUrl);
    }

    return res.status(404).json({
      success: false,
      error: { field: 'filename', message: 'The requested document could not be found.' },
    });
  } catch (err: any) {
    return next(err);
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
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Authentication required. Please sign in to submit your application.' },
      });
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

    // Clear validation checks with helpful user messages
    if (!farmName || typeof farmName !== 'string' || farmName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { field: 'farmName', message: 'Please enter your farm or enterprise name (at least 2 characters).' },
      });
    }

    if (!identityType || !identityNumber || typeof identityNumber !== 'string' || !identityNumber.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'identityNumber',
          message: 'Please choose an identification type (Kebele ID, Fayda National ID, or Passport) and enter your ID number.',
        },
      });
    }

    if (!consentedToTerms) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'consent',
          message: 'You must confirm the accuracy of your farm details and agree to the marketplace seller terms.',
        },
      });
    }

    const lat = typeof farmLatitude === 'number' && !isNaN(farmLatitude) ? farmLatitude : 9.0222;
    const lon = typeof farmLongitude === 'number' && !isNaN(farmLongitude) ? farmLongitude : 38.7468;
    const parsedSize = typeof farmSizeHectares === 'number' ? farmSizeHectares : parseFloat(String(farmSizeHectares || '1.0'));
    const sizeHectares = isNaN(parsedSize) || parsedSize <= 0 ? 1.0 : parsedSize;

    // Safe foreign key lookup for marketId (prevents foreign key constraint crash)
    let validMarketId: string | null = null;
    if (marketId && typeof marketId === 'string' && marketId.trim() !== '') {
      try {
        const foundMarket = await prisma.market.findFirst({
          where: {
            OR: [
              { id: marketId.trim() },
              { name: { contains: marketId.trim(), mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        if (foundMarket) {
          validMarketId = foundMarket.id;
        }
      } catch {
        validMarketId = null;
      }
    }

    const verificationDocs = {
      identityType,
      identityNumber: identityNumber.trim(),
      identityDocUrl: identityDocUrl || null,
      faydaNumber: faydaNumber ? faydaNumber.trim() : null,
      faydaDocUrl: faydaDocUrl || null,
      landCertificateUrl: landCertificateUrl || null,
      region: region || 'Oromia',
      woreda: woreda || 'Local Woreda',
      kebele: kebele || 'Local Kebele',
      categories: categories || ['vegetables'],
      expectedProducts: expectedProducts || 'Fresh agricultural produce',
      preferredMarket: marketId || null,
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

      // 2. Upsert FarmerProfile with foreign key resilience
      let profile;
      try {
        profile = await tx.farmerProfile.upsert({
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
            marketId: validMarketId,
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
            marketId: validMarketId,
          },
        });
      } catch (upsertErr: any) {
        if (upsertErr?.code === 'P2003') {
          // Fallback if marketId foreign key violates constraint
          profile = await tx.farmerProfile.upsert({
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
              marketId: null,
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
              marketId: null,
            },
          });
        } else {
          throw upsertErr;
        }
      }

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

    // Refresh JWT with the newly updated FARMER role
    const token = jwt.sign(
      { sub: result.user.id, role: result.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    return res.status(200).json({
      success: true,
      message: 'Farmer verification application submitted successfully. Administrator review is pending.',
      data: {
        token,
        profileId: result.profile.id,
        verificationStatus: result.profile.verificationStatus,
        submittedAt: verificationDocs.submittedAt,
      },
    });
  } catch (err: any) {
    return next(err);
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
      return res.status(401).json({
        success: false,
        error: { field: 'auth', message: 'Authentication required. Please sign in to submit your application.' },
      });
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
        error: {
          field: 'vehicleType',
          message: 'Please choose a valid delivery transport method (Bicycle, Motorcycle, Three-Wheeler, Pickup Truck, or Truck).',
        },
      });
    }

    // Conditional rule: motorized vehicles require plate and driver license
    const isMotorized = ['MOTORCYCLE', 'THREE_WHEELER', 'PICKUP_TRUCK', 'TRUCK'].includes(vehicleType);
    if (isMotorized) {
      if (!vehiclePlate || typeof vehiclePlate !== 'string' || vehiclePlate.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: { field: 'vehiclePlate', message: 'Vehicle license plate number is required for motorized transport (e.g., 3-12345 AA).' },
        });
      }
      if (!driverLicenseNumber || typeof driverLicenseNumber !== 'string' || !driverLicenseNumber.trim()) {
        return res.status(400).json({
          success: false,
          error: { field: 'driverLicenseNumber', message: 'A valid driver license number is required for motorized delivery vehicles.' },
        });
      }
    }

    if (!identityType || !identityNumber || typeof identityNumber !== 'string' || !identityNumber.trim()) {
      return res.status(400).json({
        success: false,
        error: { field: 'identityNumber', message: 'Please select an identification type and enter your ID number.' },
      });
    }

    if (!locationConsent) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'locationConsent',
          message: 'Duty location consent is required so the system can match you with nearby delivery pickup orders.',
        },
      });
    }

    if (!consentedToTerms) {
      return res.status(400).json({
        success: false,
        error: { field: 'consent', message: 'Please confirm that your courier details are accurate and agree to the delivery partner terms.' },
      });
    }

    const parsedCap = typeof vehicleCapacityKg === 'number' ? vehicleCapacityKg : parseFloat(String(vehicleCapacityKg || ''));
    const capacityKg = isNaN(parsedCap) || parsedCap <= 0 ? (isMotorized ? 150 : 25) : parsedCap;

    // Safe foreign key lookup for deliveryZoneId (prevents foreign key constraint crash)
    let validDeliveryZoneId: string | null = null;
    if (deliveryZoneId && typeof deliveryZoneId === 'string' && deliveryZoneId.trim() !== '') {
      try {
        const foundZone = await prisma.deliveryZone.findFirst({
          where: {
            OR: [
              { id: deliveryZoneId.trim() },
              { name: { contains: deliveryZoneId.trim(), mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        if (foundZone) {
          validDeliveryZoneId = foundZone.id;
        }
      } catch {
        validDeliveryZoneId = null;
      }
    }

    const verificationDocs = {
      identityType,
      identityNumber: identityNumber.trim(),
      identityDocUrl: identityDocUrl || null,
      faydaNumber: faydaNumber ? faydaNumber.trim() : null,
      faydaDocUrl: faydaDocUrl || null,
      driverLicenseNumber: driverLicenseNumber ? driverLicenseNumber.trim() : null,
      driverLicenseDocUrl: driverLicenseDocUrl || null,
      operatingCity: operatingCity || 'Addis Ababa',
      preferredZone: deliveryZoneId || null,
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

      // 2. Upsert DeliveryWorkerProfile with foreign key resilience
      let profile;
      try {
        profile = await tx.deliveryWorkerProfile.upsert({
          where: { userId },
          create: {
            userId,
            vehicleType: vehicleType as VehicleType,
            vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null,
            vehicleCapacityKg: capacityKg,
            verificationStatus: VerificationStatus.PENDING,
            verificationNote: 'Pending administrator fleet compliance review.',
            verificationDocuments: verificationDocs as any,
            deliveryZoneId: validDeliveryZoneId,
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
            deliveryZoneId: validDeliveryZoneId,
            locationConsentGranted: Boolean(locationConsent),
            locationConsentAt: locationConsent ? new Date() : null,
          },
        });
      } catch (upsertErr: any) {
        if (upsertErr?.code === 'P2003') {
          // Fallback if deliveryZoneId violates foreign key constraint
          profile = await tx.deliveryWorkerProfile.upsert({
            where: { userId },
            create: {
              userId,
              vehicleType: vehicleType as VehicleType,
              vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null,
              vehicleCapacityKg: capacityKg,
              verificationStatus: VerificationStatus.PENDING,
              verificationNote: 'Pending administrator fleet compliance review.',
              verificationDocuments: verificationDocs as any,
              deliveryZoneId: null,
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
              deliveryZoneId: null,
              locationConsentGranted: Boolean(locationConsent),
              locationConsentAt: locationConsent ? new Date() : null,
            },
          });
        } else {
          throw upsertErr;
        }
      }

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

    // Refresh JWT with the newly updated DELIVERY_WORKER role
    const token = jwt.sign(
      { sub: result.user.id, role: result.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    return res.status(200).json({
      success: true,
      message: 'Delivery Worker application submitted successfully. Administrator review is pending.',
      data: {
        token,
        profileId: result.profile.id,
        verificationStatus: result.profile.verificationStatus,
        submittedAt: verificationDocs.submittedAt,
      },
    });
  } catch (err: any) {
    return next(err);
  }
}
