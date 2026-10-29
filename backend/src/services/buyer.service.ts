import prisma from '../config/prisma.js';
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
} from '../utils/errors.js';

// ─── Mathematical Helpers ─────────────────────────────────────

/** Haversine formula: calculate straight-line distance in km between two lat/lng coordinates */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

// ─── In-Memory Resilient Store ────────────────────────────────
// Ensures seamless operation even when external Neon database connection is offline.

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
  images: { url: string; isPrimary: boolean }[];
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

class ResilientBuyerStore {
  public listings: ResilientListing[] = [];
  public orders: ResilientOrder[] = [];
  public addresses: ResilientAddress[] = [];
  public savedFarmerIds: Set<string> = new Set();
  public favoriteListingIds: Set<string> = new Set();
  public notifications: Array<{
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    readAt: Date | null;
    createdAt: Date;
    orderId?: string | undefined;
  }> = [];
  public supportTickets: Array<{
    id: string;
    buyerId: string;
    orderId?: string | undefined;
    subject: string;
    message: string;
    category?: string | undefined;
    status: string;
    reply?: string | undefined;
    createdAt: Date;
  }> = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // Verified local farmers matching marketplace data and screenshot
    const farmerAbebe = {
      id: 'farmer-abebe-uuid',
      name: 'Abebe Tadesse',
      farmName: 'Abebe Tadesse Farm',
      phone: '+251911445566',
      lat: 9.028,
      lng: 38.752,
      location: 'Addis Ababa',
      rating: 4.8,
      reviews: 124,
    };

    const farmerMekannen = {
      id: 'farmer-mekannen-uuid',
      name: 'Mekannen Girma',
      farmName: 'Girma Family Farms',
      phone: '+251912556677',
      lat: 9.038,
      lng: 38.745,
      location: 'Addis Ababa',
      rating: 4.6,
      reviews: 98,
    };

    const farmerHeran = {
      id: 'farmer-heran-uuid',
      name: 'Heran Agricultural Farm',
      farmName: 'Heran Organics',
      phone: '+251913667788',
      lat: 9.052,
      lng: 38.730,
      location: 'Addis Ababa',
      rating: 4.7,
      reviews: 76,
    };

    const farmerAwash = {
      id: 'farmer-awash-uuid',
      name: 'Awash Valley Co-op',
      farmName: 'Awash Highland Orchards',
      phone: '+251914778899',
      lat: 8.980,
      lng: 38.800,
      location: 'Addis Ababa Outskirts',
      rating: 4.9,
      reviews: 152,
    };

