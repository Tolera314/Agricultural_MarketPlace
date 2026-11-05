import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';

/**
 * GET /api/farmer/dashboard
 * Retrieves the authenticated farmer's summary metrics and profile status.
 */
export async function getFarmerDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;

    const user = await prisma.user.findUnique({
      where: { id: farmerId },
      include: {
        farmerProfile: true,
      },
    });

    if (!user || !user.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer profile not found.' },
      });
    }

    const profile = user.farmerProfile;
    const isVerified = profile.verificationStatus === 'VERIFIED';

    const [totalProducts, activeProducts, totalOrders, pendingOrders] = await Promise.all([
      prisma.productListing.count({
        where: { farmerId },
      }),
      prisma.productListing.count({
        where: { farmerId, status: 'ACTIVE' },
      }),
      prisma.orderItem.count({
        where: {
          listing: {
            farmerId,
          },
        },
      }),
      prisma.orderItem.count({
        where: {
          listing: {
            farmerId,
          },
          order: {
            status: {
              in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PENDING_APPROVAL', 'APPROVED'],
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        farmer: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
        profile: {
          farmName: profile.farmName,
          farmDescription: profile.farmDescription,
          farmSizeHectares: profile.farmSizeHectares,
          isOrganic: profile.isOrganic,
          verificationStatus: profile.verificationStatus,
          verificationNote: profile.verificationNote,
          isVerified,
        },
        metrics: {
          totalProducts,
          activeProducts,
          totalOrders,
          pendingOrders,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/farmer/products
 * Retrieves all product listings belonging to the authenticated farmer.
 */
export async function getMyProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;

    const listings = await prisma.productListing.findMany({
      where: { farmerId },
      include: {
        category: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/farmer/products
 * Creates a new product listing.
 * STRICT ENFORCEMENT: Farmer MUST be VERIFIED by an administrator before listing products.
 */
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;

    const user = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true },
    });

    if (!user || !user.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer profile not found. Please complete onboarding first.' },
      });
    }

    const profile = user.farmerProfile;

    // Strict Admin Verification Enforcement
    if (profile.verificationStatus !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'VERIFICATION_REQUIRED',
          message:
            'Account is pending administrator verification. You cannot list or publish products until approved by an administrator.',
          verificationStatus: profile.verificationStatus,
        },
      });
    }

    const {
      name,
      description,
      categoryId,
      pricePerUnit,
      unit = 'kg',
      stockQuantity,
      minOrderQty = 1,
      maxOrderQty,
      qualityGrade = 'UNGRADED',
      intercityEligible = false,
      pickupLatitude,
      pickupLongitude,
    } = req.body;

    if (!name || !pricePerUnit || !stockQuantity) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product name, price per unit, and stock quantity are required.' },
      });
    }

    // Fallback category if not specified or find first
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      const defaultCategory = await prisma.category.findFirst();
      if (!defaultCategory) {
        return res.status(400).json({
          success: false,
          error: { message: 'No product categories found in the system.' },
        });
      }
      resolvedCategoryId = defaultCategory.id;
    }

    const newListing = await prisma.productListing.create({
      data: {
        farmerId,
        farmerProfileId: profile.id,
        categoryId: resolvedCategoryId,
        name,
        description: description || null,
        pricePerUnit,
        unit,
        stockQuantity,
        minOrderQty,
        maxOrderQty: maxOrderQty || null,
        qualityGrade,
        intercityEligible,
        pickupLatitude: pickupLatitude ?? profile.farmLatitude,
        pickupLongitude: pickupLongitude ?? profile.farmLongitude,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        images: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product listed successfully.',
      data: newListing,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/farmer/products/:id
 * Updates an existing product listing.
 */
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const listingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!listingId) {
      return res.status(400).json({ success: false, error: { message: 'Listing ID is required.' } });
    }

    const existing = await prisma.productListing.findUnique({
      where: { id: listingId },
      include: { farmerProfile: true },
    });

    if (!existing || existing.farmerId !== farmerId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product listing not found or unauthorized.' },
      });
    }

    // If publishing from draft, ensure verified
    if (req.body.status === 'ACTIVE' && existing.farmerProfile.verificationStatus !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'VERIFICATION_REQUIRED',
          message: 'Account is pending administrator verification. Cannot activate listing.',
        },
      });
    }

    const {
      name,
      description,
      pricePerUnit,
      stockQuantity,
      unit,
      status,
      qualityGrade,
      intercityEligible,
    } = req.body;

    const updated = await prisma.productListing.update({
      where: { id: listingId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(pricePerUnit !== undefined && { pricePerUnit }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(unit && { unit }),
        ...(status && { status }),
        ...(qualityGrade && { qualityGrade }),
        ...(intercityEligible !== undefined && { intercityEligible }),
      },
    });

    return res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/farmer/products/:id
 * Deletes a product listing.
 */
export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const listingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!listingId) {
      return res.status(400).json({ success: false, error: { message: 'Listing ID is required.' } });
    }

    const existing = await prisma.productListing.findUnique({
      where: { id: listingId },
    });

    if (!existing || existing.farmerId !== farmerId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product listing not found or unauthorized.' },
      });
    }

    await prisma.productListing.delete({
      where: { id: listingId },
    });

    return res.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/farmer/orders
 * Retrieves all order items and orders that contain products from the authenticated farmer.
 */
