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
