import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';

// Valid coordinate boundaries
const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LON = -180;
const MAX_LON = 180;

interface ShareLocationBody {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  consentGranted: boolean;
  consentPurpose?: string;
  consentVersion?: string;
}

/**
 * POST /api/location/share
 * Authenticated endpoint for explicitly consented user location sharing.
 * Strictly extracts the authenticated user ID from req.auth.sub.
 */
export async function shareLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    const userRole = req.auth?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required to share location.' },
      });
    }

    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      consentGranted,
      consentPurpose = 'DELIVERY_DISPATCH',
      consentVersion = '1.0',
    } = req.body as ShareLocationBody;

    // 1. Validate explicit consent
    if (consentGranted !== true) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'Location sharing requires explicit user consent.',
        },
      });
    }

    // 2. Validate coordinate presence and numeric types
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Latitude and longitude must be valid floating point numbers.',
        },
      });
    }

    // 3. Validate coordinate ranges
    if (latitude < MIN_LAT || latitude > MAX_LAT) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LATITUDE_OUT_OF_RANGE',
          message: `Latitude must be between ${MIN_LAT} and ${MAX_LAT} degrees.`,
        },
      });
    }

    if (longitude < MIN_LON || longitude > MAX_LON) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LONGITUDE_OUT_OF_RANGE',
          message: `Longitude must be between ${MIN_LON} and ${MAX_LON} degrees.`,
        },
      });
    }

    // 4. Validate optional numerical metrics if provided
    if (accuracy !== undefined && (typeof accuracy !== 'number' || accuracy < 0 || isNaN(accuracy))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACCURACY',
          message: 'Reported accuracy must be a non-negative number representing meters.',
        },
      });
    }

    // 5. Gather privacy-preserving network metadata for consent verification
    const forwardedHeader = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedHeader) ? forwardedHeader[0] : forwardedHeader;
    const ipAddress: string | null = (forwardedIp ? forwardedIp.split(',')[0]?.trim() : (req.ip || null)) ?? null;

    const rawUserAgent = req.headers['user-agent'];
    const userAgentStr = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent;
    const userAgent: string | null = (userAgentStr ? userAgentStr.slice(0, 255) : null) ?? null;
    const now = new Date();

    // 6. Record the consented location in audit trail
    const locationRecord = await prisma.userLocationRecord.create({
      data: {
        userId,
        latitude,
        longitude,
        accuracy: accuracy !== undefined ? Number(accuracy) : null,
        altitude: typeof altitude === 'number' && !isNaN(altitude) ? Number(altitude) : null,
        heading: typeof heading === 'number' && !isNaN(heading) ? Number(heading) : null,
        speed: typeof speed === 'number' && !isNaN(speed) ? Number(speed) : null,
        consentGranted: true,
        consentPurpose: String(consentPurpose).slice(0, 100),
        consentVersion: String(consentVersion).slice(0, 20),
        ipAddress,
        userAgent,
        capturedAt: now,
      },
    });

    // 7. If this is a delivery worker, update their live location & consent on DeliveryWorkerProfile
    let updatedWorkerProfile = null;
    if (userRole === 'DELIVERY_WORKER') {
      try {
        updatedWorkerProfile = await prisma.deliveryWorkerProfile.update({
          where: { userId },
          data: {
            lastLatitude: latitude,
            lastLongitude: longitude,
            lastAccuracy: accuracy !== undefined ? Number(accuracy) : null,
            lastLocationAt: now,
            locationConsentGranted: true,
            locationConsentAt: now,
          },
        });
      } catch (profileErr) {
        // If profile row doesn't exist yet, we still retain the location record
        console.warn('Worker profile update skipped:', profileErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Location successfully shared with your consent.',
      data: {
        recordId: locationRecord.id,
        latitude: locationRecord.latitude,
        longitude: locationRecord.longitude,
        accuracy: locationRecord.accuracy,
        capturedAt: locationRecord.capturedAt,
        purpose: locationRecord.consentPurpose,
        workerProfile: updatedWorkerProfile
          ? {
              availability: updatedWorkerProfile.availability,
              lastLocationAt: updatedWorkerProfile.lastLocationAt,
            }
          : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/location/my-latest
 * Retrieves the authenticated user's current consented location status.
 */
export async function getMyLatestLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const latest = await prisma.userLocationRecord.findFirst({
      where: { userId, isRevoked: false },
      orderBy: { capturedAt: 'desc' },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        consentPurpose: true,
        capturedAt: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        deliveryProfile: {
          select: {
            lastLatitude: true,
            lastLongitude: true,
            lastAccuracy: true,
            lastLocationAt: true,
            locationConsentGranted: true,
            locationConsentAt: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        latestRecord: latest,
        deliveryProfileLocation: user?.deliveryProfile || null,
        hasConsented: Boolean(latest || user?.deliveryProfile?.locationConsentGranted),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/location/my-history
 * Privacy & retention control: Allows users to revoke consent and revoke/purge their location history.
 */
export async function revokeLocationConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const now = new Date();

    // Mark location records as revoked
    const updateCount = await prisma.userLocationRecord.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: now,
      },
    });

    // Reset live location on worker profile if worker
    try {
      await prisma.deliveryWorkerProfile.update({
        where: { userId },
        data: {
          lastLatitude: null,
          lastLongitude: null,
          lastAccuracy: null,
          lastLocationAt: null,
          locationConsentGranted: false,
          locationConsentAt: null,
        },
      });
    } catch {
      // ignore if no worker profile
    }

    return res.json({
      success: true,
      message: 'Location consent revoked and active location records marked as revoked.',
      revokedRecordsCount: updateCount.count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/location/admin/records
 * RBAC: Restricted to ADMIN and SUPERADMIN.
 * Displays only location records that users knowingly consented to share.
 */
export async function getAdminLocationRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const workerId = req.query.workerId as string | undefined;
    const purpose = req.query.purpose as string | undefined;
    const includeRevoked = req.query.includeRevoked === 'true';

    const where: any = {};
    if (workerId) where.userId = workerId;
    if (purpose) where.consentPurpose = purpose;
    if (!includeRevoked) where.isRevoked = false;

    const [total, records] = await Promise.all([
      prisma.userLocationRecord.count({ where }),
      prisma.userLocationRecord.findMany({
        where,
        orderBy: { capturedAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
              phone: true,
              deliveryProfile: {
                select: {
                  vehicleType: true,
                  vehiclePlate: true,
                  availability: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        records: records.map(r => ({
          id: r.id,
          user: {
            id: r.user.id,
            name: r.user.fullName,
            role: r.user.role,
            phone: r.user.phone,
            vehicle: r.user.deliveryProfile
              ? `${r.user.deliveryProfile.vehicleType} (${r.user.deliveryProfile.vehiclePlate || 'No plate'})`
              : null,
          },
          coordinates: {
            latitude: r.latitude,
            longitude: r.longitude,
            accuracy: r.accuracy,
          },
          consent: {
            granted: r.consentGranted,
            purpose: r.consentPurpose,
            version: r.consentVersion,
          },
          isRevoked: r.isRevoked,
          revokedAt: r.revokedAt,
          capturedAt: r.capturedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/location/admin/records/:id
 * RBAC: Restricted to ADMIN / SUPERADMIN for GDPR / data retention compliance.
 */
export async function deleteLocationRecordAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      return res.status(400).json({ success: false, error: { message: 'Record ID is required.' } });
    }
    await prisma.userLocationRecord.delete({
      where: { id },
    });
    return res.json({ success: true, message: 'Location record deleted.' });
  } catch (err) {
    next(err);
  }
}