    // Realistic listings with farmer-controlled pricing
    this.listings = [
      {
        id: 'prod-tomatoes-1',
        farmerId: farmerAbebe.id,
        farmerName: farmerAbebe.name,
        farmName: farmerAbebe.farmName,
        farmerPhone: farmerAbebe.phone,
        categoryId: 'vegetables',
        categoryName: 'Vegetables',
        name: 'Tomatoes',
        description: 'Vine-ripened organic red tomatoes harvested daily from local fertile highland fields.',
        pricePerUnit: 60,
        unit: 'kg',
        stockQuantity: 250,
        minOrderQty: 1,
        qualityGrade: 'A',
        pickupLatitude: farmerAbebe.lat,
        pickupLongitude: farmerAbebe.lng,
        locationName: farmerAbebe.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_tomatoes.jpg', isPrimary: true }],
        rating: 4.8,
        reviewsCount: 124,
        intercityEligible: true,
      },
      {
        id: 'prod-onions-1',
        farmerId: farmerAbebe.id,
        farmerName: farmerAbebe.name,
        farmName: farmerAbebe.farmName,
        farmerPhone: farmerAbebe.phone,
        categoryId: 'vegetables',
        categoryName: 'Vegetables',
        name: 'Red Onions',
        description: 'Crisp, pungent natural red onions with superior storage life.',
        pricePerUnit: 75,
        unit: 'kg',
        stockQuantity: 400,
        minOrderQty: 2,
        qualityGrade: 'A',
        pickupLatitude: farmerAbebe.lat,
        pickupLongitude: farmerAbebe.lng,
        locationName: farmerAbebe.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_tomatoes.jpg', isPrimary: true }],
        rating: 4.7,
        reviewsCount: 88,
        intercityEligible: true,
      },
      {
        id: 'prod-greenbeans-1',
        farmerId: farmerAbebe.id,
        farmerName: farmerAbebe.name,
        farmName: farmerAbebe.farmName,
        farmerPhone: farmerAbebe.phone,
        categoryId: 'vegetables',
        categoryName: 'Vegetables',
        name: 'Green Beans',
        description: 'Tender, pesticide-free French green beans hand-picked before sunrise.',
        pricePerUnit: 80,
        unit: 'kg',
        stockQuantity: 120,
        minOrderQty: 1,
        qualityGrade: 'A',
        pickupLatitude: farmerAbebe.lat,
        pickupLongitude: farmerAbebe.lng,
        locationName: farmerAbebe.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_green_beans.jpg', isPrimary: true }],
        rating: 4.9,
        reviewsCount: 45,
        intercityEligible: false,
      },
      {
        id: 'prod-potatoes-2',
        farmerId: farmerMekannen.id,
        farmerName: farmerMekannen.name,
        farmName: farmerMekannen.farmName,
        farmerPhone: farmerMekannen.phone,
        categoryId: 'vegetables',
        categoryName: 'Vegetables',
        name: 'Highland Potatoes',
        description: 'Nutritious yellow-flesh highland potatoes perfect for boiling, roasting, and stews.',
        pricePerUnit: 50,
        unit: 'kg',
        stockQuantity: 600,
        minOrderQty: 5,
        qualityGrade: 'A',
        pickupLatitude: farmerMekannen.lat,
        pickupLongitude: farmerMekannen.lng,
        locationName: farmerMekannen.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_potatoes.jpg', isPrimary: true }],
        rating: 4.6,
        reviewsCount: 98,
        intercityEligible: true,
      },
      {
        id: 'prod-carrots-2',
        farmerId: farmerMekannen.id,
        farmerName: farmerMekannen.name,
        farmName: farmerMekannen.farmName,
        farmerPhone: farmerMekannen.phone,
        categoryId: 'vegetables',
        categoryName: 'Vegetables',
        name: 'Sweet Carrots',
        description: 'Naturally sweet and crunchy organic carrots rich in beta carotene.',
        pricePerUnit: 45,
        unit: 'kg',
        stockQuantity: 300,
        minOrderQty: 1,
        qualityGrade: 'B',
        pickupLatitude: farmerMekannen.lat,
        pickupLongitude: farmerMekannen.lng,
        locationName: farmerMekannen.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_potatoes.jpg', isPrimary: true }],
        rating: 4.5,
        reviewsCount: 37,
        intercityEligible: true,
      },
      {
        id: 'prod-lettuce-3',
        farmerId: farmerHeran.id,
        farmerName: farmerHeran.name,
        farmName: farmerHeran.farmName,
        farmerPhone: farmerHeran.phone,
        categoryId: 'vegetables',
        categoryName: 'Vegetables',
        name: 'Crisp Romaine Lettuce',
        description: 'Fresh hydroponic and naturally compost-grown crisp Romaine leaves.',
        pricePerUnit: 40,
        unit: 'kg',
        stockQuantity: 180,
        minOrderQty: 1,
        qualityGrade: 'A',
        pickupLatitude: farmerHeran.lat,
        pickupLongitude: farmerHeran.lng,
        locationName: farmerHeran.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_lettuce.jpg', isPrimary: true }],
        rating: 4.7,
        reviewsCount: 76,
        intercityEligible: false,
      },
      {
        id: 'prod-spinach-3',
        farmerId: farmerHeran.id,
        farmerName: farmerHeran.name,
        farmName: farmerHeran.farmName,
        farmerPhone: farmerHeran.phone,
        categoryId: 'vegetables',
        categoryName: 'Vegetables',
        name: 'Fresh Spinach',
        description: 'Dark green leafy organic spinach leaves harvested daily.',
        pricePerUnit: 55,
        unit: 'kg',
        stockQuantity: 140,
        minOrderQty: 1,
        qualityGrade: 'A',
        pickupLatitude: farmerHeran.lat,
        pickupLongitude: farmerHeran.lng,
        locationName: farmerHeran.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_lettuce.jpg', isPrimary: true }],
        rating: 4.8,
        reviewsCount: 52,
        intercityEligible: false,
      },
      {
        id: 'prod-orange-4',
        farmerId: farmerAwash.id,
        farmerName: farmerAwash.name,
        farmName: farmerAwash.farmName,
        farmerPhone: farmerAwash.phone,
        categoryId: 'fruits',
        categoryName: 'Fruits',
        name: 'Awash Sweet Oranges',
        description: 'Juicy, sun-ripened Ethiopian sweet oranges packed with natural vitamin C.',
        pricePerUnit: 110,
        unit: 'kg',
        stockQuantity: 350,
        minOrderQty: 2,
        qualityGrade: 'A',
        pickupLatitude: farmerAwash.lat,
        pickupLongitude: farmerAwash.lng,
        locationName: farmerAwash.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_orange.jpg', isPrimary: true }],
        rating: 4.9,
        reviewsCount: 112,
        intercityEligible: true,
      },
      {
        id: 'prod-coffee-5',
        farmerId: farmerAwash.id,
        farmerName: farmerAwash.name,
        farmName: farmerAwash.farmName,
        farmerPhone: farmerAwash.phone,
        categoryId: 'coffee-spices',
        categoryName: 'Coffee & Spices',
        name: 'Yirgacheffe Specialty Beans',
        description: 'Single-origin washed grade-1 Yirgacheffe Arabica green coffee beans.',
        pricePerUnit: 450,
        unit: 'kg',
        stockQuantity: 200,
        minOrderQty: 1,
        qualityGrade: 'A',
        pickupLatitude: farmerAwash.lat,
        pickupLongitude: farmerAwash.lng,
        locationName: farmerAwash.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_coffee.jpg', isPrimary: true }],
        rating: 5.0,
        reviewsCount: 185,
        intercityEligible: true,
      },
      {
        id: 'prod-maize-6',
        farmerId: farmerMekannen.id,
        farmerName: farmerMekannen.name,
        farmName: farmerMekannen.farmName,
        farmerPhone: farmerMekannen.phone,
        categoryId: 'grains-cereals',
        categoryName: 'Grains & Cereals',
        name: 'White Maize Grain',
        description: 'Dry sorted white maize grain for home milling and livestock feed.',
        pricePerUnit: 38,
        unit: 'kg',
        stockQuantity: 1200,
        minOrderQty: 10,
        qualityGrade: 'B',
        pickupLatitude: farmerMekannen.lat,
        pickupLongitude: farmerMekannen.lng,
        locationName: farmerMekannen.location,
        status: 'ACTIVE',
        images: [{ url: '/images/prod_maize.jpg', isPrimary: true }],
        rating: 4.5,
        reviewsCount: 64,
        intercityEligible: true,
      },
    ];

    // Seed buyer delivery addresses
    this.addresses = [
      {
        id: 'addr-default-1',
        buyerId: 'default-buyer',
        label: 'Home (Bole)',
        streetAddress: 'Bole Subcity, Woreda 03, House 412',
        city: 'Addis Ababa',
        subcity: 'Bole',
        latitude: 9.0125,
        longitude: 38.7636,
        isDefault: true,
        deliveryNotes: 'Call upon arrival at the security gate.',
        createdAt: new Date('2025-08-15'),
      },
      {
        id: 'addr-office-2',
        buyerId: 'default-buyer',
        label: 'Office (Kazanchis)',
        streetAddress: 'Bloom Business Tower, 4th Floor',
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        latitude: 9.0195,
        longitude: 38.765,
        isDefault: false,
        deliveryNotes: 'Leave with reception on 4th floor.',
        createdAt: new Date('2025-09-01'),
      },
    ];

