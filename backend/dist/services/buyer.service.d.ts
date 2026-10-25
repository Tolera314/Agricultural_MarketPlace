/** Haversine formula: calculate straight-line distance in km between two lat/lng coordinates */
export declare function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
export interface ResilientListing {
    id: string;
    farmerId: string;
    farmerName: string;
    farmName: string;
    farmerPhone: string;
    categoryId: string;
    categoryName: string;
    name: string;
    description: string;
    pricePerUnit: number;
    unit: string;
    stockQuantity: number;
    minOrderQty: number;
    qualityGrade: string;
    pickupLatitude: number;
    pickupLongitude: number;
    locationName: string;
    status: 'ACTIVE' | 'PAUSED' | 'OUT_OF_STOCK';
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    rating: number;
    reviewsCount: number;
    intercityEligible: boolean;
}
export interface ResilientOrder {
    id: string;
    buyerId: string;
    orderNumber: string;
    status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    productSubtotal: number;
    deliveryFee: number;
    platformCommission: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    idempotencyKey?: string | undefined;
    cancellationReason?: string | undefined;
    createdAt: Date;
    updatedAt: Date;
    items: {
        id: string;
        listingId: string;
        productName: string;
        unit: string;
        agreedUnitPrice: number;
        quantity: number;
        subtotal: number;
        imageUrl: string;
        farmerName: string;
    }[];
    deliveryJob?: {
        id: string;
        status: string;
        assignedWorkerName?: string | undefined;
        workerPhone?: string | undefined;
        vehicleType?: string | undefined;
        pickupAddress: string;
        dropoffAddress: string;
        estimatedDeliveryTime?: string | undefined;
    } | undefined;
}
export interface ResilientAddress {
    id: string;
    buyerId: string;
    label: string;
    streetAddress: string;
    city: string;
    subcity?: string | undefined;
    latitude: number;
    longitude: number;
    isDefault: boolean;
    deliveryNotes?: string | undefined;
    createdAt: Date;
}
declare class ResilientBuyerStore {
    listings: ResilientListing[];
    orders: ResilientOrder[];
    addresses: ResilientAddress[];
    savedFarmerIds: Set<string>;
    favoriteListingIds: Set<string>;
    notifications: Array<{
        id: string;
        userId: string;
        title: string;
        message: string;
        type: string;
        readAt: Date | null;
        createdAt: Date;
        orderId?: string | undefined;
    }>;
    supportTickets: Array<{
        id: string;
        buyerId: string;
        orderId?: string | undefined;
        subject: string;
        message: string;
        category?: string | undefined;
        status: string;
        reply?: string | undefined;
        createdAt: Date;
    }>;
    constructor();
    private seedDefaultData;
}
export declare const resilientStore: ResilientBuyerStore;
export interface BuyerContext {
    userId: string;
    role: string;
}
/** 1. Get Buyer Dashboard Overview */
export declare function getBuyerDashboardOverview(ctx: BuyerContext, userLat?: number, userLng?: number): Promise<{
    metrics: {
        totalOrders: number;
        totalOrdersChange: string;
        ongoingDeliveries: number;
        ongoingStatus: string;
        savedFarmers: number;
        savedFarmersStatus: string;
        totalSpent: string;
        totalSpentNumeric: number;
        totalSpentChange: string;
    };
    nearbyFarmers: {
        distanceDisplay: string;
        locationSubtitle: string;
        productsSummary: string;
        priceRangeDisplay: string;
        id: string;
        name: string;
        farmName: string;
        phone: string;
        latitude: number;
        longitude: number;
        locationName: string;
        distanceKm: number;
        rating: number;
        reviewsCount: number;
        productsList: string[];
        minPrice: number;
        maxPrice: number;
        isSaved: boolean;
        avatarUrl: string;
    }[];
    popularCategories: {
        id: string;
        name: string;
        image: string;
        count: string;
    }[];
    recentOrders: ResilientOrder[];
    unreadNotificationsCount: number;
    buyerProfile: {
        fullName: string;
        role: string;
        avatarUrl: string;
        greeting: string;
        subtitle: string;
    };
}>;
/** 2. Core Business Rule: Nearest Eligible Farmer First */
export declare function getNearbyFarmers(userLat: number, userLng: number, maxRadiusKm?: number): {
    distanceDisplay: string;
    locationSubtitle: string;
    productsSummary: string;
    priceRangeDisplay: string;
    id: string;
    name: string;
    farmName: string;
    phone: string;
    latitude: number;
    longitude: number;
    locationName: string;
    distanceKm: number;
    rating: number;
    reviewsCount: number;
    productsList: string[];
    minPrice: number;
    maxPrice: number;
    isSaved: boolean;
    avatarUrl: string;
}[];
/** 3. Browse Products: Nearest-First by default with optional sorting */
export declare function searchProducts(options: {
    search?: string;
    category?: string;
    sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
    userLat?: number;
    userLng?: number;
    minPrice?: number;
    maxPrice?: number;
}): {
    distanceKm: number;
    distanceDisplay: string;
    isFavorite: boolean;
    isSavedFarmer: boolean;
    id: string;
    farmerId: string;
    farmerName: string;
    farmName: string;
    farmerPhone: string;
    categoryId: string;
    categoryName: string;
    name: string;
    description: string;
    pricePerUnit: number;
    unit: string;
    stockQuantity: number;
    minOrderQty: number;
    qualityGrade: string;
    pickupLatitude: number;
    pickupLongitude: number;
    locationName: string;
    status: "ACTIVE" | "PAUSED" | "OUT_OF_STOCK";
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    rating: number;
    reviewsCount: number;
    intercityEligible: boolean;
}[];
/** 4. Checkout Calculation & Verification (Farmer-Controlled Pricing) */
export declare function calculateCheckout(items: {
    listingId: string;
    quantity: number;
}[], deliveryAddressId?: string): {
    items: {
        listingId: string;
        name: string;
        farmerId: string;
        farmerName: string;
        unit: string;
        pricePerUnit: number;
        quantity: number;
        subtotal: number;
        imageUrl: string;
        intercityEligible: boolean;
    }[];
    productSubtotal: number;
    deliveryFee: number;
    platformCommission: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
};
/** 5. Create Order with Immutable Snapshots & Idempotency */
export declare function createBuyerOrder(ctx: BuyerContext, data: {
    items: {
        listingId: string;
        quantity: number;
    }[];
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    paymentMethod: string;
    idempotencyKey?: string;
    buyerNotes?: string;
}): {
    order: ResilientOrder;
    duplicatePrevented: boolean;
};
/** 6. Cancel Order (Permitted only before transit) */
export declare function cancelBuyerOrder(ctx: BuyerContext, orderId: string, reason?: string): {
    success: boolean;
    order: ResilientOrder;
};
/** 7. Address Management with Active Order Deletion Protection */
export declare function getBuyerAddresses(ctx: BuyerContext): ResilientAddress[];
export declare function createBuyerAddress(ctx: BuyerContext, data: {
    label: string;
    streetAddress: string;
    city: string;
    subcity?: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
    deliveryNotes?: string;
}): ResilientAddress;
export declare function updateBuyerAddress(ctx: BuyerContext, addressId: string, data: Partial<Omit<ResilientAddress, 'id' | 'buyerId' | 'createdAt'>>): ResilientAddress;
export declare function deleteBuyerAddress(ctx: BuyerContext, addressId: string): {
    success: boolean;
};
/** 8. Saved Farmers Toggle & List */
export declare function toggleSavedFarmer(ctx: BuyerContext, farmerId: string): {
    farmerId: string;
    isSaved: boolean;
    count: number;
};
export declare function getSavedFarmers(ctx: BuyerContext, userLat?: number, userLng?: number): {
    distanceDisplay: string;
    locationSubtitle: string;
    productsSummary: string;
    priceRangeDisplay: string;
    id: string;
    name: string;
    farmName: string;
    phone: string;
    latitude: number;
    longitude: number;
    locationName: string;
    distanceKm: number;
    rating: number;
    reviewsCount: number;
    productsList: string[];
    minPrice: number;
    maxPrice: number;
    isSaved: boolean;
    avatarUrl: string;
}[];
/** 9. Product Favorites Toggle & List */
export declare function toggleProductFavorite(ctx: BuyerContext, listingId: string): {
    listingId: string;
    isFavorite: boolean;
    count: number;
};
export declare function getProductFavorites(ctx: BuyerContext, userLat?: number, userLng?: number): {
    distanceKm: number;
    distanceDisplay: string;
    isFavorite: boolean;
    isSavedFarmer: boolean;
    id: string;
    farmerId: string;
    farmerName: string;
    farmName: string;
    farmerPhone: string;
    categoryId: string;
    categoryName: string;
    name: string;
    description: string;
    pricePerUnit: number;
    unit: string;
    stockQuantity: number;
    minOrderQty: number;
    qualityGrade: string;
    pickupLatitude: number;
    pickupLongitude: number;
    locationName: string;
    status: "ACTIVE" | "PAUSED" | "OUT_OF_STOCK";
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    rating: number;
    reviewsCount: number;
    intercityEligible: boolean;
}[];
/** 10. Notifications & Support */
export declare function getBuyerNotifications(ctx: BuyerContext): {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    readAt: Date | null;
    createdAt: Date;
    orderId?: string | undefined;
}[];
export declare function markNotificationAsRead(ctx: BuyerContext, notifId: string): {
    success: boolean;
    notif: {
        id: string;
        userId: string;
        title: string;
        message: string;
        type: string;
        readAt: Date | null;
        createdAt: Date;
        orderId?: string | undefined;
    } | undefined;
};
export declare function createSupportTicket(ctx: BuyerContext, data: {
    orderId?: string;
    subject: string;
    message: string;
    category?: string;
}): {
    subject: string;
    message: string;
    category: string;
    status: string;
    createdAt: Date;
    orderId?: string;
    id: string;
    buyerId: string;
};
export {};
//# sourceMappingURL=buyer.service.d.ts.map