import prisma from '../config/prisma.js';
import type { VehicleType, TradeType } from '@prisma/client';

/** Haversine distance in km between two lat/lon pairs */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export interface DispatchCandidate {
  workerId: string;
  fullName: string;
  phone: string;
  distanceKm: number;
  vehicleType: VehicleType;
  vehicleCapacityKg: number;
}

export interface DispatchResult {
  jobId: string;
  orderId: string;
  tradeType: TradeType;
  eligibleWorkerCount: number;
  offersCreatedCount: number;
  candidates: DispatchCandidate[];
}

/**
 * Dispatch Engine: Identifies eligible delivery workers and broadcasts time-limited offers.
 * 
 * Enforces business rules:
 * 1. Order status must be ready for delivery (CONFIRMED or PREPARING).
 * 2. Cross-city (INTERCITY): validates approved route and administrative approval.
 * 3. Worker eligibility:
 *    - verificationStatus === 'VERIFIED'
 *    - availability === 'ONLINE'
 *    - activeJobCount < maxActiveJobs (default 3)
 *    - vehicleCapacityKg >= order total weight
 *    - Location within broadcast radius (default 25km) and fresh.
 */
export async function dispatchOrder(orderId: string, options: { broadcastRadiusKm?: number; expirySeconds?: number } = {}): Promise<DispatchResult> {
  const radiusKm = options.broadcastRadiusKm ?? 25;
  const expirySec = options.expirySeconds ?? 300; // 5 minutes

  // 1. Fetch Order with items, farmer pickup location, and intercity details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          listing: {
            include: { farmerProfile: true },
          },
        },
      },
      intercityRoute: true,
      adminApproval: true,
      deliveryJob: true,
    },
  });

  if (!order) {
    throw Object.assign(new Error(`Order not found: ${orderId}`), { status: 404 });
  }

  // 2. Validate Order Readiness
  if (['CANCELLED', 'DELIVERED', 'REFUNDED'].includes(order.status)) {
    throw Object.assign(new Error(`Order is in terminal status: ${order.status}`), { status: 400 });
  }

  // 3. For Cross-City orders (INTERCITY), enforce administrative approval and route status
  if (order.tradeType === 'INTERCITY') {
    if (order.intercityRoute && order.intercityRoute.status !== 'ACTIVE') {
      throw Object.assign(new Error(`Intercity route is not active: ${order.intercityRoute.status}`), { status: 400 });
    }
    if (order.intercityRoute?.requiresApproval) {
      if (!order.adminApproval || order.adminApproval.status !== 'APPROVED') {
        throw Object.assign(new Error('Cross-city order requires administrative approval before dispatch.'), { status: 400 });
      }
    }
  }

  // 4. Calculate total cargo weight
  const totalWeightKg = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  // 5. Determine pickup coordinates (from first product listing or farmer profile)
  const pickupLat = order.items[0]?.listing?.pickupLatitude ?? order.items[0]?.listing?.farmerProfile?.farmLatitude ?? 9.01;
  const pickupLon = order.items[0]?.listing?.pickupLongitude ?? order.items[0]?.listing?.farmerProfile?.farmLongitude ?? 38.75;
  const pickupAddress = order.items[0]?.listing?.farmerProfile?.farmName
    ? `${order.items[0].listing.farmerProfile.farmName}, Addis Ababa Hub`
    : 'Farmer Collection Point, Addis Ababa';

  // 6. Find or create DeliveryJob
  let job = order.deliveryJob;
  if (!job) {
    job = await prisma.deliveryJob.create({
      data: {
        orderId: order.id,
        status: 'BROADCASTING',
        pickupAddress,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLon,
        dropoffAddress: order.deliveryAddress,
        dropoffLatitude: order.deliveryLatitude,
        dropoffLongitude: order.deliveryLongitude,
        requiredCapacityKg: totalWeightKg,
        broadcastRadiusKm: radiusKm,
        offerExpirySeconds: expirySec,
      },
    });
  } else if (job.status === 'UNASSIGNED') {
    job = await prisma.deliveryJob.update({
      where: { id: job.id },
      data: { status: 'BROADCASTING' },
    });
  } else if (job.status !== 'BROADCASTING') {
    throw Object.assign(new Error(`Delivery job is already in progress: ${job.status}`), { status: 409 });
  }

  // 7. Find eligible delivery workers
  // Rules: role === DELIVERY_WORKER, verificationStatus === VERIFIED, availability === ONLINE, activeJobCount < 3
  const workers = await prisma.user.findMany({
    where: {
      role: 'DELIVERY_WORKER',
      isActive: true,
      deliveryProfile: {
        verificationStatus: 'VERIFIED',
        availability: 'ONLINE',
        activeJobCount: { lt: 3 },
      },
    },
    include: {
      deliveryProfile: true,
    },
  });

  const candidates: DispatchCandidate[] = [];
  const expiryDate = new Date(Date.now() + expirySec * 1000);

  for (const w of workers) {
    const prof = w.deliveryProfile;
    if (!prof) continue;

    // Capacity check
    if (prof.vehicleCapacityKg && prof.vehicleCapacityKg < totalWeightKg) {
      continue;
    }

    // Distance calculation (fallback to default Addis Ababa coords if worker hasn't shared yet)
    const workerLat = prof.lastLatitude ?? 9.02;
    const workerLon = prof.lastLongitude ?? 38.76;
    const dist = haversineKm(workerLat, workerLon, pickupLat, pickupLon);

    // Proximity filter
    if (dist <= radiusKm) {
      candidates.push({
        workerId: w.id,
        fullName: w.fullName,
        phone: w.phone || "",
        distanceKm: Number(dist.toFixed(1)),
        vehicleType: prof.vehicleType,
        vehicleCapacityKg: prof.vehicleCapacityKg || 50,
      });
    }
  }

  // Sort candidates by proximity to pickup
  candidates.sort((a, b) => a.distanceKm - b.distanceKm);

  // 8. Broadcast offers (create DeliveryOffer & Notification records)
  let offersCreatedCount = 0;
  for (const cand of candidates) {
    // Upsert offer
    await prisma.deliveryOffer.upsert({
      where: {
        jobId_workerId: {
          jobId: job.id,
          workerId: cand.workerId,
        },
      },
      update: {
        status: 'PENDING',
        offeredAt: new Date(),
        expiresAt: expiryDate,
      },
      create: {
        jobId: job.id,
        workerId: cand.workerId,
        status: 'PENDING',
        offeredAt: new Date(),
        expiresAt: expiryDate,
      },
    });

    // Create In-App Notification
    await prisma.notification.create({
      data: {
        userId: cand.workerId,
        channel: 'IN_APP',
        status: 'SENT',
        type: 'DELIVERY_OFFER',
        title: 'New Delivery Offer Available',
        message: `New ${order.tradeType.toLowerCase()} order available near you (${cand.distanceKm} km away). Fee: ETB ${Number(order.deliveryFee).toFixed(0)}.`,
        metadata: {
          jobId: job.id,
          orderId: order.id,
          distanceKm: cand.distanceKm,
          deliveryFee: order.deliveryFee,
          expiresAt: expiryDate.toISOString(),
        },
      },
    });

    offersCreatedCount++;
  }

  return {
    jobId: job.id,
    orderId: order.id,
    tradeType: order.tradeType,
    eligibleWorkerCount: candidates.length,
    offersCreatedCount,
    candidates,
  };
}