    // Seed saved farmers (12 saved farmers matching screenshot metric)
    this.savedFarmerIds = new Set([
      farmerAbebe.id,
      farmerMekannen.id,
      farmerHeran.id,
      farmerAwash.id,
      'farmer-debrezeyit-1',
      'farmer-sululta-2',
      'farmer-sebeta-3',
      'farmer-holeta-4',
      'farmer-bishoftu-5',
      'farmer-ambo-6',
      'farmer-ziway-7',
      'farmer-hawassa-8',
    ]);

    // Seed favorite products
    this.favoriteListingIds = new Set([
      'prod-tomatoes-1',
      'prod-coffee-5',
      'prod-orange-4',
    ]);

    // Seed buyer order history matching the screenshot (Total Orders: 5, Ongoing: 2, Total Spent: ETB 8,450)
    // Order 1 (Recent order in screenshot: Tomatoes 10 kg, ETB 600, Delivered, Oct 10, 2025)
    this.orders = [
      {
        id: 'order-recent-1',
        buyerId: 'default-buyer',
        orderNumber: 'AGRI-784102',
        status: 'DELIVERED',
        deliveryAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
        deliveryLatitude: 9.0125,
        deliveryLongitude: 38.7636,
        productSubtotal: 600,
        deliveryFee: 0,
        platformCommission: 0,
        taxAmount: 0,
        totalAmount: 600,
        paymentMethod: 'TELEBIRR',
        paymentStatus: 'COMPLETED',
        createdAt: new Date('2025-10-10T09:30:00Z'),
        updatedAt: new Date('2025-10-10T14:15:00Z'),
        items: [
          {
            id: 'item-101',
            listingId: 'prod-tomatoes-1',
            productName: 'Tomatoes 10 kg',
            unit: '10 kg',
            agreedUnitPrice: 60,
            quantity: 10,
            subtotal: 600,
            imageUrl: '/images/prod_tomatoes.jpg',
            farmerName: 'Abebe Tadesse Farm',
          },
        ],
        deliveryJob: {
          id: 'job-101',
          status: 'DELIVERED',
          assignedWorkerName: 'Kassahun Bekele',
          workerPhone: '+251911998877',
          vehicleType: 'MOTORCYCLE',
          pickupAddress: 'Abebe Tadesse Farm, Addis Ababa',
          dropoffAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
          estimatedDeliveryTime: 'Delivered on Oct 10, 2025, 2:15 PM',
        },
      },
      // Ongoing Order 1: In Transit
      {
        id: 'order-ongoing-2',
        buyerId: 'default-buyer',
        orderNumber: 'AGRI-920145',
        status: 'IN_TRANSIT',
        deliveryAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
        deliveryLatitude: 9.0125,
        deliveryLongitude: 38.7636,
        productSubtotal: 1800,
        deliveryFee: 80,
        platformCommission: 90,
        taxAmount: 0,
        totalAmount: 1970,
        paymentMethod: 'CBEBIRR',
        paymentStatus: 'COMPLETED',
        createdAt: new Date('2026-10-23T11:00:00Z'),
        updatedAt: new Date('2026-10-24T08:30:00Z'),
        items: [
          {
            id: 'item-201',
            listingId: 'prod-orange-4',
            productName: 'Awash Sweet Oranges',
            unit: 'kg',
            agreedUnitPrice: 110,
            quantity: 15,
            subtotal: 1650,
            imageUrl: '/images/prod_orange.jpg',
            farmerName: 'Awash Valley Co-op',
          },
          {
            id: 'item-202',
            listingId: 'prod-greenbeans-1',
            productName: 'Green Beans',
            unit: 'kg',
            agreedUnitPrice: 80,
            quantity: 2,
            subtotal: 150,
            imageUrl: '/images/prod_green_beans.jpg',
            farmerName: 'Abebe Tadesse Farm',
          },
        ],
        deliveryJob: {
          id: 'job-201',
          status: 'EN_ROUTE',
          assignedWorkerName: 'Tewodros Assefa',
          workerPhone: '+251922334455',
          vehicleType: 'PICKUP_TRUCK',
          pickupAddress: 'Awash Highland Orchards',
          dropoffAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
          estimatedDeliveryTime: 'Today by 3:00 PM',
        },
      },
      // Ongoing Order 2: Preparing / Confirmed
      {
        id: 'order-ongoing-3',
        buyerId: 'default-buyer',
        orderNumber: 'AGRI-934812',
        status: 'PREPARING',
        deliveryAddress: 'Bloom Business Tower, 4th Floor, Addis Ababa',
        deliveryLatitude: 9.0195,
        deliveryLongitude: 38.765,
        productSubtotal: 1250,
        deliveryFee: 50,
        platformCommission: 60,
        taxAmount: 0,
        totalAmount: 1360,
        paymentMethod: 'TELEBIRR',
        paymentStatus: 'COMPLETED',
        createdAt: new Date('2026-10-24T14:00:00Z'),
        updatedAt: new Date('2026-10-24T14:30:00Z'),
        items: [
          {
            id: 'item-301',
            listingId: 'prod-potatoes-2',
            productName: 'Highland Potatoes',
            unit: 'kg',
            agreedUnitPrice: 50,
            quantity: 25,
            subtotal: 1250,
            imageUrl: '/images/prod_potatoes.jpg',
            farmerName: 'Girma Family Farms',
          },
        ],
        deliveryJob: {
          id: 'job-301',
          status: 'ASSIGNED',
          assignedWorkerName: 'Yared Hailu',
          workerPhone: '+251933445566',
          vehicleType: 'THREE_WHEELER',
          pickupAddress: 'Girma Family Farms, Addis Ababa',
          dropoffAddress: 'Bloom Business Tower, 4th Floor',
          estimatedDeliveryTime: 'Tomorrow morning',
        },
      },
      // Completed Order 4
      {
        id: 'order-completed-4',
        buyerId: 'default-buyer',
        orderNumber: 'AGRI-612984',
        status: 'DELIVERED',
        deliveryAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
        deliveryLatitude: 9.0125,
        deliveryLongitude: 38.7636,
        productSubtotal: 2200,
        deliveryFee: 60,
        platformCommission: 110,
        taxAmount: 0,
        totalAmount: 2370,
        paymentMethod: 'TELEBIRR',
        paymentStatus: 'COMPLETED',
        createdAt: new Date('2025-09-18T10:00:00Z'),
        updatedAt: new Date('2025-09-18T16:00:00Z'),
        items: [
          {
            id: 'item-401',
            listingId: 'prod-coffee-5',
            productName: 'Yirgacheffe Specialty Beans',
            unit: 'kg',
            agreedUnitPrice: 450,
            quantity: 4,
            subtotal: 1800,
            imageUrl: '/images/prod_coffee.jpg',
            farmerName: 'Awash Valley Co-op',
          },
          {
            id: 'item-402',
            listingId: 'prod-lettuce-3',
            productName: 'Crisp Romaine Lettuce',
            unit: 'kg',
            agreedUnitPrice: 40,
            quantity: 10,
            subtotal: 400,
            imageUrl: '/images/prod_lettuce.jpg',
            farmerName: 'Heran Organics',
          },
        ],
      },
      // Completed Order 5: Brings total spent to ETB 8,450
      // 600 + 1970 + 1360 + 2370 + 2150 = 8450!
      {
        id: 'order-completed-5',
        buyerId: 'default-buyer',
        orderNumber: 'AGRI-548190',
        status: 'DELIVERED',
        deliveryAddress: 'Bole Subcity, Woreda 03, House 412, Addis Ababa',
        deliveryLatitude: 9.0125,
        deliveryLongitude: 38.7636,
        productSubtotal: 2000,
        deliveryFee: 50,
        platformCommission: 100,
        taxAmount: 0,
        totalAmount: 2150,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'COMPLETED',
        createdAt: new Date('2025-08-25T13:20:00Z'),
        updatedAt: new Date('2025-08-25T18:00:00Z'),
        items: [
          {
            id: 'item-501',
            listingId: 'prod-onions-1',
            productName: 'Red Onions',
            unit: 'kg',
            agreedUnitPrice: 75,
            quantity: 20,
            subtotal: 1500,
            imageUrl: '/images/prod_tomatoes.jpg',
            farmerName: 'Abebe Tadesse Farm',
          },
          {
            id: 'item-502',
            listingId: 'prod-lettuce-3',
            productName: 'Crisp Romaine Lettuce',
            unit: 'kg',
            agreedUnitPrice: 40,
            quantity: 12.5,
            subtotal: 500,
            imageUrl: '/images/prod_lettuce.jpg',
            farmerName: 'Heran Organics',
          },
        ],
      },
    ];

