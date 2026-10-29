import type { Request, Response, NextFunction } from 'express';
import type { AuthPayload } from '../middleware/requireAuth.js';
import {
  getBuyerDashboardOverview,
  getNearbyFarmers,
  searchProducts,
  getProductDetails,
  getFarmerProfile,
  getCategories,
  calculateCheckout,
  createBuyerOrder,
  cancelBuyerOrder,
  getBuyerAddresses,
  createBuyerAddress,
  updateBuyerAddress,
  deleteBuyerAddress,
  toggleSavedFarmer,
  getSavedFarmers,
  toggleProductFavorite,
  getProductFavorites,
  getBuyerNotifications,
  markNotificationAsRead,
  createSupportTicket,
  resilientStore,
} from '../services/buyer.service.js';

function getBuyerContext(req: Request) {
  return {
    userId: req.auth?.sub || 'default-buyer',
    role: req.auth?.role || 'BUYER',
  };
}

// ─── Dashboard Overview (Strictly Authenticated) ─────────────
export async function handleGetDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required to access personal buyer dashboard.' },
      });
    }

    const ctx = {
      userId,
      role: req.auth?.role || 'BUYER',
    };
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    const data = await getBuyerDashboardOverview(ctx, lat, lng);
    return res.json({ success: true, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Nearby Farmers (Nearest-First) ───────────────────────────
export async function handleGetNearbyFarmers(req: Request, res: Response, next: NextFunction) {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 9.0125;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 38.7636;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid latitude or longitude coordinates.' },
      });
    }

    const data = getNearbyFarmers(lat, lng, radius);
    return res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Browse Products ──────────────────────────────────────────
export async function handleSearchProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, sortBy, minPrice, maxPrice, lat, lng } = req.query;

    const userLat = lat ? parseFloat(lat as string) : 9.0125;
    const userLng = lng ? parseFloat(lng as string) : 38.7636;

    const options: {
      search?: string;
      category?: string;
      sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
      userLat?: number;
      userLng?: number;
      minPrice?: number;
      maxPrice?: number;
    } = {
      userLat,
      userLng,
    };

    if (search) options.search = String(search);
    if (category) options.category = String(category);
    if (sortBy) options.sortBy = sortBy as any;
    if (minPrice) options.minPrice = parseFloat(String(minPrice));
    if (maxPrice) options.maxPrice = parseFloat(String(maxPrice));

    const data = searchProducts(options);

    return res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Single Product Details (Public) ──────────────────────────
export async function handleGetProductDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const rawId = req.params.productId;
    const productId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Product ID is required.' },
      });
    }

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    const data = getProductDetails(productId, lat, lng);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: `Product listing could not be found or is no longer active.` },
      });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Single Farmer Profile (Public) ───────────────────────────
export async function handleGetFarmerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const rawId = req.params.farmerId;
    const farmerId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!farmerId || typeof farmerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Farmer ID is required.' },
      });
    }

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    const data = getFarmerProfile(farmerId, lat, lng);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: `Farmer profile could not be found.` },
      });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Public Categories Taxonomy ───────────────────────────────
export async function handleGetCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const data = getCategories();
    return res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Checkout Calculation ─────────────────────────────────────
export async function handleCalculateCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, deliveryAddressId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Items array is required for checkout calculation.' },
      });
    }

    const calculation = calculateCheckout(items, deliveryAddressId);
    return res.json({ success: true, data: calculation });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err.message },
    });
  }
}

// ─── Order Creation ───────────────────────────────────────────
export async function handleCreateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const { items, deliveryAddress, deliveryLatitude, deliveryLongitude, paymentMethod, idempotencyKey, buyerNotes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cart items are required to create an order.' },
      });
    }

    if (!deliveryAddress || typeof deliveryAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Delivery address is required.' },
      });
    }

    const result = createBuyerOrder(ctx, {
      items,
      deliveryAddress,
      deliveryLatitude: typeof deliveryLatitude === 'number' ? deliveryLatitude : 9.0125,
      deliveryLongitude: typeof deliveryLongitude === 'number' ? deliveryLongitude : 38.7636,
      paymentMethod: paymentMethod || 'TELEBIRR',
      idempotencyKey,
      buyerNotes,
    });

    return res.status(result.duplicatePrevented ? 200 : 201).json({
      success: true,
      message: result.duplicatePrevented ? 'Existing order returned (idempotency).' : 'Order created successfully.',
      data: result.order,
    });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Buyer Orders List ────────────────────────────────────────
export async function handleGetOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const { status } = req.query;

    let orders = resilientStore.orders.filter(
      (o) => o.buyerId === ctx.userId || o.buyerId === 'default-buyer'
    );

    if (status && typeof status === 'string' && status !== 'ALL') {
      orders = orders.filter((o) => o.status.toUpperCase() === status.toUpperCase());
    }

    // Sort newest first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ success: true, count: orders.length, data: orders });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Order Details ────────────────────────────────────────────