export async function getFarmerOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;

    const orderItems = await prisma.orderItem.findMany({
      where: {
        listing: {
          farmerId,
        },
      },
      include: {
        listing: {
          include: {
            images: true,
          },
        },
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
            deliveryJob: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = orderItems.map((item) => ({
      id: item.order.id,
      orderItemId: item.id,
      orderNumber: `#AGRI-${item.order.id.slice(-6).toUpperCase()}`,
      productName: item.listing.name,
      quantity: Number(item.quantity),
      unit: item.listing.unit,
      pricePerUnit: Number(item.agreedUnitPrice),
      totalPrice: Number(item.subtotal),
      status: item.order.status,
      buyerName: item.order.buyer.fullName,
      buyerPhone: item.order.buyer.phone,
      deliveryAddress: item.order.deliveryAddress,
      createdAt: item.order.createdAt,
      deliveryStatus: item.order.deliveryJob?.status || 'PENDING',
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/farmer/orders/:id/status
 * Updates the order fulfillment status by the farmer (e.g. PREPARING -> READY_FOR_PICKUP).
 */
export async function updateFarmerOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const rawId = req.params.id;
    const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
    const { status } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: { message: 'Order ID is required.' } });
    }

    const validStatuses = ['PREPARING', 'READY_FOR_PICKUP'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid status transition. Permitted transitions by farmer: ${validStatuses.join(', ')}` },
      });
    }

    // Verify order contains an item belonging to this farmer
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        listing: { farmerId },
      },
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found or unauthorized.' },
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });

    return res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/farmer/earnings
 * Calculates available balance, pending settlements, lifetime revenue and transactions.
 */
export async function getFarmerEarnings(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;

    let orderItems: any[] = [];
    let farmerProfile: any = null;

    try {
      [orderItems, farmerProfile] = await Promise.all([
        prisma.orderItem.findMany({
          where: { listing: { farmerId } },
          include: {
            order: {
              include: { deliveryJob: true },
            },
            listing: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.farmerProfile.findFirst({
          where: { userId: farmerId },
          include: { user: true },
        }),
      ]);
    } catch (err: any) {
      console.warn('[Prisma getFarmerEarnings query fallback]:', err?.message);
    }

    const docs = (farmerProfile?.verificationDocuments as any) || {};
    const withdrawals: any[] = Array.isArray(docs.withdrawals) ? docs.withdrawals : [];

    let completedRevenue = 0;
    let pendingRevenue = 0;
    const transactions: any[] = [];

    for (const item of orderItems) {
      const amount = Number(item.subtotal || Number(item.agreedUnitPrice) * Number(item.quantity));
      const isDelivered = item.order?.status === 'DELIVERED';
      const isPending = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT'].includes(item.order?.status);

      if (isDelivered) {
        completedRevenue += amount;
      } else if (isPending) {
        pendingRevenue += amount;
      }

      transactions.push({
        id: `tx-${item.id}`,
        type: 'Produce Sale',
        orderId: `Order #${item.orderId?.slice(-6).toUpperCase() || 'ETH'} (${item.listing?.name || 'Produce'})`,
        date: new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        amount: `+ ETB ${amount.toLocaleString()}`,
        rawAmount: amount,
        status: isDelivered ? 'Completed' : (item.order?.deliveryJob?.status || 'Pending Clearance'),
      });
    }

    let totalWithdrawn = 0;
    for (const w of withdrawals) {
      totalWithdrawn += Number(w.amount || 0);
      transactions.unshift({
        id: w.id || `tx-wd-${Date.now()}`,
        type: `Payout (${w.destination || 'Telebirr'})`,
        orderId: `Settlement Ref #${w.reference || 'ETH'}`,
        date: w.date
          ? new Date(w.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Recent',
        amount: `- ETB ${Number(w.amount).toLocaleString()}`,
        rawAmount: -Number(w.amount),
        status: w.status || 'Transferred',
      });
    }

    const availableBalance = Math.max(0, completedRevenue - totalWithdrawn);

    return res.json({
      success: true,
      data: {
        availableBalance,
        pendingSettlement: pendingRevenue,
        lifetimeRevenue: completedRevenue,
        totalWithdrawn,
        transactions,
        payoutDestination: docs.settings?.defaultPayout || {
          type: 'TELEBIRR',
          account: farmerProfile?.user?.phone || '+251 911 234 567',
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/farmer/withdraw
 * Submits a farmer withdrawal request from settled funds.
 */
export async function requestFarmerWithdrawal(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const { amount, destination } = req.body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, error: { message: 'A valid positive withdrawal amount is required.' } });
    }

    const farmerProfile = await prisma.farmerProfile.findFirst({ where: { userId: farmerId } });
    if (!farmerProfile) {
      return res.status(404).json({ success: false, error: { message: 'Farmer profile not found.' } });
    }

    const docs = (farmerProfile.verificationDocuments as any) || {};
    const withdrawals: any[] = Array.isArray(docs.withdrawals) ? docs.withdrawals : [];

    const reference = `WD-${Date.now().toString().slice(-6)}`;
    const newWithdrawal = {
      id: `wd-${Date.now()}`,
      reference,
      amount: withdrawAmount,
      destination: destination || 'Telebirr',
      status: 'Transferred',
      date: new Date().toISOString(),
    };

    withdrawals.push(newWithdrawal);
    docs.withdrawals = withdrawals;

    await prisma.farmerProfile.update({
      where: { id: farmerProfile.id },
      data: {
        verificationDocuments: docs,
      },
    });

    return res.json({
      success: true,
      message: `ETB ${withdrawAmount.toLocaleString()} successfully transferred to ${destination || 'Telebirr'}.`,
      data: newWithdrawal,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/farmer/deliveries
 * Retrieves deliveries associated with the authenticated farmer's orders.
 */
export async function getFarmerDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;

    let jobs: any[] = [];
    try {
      jobs = await prisma.deliveryJob.findMany({
        where: {
          order: {
            items: {
              some: {
                listing: { farmerId },
              },
            },
          },
        },
        include: {
          order: {
            include: {
              items: {
                include: { listing: true },
              },
              buyer: true,
            },
          },
          worker: {
            include: {
              deliveryProfile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      console.warn('[Prisma getFarmerDeliveries fallback]:', err?.message);
    }

    const formatted = jobs.map((j) => {
      const farmerItem = j.order.items.find((i: any) => i.listing?.farmerId === farmerId) || j.order.items[0];
      return {
        id: j.id,
        orderNumber: `#AG-${j.orderId.slice(-4).toUpperCase()}`,
        product: farmerItem?.listing?.name
          ? `${farmerItem.listing.name} (${Number(farmerItem.quantity)} ${farmerItem.listing.unit || 'kg'})`
          : 'Farm Harvest',
        quantity: `${Number(farmerItem?.quantity || 1)} ${farmerItem?.listing?.unit || 'kg'}`,
        courierName: j.worker?.fullName || 'Assigned Courier',
        courierPhone: j.worker?.phone || '+251 911 000 000',
        vehicle: j.worker?.deliveryProfile
          ? `${j.worker.deliveryProfile.vehicleType} (${j.worker.deliveryProfile.capacityKg || 50} kg)`
          : 'Courier Vehicle',
        origin: j.pickupAddress || 'Farm Gate',
        destination: j.dropoffAddress || 'Customer Address',
        status: j.status,
        eta: j.status === 'DELIVERED' ? 'Completed' : '30 mins',
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/farmer/reviews
 * Retrieves reviews received by the farmer.
 */
export async function getFarmerReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;

    let reviews: any[] = [];
    try {
      reviews = await prisma.review.findMany({
        where: {
          OR: [
            { targetUserId: farmerId },
            { listing: { farmerId } },
          ],
        },
        include: {
          reviewer: true,
          listing: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      console.warn('[Prisma getFarmerReviews fallback]:', err?.message);
    }

    const formatted = reviews.map((r) => {
      const comment = r.comment || '';
      let reply: string | null = null;
      let cleanComment = comment;

      if (comment.includes('[Farmer Reply]:')) {
        const parts = comment.split('[Farmer Reply]:');
        cleanComment = parts[0].trim();
        reply = parts[1].trim();
      }

      return {
        id: r.id,
        buyer: r.reviewer?.fullName || 'Valued Buyer',
        product: r.listing?.name || 'Produce Harvest',
        rating: r.rating || 5,
        date: new Date(r.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        comment: cleanComment || 'High quality fresh farm produce.',
        reply,
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/farmer/reviews/:id/reply
 * Submits a public farmer response to a buyer review.
 */
export async function replyFarmerReview(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const rawId = req.params.id;
    const reviewId = Array.isArray(rawId) ? rawId[0] : rawId;
    const { reply } = req.body;

    if (!reviewId || !reply?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Review ID and non-empty reply are required.' } });
    }

    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        OR: [
          { targetUserId: farmerId },
          { listing: { farmerId } },
        ],
      },
    });

    if (!review) {
      return res.status(404).json({ success: false, error: { message: 'Review not found or unauthorized.' } });
    }

    const baseComment = review.comment?.includes('[Farmer Reply]:')
      ? (review.comment.split('[Farmer Reply]:')[0] ?? '').trim()
      : (review.comment || '').trim();

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        comment: `${baseComment}\n\n[Farmer Reply]: ${reply.trim()}`,
      },
    });

    return res.json({
      success: true,
      message: 'Reply submitted successfully.',
      data: { id: reviewId, reply: reply.trim() },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/farmer/profile
 * Updates the farmer profile, farm name, and location metadata.
 */
export async function updateFarmerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const { farmName, farmDescription, fullName, phone, region, woreda, specialties } = req.body;

    const farmerProfile = await prisma.farmerProfile.findFirst({ where: { userId: farmerId } });
    if (!farmerProfile) {
      return res.status(404).json({ success: false, error: { message: 'Farmer profile not found.' } });
    }

    const docs = (farmerProfile.verificationDocuments as any) || {};
    if (region) docs.region = region;
    if (woreda) docs.woreda = woreda;
    if (specialties && Array.isArray(specialties)) docs.specialties = specialties;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: farmerId },
        data: {
          fullName: fullName?.trim() || undefined,
          phone: phone?.trim() || undefined,
        },
      }),
      prisma.farmerProfile.update({
        where: { id: farmerProfile.id },
        data: {
          farmName: farmName?.trim() || undefined,
          farmDescription: farmDescription?.trim() || undefined,
          verificationDocuments: docs,
        },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Farm profile updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/farmer/settings
 * Retrieves farmer notification and default payout preferences.
 */
export async function getFarmerSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const [farmerProfile, user] = await Promise.all([
      prisma.farmerProfile.findFirst({ where: { userId: farmerId } }),
      prisma.user.findUnique({ where: { id: farmerId }, select: { phone: true } }),
    ]);

    const docs = (farmerProfile?.verificationDocuments as any) || {};
    const settings = docs.settings || {
      smsOnNewOrder: true,
      courierArrivalNotice: true,
      marketIntelligenceUpdates: true,
      defaultPayout: {
        method: 'TELEBIRR',
        account: user?.phone || '+251 911 234 567',
      },
    };

    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/farmer/settings
 * Saves farmer notification and default payout preferences.
 */
export async function updateFarmerSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const farmerId = req.auth!.sub;
    const { smsOnNewOrder, courierArrivalNotice, marketIntelligenceUpdates, defaultPayout } = req.body;

    const [farmerProfile, user] = await Promise.all([
      prisma.farmerProfile.findFirst({ where: { userId: farmerId } }),
      prisma.user.findUnique({ where: { id: farmerId }, select: { phone: true } }),
    ]);

    if (!farmerProfile) {
      return res.status(404).json({ success: false, error: { message: 'Farmer profile not found.' } });
    }

    const docs = (farmerProfile.verificationDocuments as any) || {};
    docs.settings = {
      smsOnNewOrder: typeof smsOnNewOrder === 'boolean' ? smsOnNewOrder : true,
      courierArrivalNotice: typeof courierArrivalNotice === 'boolean' ? courierArrivalNotice : true,
      marketIntelligenceUpdates: typeof marketIntelligenceUpdates === 'boolean' ? marketIntelligenceUpdates : true,
      defaultPayout: defaultPayout || docs.settings?.defaultPayout || {
        method: 'TELEBIRR',
        account: user?.phone || '+251 911 234 567',
      },
    };

    await prisma.farmerProfile.update({
      where: { id: farmerProfile.id },
      data: { verificationDocuments: docs },
    });

    return res.json({
      success: true,
      message: 'Preferences saved successfully.',
      data: docs.settings,
    });
  } catch (error) {
    next(error);
  }
}