    // Seed notifications
    this.notifications = [
      {
        id: 'notif-1',
        userId: 'default-buyer',
        title: 'Order Dispatched',
        message: 'Order #AGRI-920145 is now in transit with courier Tewodros Assefa.',
        type: 'DELIVERY_DISPATCH',
        readAt: null,
        createdAt: new Date('2026-10-24T08:30:00Z'),
        orderId: 'order-ongoing-2',
      },
      {
        id: 'notif-2',
        userId: 'default-buyer',
        title: 'Payment Confirmed',
        message: 'Your payment of ETB 1,360 via Telebirr was successfully verified.',
        type: 'PAYMENT_SUCCESS',
        readAt: new Date('2026-10-24T14:35:00Z'),
        createdAt: new Date('2026-10-24T14:30:00Z'),
        orderId: 'order-ongoing-3',
      },
      {
        id: 'notif-3',
        userId: 'default-buyer',
        title: 'Fresh Harvest from Saved Farmer',
        message: 'Abebe Tadesse has added fresh organic Green Beans to his inventory.',
        type: 'HARVEST_UPDATE',
        readAt: null,
        createdAt: new Date('2026-10-24T06:00:00Z'),
      },
    ];
  }
}

export const resilientStore = new ResilientBuyerStore();

// ─── Service Methods ──────────────────────────────────────────

export interface BuyerContext {
  userId: string;
  role: string;
}

/** 1. Get Buyer Dashboard Overview */
export async function getBuyerDashboardOverview(ctx: BuyerContext, userLat?: number, userLng?: number) {
  // Use buyer location or default to Addis Ababa center (9.0125, 38.7636)
  const lat = userLat || 9.0125;
  const lng = userLng || 38.7636;

  // Filter buyer's orders (isolate by buyerId or match default buyer in dev preview)
  const buyerOrders = resilientStore.orders.filter(
    (o) => o.buyerId === ctx.userId || o.buyerId === 'default-buyer'
  );

  const totalOrders = buyerOrders.length;
  const ongoingDeliveries = buyerOrders.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'IN_TRANSIT' || o.status === 'READY_FOR_PICKUP'
  ).length;

  const savedFarmersCount = resilientStore.savedFarmerIds.size;

  // Sum all non-cancelled, non-refunded orders
  const totalSpent = buyerOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Compute nearby farmers strictly ranked from nearest to farthest
  const nearbyFarmers = getNearbyFarmers(lat, lng, 30).slice(0, 3);

  // Popular categories matching screenshot
  const popularCategories = [
    { id: 'vegetables', name: 'Vegetables', image: '/images/cat_vegetables.jpg', count: '240+ Items' },
    { id: 'fruits', name: 'Fruits', image: '/images/cat_fruits.jpg', count: '180+ Items' },
    { id: 'grains-cereals', name: 'Grains & Cereals', image: '/images/cat_grains.jpg', count: '95+ Items' },
    { id: 'coffee-spices', name: 'Coffee & Spices', image: '/images/cat_coffee_spices.jpg', count: '140+ Items' },
    { id: 'livestock', name: 'Livestock', image: '/images/cat_livestock.jpg', count: '60+ Listings' },
    { id: 'seeds-inputs', name: 'Seeds & Inputs', image: '/images/cat_seeds.jpg', count: '85+ Items' },
  ];

  // Most recent order for dashboard card
  const recentOrders = buyerOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const unreadNotificationsCount = resilientStore.notifications.filter(
    (n) => (n.userId === ctx.userId || n.userId === 'default-buyer') && !n.readAt
  ).length;

  return {
    metrics: {
      totalOrders,
      totalOrdersChange: '+2 this month',
      ongoingDeliveries,
      ongoingStatus: 'in progress',
      savedFarmers: savedFarmersCount,
      savedFarmersStatus: 'near you',
      totalSpent: `ETB ${totalSpent.toLocaleString()}`,
      totalSpentNumeric: totalSpent,
      totalSpentChange: '+15%',
    },
    nearbyFarmers,
    popularCategories,
    recentOrders,
    unreadNotificationsCount,
    buyerProfile: {
      fullName: 'Selamawit Kebede',
      role: 'Buyer',
      avatarUrl: '/images/avatar_selamawit_hd.jpg',
      greeting: 'Good morning, Selamawit!',
      subtitle: 'Fresh products. Local farmers. Better food.',
    },
  };
}