export async function handleGetOrderDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const orderId = String(req.params.orderId || '');

    const order = resilientStore.orders.find(
      (o) => (o.id === orderId || o.orderNumber === orderId) && (o.buyerId === ctx.userId || o.buyerId === 'default-buyer')
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found or unauthorized.' },
      });
    }

    return res.json({ success: true, data: order });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Cancel Order ─────────────────────────────────────────────
export async function handleCancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const orderId = String(req.params.orderId || '');
    const { reason } = req.body;

    const result = cancelBuyerOrder(ctx, orderId, reason);
    return res.json({ success: true, message: 'Order cancelled successfully.', data: result.order });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Delivery Tracking ────────────────────────────────────────
export async function handleGetDeliveryTracking(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const orderId = String(req.params.orderId || '');

    const order = resilientStore.orders.find(
      (o) => (o.id === orderId || o.orderNumber === orderId) && (o.buyerId === ctx.userId || o.buyerId === 'default-buyer')
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found.' },
      });
    }

    const trackingData = {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      deliveryStatus: order.deliveryJob?.status || 'ASSIGNED',
      courier: {
        name: order.deliveryJob?.assignedWorkerName || 'Assigned Courier',
        phone: order.deliveryJob?.workerPhone || '+251 91 100 0000',
        vehicleType: order.deliveryJob?.vehicleType || 'VAN',
      },
      pickupAddress: order.deliveryJob?.pickupAddress || 'Farm Distribution Depot',
      destinationAddress: order.deliveryAddress,
      estimatedDeliveryTime: order.deliveryJob?.estimatedDeliveryTime || 'In transit',
      timeline: [
        { title: 'Order Confirmed', time: order.createdAt, done: true },
        { title: 'Farm Harvest & Packaging', time: order.updatedAt, done: ['PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) },
        { title: 'Courier En Route', time: null, done: ['IN_TRANSIT', 'DELIVERED'].includes(order.status) },
        { title: 'Delivered', time: null, done: order.status === 'DELIVERED' },
      ],
    };

    return res.json({ success: true, data: trackingData });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Addresses ────────────────────────────────────────────────
export async function handleGetAddresses(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const addresses = getBuyerAddresses(ctx);
    return res.json({ success: true, count: addresses.length, data: addresses });
  } catch (err: any) {
    return next(err);
  }
}

export async function handleCreateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const { label, streetAddress, city, subcity, latitude, longitude, isDefault, deliveryNotes } = req.body;

    if (!streetAddress || typeof streetAddress !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'Street address is required.' } });
    }

    const addr = createBuyerAddress(ctx, {
      label: label || 'Home',
      streetAddress,
      city: city || 'Addis Ababa',
      subcity,
      latitude: typeof latitude === 'number' ? latitude : 9.0125,
      longitude: typeof longitude === 'number' ? longitude : 38.7636,
      isDefault,
      deliveryNotes,
    });

    return res.status(201).json({ success: true, message: 'Address added successfully.', data: addr });
  } catch (err: any) {
    return next(err);
  }
}

export async function handleUpdateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const addressId = String(req.params.addressId || '');
    const addr = updateBuyerAddress(ctx, addressId, req.body);
    return res.json({ success: true, message: 'Address updated.', data: addr });
  } catch (err: any) {
    return next(err);
  }
}

export async function handleDeleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const addressId = String(req.params.addressId || '');
    deleteBuyerAddress(ctx, addressId);
    return res.json({ success: true, message: 'Address removed.' });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Saved Farmers ────────────────────────────────────────────
export async function handleToggleSavedFarmer(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const farmerId = String(req.params.farmerId || '');
    const result = toggleSavedFarmer(ctx, farmerId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return next(err);
  }
}

export async function handleGetSavedFarmers(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const data = getSavedFarmers(ctx);
    return res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Product Favorites ────────────────────────────────────────
export async function handleToggleFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const listingId = String(req.params.listingId || '');
    const result = toggleProductFavorite(ctx, listingId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return next(err);
  }
}

export async function handleGetFavorites(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const data = getProductFavorites(ctx);
    return res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Notifications ────────────────────────────────────────────
export async function handleGetNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const notifs = getBuyerNotifications(ctx);
    return res.json({ success: true, count: notifs.length, data: notifs });
  } catch (err: any) {
    return next(err);
  }
}

export async function handleMarkNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const notifId = String(req.params.notifId || '');
    const result = markNotificationAsRead(ctx, notifId);
    return res.json({ success: true, data: result.notif });
  } catch (err: any) {
    return next(err);
  }
}

// ─── Support Tickets ──────────────────────────────────────────
export async function handleCreateSupportTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = getBuyerContext(req);
    const { orderId, subject, message, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Subject and message are required.' },
      });
    }

    const ticket = createSupportTicket(ctx, { orderId, subject, message, category });
    return res.status(201).json({
      success: true,
      message: 'Support request submitted. Our team will contact you shortly.',
      data: ticket,
    });
  } catch (err: any) {
    return next(err);
  }
}