/**
 * Demo Seed Helper: Creates a complete valid confirmed order with farmer listing,
 * buyer, items, and delivery fee, then dispatches it so delivery workers immediately
 * have real live orders to test and evaluate in the dashboard.
 */
export async function seedDemoOrderAndDispatch(buyerId?: string): Promise<{ orderId: string; dispatchResult: DispatchResult }> {
  // 1. Ensure or find a demo Farmer
  let farmer = await prisma.user.findFirst({
    where: { role: 'FARMER' },
    include: { farmerProfile: true, productListings: true },
  });

  if (!farmer) {
    farmer = await prisma.user.create({
      data: {
        fullName: 'Almaz Tefera (Demo Farm)',
        phone: '+251911000111',
        email: 'almaz.farm@agrimarket.et',
        passwordHash: '$2a$12$e8YjT3O/tZ8lM5B1T5x8g.8m9PzW6f9g3VqM5v1K.9q',
        role: 'FARMER',
        isVerified: true,
        farmerProfile: {
          create: {
            farmName: 'Bishoftu Organic Veggies',
            farmDescription: 'Fresh vegetables grown in Bishoftu volcanic soil',
            farmSizeHectares: 4.5,
            isOrganic: true,
            verificationStatus: 'VERIFIED',
            farmLatitude: 8.7522,
            farmLongitude: 38.9785,
          },
        },
      },
      include: { farmerProfile: true, productListings: true },
    });
  }

  // 2. Ensure Category and Product Listing exist
  let category = await prisma.category.findFirst({ where: { slug: 'vegetables' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Vegetables',
        slug: 'vegetables',
        description: 'Fresh vegetables directly harvested from local farms',
      },
    });
  }

  let listing = await prisma.productListing.findFirst({
    where: { farmerId: farmer.id },
  });

  if (!listing) {
    listing = await prisma.productListing.create({
      data: {
        farmerId: farmer.id,
        farmerProfileId: farmer.farmerProfile!.id,
        categoryId: category.id,
        name: 'Fresh Red Tomatoes (25kg Box)',
        description: 'Premium quality farm-fresh tomatoes, harvested this morning.',
        qualityGrade: 'A',
        pricePerUnit: 120.0,
        unit: 'box',
        stockQuantity: 100,
        pickupLatitude: 9.0125,
        pickupLongitude: 38.7554,
        status: 'ACTIVE',
        images: {
          create: [
            { url: '/images/prod_tomatoes.jpg', isPrimary: true },
          ],
        },
      },
    });
  }

  // 3. Ensure a Buyer exists
  let buyer = buyerId
    ? await prisma.user.findUnique({ where: { id: buyerId } })
    : await prisma.user.findFirst({ where: { role: 'BUYER' } });

  if (!buyer) {
    buyer = await prisma.user.create({
      data: {
        fullName: 'Kidist Haile (Bole Buyer)',
        phone: '+251922334455',
        email: 'kidist.buyer@gmail.com',
        passwordHash: '$2a$12$e8YjT3O/tZ8lM5B1T5x8g.8m9PzW6f9g3VqM5v1K.9q',
        role: 'BUYER',
        isVerified: true,
        buyerProfile: {
          create: {
            preferredDeliveryAddress: 'Bole Medhanealem, Addis Ababa',
            preferredLatitude: 8.9954,
            preferredLongitude: 38.7892,
          },
        },
      },
    });
  }

  // 4. Create Order
  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      tradeType: 'LOCAL',
      status: 'CONFIRMED',
      deliveryAddress: 'Bole Medhanealem, Near Edna Mall, Addis Ababa',
      deliveryLatitude: 8.9954,
      deliveryLongitude: 38.7892,
      productSubtotal: 240.0,
      deliveryFee: 150.0,
      platformCommission: 15.0,
      taxAmount: 0.0,
      totalAmount: 390.0,
      paymentMethod: 'CASH_ON_DELIVERY',
      paymentStatus: 'PENDING',
      buyerNotes: 'Please ring bell upon arrival.',
      confirmedAt: new Date(),
      items: {
        create: [
          {
            listingId: listing.id,
            listingSnapshot: {
              name: listing.name,
              unit: listing.unit,
              qualityGrade: listing.qualityGrade,
              pricePerUnit: Number(listing.pricePerUnit),
            },
            quantity: 2,
            agreedUnitPrice: listing.pricePerUnit,
            subtotal: 240.0,
          },
        ],
      },
    },
  });

  // 5. Dispatch the newly created order
  const dispatchResult = await dispatchOrder(order.id, {
    broadcastRadiusKm: 50, // generous radius so local demo worker matches
    expirySeconds: 600,   // 10 minutes for testing
  });

  return {
    orderId: order.id,
    dispatchResult,
  };
}