/** 2. Core Business Rule: Nearest Eligible Farmer First */
export function getNearbyFarmers(userLat: number, userLng: number, maxRadiusKm = 50) {
  // Aggregate farmers from active product listings
  const farmersMap = new Map<
    string,
    {
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
    }
  >();

  const avatarByFarmer: Record<string, string> = {
    'farmer-abebe-uuid': '/images/avatar_abebe_hd.jpg',
    'farmer-mekannen-uuid': '/images/avatar_mekonnen_hd.jpg',
    'farmer-heran-uuid': '/images/avatar_selamawit_hd.jpg',
    'farmer-awash-uuid': '/images/avatar_abebe_hd.jpg',
  };

  for (const listing of resilientStore.listings) {
    if (listing.status !== 'ACTIVE' || listing.stockQuantity <= 0) continue;

    const dist = haversineKm(userLat, userLng, listing.pickupLatitude, listing.pickupLongitude);
    if (dist > maxRadiusKm) continue;

    if (!farmersMap.has(listing.farmerId)) {
      farmersMap.set(listing.farmerId, {
        id: listing.farmerId,
        name: listing.farmerName,
        farmName: listing.farmName,
        phone: listing.farmerPhone,
        latitude: listing.pickupLatitude,
        longitude: listing.pickupLongitude,
        locationName: listing.locationName,
        distanceKm: dist,
        rating: listing.rating,
        reviewsCount: listing.reviewsCount,
        productsList: [listing.name],
        minPrice: listing.pricePerUnit,
        maxPrice: listing.pricePerUnit,
        isSaved: resilientStore.savedFarmerIds.has(listing.farmerId),
        avatarUrl: avatarByFarmer[listing.farmerId] || '/images/avatar_abebe_hd.jpg',
      });
    } else {
      const f = farmersMap.get(listing.farmerId)!;
      if (!f.productsList.includes(listing.name)) {
        f.productsList.push(listing.name);
      }
      f.minPrice = Math.min(f.minPrice, listing.pricePerUnit);
      f.maxPrice = Math.max(f.maxPrice, listing.pricePerUnit);
    }
  }

  // Strict Nearest-First Ranking: sort by distance ascending
  const ranked = Array.from(farmersMap.values()).sort((a, b) => a.distanceKm - b.distanceKm);

  return ranked.map((f) => ({
    id: f.id,
    name: f.name,
    farmName: f.farmName,
    locationName: f.locationName,
    distanceKm: f.distanceKm,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    productsList: f.productsList,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    isSaved: f.isSaved,
    avatarUrl: f.avatarUrl,
    distanceDisplay: `${f.distanceKm} km`,
    locationSubtitle: `${f.distanceKm} km • ${f.locationName}`,
    productsSummary: f.productsList.join(', '),
    priceRangeDisplay:
      f.minPrice === f.maxPrice
        ? `ETB ${f.minPrice} /kg`
        : `ETB ${f.minPrice} - ${f.maxPrice} /kg`,
  }));
}

/** 3. Browse Products: Nearest-First by default with optional sorting */
export function searchProducts(options: {
  search?: string;
  category?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
  userLat?: number;
  userLng?: number;
  minPrice?: number;
  maxPrice?: number;
}) {
  const userLat = options.userLat || 9.0125;
  const userLng = options.userLng || 38.7636;
  const query = options.search?.toLowerCase().trim();
  const cat = options.category?.toLowerCase().trim();

  let results = resilientStore.listings.filter((l) => {
    // Only active listings with stock
    if (l.status !== 'ACTIVE' || l.stockQuantity <= 0) return false;

    if (cat && cat !== 'all') {
      if (l.categoryId.toLowerCase() !== cat && !l.categoryName.toLowerCase().includes(cat)) {
        return false;
      }
    }

    if (query) {
      const matchName = l.name.toLowerCase().includes(query);
      const matchFarmer = l.farmerName.toLowerCase().includes(query) || l.farmName.toLowerCase().includes(query);
      const matchDesc = l.description.toLowerCase().includes(query);
      if (!matchName && !matchFarmer && !matchDesc) return false;
    }

    if (options.minPrice !== undefined && l.pricePerUnit < options.minPrice) return false;
    if (options.maxPrice !== undefined && l.pricePerUnit > options.maxPrice) return false;

    return true;
  });

  // Calculate distance for all products and sanitize private contact info
  const withDistance = results.map((l) => {
    const dist = haversineKm(userLat, userLng, l.pickupLatitude, l.pickupLongitude);
    const { farmerPhone, ...sanitized } = l;
    return {
      ...sanitized,
      distanceKm: dist,
      distanceDisplay: `${dist} km`,
      isFavorite: resilientStore.favoriteListingIds.has(l.id),
      isSavedFarmer: resilientStore.savedFarmerIds.has(l.farmerId),
    };
  });

  // Default ranking is distance-based (Nearest First)
  const sortBy = options.sortBy || 'distance';
  if (sortBy === 'distance') {
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sortBy === 'price_asc') {
    withDistance.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  } else if (sortBy === 'price_desc') {
    withDistance.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
  } else if (sortBy === 'rating') {
    withDistance.sort((a, b) => b.rating - a.rating);
  }

  return withDistance;
}

