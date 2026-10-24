import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';

// ─── Helper ──────────────────────────────────────────────────

/** Haversine distance in km between two lat/lon pairs */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GET /api/worker/dashboard ────────────────────────────────
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;

    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      include: { deliveryProfile: true },
    });

    if (!worker || !worker.deliveryProfile) {
      return res.status(404).json({ success: false, error: { message: 'Worker profile not found.' } });
    }

    const profile = worker.deliveryProfile;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Today's deliveries (assigned to this worker, updated today)
    const todayJobs = await prisma.deliveryJob.findMany({
      where: {
        assignedWorker: workerId,
        updatedAt: { gte: today, lt: tomorrow },
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                listing: {
                  include: {
                    images: { take: 1 },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const completedToday = todayJobs.filter(j => j.status === 'DELIVERED').length;

    // Get completed deliveries for earnings calc (order.deliveryFee)
    const completedJobs = await prisma.deliveryJob.findMany({
      where: {
        assignedWorker: workerId,
        status: 'DELIVERED',
        deliveredAt: { gte: today, lt: tomorrow },
      },
      include: { order: true },
    });

    const todayEarnings = completedJobs.reduce((sum, j) => {
      return sum + (Number(j.order.deliveryFee) || 0);
    }, 0);

    // Available offers for this worker (PENDING and not expired)
    const availableOffers = await prisma.deliveryOffer.count({
      where: {
        workerId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    // Worker rating (average of reviews targeting this user)
    const ratingAgg = await prisma.review.aggregate({
      where: { targetUserId: workerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Recent activity (last 5 delivery events for this worker's jobs)
    const recentEvents = await prisma.deliveryEvent.findMany({
      where: { job: { assignedWorker: workerId } },
      include: {
        job: {
          include: {
            order: {
              include: {
                items: {
                  include: {
                    listing: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 5,
    });

    // Active job for today's route
    const activeJob = todayJobs.find(j =>
      ['ASSIGNED', 'HEADING_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE'].includes(j.status)
    );

    return res.json({
      success: true,
      data: {
        worker: {
          id: worker.id,
          fullName: worker.fullName,
          phone: worker.phone,
          email: worker.email,
        },
        profile: {
          vehicleType: profile.vehicleType,
          vehiclePlate: profile.vehiclePlate,
          vehicleCapacityKg: profile.vehicleCapacityKg,
          availability: profile.availability,
          lastLatitude: profile.lastLatitude,
          lastLongitude: profile.lastLongitude,
          lastLocationAt: profile.lastLocationAt,
          activeJobCount: profile.activeJobCount,
          verificationStatus: profile.verificationStatus,
        },
        metrics: {
          availableOrders: availableOffers,
          todayDeliveries: todayJobs.length,
          completedToday,
          todayEarnings,
          rating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : null,
          ratingCount: ratingAgg._count.rating,
        },
        todayJobs: todayJobs.slice(0, 10).map(j => ({
          id: j.id,
          orderId: j.orderId,
          status: j.status,
          pickupAddress: j.pickupAddress,
          dropoffAddress: j.dropoffAddress,
          pickupLatitude: j.pickupLatitude,
          pickupLongitude: j.pickupLongitude,
          dropoffLatitude: j.dropoffLatitude,
          dropoffLongitude: j.dropoffLongitude,
          acceptedAt: j.acceptedAt,
          pickedUpAt: j.pickedUpAt,
          deliveredAt: j.deliveredAt,
          product: j.order.items[0]?.listing?.name ?? 'Order',
          quantity: j.order.items[0]?.quantity ? Number(j.order.items[0].quantity) : undefined,
          deliveryFee: j.order.deliveryFee,
        })),
        activeJob: activeJob
          ? {
              id: activeJob.id,
              status: activeJob.status,
              pickupAddress: activeJob.pickupAddress,
              dropoffAddress: activeJob.dropoffAddress,
              pickupLatitude: activeJob.pickupLatitude,
              pickupLongitude: activeJob.pickupLongitude,
              dropoffLatitude: activeJob.dropoffLatitude,
              dropoffLongitude: activeJob.dropoffLongitude,
              deliveryFee: activeJob.order.deliveryFee,
            }
          : null,
        recentActivity: recentEvents.map(e => ({
          id: e.id,
          status: e.status,
          occurredAt: e.occurredAt,
          notes: e.notes,
          jobId: e.jobId,
          product: e.job.order.items[0]?.listing?.name ?? 'Order',
          dropoffAddress: e.job.dropoffAddress,
          deliveryFee: e.job.order.deliveryFee,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/worker/offers ───────────────────────────────────
/** Pending delivery offers for this worker, optionally sorted by distance */
export async function getMyOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const workerProfile = await prisma.deliveryWorkerProfile.findUnique({ where: { userId: workerId } });

    const offers = await prisma.deliveryOffer.findMany({
      where: {
        workerId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        job: {
          include: {
            order: {
              include: {
                items: {
                  include: {
                    listing: {
                      include: {
                        farmerProfile: true,
                        images: { take: 1 },
                      },
                    },
                  },
                },
                buyer: { select: { fullName: true } },
              },
            },
          },
        },
      },
      orderBy: { offeredAt: 'asc' },
    });

    const data = offers.map(o => {
      const job = o.job;
      const item = job.order.items[0];
      const distanceKm =
        workerProfile?.lastLatitude && workerProfile?.lastLongitude
          ? haversineKm(
              workerProfile.lastLatitude,
              workerProfile.lastLongitude,
              job.pickupLatitude,
              job.pickupLongitude
            )
          : null;

      const routeDistKm =
        job.pickupLatitude && job.dropoffLatitude
          ? haversineKm(job.pickupLatitude, job.pickupLongitude, job.dropoffLatitude, job.dropoffLongitude)
          : null;

      const secondsLeft = Math.max(0, Math.floor((o.expiresAt.getTime() - Date.now()) / 1000));

      return {
        offerId: o.id,
        jobId: job.id,
        orderId: job.orderId,
        status: o.status,
        offeredAt: o.offeredAt,
        expiresAt: o.expiresAt,
        secondsLeft,
        product: item?.listing?.name ?? 'Agricultural Produce',
        productImage: item?.listing?.images?.[0]?.url ?? null,
        quantityKg: item?.quantity ? Number(item.quantity) : null,
        pickupAddress: job.pickupAddress,
        dropoffAddress: job.dropoffAddress,
        pickupLatitude: job.pickupLatitude,
        pickupLongitude: job.pickupLongitude,
        dropoffLatitude: job.dropoffLatitude,
        dropoffLongitude: job.dropoffLongitude,
        distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
        routeDistKm: routeDistKm !== null ? Number(routeDistKm.toFixed(1)) : null,
        deliveryFee: job.order.deliveryFee,
        requiredVehicleType: job.requiredVehicleType,
        requiredCapacityKg: job.requiredCapacityKg,
        paymentMethod: job.order.paymentMethod,
      };
    });

    // Sort by distance if available, otherwise by offered time
    data.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return 0;
    });

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/worker/offers/:offerId/accept ──────────────────
export async function acceptOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const offerId = String(req.params.offerId);

    // Atomic: find offer and update in a transaction to prevent race conditions
    const result = await prisma.$transaction(async tx => {
      const offer = await tx.deliveryOffer.findUnique({
        where: { id: offerId },
        include: { job: true },
      });

      if (!offer) throw Object.assign(new Error('Offer not found.'), { status: 404 });
      if (offer.workerId !== workerId) throw Object.assign(new Error('Access denied.'), { status: 403 });
      if (offer.status !== 'PENDING') throw Object.assign(new Error(`Offer already ${offer.status.toLowerCase()}.`), { status: 409 });
      if (offer.expiresAt < new Date()) throw Object.assign(new Error('Offer has expired.'), { status: 410 });
      if (offer.job.status !== 'BROADCASTING') throw Object.assign(new Error('Job is no longer available.'), { status: 409 });

      // Mark offer accepted
      await tx.deliveryOffer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });

      // Expire other pending offers for this job
      await tx.deliveryOffer.updateMany({
        where: { jobId: offer.jobId, status: 'PENDING', NOT: { id: offerId } },
        data: { status: 'WITHDRAWN' },
      });

      // Assign job to worker
      const job = await tx.deliveryJob.update({
        where: { id: offer.jobId },
        data: {
          status: 'ASSIGNED',
          assignedWorker: workerId,
          acceptedAt: new Date(),
        },
      });

      // Increment active job count
      await tx.deliveryWorkerProfile.update({
        where: { userId: workerId },
        data: { activeJobCount: { increment: 1 } },
      });

      // Log event
      await tx.deliveryEvent.create({
        data: { jobId: job.id, status: 'ASSIGNED', notes: 'Worker accepted offer.' },
      });

      return job;
    });

    return res.json({ success: true, message: 'Delivery accepted.', data: { jobId: result.id, status: result.status } });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ success: false, error: { message: err.message } });
    next(err);
  }
}

// ─── POST /api/worker/offers/:offerId/reject ──────────────────
export async function rejectOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const offerId = String(req.params.offerId);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : null;

    const offer = await txOffer(offerId);
    if (!offer) return res.status(404).json({ success: false, error: { message: 'Offer not found.' } });
    if (offer.workerId !== workerId) return res.status(403).json({ success: false, error: { message: 'Access denied.' } });
    if (offer.status !== 'PENDING') return res.status(409).json({ success: false, error: { message: `Offer already ${offer.status.toLowerCase()}.` } });

    await prisma.deliveryOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED', respondedAt: new Date(), rejectionReason: reason },
    });

    return res.json({ success: true, message: 'Offer declined.' });
  } catch (err) {
    next(err);
  }
}

async function txOffer(id: string) {
  return prisma.deliveryOffer.findUnique({ where: { id } });
}

// ─── GET /api/worker/deliveries ───────────────────────────────
export async function getMyDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const pageStr = typeof req.query.page === 'string' ? req.query.page : '1';
    const limitStr = typeof req.query.limit === 'string' ? req.query.limit : '20';
    const take = Math.min(parseInt(limitStr, 10) || 20, 50);
    const skip = (Math.max(parseInt(pageStr, 10) || 1, 1) - 1) * take;

    const where: any = { assignedWorker: workerId };
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.deliveryJob.findMany({
        where,
        include: {
          order: {
            include: {
              items: {
                include: {
                  listing: {
                    select: {
                      name: true,
                      images: { select: { url: true }, take: 1 },
                    },
                  },
                },
              },
            },
          },
          events: { orderBy: { occurredAt: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
        take,
        skip,
      }),
      prisma.deliveryJob.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        jobs: jobs.map(j => ({
          id: j.id,
          orderId: j.orderId,
          status: j.status,
          pickupAddress: j.pickupAddress,
          dropoffAddress: j.dropoffAddress,
          pickupLatitude: j.pickupLatitude,
          pickupLongitude: j.pickupLongitude,
          dropoffLatitude: j.dropoffLatitude,
          dropoffLongitude: j.dropoffLongitude,
          acceptedAt: j.acceptedAt,
          pickedUpAt: j.pickedUpAt,
          deliveredAt: j.deliveredAt,
          failedAt: j.failedAt,
          proofOfDeliveryUrl: j.proofOfDeliveryUrl,
          product: j.order.items[0]?.listing?.name ?? 'Order',
          productImage: j.order.items[0]?.listing?.images?.[0]?.url ?? null,
          quantityKg: j.order.items[0]?.quantity ? Number(j.order.items[0].quantity) : null,
          deliveryFee: j.order.deliveryFee,
          paymentMethod: j.order.paymentMethod,
          cashCollected: j.cashCollected,
          createdAt: j.createdAt,
          events: j.events,
        })),
        total,
        page: parseInt(pageStr, 10) || 1,
        limit: take,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/worker/deliveries/:jobId/status ───────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  ASSIGNED: ['HEADING_TO_PICKUP', 'CANCELLED'],
  HEADING_TO_PICKUP: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['EN_ROUTE', 'FAILED'],
  EN_ROUTE: ['DELIVERED', 'FAILED'],
};

export async function updateDeliveryStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const jobId = String(req.params.jobId);
    const { status, notes, latitude, longitude } = req.body;

    if (!status) return res.status(400).json({ success: false, error: { message: 'Status is required.' } });

    const job = await prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ success: false, error: { message: 'Delivery job not found.' } });
    if (job.assignedWorker !== workerId) return res.status(403).json({ success: false, error: { message: 'Access denied.' } });

    const allowed = VALID_TRANSITIONS[job.status] ?? [];
    if (!allowed.includes(status)) {
      return res.status(409).json({
        success: false,
        error: { message: `Cannot transition from ${job.status} to ${status}.` },
      });
    }

    const now = new Date();
    const updateData: any = { status };
    if (status === 'PICKED_UP') updateData.pickedUpAt = now;
    if (status === 'DELIVERED') updateData.deliveredAt = now;
    if (status === 'FAILED') updateData.failedAt = now;

    const updated = await prisma.$transaction(async tx => {
      const j = await tx.deliveryJob.update({ where: { id: jobId }, data: updateData });
      await tx.deliveryEvent.create({
        data: {
          jobId,
          status: status as any,
          notes: notes ?? null,
          latitude: latitude !== undefined ? Number(latitude) : null,
          longitude: longitude !== undefined ? Number(longitude) : null,
        },
      });
      if (['DELIVERED', 'FAILED', 'CANCELLED'].includes(status)) {
        await tx.deliveryWorkerProfile.update({
          where: { userId: workerId },
          data: { activeJobCount: { decrement: 1 } },
        });
      }
      return j;
    });

    return res.json({ success: true, data: { id: updated.id, status: updated.status } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/worker/earnings ─────────────────────────────────
export async function getEarnings(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const period = typeof req.query.period === 'string' ? req.query.period : 'today';

    const now = new Date();
    let from: Date;
    if (period === 'week') {
      from = new Date(now);
      from.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // today
      from = new Date(now);
      from.setHours(0, 0, 0, 0);
    }

    const jobs = await prisma.deliveryJob.findMany({
      where: {
        assignedWorker: workerId,
        status: 'DELIVERED',
        deliveredAt: { gte: from },
      },
      include: { order: { select: { deliveryFee: true, paymentMethod: true, id: true } } },
      orderBy: { deliveredAt: 'desc' },
    });

    const totalEarnings = jobs.reduce((sum, j) => sum + (Number(j.order.deliveryFee) || 0), 0);

    return res.json({
      success: true,
      data: {
        period,
        from,
        totalEarnings,
        deliveryCount: jobs.length,
        deliveries: jobs.map(j => ({
          jobId: j.id,
          orderId: j.orderId,
          deliveryFee: j.order.deliveryFee,
          paymentMethod: j.order.paymentMethod,
          deliveredAt: j.deliveredAt,
          dropoffAddress: j.dropoffAddress,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/worker/profile ──────────────────────────────────
export async function getWorkerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const user = await prisma.user.findUnique({
      where: { id: workerId },
      include: { deliveryProfile: true, userProfile: true },
    });
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found.' } });

    return res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.userProfile?.avatarUrl ?? null,
        profile: user.deliveryProfile,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/worker/profile ────────────────────────────────
export async function updateWorkerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const { availability, vehiclePlate, vehicleCapacityKg, latitude, longitude } = req.body;

    const updateData: any = {};
    if (availability) updateData.availability = availability;
    if (vehiclePlate !== undefined) updateData.vehiclePlate = vehiclePlate;
    if (vehicleCapacityKg !== undefined) updateData.vehicleCapacityKg = Number(vehicleCapacityKg);
    if (latitude !== undefined && longitude !== undefined) {
      updateData.lastLatitude = Number(latitude);
      updateData.lastLongitude = Number(longitude);
      updateData.lastLocationAt = new Date();
    }

    const profile = await prisma.deliveryWorkerProfile.update({
      where: { userId: workerId },
      data: updateData,
    });

    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/worker/notifications ────────────────────────────
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const notifications = await prisma.notification.findMany({
      where: { userId: workerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
}
