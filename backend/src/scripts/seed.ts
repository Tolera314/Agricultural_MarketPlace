/**
 * Agricultural Marketplace Platform - Production-Grade Database Seeder
 * ====================================================================
 * Security & Reliability Standards:
 *  - Environment Safety Guard: Blocks destructive runs in production unless explicitly opted in.
 *  - Secure Credential Management: Configurable passwords via environment variables;
 *    strong bcrypt cost factor (12) used for high cryptographic resilience.
 *  - 100% Idempotent: Every entity uses safe upserts/find-and-update patterns so the script
 *    can be run repeatedly at any time without duplicate key (P2002) or missing relation crashes.
 *  - Complete Relational Graph: Seeds Admins, Farmers, Couriers, Buyers, Cities, Markets,
 *    Delivery Zones, Intercity Routes, Categories, Products, Orders, and Pricing Rules.
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

// ============================================================================
// 1. SECURITY & CONFIGURATION GUARDS
// ============================================================================

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const ALLOW_PROD_SEED = process.env.ALLOW_PRODUCTION_SEED === 'true';

if (IS_PROD && !ALLOW_PROD_SEED) {
  console.error('\n🛑 SECURITY ABORT: Seeding is blocked in production environments.');
  console.error('To override for a verified bootstrap, set ALLOW_PRODUCTION_SEED=true.\n');
  process.exit(1);
}

// Credentials sourced from environment with secure fallback defaults for development
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@AgriMarket2026!';
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'User@AgriMarket2026!';
const BCRYPT_ROUNDS = 12;

async function seed() {
  console.log('\n🌱 =======================================================');
  console.log('   AgriMarket Platform - Database Seeding Pipeline');
  console.log(`   Environment: ${NODE_ENV.toUpperCase()} | Bcrypt Rounds: ${BCRYPT_ROUNDS}`);
  console.log('   =======================================================\n');

  const startTime = Date.now();

  console.log('🔐 Generating cryptographically secure credential hashes...');
  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS),
    bcrypt.hash(USER_PASSWORD, BCRYPT_ROUNDS),
  ]);

  // ============================================================================
  // 2. GEOGRAPHIC FOUNDATION: CITIES & REGIONS
  // ============================================================================
  console.log('\n📍 [1/9] Initializing Ethiopian Cities & Regional Centers...');

  const citiesData = [
    { name: 'Addis Ababa', regionName: 'Addis Ababa', countryCode: 'ET', latitude: 9.0108, longitude: 38.7613 },
    { name: 'Bahir Dar', regionName: 'Amhara', countryCode: 'ET', latitude: 11.5936, longitude: 37.3908 },
    { name: 'Jimma', regionName: 'Oromia', countryCode: 'ET', latitude: 7.6734, longitude: 36.8344 },
    { name: 'Hawassa', regionName: 'Sidama', countryCode: 'ET', latitude: 7.0621, longitude: 38.4764 },
    { name: 'Adama', regionName: 'Oromia', countryCode: 'ET', latitude: 8.5414, longitude: 39.2689 },
    { name: 'Mekelle', regionName: 'Tigray', countryCode: 'ET', latitude: 13.4967, longitude: 39.4753 },
    { name: 'Dire Dawa', regionName: 'Dire Dawa', countryCode: 'ET', latitude: 9.6009, longitude: 41.8501 },
  ];

  const cityMap = new Map<string, string>();
  for (const c of citiesData) {
    const city = await prisma.city.upsert({
      where: { name: c.name },
      update: {
        regionName: c.regionName,
        latitude: c.latitude,
        longitude: c.longitude,
        countryCode: c.countryCode,
        isActive: true,
      },
      create: c,
    });
    cityMap.set(c.name, city.id);
  }
  console.log(`   ✅ ${citiesData.length} Cities verified.`);

  // ============================================================================
  // 3. PHYSICAL HUBS & REGIONAL MARKETS
  // ============================================================================
  console.log('\n🏬 [2/9] Initializing Agricultural Markets & Trading Hubs...');

  const marketsData = [
    { name: 'Addis Ababa Merkato Grain Market', cityName: 'Addis Ababa', latitude: 9.0305, longitude: 38.7400, radius: 40 },
    { name: 'Addis Ababa Kera Livestock & Produce Depot', cityName: 'Addis Ababa', latitude: 8.9880, longitude: 38.7490, radius: 30 },
    { name: 'Bahir Dar Central Produce Market', cityName: 'Bahir Dar', latitude: 11.5950, longitude: 37.3880, radius: 35 },
    { name: 'Jimma Coffee & Agricultural Depot', cityName: 'Jimma', latitude: 7.6750, longitude: 36.8360, radius: 45 },
    { name: 'Hawassa Lake Basin Produce Hub', cityName: 'Hawassa', latitude: 7.0600, longitude: 38.4800, radius: 30 },
    { name: 'Adama Express Logistics Market', cityName: 'Adama', latitude: 8.5400, longitude: 39.2700, radius: 35 },
  ];

  const marketMap = new Map<string, string>();
  for (const m of marketsData) {
    const cityId = cityMap.get(m.cityName)!;
    const existing = await prisma.market.findFirst({ where: { name: m.name, cityId } });
    if (existing) {
      await prisma.market.update({
        where: { id: existing.id },
        data: { latitude: m.latitude, longitude: m.longitude, serviceRadiusKm: m.radius, isActive: true },
      });
      marketMap.set(m.name, existing.id);
    } else {
      const created = await prisma.market.create({
        data: {
          name: m.name,
          cityId,
          latitude: m.latitude,
          longitude: m.longitude,
          serviceRadiusKm: m.radius,
          isActive: true,
        },
      });
      marketMap.set(m.name, created.id);
    }
  }
  console.log(`   ✅ ${marketsData.length} Agricultural Markets verified.`);

  // ============================================================================
  // 4. DELIVERY ZONES (Solving foreign key constraints for delivery couriers)
  // ============================================================================
  console.log('\n🚚 [3/9] Initializing Last-Mile Delivery Zones...');

  const addisCityId = cityMap.get('Addis Ababa')!;
  const hawassaCityId = cityMap.get('Hawassa')!;
  const bahirDarCityId = cityMap.get('Bahir Dar')!;

  const deliveryZonesData = [
    {
      name: 'Addis Ababa Central & Merkato Zone',
      cityId: addisCityId,
      marketId: marketMap.get('Addis Ababa Merkato Grain Market'),
      description: 'Central commercial and wholesale agricultural distribution sector',
      latitude: 9.0305,
      longitude: 38.7400,
      radiusKm: 15.0,
    },
    {
      name: 'Bole & Beshale Residential Express Zone',
      cityId: addisCityId,
      marketId: marketMap.get('Addis Ababa Kera Livestock & Produce Depot'),
      description: 'High-density urban residential consumer delivery zone',
      latitude: 9.0020,
      longitude: 38.7880,
      radiusKm: 18.0,
    },
    {
      name: 'Hawassa Urban & Lake Basin Hub',
      cityId: hawassaCityId,
      marketId: marketMap.get('Hawassa Lake Basin Produce Hub'),
      description: 'Southern region fruit, vegetable, and fish logistics sector',
      latitude: 7.0600,
      longitude: 38.4800,
      radiusKm: 20.0,
    },
    {
      name: 'Bahir Dar Lakeside Trade Sector',
      cityId: bahirDarCityId,
      marketId: marketMap.get('Bahir Dar Central Produce Market'),
      description: 'Northern agricultural produce trading zone',
      latitude: 11.5950,
      longitude: 37.3880,
      radiusKm: 20.0,
    },
  ];

  const zoneMap = new Map<string, string>();
  for (const z of deliveryZonesData) {
    const existing = await prisma.deliveryZone.findFirst({ where: { name: z.name, cityId: z.cityId } });
    const marketId = z.marketId ?? null;
    if (existing) {
      await prisma.deliveryZone.update({
        where: { id: existing.id },
        data: {
          marketId,
          description: z.description,
          latitude: z.latitude,
          longitude: z.longitude,
          radiusKm: z.radiusKm,
          isActive: true,
        },
      });
      zoneMap.set(z.name, existing.id);
    } else {
      const created = await prisma.deliveryZone.create({
        data: {
          name: z.name,
          cityId: z.cityId,
          marketId,
          description: z.description,
          latitude: z.latitude,
          longitude: z.longitude,
          radiusKm: z.radiusKm,
          isActive: true,
        },
      });
      zoneMap.set(z.name, created.id);
    }
  }
  console.log(`   ✅ ${deliveryZonesData.length} Delivery Zones verified.`);

  // ============================================================================
  // 5. INTERCITY TRADE CORRIDORS & LOGISTICS ROUTES
  // ============================================================================
  console.log('\n🛣️  [4/9] Initializing Intercity Logistics Corridors...');

  const addisMarketId = marketMap.get('Addis Ababa Merkato Grain Market')!;
  const bahirDarMarketId = marketMap.get('Bahir Dar Central Produce Market')!;
  const jimmaMarketId = marketMap.get('Jimma Coffee & Agricultural Depot')!;
  const hawassaMarketId = marketMap.get('Hawassa Lake Basin Produce Hub')!;
  const adamaMarketId = marketMap.get('Adama Express Logistics Market')!;

  const routesConfig = [
    {
      originCityId: cityMap.get('Bahir Dar')!,
      destCityId: cityMap.get('Addis Ababa')!,
      originMarketId: bahirDarMarketId,
      destMarketId: addisMarketId,
      transitDays: 2,
      requiresApproval: true,
      minTransaction: 2000,
    },
    {
      originCityId: cityMap.get('Jimma')!,
      destCityId: cityMap.get('Addis Ababa')!,
      originMarketId: jimmaMarketId,
      destMarketId: addisMarketId,
      transitDays: 2,
      requiresApproval: true,
      minTransaction: 3000,
    },
    {
      originCityId: cityMap.get('Hawassa')!,
      destCityId: cityMap.get('Addis Ababa')!,
      originMarketId: hawassaMarketId,
      destMarketId: addisMarketId,
      transitDays: 1,
      requiresApproval: true,
      minTransaction: 1500,
    },
    {
      originCityId: cityMap.get('Adama')!,
      destCityId: cityMap.get('Addis Ababa')!,
      originMarketId: adamaMarketId,
      destMarketId: addisMarketId,
      transitDays: 1,
      requiresApproval: false,
      minTransaction: 500,
    },
  ];

  const routeMap = new Map<string, string>();
  for (const rc of routesConfig) {
    const route = await prisma.intercityRoute.upsert({
      where: {
        originMarketId_destinationMarketId: {
          originMarketId: rc.originMarketId,
          destinationMarketId: rc.destMarketId,
        },
      },
      update: {
        originCityId: rc.originCityId,
        destinationCityId: rc.destCityId,
        requiresApproval: rc.requiresApproval,
        estimatedTransitDays: rc.transitDays,
        minTransactionLimit: rc.minTransaction,
        status: 'ACTIVE',
      },
      create: {
        originCityId: rc.originCityId,
        destinationCityId: rc.destCityId,
        originMarketId: rc.originMarketId,
        destinationMarketId: rc.destMarketId,
        requiresApproval: rc.requiresApproval,
        estimatedTransitDays: rc.transitDays,
        minTransactionLimit: rc.minTransaction,
        status: 'ACTIVE',
      },
    });
    routeMap.set(`${rc.originMarketId}->${rc.destMarketId}`, route.id);
  }
  console.log(`   ✅ ${routesConfig.length} Intercity Logistics Routes verified.`);

  // ============================================================================
  // 6. PRODUCT CATEGORIES & TAXONOMY
  // ============================================================================
  console.log('\n🌾 [5/9] Initializing Agricultural Categories...');

  const categoriesData = [
    { name: 'Vegetables', slug: 'vegetables', description: 'Fresh farm-grown highland and lowland vegetables' },
    { name: 'Fruits', slug: 'fruits', description: 'Sun-ripened orchard and citrus fruits' },
    { name: 'Grains & Cereals', slug: 'grains-cereals', description: 'Ethiopian teff, wheat, barley, maize, and pulses' },
    { name: 'Coffee & Spices', slug: 'coffee-spices', description: 'Ethiopian specialty coffees, berbere, ginger, and cardamom' },
    { name: 'Livestock & Dairy', slug: 'livestock-dairy', description: 'Livestock, poultry, honey, and fresh farm dairy' },
    { name: 'Seeds & Farm Inputs', slug: 'seeds-inputs', description: 'Certified hybrid and organic agricultural seeds and organic fertilizers' },
  ];

  const catMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
    catMap.set(cat.slug, category.id);
  }
  console.log(`   ✅ ${categoriesData.length} Product Categories verified.`);

  // ============================================================================
  // 7. PLATFORM ACTORS & ROLE ACCOUNTS
  // ============================================================================
  console.log('\n👥 [6/9] Initializing Platform Users & Authoritative Roles...');

  // Helper for idempotent user + profile upsert
  async function upsertUserWithProfile(config: {
    fullName: string;
    phone: string;
    email: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'FARMER' | 'DELIVERY_WORKER' | 'BUYER';
    isVerified: boolean;
    onboardingStatus: string;
    passwordHash: string;
    userProfile?: { avatarUrl?: string; bio?: string };
    farmerProfile?: {
      farmName: string;
      farmDescription: string;
      farmLatitude: number;
      farmLongitude: number;
      isOrganic: boolean;
      verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
      verificationNote?: string;
      marketId?: string;
      verificationDocuments?: any;
    };
    deliveryProfile?: {
      vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'THREE_WHEELER' | 'PICKUP_TRUCK' | 'TRUCK' | 'OTHER';
      vehiclePlate?: string;
      vehicleCapacityKg: number;
      availability: 'ONLINE' | 'BUSY' | 'OFFLINE';
      verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
      lastLatitude: number;
      lastLongitude: number;
      deliveryZoneId?: string | null | undefined;
      verificationDocuments?: any;
    };
    buyerProfile?: {
      preferredDeliveryAddress: string;
      preferredLatitude: number;
      preferredLongitude: number;
    };
  }) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: config.phone }, { email: config.email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          fullName: config.fullName,
          phone: config.phone,
          email: config.email,
          passwordHash: config.passwordHash,
          role: config.role,
          isActive: true,
          isVerified: config.isVerified,
          onboardingStatus: config.onboardingStatus,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: config.fullName,
          role: config.role,
          isVerified: config.isVerified,
          onboardingStatus: config.onboardingStatus,
          isActive: true,
        },
      });
    }

    // Upsert UserProfile
    if (config.userProfile) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: config.userProfile,
        create: { userId: user.id, ...config.userProfile },
      });
    }

    // Upsert FarmerProfile
    let farmerProfileRecord = null;
    if (config.farmerProfile) {
      farmerProfileRecord = await prisma.farmerProfile.upsert({
        where: { userId: user.id },
        update: config.farmerProfile as any,
        create: { userId: user.id, ...config.farmerProfile } as any,
      });
    }

    // Upsert DeliveryProfile
    let deliveryProfileRecord = null;
    if (config.deliveryProfile) {
      deliveryProfileRecord = await prisma.deliveryWorkerProfile.upsert({
        where: { userId: user.id },
        update: config.deliveryProfile as any,
        create: { userId: user.id, ...config.deliveryProfile } as any,
      });
    }

    // Upsert BuyerProfile
    let buyerProfileRecord = null;
    if (config.buyerProfile) {
      buyerProfileRecord = await prisma.buyerProfile.upsert({
        where: { userId: user.id },
        update: config.buyerProfile,
        create: { userId: user.id, ...config.buyerProfile },
      });
    }

    return { user, farmerProfile: farmerProfileRecord, deliveryProfile: deliveryProfileRecord, buyerProfile: buyerProfileRecord };
  }

  // --- SuperAdmin ---
  const { user: superAdmin } = await upsertUserWithProfile({
    fullName: 'Selamawit Assefa',
    phone: '+251911223344',
    email: 'admin@agrimarket.et',
    role: 'SUPERADMIN',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: adminPasswordHash,
    userProfile: {
      avatarUrl: '/images/avatar_selamawit_hd.jpg',
      bio: 'Chief Agricultural Marketplace Administrator',
    },
  });
  console.log('   ✅ SuperAdmin: Selamawit Assefa (+251911223344)');

  // --- Operational Admin ---
  const { user: opsAdmin } = await upsertUserWithProfile({
    fullName: 'Bereket Tilahun',
    phone: '+251911334455',
    email: 'ops@agrimarket.et',
    role: 'ADMIN',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: adminPasswordHash,
    userProfile: {
      avatarUrl: '/images/avatar_bereket_hd.jpg',
      bio: 'Marketplace Operations & Verification Lead',
    },
  });
  console.log('   ✅ Operations Admin: Bereket Tilahun (+251911334455)');

  // --- Verified Farmers ---
  const centralZoneId = zoneMap.get('Addis Ababa Central & Merkato Zone');

  const { user: abebeUser, farmerProfile: abebeProfile } = await upsertUserWithProfile({
    fullName: 'Abebe Tadesse',
    phone: '+251911445566',
    email: 'abebe.farm@agrimarket.et',
    role: 'FARMER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    userProfile: {
      avatarUrl: '/images/avatar_abebe_hd.jpg',
      bio: 'Third generation organic highland vegetable and cereal farmer',
    },
    farmerProfile: {
      farmName: 'Sheger Fresh Valley Farm',
      farmDescription: 'Premium organic red tomatoes, highland potatoes, and seasonal onions',
      farmLatitude: 9.0200,
      farmLongitude: 38.7500,
      isOrganic: true,
      verificationStatus: 'VERIFIED',
      verificationNote: 'Land certificate and Fayda National ID verified by Ministry of Agriculture depot.',
      marketId: addisMarketId,
      verificationDocuments: {
        identityType: 'National Fayda ID',
        identityNumber: 'FIN-1029384756',
        preferredMarket: 'addis-central-hub',
      },
    },
  });

  const { user: mekonnenUser, farmerProfile: mekonnenProfile } = await upsertUserWithProfile({
    fullName: 'Mekonnen Birhanu',
    phone: '+251911889900',
    email: 'mekonnen.coffee@agrimarket.et',
    role: 'FARMER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    userProfile: {
      avatarUrl: '/images/avatar_mekonnen_hd.jpg',
      bio: 'Jimma Highland Rainforest Certified Specialty Arabica Coffee Grower',
    },
    farmerProfile: {
      farmName: 'Kaffa Forest Specialty Coffee Estate',
      farmDescription: 'Single-origin organic washed and natural shade-grown Arabica coffees',
      farmLatitude: 7.6700,
      farmLongitude: 36.8300,
      isOrganic: true,
      verificationStatus: 'VERIFIED',
      marketId: jimmaMarketId,
    },
  });

  const { user: almazUser, farmerProfile: almazProfile } = await upsertUserWithProfile({
    fullName: 'Almaz Ayana',
    phone: '+251912345678',
    email: 'almaz.sidama@agrimarket.et',
    role: 'FARMER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    userProfile: {
      avatarUrl: '/images/avatar_almaz_hd.jpg',
      bio: 'Sidama Basin fresh fruit orchardist and sweet bell pepper producer',
    },
    farmerProfile: {
      farmName: 'Lake Hawassa Green Oasis',
      farmDescription: 'Irrigated horticultural produce, sweet peppers, papayas, and avocado orchards',
      farmLatitude: 7.0580,
      farmLongitude: 38.4750,
      isOrganic: true,
      verificationStatus: 'VERIFIED',
      marketId: hawassaMarketId,
    },
  });

  // --- Pending Farmer (For verification workflow testing in admin panel) ---
  const { user: dawitUser } = await upsertUserWithProfile({
    fullName: 'Dawit Kebede',
    phone: '+251911778899',
    email: 'dawit.kebede@agrimarket.et',
    role: 'FARMER',
    isVerified: false,
    onboardingStatus: 'PENDING_VERIFICATION',
    passwordHash: userPasswordHash,
    userProfile: {
      bio: 'Highland seed potato and garlic producer in Amhara Lake Tana Basin',
    },
    farmerProfile: {
      farmName: 'Kebede Highland Farms',
      farmDescription: 'Specialty organic seed potatoes and legumes',
      farmLatitude: 11.5900,
      farmLongitude: 37.3800,
      isOrganic: true,
      verificationStatus: 'PENDING',
      verificationNote: 'National ID and Agricultural Cooperative License submitted for administrator review.',
      marketId: bahirDarMarketId,
      verificationDocuments: {
        identityType: 'Kebele ID',
        identityNumber: 'KB-AMH-882190',
        submittedAt: new Date().toISOString(),
      },
    },
  });
  console.log('   ✅ Farmers verified (Abebe, Mekonnen, Almaz) + Pending Farmer (Dawit).');

  // --- Verified Delivery Workers (Couriers) ---
  const { user: haileUser } = await upsertUserWithProfile({
    fullName: 'Haile Gebre',
    phone: '+251911667788',
    email: 'haile.delivery@agrimarket.et',
    role: 'DELIVERY_WORKER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    deliveryProfile: {
      vehicleType: 'MOTORCYCLE',
      vehiclePlate: 'AA-3-54921',
      vehicleCapacityKg: 80,
      availability: 'ONLINE',
      verificationStatus: 'VERIFIED',
      lastLatitude: 9.0150,
      lastLongitude: 38.7600,
      deliveryZoneId: centralZoneId,
      verificationDocuments: {
        driverLicense: 'DL-ET-992100',
        licensePlate: 'AA-3-54921',
        preferredZone: 'zone-addis-central',
      },
    },
  });

  const { user: tarikuUser } = await upsertUserWithProfile({
    fullName: 'Tariku Desta',
    phone: '+251911556677',
    email: 'tariku.transit@agrimarket.et',
    role: 'DELIVERY_WORKER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    deliveryProfile: {
      vehicleType: 'PICKUP_TRUCK',
      vehiclePlate: 'ET-4-88231',
      vehicleCapacityKg: 1500,
      availability: 'ONLINE',
      verificationStatus: 'VERIFIED',
      lastLatitude: 9.0250,
      lastLongitude: 38.7450,
      deliveryZoneId: centralZoneId,
    },
  });

  const { user: martaUser } = await upsertUserWithProfile({
    fullName: 'Marta Worku',
    phone: '+251911998877',
    email: 'marta.courier@agrimarket.et',
    role: 'DELIVERY_WORKER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    deliveryProfile: {
      vehicleType: 'THREE_WHEELER',
      vehiclePlate: 'AA-2-12345',
      vehicleCapacityKg: 250,
      availability: 'ONLINE',
      verificationStatus: 'VERIFIED',
      lastLatitude: 9.0050,
      lastLongitude: 38.7750,
      deliveryZoneId: zoneMap.get('Bole & Beshale Residential Express Zone'),
    },
  });

  // --- Pending Delivery Courier (For admin review dashboard) ---
  const { user: chalaUser } = await upsertUserWithProfile({
    fullName: 'Chala Gutu',
    phone: '+251913456789',
    email: 'chala.gutu@agrimarket.et',
    role: 'DELIVERY_WORKER',
    isVerified: false,
    onboardingStatus: 'PENDING_VERIFICATION',
    passwordHash: userPasswordHash,
    deliveryProfile: {
      vehicleType: 'BICYCLE',
      vehicleCapacityKg: 30,
      availability: 'OFFLINE',
      verificationStatus: 'PENDING',
      lastLatitude: 9.0200,
      lastLongitude: 38.7500,
      deliveryZoneId: centralZoneId,
      verificationDocuments: {
        identityType: 'Kebele ID',
        identityNumber: 'KB-ET-771122',
        submittedAt: new Date().toISOString(),
      },
    },
  });
  console.log('   ✅ Couriers verified (Haile, Tariku, Marta) + Pending Courier (Chala).');

  // --- Verified Buyers ---
  const { user: buyer1 } = await upsertUserWithProfile({
    fullName: 'Kidist Haile',
    phone: '+251922334455',
    email: 'kidist.buyer@gmail.com',
    role: 'BUYER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    buyerProfile: {
      preferredDeliveryAddress: 'Bole Medhanealem, Addis Ababa',
      preferredLatitude: 8.9954,
      preferredLongitude: 38.7892,
    },
  });

  const { user: buyer2 } = await upsertUserWithProfile({
    fullName: 'Solomon Bekele',
    phone: '+251933445566',
    email: 'solomon.bekele@outlook.com',
    role: 'BUYER',
    isVerified: true,
    onboardingStatus: 'COMPLETED',
    passwordHash: userPasswordHash,
    buyerProfile: {
      preferredDeliveryAddress: 'Kazanchis Commercial District, Addis Ababa',
      preferredLatitude: 9.0190,
      preferredLongitude: 38.7680,
    },
  });
  console.log('   ✅ Buyers verified (Kidist Haile, Solomon Bekele).');

  // ============================================================================
  // 8. PRODUCT LISTINGS (Catalog with realistic inventory)
  // ============================================================================
  console.log('\n📦 [7/9] Initializing Product Catalog & Farm Listings...');

  const productsConfig = [
    {
      name: 'Fresh Red Tomatoes',
      farmerId: abebeUser.id,
      farmerProfileId: abebeProfile!.id,
      categoryId: catMap.get('vegetables')!,
      pricePerUnit: 60,
      unit: 'kg',
      stockQuantity: 450,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_tomatoes.jpg'],
      description: 'Vine-ripened organic red tomatoes harvested fresh daily in Bishoftu highland valley.',
    },
    {
      name: 'Highland Potatoes',
      farmerId: abebeUser.id,
      farmerProfileId: abebeProfile!.id,
      categoryId: catMap.get('vegetables')!,
      pricePerUnit: 56,
      unit: 'kg',
      stockQuantity: 800,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_potatoes.jpg'],
      description: 'Clean, firm highland grade-A potatoes ideal for commercial kitchens, chips, and home cooking.',
    },
    {
      name: 'Red Onions',
      farmerId: abebeUser.id,
      farmerProfileId: abebeProfile!.id,
      categoryId: catMap.get('vegetables')!,
      pricePerUnit: 35,
      unit: 'kg',
      stockQuantity: 5, // Low stock triggers reorder alert in admin/farmer dashboard
      qualityGrade: 'B' as const,
      intercityEligible: false,
      images: ['/images/prod_onions.jpg'],
      description: 'Cured red onions from Meki-Ziway basin with intense aromatic flavor and long shelf-life.',
    },
    {
      name: 'Jimma Grade 1 Arabica Coffee',
      farmerId: mekonnenUser.id,
      farmerProfileId: mekonnenProfile!.id,
      categoryId: catMap.get('coffee-spices')!,
      pricePerUnit: 210,
      unit: 'kg',
      stockQuantity: 1200,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_coffee.jpg'],
      description: 'Specialty green unroasted coffee beans with vibrant citrus notes and rich body from Kaffa rainforest.',
    },
    {
      name: 'Organic Sweet Maize',
      farmerId: abebeUser.id,
      farmerProfileId: abebeProfile!.id,
      categoryId: catMap.get('grains-cereals')!,
      pricePerUnit: 40,
      unit: 'kg',
      stockQuantity: 950,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_maize.jpg'],
      description: 'Non-GMO sweet yellow corn freshly shucked and naturally dried for milling or livestock feed.',
    },
    {
      name: 'Fresh Sweet Bell Peppers',
      farmerId: almazUser.id,
      farmerProfileId: almazProfile!.id,
      categoryId: catMap.get('vegetables')!,
      pricePerUnit: 75,
      unit: 'kg',
      stockQuantity: 320,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_peppers.jpg'],
      description: 'Crisp green and red bell peppers irrigated from Lake Hawassa basin.',
    },
  ];

  const productMap = new Map<string, string>();
  for (const p of productsConfig) {
    const existing = await prisma.productListing.findFirst({
      where: { name: p.name, farmerId: p.farmerId },
    });
    if (existing) {
      await prisma.productListing.update({
        where: { id: existing.id },
        data: {
          pricePerUnit: p.pricePerUnit,
          stockQuantity: p.stockQuantity,
          qualityGrade: p.qualityGrade,
          intercityEligible: p.intercityEligible,
          description: p.description,
          status: 'ACTIVE',
        },
      });
      productMap.set(p.name, existing.id);
    } else {
      const created = await prisma.productListing.create({
        data: {
          name: p.name,
          farmerId: p.farmerId,
          farmerProfileId: p.farmerProfileId,
          categoryId: p.categoryId,
          pricePerUnit: p.pricePerUnit,
          unit: p.unit,
          stockQuantity: p.stockQuantity,
          qualityGrade: p.qualityGrade,
          intercityEligible: p.intercityEligible,
          pickupLatitude: 9.0200,
          pickupLongitude: 38.7500,
          description: p.description,
          status: 'ACTIVE',
          images: {
            create: p.images.map((url, idx) => ({
              url,
              isPrimary: idx === 0,
              sortOrder: idx,
            })),
          },
        },
      });
      productMap.set(p.name, created.id);
    }
  }
  console.log(`   ✅ ${productsConfig.length} Product Listings verified.`);

  // ============================================================================
  // 9. PLATFORM PRICING RULES & GOVERNANCE
  // ============================================================================
  console.log('\n📊 [8/9] Initializing Platform Pricing & Logistics Governance Rules...');

  const pricingRulesData = [
    {
      name: 'Platform Standard Commission',
      description: 'Standard 5% platform commission on agricultural gross product sales',
      type: 'COMMISSION_PERCENTAGE' as const,
      scope: 'GLOBAL' as const,
      value: 5.0,
      isActive: true,
    },
    {
      name: 'Local Delivery Base Rate',
      description: 'Base logistics charge for intracity deliveries within local zones',
      type: 'DELIVERY_BASE_FEE' as const,
      scope: 'GLOBAL' as const,
      value: 150.0,
      isActive: true,
    },
    {
      name: 'Intercity Long-Haul Logistics Base Fee',
      description: 'Standard cross-regional transport surcharge for long-distance routes',
      type: 'INTERCITY_FEE' as const,
      scope: 'GLOBAL' as const,
      value: 450.0,
      isActive: true,
    },
  ];

  for (const rule of pricingRulesData) {
    const existing = await prisma.pricingRule.findFirst({ where: { name: rule.name } });
    if (existing) {
      await prisma.pricingRule.update({
        where: { id: existing.id },
        data: { value: rule.value, description: rule.description, isActive: true },
      });
    } else {
      await prisma.pricingRule.create({ data: rule });
    }
  }
  console.log(`   ✅ ${pricingRulesData.length} Pricing Rules verified.`);

  // ============================================================================
  // 10. REALISTIC HISTORICAL ORDERS & ANALYTICS DATA
  // ============================================================================
  console.log('\n📈 [9/9] Verifying Platform Orders & Audit Logging...');

  const bahirDarRouteId = routeMap.get(`${bahirDarMarketId}->${addisMarketId}`);
  const daysAgo = [1, 2, 3, 4, 5, 6, 7];

  for (const d of daysAgo) {
    const pastDate = new Date(Date.now() - d * 24 * 3600 * 1000);
    const localOrderId = `ord-history-local-${d}`;
    const intercityOrderId = `ord-history-intercity-${d}`;

    const existingLocal = await prisma.order.findUnique({ where: { id: localOrderId } });
    if (!existingLocal) {
      await prisma.order.create({
        data: {
          id: localOrderId,
          buyerId: buyer1.id,
          tradeType: 'LOCAL',
          status: 'DELIVERED',
          deliveryAddress: 'Addis Ababa Central Local Zone',
          deliveryLatitude: 9.0200,
          deliveryLongitude: 38.7500,
          productSubtotal: 1200 + d * 150,
          deliveryFee: 150,
          platformCommission: 60,
          totalAmount: 1410 + d * 150,
          paymentMethod: 'CASH_ON_DELIVERY',
          paymentStatus: 'COMPLETED',
          createdAt: pastDate,
          items: {
            create: {
              listingId: productMap.get('Fresh Red Tomatoes')!,
              quantity: 20 + d * 2,
              agreedUnitPrice: 60,
              subtotal: 1200 + d * 150,
              listingSnapshot: { name: 'Fresh Red Tomatoes', pricePerUnit: 60 },
            },
          },
        },
      });
    }

    const existingIntercity = await prisma.order.findUnique({ where: { id: intercityOrderId } });
    if (!existingIntercity) {
      await prisma.order.create({
        data: {
          id: intercityOrderId,
          buyerId: buyer2.id,
          tradeType: 'INTERCITY',
          intercityRouteId: bahirDarRouteId || null,
          status: 'DELIVERED',
          deliveryAddress: 'Bahir Dar -> Addis Ababa Wholesale Terminal',
          deliveryLatitude: 9.0200,
          deliveryLongitude: 38.7500,
          productSubtotal: 2240 + d * 200,
          deliveryFee: 400,
          platformCommission: 112,
          totalAmount: 2752 + d * 200,
          paymentMethod: 'TELEBIRR',
          paymentStatus: 'COMPLETED',
          createdAt: pastDate,
          items: {
            create: {
              listingId: productMap.get('Highland Potatoes')!,
              quantity: 40 + d * 3,
              agreedUnitPrice: 56,
              subtotal: 2240 + d * 200,
              listingSnapshot: { name: 'Highland Potatoes', pricePerUnit: 56 },
            },
          },
        },
      });
    }
  }

  // Create an initial audit log record for platform seeding
  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.id,
      action: 'ADMIN_OVERRIDE',
      entityType: 'PLATFORM_SEED',
      entityId: 'seed-bootstrap',
      newValue: {
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        status: 'BOOTSTRAP_COMPLETE',
      },
    },
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n🎉 =======================================================');
  console.log(`   Seeding Pipeline Completed Successfully in ${durationSec}s!`);
  console.log('   =======================================================');
  console.log('   Default Login Credentials (Change in Production):');
  console.log(`   • SuperAdmin : +251911223344 / admin@agrimarket.et  (Pass: ${ADMIN_PASSWORD})`);
  console.log(`   • Farmer     : +251911445566 / abebe.farm@agrimarket.et (Pass: ${USER_PASSWORD})`);
  console.log(`   • Courier    : +251911667788 / haile.delivery@agrimarket.et (Pass: ${USER_PASSWORD})`);
  console.log(`   • Buyer      : +251922334455 / kidist.buyer@gmail.com (Pass: ${USER_PASSWORD})`);
  console.log('   =======================================================\n');
}

seed()
  .catch((err) => {
    console.error('\n❌ SEEDING FAILED WITH ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