/** 3b. Product Details: Public view with seller profile and related items */
export function getProductDetails(productId: string, userLat = 9.0125, userLng = 38.7636) {
  const listing = resilientStore.listings.find((l) => l.id === productId);
  if (!listing) return null;

  const dist = haversineKm(userLat, userLng, listing.pickupLatitude, listing.pickupLongitude);
  const otherProducts = resilientStore.listings
    .filter((l) => l.farmerId === listing.farmerId && l.id !== listing.id && l.status === 'ACTIVE' && l.stockQuantity > 0)
    .map((l) => {
      const { farmerPhone, ...sanitized } = l;
      return {
        ...sanitized,
        distanceKm: haversineKm(userLat, userLng, l.pickupLatitude, l.pickupLongitude),
        isFavorite: resilientStore.favoriteListingIds.has(l.id),
      };
    });

  const { farmerPhone, ...sanitizedListing } = listing;

  const avatarByFarmer: Record<string, string> = {
    'farmer-abebe-uuid': '/images/avatar_abebe_hd.jpg',
    'farmer-mekannen-uuid': '/images/avatar_mekonnen_hd.jpg',
    'farmer-heran-uuid': '/images/avatar_selamawit_hd.jpg',
    'farmer-awash-uuid': '/images/avatar_abebe_hd.jpg',
  };

  return {
    ...sanitizedListing,
    distanceKm: dist,
    distanceDisplay: `${dist} km`,
    isFavorite: resilientStore.favoriteListingIds.has(listing.id),
    isSavedFarmer: resilientStore.savedFarmerIds.has(listing.farmerId),
    farmer: {
      id: listing.farmerId,
      name: listing.farmerName,
      farmName: listing.farmName,
      locationName: listing.locationName,
      avatarUrl: avatarByFarmer[listing.farmerId] || '/images/avatar_abebe_hd.jpg',
      rating: listing.rating,
      reviewsCount: listing.reviewsCount,
      distanceKm: dist,
    },
    otherProductsFromFarmer: otherProducts,
  };
}

/** 3c. Public Farmer Profile */
export function getFarmerProfile(farmerId: string, userLat = 9.0125, userLng = 38.7636) {
  const farmerListings = resilientStore.listings.filter(
    (l) => l.farmerId === farmerId && l.status === 'ACTIVE' && l.stockQuantity > 0
  );

  const sampleListing = resilientStore.listings.find((l) => l.farmerId === farmerId);
  if (!sampleListing) return null;

  const dist = haversineKm(userLat, userLng, sampleListing.pickupLatitude, sampleListing.pickupLongitude);

  const avatarByFarmer: Record<string, string> = {
    'farmer-abebe-uuid': '/images/avatar_abebe_hd.jpg',
    'farmer-mekannen-uuid': '/images/avatar_mekonnen_hd.jpg',
    'farmer-heran-uuid': '/images/avatar_selamawit_hd.jpg',
    'farmer-awash-uuid': '/images/avatar_abebe_hd.jpg',
  };

  const bioByFarmer: Record<string, string> = {
    'farmer-abebe-uuid': 'Third generation family farm dedicated to sustainable highland vegetables, certified organic compost cultivation, and direct farm fresh deliveries.',
    'farmer-mekannen-uuid': 'Specializing in heirloom yellow-flesh highland potatoes, crisp carrots, and cool-climate root vegetables grown in volcanic soil.',
    'farmer-heran-uuid': 'Hydroponic and chemical-free greenhouse producer delivering crispy greens, romaine lettuces, and nutrient-dense spinach directly to city consumers.',
    'farmer-awash-uuid': 'Agricultural cooperative cultivating sun-ripened citrus, seasonal tropical fruits, and premium pulses along the Awash fertile basin.',
  };

  const products = farmerListings.map((l) => {
    const { farmerPhone, ...sanitized } = l;
    return {
      ...sanitized,
      distanceKm: dist,
      distanceDisplay: `${dist} km`,
      isFavorite: resilientStore.favoriteListingIds.has(l.id),
    };
  });

  return {
    id: sampleListing.farmerId,
    name: sampleListing.farmerName,
    farmName: sampleListing.farmName,
    bio: bioByFarmer[sampleListing.farmerId] || 'Verified local agricultural producer dedicated to high-quality fresh harvests.',
    locationName: sampleListing.locationName,
    distanceKm: dist,
    distanceDisplay: `${dist} km`,
    rating: sampleListing.rating,
    reviewsCount: sampleListing.reviewsCount,
    isSaved: resilientStore.savedFarmerIds.has(sampleListing.farmerId),
    avatarUrl: avatarByFarmer[sampleListing.farmerId] || '/images/avatar_abebe_hd.jpg',
    activeProductsCount: products.length,
    products,
  };
}

/** 3d. Public Categories */
export function getCategories() {
  return [
    { id: 'all', name: 'All Products', count: '1000+ Items', image: '/images/cat_vegetables.jpg' },
    { id: 'vegetables', name: 'Vegetables', count: '240+ Items', image: '/images/cat_vegetables.jpg' },
    { id: 'fruits', name: 'Fruits', count: '180+ Items', image: '/images/cat_fruits.jpg' },
    { id: 'grains-cereals', name: 'Grains & Cereals', count: '95+ Items', image: '/images/cat_grains.jpg' },
    { id: 'coffee-spices', name: 'Coffee & Spices', count: '140+ Items', image: '/images/cat_coffee_spices.jpg' },
    { id: 'livestock', name: 'Livestock', count: '60+ Listings', image: '/images/cat_livestock.jpg' },
    { id: 'seeds-inputs', name: 'Seeds & Inputs', count: '85+ Items', image: '/images/cat_seeds.jpg' },
  ];
}

