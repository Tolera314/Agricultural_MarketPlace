import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { haversineKm, dispatchOrder, seedDemoOrderAndDispatch } from '../services/dispatch.service.js';

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
            buyer: {
              select: { fullName: true, phone: true },
            },
          },
        },
        events: {
          orderBy: { occurredAt: 'desc' },
          take: 3,
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

    // Recent activity (last 6 delivery events for this worker's jobs)
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
      take: 6,
    });

    // Active job for today's route
    const activeJob = todayJobs.find(j =>
      ['ASSIGNED', 'HEADING_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE'].includes(j.status)
    );

    // Pending Cash on Delivery (COD) reconciliations
    const pendingCod = await prisma.cashReconciliation.aggregate({
      where: {
        workerId,
        status: 'PENDING',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Unresolved incidents count
    const incidentCount = await prisma.report.count({
      where: {
        reporterId: workerId,
        status: { in: ['OPEN', 'INVESTIGATING'] },
      },
    });

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
          rating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : 4.8,
          ratingCount: ratingAgg._count.rating || 12,
          pendingCodBalance: Number(pendingCod._sum.amount || 0),
          pendingCodCount: pendingCod._count.id,
          activeIncidents: incidentCount,
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
          failedAt: j.failedAt,
          product: j.order.items[0]?.listing?.name ?? 'Agricultural Produce',
          quantityKg: j.order.items[0]?.quantity ? Number(j.order.items[0].quantity) : null,
          deliveryFee: j.order.deliveryFee,
          buyerName: j.order.buyer?.fullName,
          buyerPhone: j.order.buyer?.phone,
        })),
        activeJob: activeJob
          ? {
              id: activeJob.id,
              orderId: activeJob.orderId,
              status: activeJob.status,
              pickupAddress: activeJob.pickupAddress,
              dropoffAddress: activeJob.dropoffAddress,
              pickupLatitude: activeJob.pickupLatitude,
              pickupLongitude: activeJob.pickupLongitude,
              dropoffLatitude: activeJob.dropoffLatitude,
              dropoffLongitude: activeJob.dropoffLongitude,
              deliveryFee: activeJob.order.deliveryFee,
              product: activeJob.order.items[0]?.listing?.name ?? 'Agricultural Produce',
              quantityKg: activeJob.order.items[0]?.quantity ? Number(activeJob.order.items[0].quantity) : null,
              buyerName: activeJob.order.buyer?.fullName,
              buyerPhone: activeJob.order.buyer?.phone,
              paymentMethod: activeJob.order.paymentMethod,
              totalAmount: activeJob.order.totalAmount,
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
                buyer: { select: { fullName: true, phone: true } },
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
        tradeType: job.order.tradeType,
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
        distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : 2.5,
        routeDistKm: routeDistKm !== null ? Number(routeDistKm.toFixed(1)) : 8.0,
        deliveryFee: job.order.deliveryFee,
        requiredVehicleType: job.requiredVehicleType,
        requiredCapacityKg: job.requiredCapacityKg,
        paymentMethod: job.order.paymentMethod,
        buyerName: job.order.buyer?.fullName,
        farmerName: item?.listing?.farmerProfile?.farmName,
      };
    });

    // Sort by proximity to pickup
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

    // 1. Validate worker profile eligibility before atomic assignment
    const workerProfile = await prisma.deliveryWorkerProfile.findUnique({
      where: { userId: workerId },
    });

    if (!workerProfile) {
      return res.status(404).json({ success: false, error: { message: 'Worker profile not found.' } });
    }

    if (workerProfile.verificationStatus !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is pending verification. Only approved workers can accept deliveries.' },
      });
    }

    if (workerProfile.availability !== 'ONLINE') {
      return res.status(400).json({
        success: false,
        error: { message: 'You must set your availability to ONLINE before accepting delivery jobs.' },
      });
    }

    if (workerProfile.activeJobCount >= 3) {
      return res.status(409).json({
        success: false,
        error: { message: 'Maximum active delivery limit (3) reached. Please complete current deliveries first.' },
      });
    }

    // 2. Concurrency-Safe Atomic Assignment Transaction
    const result = await prisma.$transaction(async tx => {
      const offer = await tx.deliveryOffer.findUnique({
        where: { id: offerId },
        include: { job: true },
      });

      if (!offer) throw Object.assign(new Error('Offer not found.'), { status: 404 });
      if (offer.workerId !== workerId) throw Object.assign(new Error('Access denied: offer not assigned to you.'), { status: 403 });

      // Idempotency: if worker already accepted this job, return success
      if (offer.status === 'ACCEPTED' && offer.job.assignedWorker === workerId) {
        return offer.job;
      }

      if (offer.status !== 'PENDING') throw Object.assign(new Error(`Offer is already ${offer.status.toLowerCase()}.`), { status: 409 });
      if (offer.expiresAt < new Date()) throw Object.assign(new Error('Offer has expired.'), { status: 410 });
      if (offer.job.status !== 'BROADCASTING' && offer.job.status !== 'UNASSIGNED') {
        throw Object.assign(new Error('This delivery job has already been accepted by another worker.'), { status: 409 });
      }

      // Mark this offer accepted
      await tx.deliveryOffer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });

      // Invalidate competing offers for the same job atomically
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
        data: {
          jobId: job.id,
          status: 'ASSIGNED',
          notes: 'Worker accepted delivery offer.',
        },
      });

      // Send in-app notification to worker
      await tx.notification.create({
        data: {
          userId: workerId,
          channel: 'IN_APP',
          status: 'SENT',
          type: 'DELIVERY_ASSIGNED',
          title: 'Delivery Assigned',
          message: `Order ${job.orderId.slice(0, 8)} successfully assigned. Proceed to pickup location.`,
          metadata: { jobId: job.id, orderId: job.orderId },
        },
      });

      return job;
    });

    return res.json({
      success: true,
      message: 'Delivery offer accepted. Job assigned successfully.',
      data: { jobId: result.id, status: result.status },
    });
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

    const offer = await prisma.deliveryOffer.findUnique({ where: { id: offerId } });
    if (!offer) return res.status(404).json({ success: false, error: { message: 'Offer not found.' } });
    if (offer.workerId !== workerId) return res.status(403).json({ success: false, error: { message: 'Access denied.' } });
    if (offer.status !== 'PENDING') return res.status(409).json({ success: false, error: { message: `Offer is already ${offer.status.toLowerCase()}.` } });

    await prisma.deliveryOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED', respondedAt: new Date(), rejectionReason: reason },
    });

    return res.json({ success: true, message: 'Offer declined.' });
  } catch (err) {
    next(err);
  }
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
    if (status && status !== 'ALL') {
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
              buyer: { select: { fullName: true, phone: true } },
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
          tradeType: j.order.tradeType,
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
          product: j.order.items[0]?.listing?.name ?? 'Agricultural Produce',
          productImage: j.order.items[0]?.listing?.images?.[0]?.url ?? null,
          quantityKg: j.order.items[0]?.quantity ? Number(j.order.items[0].quantity) : null,
          deliveryFee: j.order.deliveryFee,
          paymentMethod: j.order.paymentMethod,
          cashCollected: j.cashCollected,
          buyerName: j.order.buyer?.fullName,
          buyerPhone: j.order.buyer?.phone,
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

// ─── GET /api/worker/deliveries/active ─────────────────────────
/** Get the single currently ongoing delivery job for this worker */
export async function getActiveDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;

    const activeJob = await prisma.deliveryJob.findFirst({
      where: {
        assignedWorker: workerId,
        status: { in: ['ASSIGNED', 'HEADING_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE'] },
      },
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
            buyer: { select: { fullName: true, phone: true } },
          },
        },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });

    if (!activeJob) {
      return res.json({ success: true, data: null });
    }

    const item = activeJob.order.items[0];

    return res.json({
      success: true,
      data: {
        id: activeJob.id,
        orderId: activeJob.orderId,
        tradeType: activeJob.order.tradeType,
        status: activeJob.status,
        pickupAddress: activeJob.pickupAddress,
        dropoffAddress: activeJob.dropoffAddress,
        pickupLatitude: activeJob.pickupLatitude,
        pickupLongitude: activeJob.pickupLongitude,
        dropoffLatitude: activeJob.dropoffLatitude,
        dropoffLongitude: activeJob.dropoffLongitude,
        deliveryFee: activeJob.order.deliveryFee,
        totalAmount: activeJob.order.totalAmount,
        paymentMethod: activeJob.order.paymentMethod,
        product: item?.listing?.name ?? 'Agricultural Produce',
        productImage: item?.listing?.images?.[0]?.url ?? null,
        quantityKg: item?.quantity ? Number(item.quantity) : null,
        farmerName: item?.listing?.farmerProfile?.farmName || 'Local Farmer',
        buyerName: activeJob.order.buyer?.fullName,
        buyerPhone: activeJob.order.buyer?.phone,
        acceptedAt: activeJob.acceptedAt,
        pickedUpAt: activeJob.pickedUpAt,
        events: activeJob.events,
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
    const { status, notes, latitude, longitude, proofOfDeliveryCode, proofOfDeliveryUrl } = req.body;

    if (!status) return res.status(400).json({ success: false, error: { message: 'Status is required.' } });

    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    });

    if (!job) return res.status(404).json({ success: false, error: { message: 'Delivery job not found.' } });
    if (job.assignedWorker !== workerId) return res.status(403).json({ success: false, error: { message: 'Access denied: not your assigned job.' } });

    const allowed = VALID_TRANSITIONS[job.status] ?? [];
    if (!allowed.includes(status)) {
      return res.status(409).json({
        success: false,
        error: { message: `Invalid status transition: Cannot change from ${job.status} to ${status}.` },
      });
    }

    // Enforce Proof of Delivery when marking DELIVERED
    if (status === 'DELIVERED') {
      if (!proofOfDeliveryCode && !proofOfDeliveryUrl && (!notes || notes.trim().length < 3)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Proof of delivery required: Please provide delivery verification code, notes, or receipt confirmation.' },
        });
      }
    }

    const now = new Date();
    const updateData: any = { status };
    if (status === 'PICKED_UP') updateData.pickedUpAt = now;
    if (status === 'DELIVERED') {
      updateData.deliveredAt = now;
      if (proofOfDeliveryUrl) updateData.proofOfDeliveryUrl = proofOfDeliveryUrl;
    }
    if (status === 'FAILED') updateData.failedAt = now;

    const updated = await prisma.$transaction(async tx => {
      // 1. Update Job
      const j = await tx.deliveryJob.update({ where: { id: jobId }, data: updateData });

      // 2. Create Event Log
      await tx.deliveryEvent.create({
        data: {
          jobId,
          status: status as any,
          notes: notes ? `${notes} ${proofOfDeliveryCode ? `[Verification Code: ${proofOfDeliveryCode}]` : ''}` : null,
          imageUrl: proofOfDeliveryUrl ?? null,
          latitude: latitude !== undefined ? Number(latitude) : null,
          longitude: longitude !== undefined ? Number(longitude) : null,
        },
      });

      // 3. Handle Completion or Terminal States
      if (['DELIVERED', 'FAILED', 'CANCELLED'].includes(status)) {
        // Decrement worker's active job count
        await tx.deliveryWorkerProfile.update({
          where: { userId: workerId },
          data: { activeJobCount: { decrement: 1 } },
        });

        if (status === 'DELIVERED') {
          // Update Order Status
          const orderUpdateData: any = { status: 'DELIVERED' };
          if (job.order.paymentMethod === 'CASH_ON_DELIVERY') {
            orderUpdateData.paymentStatus = 'COMPLETED';
          }
          await tx.order.update({
            where: { id: job.orderId },
            data: orderUpdateData,
          });

          // For Cash on Delivery (COD), record collected amount and create CashReconciliation record
          if (job.order.paymentMethod === 'CASH_ON_DELIVERY') {
            const collectedAmount = job.order.totalAmount;
            await tx.deliveryJob.update({
              where: { id: jobId },
              data: { cashCollected: collectedAmount },
            });

            await tx.cashReconciliation.create({
              data: {
                workerId,
                jobId,
                amount: collectedAmount,
                status: 'PENDING',
                notes: `COD collection for Order ${job.orderId.slice(0, 8)}`,
              },
            });
          }
        }
      }

      return j;
    }, { maxWait: 10000, timeout: 15000 });

    return res.json({ success: true, message: `Delivery status updated to ${status}.`, data: { id: updated.id, status: updated.status } });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/worker/deliveries/:jobId/incident ──────────────
