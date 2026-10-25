import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

async function seed() {
  console.log('--- Starting Admin & Marketplace Data Seed ---');

  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const userPasswordHash = await bcrypt.hash('UserPassword123!', 10);

  // 1. Ensure SuperAdmin Selamawit Assefa exists
  const adminPhone = '+251911223344';
  let admin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        fullName: 'Selamawit Assefa',
        phone: adminPhone,
        email: 'admin@agrimarket.et',
        passwordHash,
        role: 'SUPERADMIN',
        isActive: true,
        isVerified: true,
        userProfile: {
          create: {
            avatarUrl: '/images/avatar_selamawit_hd.jpg',
            bio: 'Chief Agricultural Marketplace Administrator',
          },
        },
      },
    });
    console.log('Created SuperAdmin: Selamawit Assefa');
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        fullName: 'Selamawit Assefa',
        email: 'admin@agrimarket.et',
        role: 'SUPERADMIN',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Updated SuperAdmin: Selamawit Assefa');
  }

  // 2. Ensure Ethiopian Cities exist
  const citiesData = [
    { name: 'Addis Ababa', regionName: 'Addis Ababa', latitude: 9.0108, longitude: 38.7613 },
    { name: 'Bahir Dar', regionName: 'Amhara', latitude: 11.5936, longitude: 37.3908 },
    { name: 'Jimma', regionName: 'Oromia', latitude: 7.6734, longitude: 36.8344 },
    { name: 'Hawassa', regionName: 'Sidama', latitude: 7.0621, longitude: 38.4764 },
    { name: 'Adama', regionName: 'Oromia', latitude: 8.5414, longitude: 39.2689 },
    { name: 'Mekelle', regionName: 'Tigray', latitude: 13.4967, longitude: 39.4753 },
  ];

  const cityMap = new Map<string, string>();
  for (const c of citiesData) {
    let city = await prisma.city.findUnique({ where: { name: c.name } });
    if (!city) {
      city = await prisma.city.create({ data: c });
    }
    cityMap.set(c.name, city.id);
  }
  console.log('Cities initialized.');

  // 3. Ensure Local Markets exist
  const marketsData = [
    { name: 'Addis Ababa Merkato Grain Market', cityName: 'Addis Ababa', latitude: 9.0305, longitude: 38.7400, radius: 40 },
    { name: 'Bahir Dar Central Produce Market', cityName: 'Bahir Dar', latitude: 11.5950, longitude: 37.3880, radius: 35 },
    { name: 'Jimma Coffee & Agricultural Depot', cityName: 'Jimma', latitude: 7.6750, longitude: 36.8360, radius: 45 },
    { name: 'Hawassa Lake Basin Produce Hub', cityName: 'Hawassa', latitude: 7.0600, longitude: 38.4800, radius: 30 },
    { name: 'Adama Express Logistics Market', cityName: 'Adama', latitude: 8.5400, longitude: 39.2700, radius: 35 },
  ];

  const marketMap = new Map<string, string>();
  for (const m of marketsData) {
    const cityId = cityMap.get(m.cityName)!;
    let market = await prisma.market.findFirst({ where: { name: m.name, cityId } });
    if (!market) {
      market = await prisma.market.create({
        data: {
          name: m.name,
          cityId,
          latitude: m.latitude,
          longitude: m.longitude,
          serviceRadiusKm: m.radius,
        },
      });
    }
    marketMap.set(m.name, market.id);
  }
  console.log('Markets initialized.');

  // 4. Ensure Intercity Routes exist
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
    let route = await prisma.intercityRoute.findUnique({
      where: {
        originMarketId_destinationMarketId: {
          originMarketId: rc.originMarketId,
          destinationMarketId: rc.destMarketId,
        },
      },
    });
    if (!route) {
      route = await prisma.intercityRoute.create({
        data: {
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
    }
    const key = `${rc.originMarketId}->${rc.destMarketId}`;
    routeMap.set(key, route.id);
  }
  console.log('Intercity routes initialized.');

  // 5. Ensure Categories exist
  const categoriesData = [
    { name: 'Vegetables', slug: 'vegetables', description: 'Fresh farm-grown vegetables' },
    { name: 'Fruits', slug: 'fruits', description: 'Sun-ripened orchard fruits' },
    { name: 'Grains & Cereals', slug: 'grains-cereals', description: 'Highland cereals, teff, maize, barley' },
    { name: 'Coffee & Spices', slug: 'coffee-spices', description: 'Ethiopian specialty coffees and spices' },
    { name: 'Livestock', slug: 'livestock', description: 'Farm animals and livestock products' },
    { name: 'Seeds & Inputs', slug: 'seeds-inputs', description: 'Certified organic and hybrid seeds' },
  ];

  const catMap = new Map<string, string>();
  for (const cat of categoriesData) {
    let category = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!category) {
      category = await prisma.category.create({ data: cat });
    }
    catMap.set(cat.slug, category.id);
  }
  console.log('Categories initialized.');

  // 6. Ensure Farmers exist (including Abebe, Dawit [Pending Approval], Almaz)
  // Abebe Tadesse
  let abebe = await prisma.user.findUnique({ where: { phone: '+251911445566' } });
  if (!abebe) {
    abebe = await prisma.user.create({
      data: {
        fullName: 'Abebe Tadesse',
        phone: '+251911445566',
        email: 'abebe.farm@agrimarket.et',
        passwordHash: userPasswordHash,
        role: 'FARMER',
        isActive: true,
        isVerified: true,
        userProfile: {
          create: {
            avatarUrl: '/images/avatar_abebe_hd.jpg',
            bio: 'Third generation organic vegetable farmer',
          },
        },
        farmerProfile: {
          create: {
            farmName: 'Abebe Tadesse Farm',
            farmDescription: 'High quality organic red tomatoes and vegetables',
            farmLatitude: 9.0200,
            farmLongitude: 38.7500,
            isOrganic: true,
            verificationStatus: 'VERIFIED',
            marketId: addisMarketId,
          },
        },
      },
    });
  }

  // Dawit Kebede (Pending Registration for System Alert)
  let dawit = await prisma.user.findUnique({ where: { phone: '+251911778899' } });
  if (!dawit) {
    dawit = await prisma.user.create({
      data: {
        fullName: 'Dawit Kebede',
        phone: '+251911778899',
        email: 'dawit.kebede@agrimarket.et',
        passwordHash: userPasswordHash,
        role: 'FARMER',
        isActive: true,
        isVerified: false,
        userProfile: {
          create: {
            bio: 'Highland highland potato and garlic producer in Amhara',
          },
        },
        farmerProfile: {
          create: {
            farmName: 'Kebede Highland Farms',
            farmDescription: 'Specialty organic seed potatoes and legumes',
            farmLatitude: 11.5900,
            farmLongitude: 37.3800,
            isOrganic: true,
            verificationStatus: 'PENDING',
            verificationNote: 'National ID and Agricultural Cooperative License submitted for review.',
            marketId: bahirDarMarketId,
          },
        },
      },
    });
  }

  // Jimma Specialty Coffee Farmer
  let mekonnen = await prisma.user.findUnique({ where: { phone: '+251911887766' } });
  if (!mekonnen) {
    mekonnen = await prisma.user.create({
      data: {
        fullName: 'Mekonnen Wolde',
        phone: '+251911887766',
        email: 'mekonnen.coffee@agrimarket.et',
        passwordHash: userPasswordHash,
        role: 'FARMER',
        isActive: true,
        isVerified: true,
        userProfile: {
          create: {
            avatarUrl: '/images/avatar_mekonnen_hd.jpg',
            bio: 'Specialty Jimma Grade 1 Forest Coffee producer',
          },
        },
        farmerProfile: {
          create: {
            farmName: 'Kaffa-Jimma Agro Forest',
            farmDescription: 'Shade-grown organic arabica coffee',
            farmLatitude: 7.6700,
            farmLongitude: 36.8300,
            isOrganic: true,
            verificationStatus: 'VERIFIED',
            marketId: jimmaMarketId,
          },
        },
      },
    });
  }

  const abebeFarmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: abebe.id } });
  const mekonnenFarmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: mekonnen.id } });

  // 7. Ensure Delivery Workers exist
  let worker1 = await prisma.user.findUnique({ where: { phone: '+251911999001' } });
  if (!worker1) {
    worker1 = await prisma.user.create({
      data: {
        fullName: 'Hailemariam Desalegn',
        phone: '+251911999001',
        email: 'haile.delivery@agrimarket.et',
        passwordHash: userPasswordHash,
        role: 'DELIVERY_WORKER',
        isActive: true,
        isVerified: true,
        deliveryProfile: {
          create: {
            vehicleType: 'MOTORCYCLE',
            vehiclePlate: 'AA-3-54921',
            vehicleCapacityKg: 80,
            availability: 'ONLINE',
            verificationStatus: 'VERIFIED',
            lastLatitude: 9.0150,
            lastLongitude: 38.7600,
          },
        },
      },
    });
  }

  let worker2 = await prisma.user.findUnique({ where: { phone: '+251911999002' } });
  if (!worker2) {
    worker2 = await prisma.user.create({
      data: {
        fullName: 'Tariku Jemberu',
        phone: '+251911999002',
        email: 'tariku.transit@agrimarket.et',
        passwordHash: userPasswordHash,
        role: 'DELIVERY_WORKER',
        isActive: true,
        isVerified: true,
        deliveryProfile: {
          create: {
            vehicleType: 'PICKUP_TRUCK',
            vehiclePlate: 'ET-4-88231',
            vehicleCapacityKg: 1500,
            availability: 'ONLINE',
            verificationStatus: 'VERIFIED',
            lastLatitude: 9.0250,
            lastLongitude: 38.7450,
          },
        },
      },
    });
  }

  // 8. Ensure Buyers exist
  let buyer1 = await prisma.user.findUnique({ where: { phone: '+251922334455' } });
  if (!buyer1) {
    buyer1 = await prisma.user.create({
      data: {
        fullName: 'Kidist Haile',
        phone: '+251922334455',
        email: 'kidist.buyer@gmail.com',
        passwordHash: userPasswordHash,
        role: 'BUYER',
        isActive: true,
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

  let buyer2 = await prisma.user.findUnique({ where: { phone: '+251933445566' } });
  if (!buyer2) {
    buyer2 = await prisma.user.create({
      data: {
        fullName: 'Solomon Bekele',
        phone: '+251933445566',
        email: 'solomon.bekele@outlook.com',
        passwordHash: userPasswordHash,
        role: 'BUYER',
        isActive: true,
        isVerified: true,
        buyerProfile: {
          create: {
            preferredDeliveryAddress: 'Kazanchis Commercial District, Addis Ababa',
            preferredLatitude: 9.0190,
            preferredLongitude: 38.7680,
          },
        },
      },
    });
  }

  // 9. Ensure Product Listings exist matching the Top Products from screenshot:
  // - Tomatoes (420 sold)
  // - Potatoes (380 sold)
  // - Onions (310 sold, stock 5 kg to trigger system alert!)
  // - Coffee (220 sold)
  // - Maize (180 sold)

  const productsConfig = [
    {
      name: 'Fresh Red Tomatoes',
      farmerId: abebe.id,
      farmerProfileId: abebeFarmerProfile!.id,
      categoryId: catMap.get('vegetables')!,
      pricePerUnit: 60,
      unit: 'kg',
      stockQuantity: 450,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_tomatoes.jpg'],
      description: 'Vine-ripened organic red tomatoes harvested fresh daily.',
    },
    {
      name: 'Highland Potatoes',
      farmerId: abebe.id,
      farmerProfileId: abebeFarmerProfile!.id,
      categoryId: catMap.get('vegetables')!,
      pricePerUnit: 56,
      unit: 'kg',
      stockQuantity: 800,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_potatoes.jpg'],
      description: 'Clean, firm highland grade-A potatoes ideal for commercial and home cooking.',
    },
    {
      name: 'Red Onions',
      farmerId: abebe.id,
      farmerProfileId: abebeFarmerProfile!.id,
      categoryId: catMap.get('vegetables')!,
      pricePerUnit: 35,
      unit: 'kg',
      stockQuantity: 5, // LOW STOCK to trigger alert!
      qualityGrade: 'B' as const,
      intercityEligible: true,
      images: ['/images/prod_tomatoes.jpg'], // fallback thumbnail
      description: 'Sweet and pungent organic red onions from the Awash valley.',
    },
    {
      name: 'Jimma Grade 1 Arabica Coffee',
      farmerId: mekonnen.id,
      farmerProfileId: mekonnenFarmerProfile!.id,
      categoryId: catMap.get('coffee-spices')!,
      pricePerUnit: 210,
      unit: 'kg',
      stockQuantity: 350,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_coffee.jpg'],
      description: 'Shade-grown specialty coffee beans from Kaffa-Jimma biosphere reserve.',
    },
    {
      name: 'Organic Sweet Maize',
      farmerId: abebe.id,
      farmerProfileId: abebeFarmerProfile!.id,
      categoryId: catMap.get('grains-cereals')!,
      pricePerUnit: 40,
      unit: 'kg',
      stockQuantity: 600,
      qualityGrade: 'A' as const,
      intercityEligible: true,
      images: ['/images/prod_maize.jpg'],
      description: 'High-yield organically cultivated sweet yellow maize.',
    },
  ];

  const productMap = new Map<string, string>();
  for (const p of productsConfig) {
    let prod = await prisma.productListing.findFirst({
      where: { name: p.name, farmerId: p.farmerId },
    });
    if (!prod) {
      prod = await prisma.productListing.create({
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
          images: {
            create: p.images.map((url, idx) => ({
              url,
              isPrimary: idx === 0,
            })),
          },
        },
      });
    } else {
      // Ensure stock quantity is synced (e.g. 5kg for onions)
      await prisma.productListing.update({
        where: { id: prod.id },
        data: { stockQuantity: p.stockQuantity },
      });
    }
    productMap.set(p.name, prod.id);
  }
  console.log('Product listings initialized.');

  // 10. Seed Orders matching Screenshot & admin.md requirements:
  // - Order 1: Tomatoes (10 kg) | Addis Ababa -> Sebeta | ETB 600 | Processing (Oct 10)
  // - Order 2: Potatoes (50 kg) | Bahir Dar -> Addis Ababa | ETB 2,800 | Approved (Oct 10) [Intercity]
  // - Order 3: Coffee (20 kg) | Jimma -> Addis Ababa | ETB 4,200 | Shipped / In Transit (Oct 9) [Intercity]
  // - Order 4: Onions (30 kg) | Adama / Debre Zeit -> Addis Ababa | ETB 1,050 | Delivered (Oct 9)
  // - Order 5: Intercity order requiring admin approval (PENDING_APPROVAL) so alert is active!

  const jimmaRouteId = routeMap.get(`${jimmaMarketId}->${addisMarketId}`);
  const bahirDarRouteId = routeMap.get(`${bahirDarMarketId}->${addisMarketId}`);
  const adamaRouteId = routeMap.get(`${adamaMarketId}->${addisMarketId}`);

  // Order 1: Tomatoes 10kg (ETB 600)
  const o1Id = 'ord-recent-001';
  let o1 = await prisma.order.findUnique({ where: { id: o1Id } });
  if (!o1) {
    o1 = await prisma.order.create({
      data: {
        id: o1Id,
        buyerId: buyer1.id,
        tradeType: 'LOCAL',
        status: 'PREPARING',
        deliveryAddress: 'Addis Ababa -> Sebeta / Bole Outlet',
        deliveryLatitude: 8.9100,
        deliveryLongitude: 38.6200,
        productSubtotal: 600,
        deliveryFee: 100,
        platformCommission: 30,
        totalAmount: 700,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PENDING',
        createdAt: new Date(Date.now() - 3600 * 1000 * 18), // 18 hrs ago
        items: {
          create: {
            listingId: productMap.get('Fresh Red Tomatoes')!,
            quantity: 10,
            agreedUnitPrice: 60,
            subtotal: 600,
            listingSnapshot: {
              name: 'Fresh Red Tomatoes (10 kg)',
              unit: 'kg',
              pricePerUnit: 60,
              route: 'Addis Ababa -> Sebeta',
              image: '/images/prod_tomatoes.jpg',
            },
          },
        },
      },
    });
  }

  // Order 2: Potatoes 50kg (ETB 2,800) [Approved]
  const o2Id = 'ord-recent-002';
  let o2 = await prisma.order.findUnique({ where: { id: o2Id } });
  if (!o2) {
    o2 = await prisma.order.create({
      data: {
        id: o2Id,
        buyerId: buyer2.id,
        tradeType: 'INTERCITY',
        intercityRouteId: bahirDarRouteId || null,
        status: 'APPROVED',
        deliveryAddress: 'Bahir Dar -> Addis Ababa',
        deliveryLatitude: 9.0100,
        deliveryLongitude: 38.7600,
        productSubtotal: 2800,
        deliveryFee: 400,
        platformCommission: 140,
        totalAmount: 3200,
        paymentMethod: 'TELEBIRR',
        paymentStatus: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24), // 1 day ago
        items: {
          create: {
            listingId: productMap.get('Highland Potatoes')!,
            quantity: 50,
            agreedUnitPrice: 56,
            subtotal: 2800,
            listingSnapshot: {
              name: 'Highland Potatoes (50 kg)',
              unit: 'kg',
              pricePerUnit: 56,
              route: 'Bahir Dar -> Addis Ababa',
              image: '/images/prod_potatoes.jpg',
            },
          },
        },
      },
    });
  }

  // Order 3: Coffee 20kg (ETB 4,200) [In Transit / Shipped]
  const o3Id = 'ord-recent-003';
  let o3 = await prisma.order.findUnique({ where: { id: o3Id } });
  if (!o3) {
    o3 = await prisma.order.create({
      data: {
        id: o3Id,
        buyerId: buyer1.id,
        tradeType: 'INTERCITY',
        intercityRouteId: jimmaRouteId || null,
        status: 'IN_TRANSIT',
        deliveryAddress: 'Jimma -> Addis Ababa',
        deliveryLatitude: 9.0150,
        deliveryLongitude: 38.7620,
        productSubtotal: 4200,
        deliveryFee: 450,
        platformCommission: 210,
        totalAmount: 4650,
        paymentMethod: 'CHAPA',
        paymentStatus: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600 * 1000 * 36), // 36 hrs ago
        items: {
          create: {
            listingId: productMap.get('Jimma Grade 1 Arabica Coffee')!,
            quantity: 20,
            agreedUnitPrice: 210,
            subtotal: 4200,
            listingSnapshot: {
              name: 'Jimma Coffee (20 kg)',
              unit: 'kg',
              pricePerUnit: 210,
              route: 'Jimma -> Addis Ababa',
              image: '/images/prod_coffee.jpg',
            },
          },
        },
      },
    });
  }

  // Order 4: Onions 30kg (ETB 1,050) [Delivered]
  const o4Id = 'ord-recent-004';
  let o4 = await prisma.order.findUnique({ where: { id: o4Id } });
  if (!o4) {
    o4 = await prisma.order.create({
      data: {
        id: o4Id,
        buyerId: buyer2.id,
        tradeType: 'LOCAL',
        status: 'DELIVERED',
        deliveryAddress: 'Adama -> Addis Ababa',
        deliveryLatitude: 9.0200,
        deliveryLongitude: 38.7550,
        productSubtotal: 1050,
        deliveryFee: 150,
        platformCommission: 52.5,
        totalAmount: 1200,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600 * 1000 * 48), // 2 days ago
        items: {
          create: {
            listingId: productMap.get('Red Onions')!,
            quantity: 30,
            agreedUnitPrice: 35,
            subtotal: 1050,
            listingSnapshot: {
              name: 'Red Onions (30 kg)',
              unit: 'kg',
              pricePerUnit: 35,
              route: 'Adama -> Addis Ababa',
              image: '/images/prod_tomatoes.jpg',
            },
          },
        },
      },
    });
  }

  // Order 5: Intercity Trade Awaiting Admin Approval (System Alert 2)
  const o5Id = 'ord-pending-approval-005';
  let o5 = await prisma.order.findUnique({ where: { id: o5Id } });
  if (!o5) {
    o5 = await prisma.order.create({
      data: {
        id: o5Id,
        buyerId: buyer2.id,
        tradeType: 'INTERCITY',
        intercityRouteId: jimmaRouteId || null,
        status: 'PENDING_APPROVAL',
        deliveryAddress: 'Jimma Agricultural Center -> Addis Ababa Bole Wholesale Hub',
        deliveryLatitude: 8.9950,
        deliveryLongitude: 38.7900,
        productSubtotal: 10500,
        deliveryFee: 900,
        platformCommission: 525,
        totalAmount: 11400,
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PENDING',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4), // 4 hours ago
        items: {
          create: {
            listingId: productMap.get('Jimma Grade 1 Arabica Coffee')!,
            quantity: 50,
            agreedUnitPrice: 210,
            subtotal: 10500,
            listingSnapshot: {
              name: 'Jimma Grade 1 Arabica Coffee (50 kg)',
              unit: 'kg',
              pricePerUnit: 210,
              route: 'Jimma -> Addis Ababa',
            },
          },
        },
        adminApproval: {
          create: {
            status: 'PENDING',
            requestedAt: new Date(Date.now() - 3600 * 1000 * 4),
          },
        },
      },
    });
    console.log('Created pending intercity order for approval workflow');
  }

  // 11. Create a few daily orders over the last 7 days so the chart has real lines
  const daysAgo = [1, 2, 3, 4, 5, 6, 7];
  for (const d of daysAgo) {
    const localDate = new Date(Date.now() - d * 24 * 3600 * 1000);
    const existing = await prisma.order.findFirst({
      where: {
        id: `ord-history-local-${d}`,
      },
    });
    if (!existing) {
      await prisma.order.create({
        data: {
          id: `ord-history-local-${d}`,
          buyerId: buyer1.id,
          tradeType: 'LOCAL',
          status: 'DELIVERED',
          deliveryAddress: 'Addis Ababa Local Zone',
          deliveryLatitude: 9.0200,
          deliveryLongitude: 38.7500,
          productSubtotal: 1200 + d * 150,
          deliveryFee: 150,
          platformCommission: 60,
          totalAmount: 1410 + d * 150,
          paymentMethod: 'CASH_ON_DELIVERY',
          paymentStatus: 'COMPLETED',
          createdAt: localDate,
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

      await prisma.order.create({
        data: {
          id: `ord-history-intercity-${d}`,
          buyerId: buyer2.id,
          tradeType: 'INTERCITY',
          intercityRouteId: bahirDarRouteId || null,
          status: 'DELIVERED',
          deliveryAddress: 'Bahir Dar -> Addis Ababa',
          deliveryLatitude: 9.0200,
          deliveryLongitude: 38.7500,
          productSubtotal: 2240 + d * 200,
          deliveryFee: 400,
          platformCommission: 112,
          totalAmount: 2752 + d * 200,
          paymentMethod: 'TELEBIRR',
          paymentStatus: 'COMPLETED',
          createdAt: localDate,
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

  // 12. Create Pricing Rules if none exist
  const existingRules = await prisma.pricingRule.count();
  if (existingRules === 0) {
    await prisma.pricingRule.createMany({
      data: [
        {
          name: 'Platform Standard Commission',
          description: 'Standard 5% commission on agricultural gross product sales',
          type: 'COMMISSION_PERCENTAGE',
          scope: 'GLOBAL',
          value: 5.0,
          isActive: true,
        },
        {
          name: 'Local Delivery Base Rate',
          description: 'Base logistics charge for intracity deliveries within 30km',
          type: 'DELIVERY_BASE_FEE',
          scope: 'GLOBAL',
          value: 150.0,
          isActive: true,
        },
        {
          name: 'Intercity Long-Haul Logistics Base Fee',
          description: 'Standard cross-regional transport surcharge',
          type: 'INTERCITY_FEE',
          scope: 'GLOBAL',
          value: 450.0,
          isActive: true,
        },
      ],
    });
    console.log('Default platform pricing rules initialized.');
  }

  console.log('--- Admin & Marketplace Data Seed Completed Successfully ---');
}

seed()
  .catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