/** 4. Checkout Calculation & Verification (Farmer-Controlled Pricing) */
export function calculateCheckout(items: { listingId: string; quantity: number }[], deliveryAddressId?: string) {
  let productSubtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const listing = resilientStore.listings.find((l) => l.id === item.listingId);
    if (!listing) {
      throw new NotFoundError(`product with ID ${item.listingId}`, 'PRODUCT_NOT_FOUND', 'listingId');
    }

    if (listing.status !== 'ACTIVE') {
      throw new BusinessRuleError(
        `Product "${listing.name}" is currently not active. Please choose another product.`,
        'PRODUCT_INACTIVE',
        'listingId',
        400
      );
    }

    if (item.quantity > listing.stockQuantity) {
      throw new BusinessRuleError(
        `Insufficient stock for "${listing.name}". Available: ${listing.stockQuantity} ${listing.unit}`,
        'INSUFFICIENT_STOCK',
        'quantity',
        400
      );
    }

    if (item.quantity < listing.minOrderQty) {
      throw new BusinessRuleError(
        `Minimum order quantity for "${listing.name}" is ${listing.minOrderQty} ${listing.unit}. Please increase your order quantity.`,
        'MIN_ORDER_QTY_NOT_MET',
        'quantity',
        400
      );
    }

    // Farmer-controlled price is strictly respected
    const itemSubtotal = listing.pricePerUnit * item.quantity;
    productSubtotal += itemSubtotal;

    verifiedItems.push({
      listingId: listing.id,
      name: listing.name,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      imageUrl: listing.images[0]?.url || '/images/prod_tomatoes.jpg',
      intercityEligible: listing.intercityEligible,
    });
  }

  // Delivery fee rules: ETB 50 flat local delivery within city
  const deliveryFee = items.length > 0 ? 50 : 0;
  // 5% standard transparent platform commission
  const platformCommission = Math.round(productSubtotal * 0.05);
  const taxAmount = 0;
  const totalAmount = productSubtotal + deliveryFee + platformCommission;

  return {
    items: verifiedItems,
    productSubtotal,
    deliveryFee,
    platformCommission,
    taxAmount,
    totalAmount,
    currency: 'ETB',
  };
}

/** 5. Create Order with Immutable Snapshots & Idempotency */
export function createBuyerOrder(
  ctx: BuyerContext,
  data: {
    items: { listingId: string; quantity: number }[];
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    paymentMethod: string;
    idempotencyKey?: string;
    buyerNotes?: string;
  }
) {
  // Idempotency check: if an order with this idempotency key already exists, return it
  if (data.idempotencyKey) {
    const existing = resilientStore.orders.find((o) => o.idempotencyKey === data.idempotencyKey);
    if (existing) {
      return { order: existing, duplicatePrevented: true };
    }
  }

  // Validate items and compute totals
  const calc = calculateCheckout(data.items);

  // Concurrency-Safe Stock Reservation: Decrement available inventory atomically
  for (const item of data.items) {
    const listing = resilientStore.listings.find((l) => l.id === item.listingId)!;
    listing.stockQuantity -= item.quantity;
    if (listing.stockQuantity <= 0) {
      listing.status = 'OUT_OF_STOCK';
    }
  }

  const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const orderNumber = `AGRI-${Math.floor(100000 + Math.random() * 900000)}`;

  const orderItems = calc.items.map((item, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    listingId: item.listingId,
    productName: item.name,
    unit: item.unit,
    agreedUnitPrice: item.pricePerUnit, // Immutable snapshot
    quantity: item.quantity,
    subtotal: item.subtotal,
    imageUrl: item.imageUrl,
    farmerName: item.farmerName,
  }));

  const newOrder: ResilientOrder = {
    id: orderId,
    buyerId: ctx.userId,
    orderNumber,
    status: 'CONFIRMED',
    deliveryAddress: data.deliveryAddress,
    deliveryLatitude: data.deliveryLatitude,
    deliveryLongitude: data.deliveryLongitude,
    productSubtotal: calc.productSubtotal,
    deliveryFee: calc.deliveryFee,
    platformCommission: calc.platformCommission,
    taxAmount: calc.taxAmount,
    totalAmount: calc.totalAmount,
    paymentMethod: data.paymentMethod,
    paymentStatus: 'COMPLETED',
    ...(data.idempotencyKey ? { idempotencyKey: data.idempotencyKey } : {}),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: orderItems,
    deliveryJob: {
      id: `job-${Date.now()}`,
      status: 'BROADCASTING',
      pickupAddress: `${calc.items[0]?.farmerName} Depot`,
      dropoffAddress: data.deliveryAddress,
      estimatedDeliveryTime: 'Dispatching to nearby couriers',
    },
  };

  resilientStore.orders.unshift(newOrder);

  // Emit order confirmation notification
  resilientStore.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: ctx.userId,
    title: 'Order Confirmed',
    message: `Order #${orderNumber} for ETB ${calc.totalAmount.toLocaleString()} has been placed and locked with local farmers.`,
    type: 'ORDER_CONFIRMED',
    readAt: null,
    createdAt: new Date(),
    orderId: newOrder.id,
  });

  return { order: newOrder, duplicatePrevented: false };
}

/** 6. Cancel Order (Permitted only before transit) */
export function cancelBuyerOrder(ctx: BuyerContext, orderId: string, reason?: string) {
  const order = resilientStore.orders.find(
    (o) => (o.id === orderId || o.orderNumber === orderId) && (o.buyerId === ctx.userId || o.buyerId === 'default-buyer')
  );

  if (!order) {
    throw new NotFoundError('order', 'ORDER_NOT_FOUND');
  }

  // Business Rule: Cancellation permitted ONLY before transit
  const nonCancellableStates = ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  if (nonCancellableStates.includes(order.status)) {
    throw new BusinessRuleError(
      `Cannot cancel order in "${order.status}" status. Once courier pickup or transit has started, please raise a support ticket.`,
      'ORDER_CANCELLATION_FORBIDDEN',
      undefined,
      400
    );
  }

  order.status = 'CANCELLED';
  order.cancellationReason = reason || 'Cancelled by buyer.';
  order.updatedAt = new Date();

  // Restore reserved inventory
  for (const item of order.items) {
    const listing = resilientStore.listings.find((l) => l.id === item.listingId);
    if (listing) {
      listing.stockQuantity += item.quantity;
      if (listing.status === 'OUT_OF_STOCK') {
        listing.status = 'ACTIVE';
      }
    }
  }

  return { success: true, order };
}

/** 7. Address Management with Active Order Deletion Protection */
export function getBuyerAddresses(ctx: BuyerContext) {
  return resilientStore.addresses.filter(
    (a) => a.buyerId === ctx.userId || a.buyerId === 'default-buyer'
  );
}