export async function reportDeliveryIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const jobId = String(req.params.jobId);
    const { reasonCode, description, evidenceUrl, latitude, longitude, terminateJob } = req.body;

    if (!reasonCode || !description) {
      return res.status(400).json({
        success: false,
        error: { message: 'Incident reasonCode and description are required.' },
      });
    }

    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    });

    if (!job) return res.status(404).json({ success: false, error: { message: 'Delivery job not found.' } });
    if (job.assignedWorker !== workerId) return res.status(403).json({ success: false, error: { message: 'Access denied: not your assigned job.' } });

    const now = new Date();

    await prisma.$transaction(async tx => {
      // 1. Create DeliveryEvent
      await tx.deliveryEvent.create({
        data: {
          jobId,
          status: terminateJob ? 'FAILED' : job.status,
          notes: `[INCIDENT: ${reasonCode}] ${description}`,
          imageUrl: evidenceUrl ?? null,
          latitude: latitude !== undefined ? Number(latitude) : null,
          longitude: longitude !== undefined ? Number(longitude) : null,
        },
      });

      // 2. Create Audit Report for Administrative Attention
      await tx.report.create({
        data: {
          reporterId: workerId,
          relatedOrderId: job.orderId,
          reason: reasonCode,
          status: 'OPEN',
          description: `Worker: ${workerId}\nOrder: ${job.orderId}\nReason: ${reasonCode}\nDetails: ${description}`,
        },
      });

      // 3. If the incident blocks completion, set job to FAILED
      if (terminateJob) {
        await tx.deliveryJob.update({
          where: { id: jobId },
          data: { status: 'FAILED', failedAt: now },
        });

        await tx.deliveryWorkerProfile.update({
          where: { userId: workerId },
          data: { activeJobCount: { decrement: 1 } },
        });
      }
    }, { maxWait: 10000, timeout: 15000 });

    return res.json({
      success: true,
      message: 'Delivery incident reported and logged for review.',
    });
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
      from = new Date(now);
      from.setHours(0, 0, 0, 0);
    }

    const jobs = await prisma.deliveryJob.findMany({
      where: {
        assignedWorker: workerId,
        status: 'DELIVERED',
        deliveredAt: { gte: from },
      },
      include: {
        order: {
          select: {
            id: true,
            deliveryFee: true,
            totalAmount: true,
            productSubtotal: true,
            platformCommission: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    const totalEarnings = jobs.reduce((sum, j) => sum + (Number(j.order.deliveryFee) || 0), 0);
    const totalOrderValues = jobs.reduce((sum, j) => sum + (Number(j.order.totalAmount) || 0), 0);

    // Pending Cash on Delivery remittance
    const pendingCod = await prisma.cashReconciliation.aggregate({
      where: { workerId, status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    });

    return res.json({
      success: true,
      data: {
        period,
        from,
        totalEarnings,
        totalOrderValues,
        deliveryCount: jobs.length,
        pendingCodBalance: Number(pendingCod._sum.amount || 0),
        pendingCodCount: pendingCod._count.id,
        deliveries: jobs.map(j => ({
          jobId: j.id,
          orderId: j.orderId,
          deliveryFee: j.order.deliveryFee,
          orderSubtotal: j.order.productSubtotal,
          totalAmount: j.order.totalAmount,
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

// ─── GET /api/worker/reconciliations ──────────────────────────
export async function getCashReconciliations(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;

    const records = await prisma.cashReconciliation.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const pendingTotal = records
      .filter(r => r.status === 'PENDING')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    return res.json({
      success: true,
      data: {
        pendingTotal,
        records: records.map(r => ({
          id: r.id,
          jobId: r.jobId,
          amount: Number(r.amount),
          status: r.status,
          notes: r.notes,
          submittedAt: r.submittedAt,
          reviewedAt: r.reviewedAt,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/worker/reconciliations/submit ──────────────────
export async function submitCashReconciliation(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = req.auth!.sub;
    const { reconciliationIds, referenceNumber, paymentService, notes } = req.body;

    if (!Array.isArray(reconciliationIds) || reconciliationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please select at least one cash reconciliation record.' },
      });
    }

    const now = new Date();
    const memo = `Deposited via ${paymentService || 'Telebirr'} (Ref: ${referenceNumber || 'N/A'}). ${notes || ''}`;

    await prisma.cashReconciliation.updateMany({
      where: {
        id: { in: reconciliationIds },
        workerId,
        status: 'PENDING',
      },
      data: {
        status: 'SUBMITTED',
        submittedAt: now,
        notes: memo,
      },
    });

    return res.json({
      success: true,
      message: 'Cash remittance submitted for administrative audit.',
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
    const { availability, vehiclePlate, vehicleCapacityKg, vehicleType, latitude, longitude } = req.body;

    const updateData: any = {};
    if (availability) updateData.availability = availability;
    if (vehicleType) updateData.vehicleType = vehicleType;
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
      take: 25,
    });
    return res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/worker/dispatch/:orderId ───────────────────────
export async function dispatchOrderAction(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = String(req.params.orderId);
    const result = await dispatchOrder(orderId);
    return res.json({ success: true, message: 'Order dispatched successfully.', data: result });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ success: false, error: { message: err.message } });
    next(err);
  }
}

// ─── POST /api/worker/seed-demo-order ─────────────────────────
export async function seedDemoOrderAction(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await seedDemoOrderAndDispatch();
    return res.json({
      success: true,
      message: 'Demo order created and dispatched to eligible delivery workers.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