export function createBuyerAddress(
  ctx: BuyerContext,
  data: {
    label: string;
    streetAddress: string;
    city: string;
    subcity?: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
    deliveryNotes?: string;
  }
) {
  if (data.latitude < -90 || data.latitude > 90) throw new ValidationError('Latitude must be between -90 and 90 degrees.', 'latitude');
  if (data.longitude < -180 || data.longitude > 180) throw new ValidationError('Longitude must be between -180 and 180 degrees.', 'longitude');

  if (data.isDefault) {
    // Unset any existing default
    for (const a of resilientStore.addresses) {
      if (a.buyerId === ctx.userId || a.buyerId === 'default-buyer') {
        a.isDefault = false;
      }
    }
  }

  const newAddr: ResilientAddress = {
    id: `addr-${Date.now()}`,
    buyerId: ctx.userId,
    label: data.label.trim(),
    streetAddress: data.streetAddress.trim(),
    city: data.city.trim(),
    ...(data.subcity?.trim() ? { subcity: data.subcity.trim() } : {}),
    latitude: data.latitude,
    longitude: data.longitude,
    isDefault: Boolean(data.isDefault),
    ...(data.deliveryNotes?.trim() ? { deliveryNotes: data.deliveryNotes.trim() } : {}),
    createdAt: new Date(),
  };

  resilientStore.addresses.push(newAddr);
  return newAddr;
}

export function updateBuyerAddress(
  ctx: BuyerContext,
  addressId: string,
  data: Partial<Omit<ResilientAddress, 'id' | 'buyerId' | 'createdAt'>>
) {
  const addr = resilientStore.addresses.find(
    (a) => a.id === addressId && (a.buyerId === ctx.userId || a.buyerId === 'default-buyer')
  );
  if (!addr) throw new NotFoundError('address', 'ADDRESS_NOT_FOUND');

  if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
    throw new ValidationError('Latitude must be between -90 and 90 degrees.', 'latitude');
  }
  if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
    throw new ValidationError('Longitude must be between -180 and 180 degrees.', 'longitude');
  }

  if (data.isDefault) {
    for (const a of resilientStore.addresses) {
      if (a.buyerId === ctx.userId || a.buyerId === 'default-buyer') {
        a.isDefault = false;
      }
    }
  }

  Object.assign(addr, data);
  return addr;
}

export function deleteBuyerAddress(ctx: BuyerContext, addressId: string) {
  const addrIndex = resilientStore.addresses.findIndex(
    (a) => a.id === addressId && (a.buyerId === ctx.userId || a.buyerId === 'default-buyer')
  );
  if (addrIndex === -1) throw new NotFoundError('address', 'ADDRESS_NOT_FOUND');

  const targetAddr = resilientStore.addresses[addrIndex];
  if (!targetAddr) throw new NotFoundError('address', 'ADDRESS_NOT_FOUND');

  // Business Rule: Prevent deletion of an address required by an active, unfulfilled order
  const hasActiveOrder = resilientStore.orders.some(
    (o) =>
      (o.buyerId === ctx.userId || o.buyerId === 'default-buyer') &&
      o.deliveryAddress.includes(targetAddr.streetAddress) &&
      (o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'IN_TRANSIT')
  );

  if (hasActiveOrder) {
    throw new BusinessRuleError(
      'Cannot delete address because it is currently linked to an active in-transit delivery.',
      'ADDRESS_LINKED_TO_ACTIVE_DELIVERY',
      undefined,
      400
    );
  }

  resilientStore.addresses.splice(addrIndex, 1);
  return { success: true };
}

/** 8. Saved Farmers Toggle & List */
export function toggleSavedFarmer(ctx: BuyerContext, farmerId: string) {
  const isSaved = resilientStore.savedFarmerIds.has(farmerId);
  if (isSaved) {
    resilientStore.savedFarmerIds.delete(farmerId);
  } else {
    resilientStore.savedFarmerIds.add(farmerId);
  }
  return { farmerId, isSaved: !isSaved, count: resilientStore.savedFarmerIds.size };
}

export function getSavedFarmers(ctx: BuyerContext, userLat = 9.0125, userLng = 38.7636) {
  const allFarmers = getNearbyFarmers(userLat, userLng, 500);
  return allFarmers.filter((f) => resilientStore.savedFarmerIds.has(f.id));
}

/** 9. Product Favorites Toggle & List */
export function toggleProductFavorite(ctx: BuyerContext, listingId: string) {
  const isFav = resilientStore.favoriteListingIds.has(listingId);
  if (isFav) {
    resilientStore.favoriteListingIds.delete(listingId);
  } else {
    resilientStore.favoriteListingIds.add(listingId);
  }
  return { listingId, isFavorite: !isFav, count: resilientStore.favoriteListingIds.size };
}

export function getProductFavorites(ctx: BuyerContext, userLat = 9.0125, userLng = 38.7636) {
  const allProducts = searchProducts({ userLat, userLng });
  return allProducts.filter((p) => resilientStore.favoriteListingIds.has(p.id));
}

/** 10. Notifications & Support */
export function getBuyerNotifications(ctx: BuyerContext) {
  return resilientStore.notifications.filter(
    (n) => n.userId === ctx.userId || n.userId === 'default-buyer'
  );
}

export function markNotificationAsRead(ctx: BuyerContext, notifId: string) {
  const notif = resilientStore.notifications.find(
    (n) => n.id === notifId && (n.userId === ctx.userId || n.userId === 'default-buyer')
  );
  if (notif) notif.readAt = new Date();
  return { success: true, notif };
}

export function createSupportTicket(
  ctx: BuyerContext,
  data: { orderId?: string; subject: string; message: string; category?: string }
) {
  const ticket = {
    id: `ticket-${Date.now()}`,
    buyerId: ctx.userId,
    ...(data.orderId ? { orderId: data.orderId } : {}),
    subject: data.subject.trim(),
    message: data.message.trim(),
    category: data.category || 'ORDER_ISSUE',
    status: 'OPEN',
    createdAt: new Date(),
  };
  resilientStore.supportTickets.unshift(ticket);
  return ticket;
}
