-- Migration: 20261120_intercity_bulk_logistics
-- Description: Add Inter-City Trade, Bulk Freight, and Transport Provider models

-- 1. Create Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FulfillmentType') THEN
        CREATE TYPE "FulfillmentType" AS ENUM ('LOCAL_DELIVERY', 'INTERCITY_BULK', 'INTERCITY_CONSOLIDATED', 'UNFULFILLABLE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShipmentStatus') THEN
        CREATE TYPE "ShipmentStatus" AS ENUM ('REQUESTED', 'QUOTATION_PENDING', 'AWAITING_APPROVAL', 'SCHEDULED', 'PICKUP_IN_PROGRESS', 'LOADING', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'ARRIVED', 'UNLOADING', 'DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VehicleCategory') THEN
        CREATE TYPE "VehicleCategory" AS ENUM ('LIGHT_PICKUP_1T', 'MEDIUM_TRUCK_ISUZU_5T', 'HEAVY_TRUCK_15T', 'HEAVY_TRUCK_30T', 'REEFER_VAN_COLD_CHAIN', 'REEFER_TRUCK_COLD_CHAIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarrierVerificationStatus') THEN
        CREATE TYPE "CarrierVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CargoHandlingRequirement') THEN
        CREATE TYPE "CargoHandlingRequirement" AS ENUM ('STANDARD_DRY', 'VENTILATED_CRATE', 'COLD_CHAIN_REFRIGERATED', 'FRAGILE_PERISHABLE', 'BULK_GRAIN_SACK');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AllocationStrategy') THEN
        CREATE TYPE "AllocationStrategy" AS ENUM ('WEIGHT_PROPORTIONAL', 'VOLUME_PROPORTIONAL', 'HYBRID');
    END IF;
    -- Alter Role enum to include TRANSPORT_PROVIDER
    BEGIN
        ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TRANSPORT_PROVIDER';
    EXCEPTION
        WHEN others THEN null;
    END;
END $$;

-- 2. Alter Existing Tables
ALTER TABLE "product_listings"
ADD COLUMN IF NOT EXISTS "minBulkOrderQty" DECIMAL(14,3),
ADD COLUMN IF NOT EXISTS "reservedQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "cargoVolumePerUnitM3" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "handlingRequirement" "CargoHandlingRequirement" NOT NULL DEFAULT 'STANDARD_DRY';

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'LOCAL_DELIVERY',
ADD COLUMN IF NOT EXISTS "transportFee" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "loadingFee" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "deliveryOtp" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryOtpExpiresAt" TIMESTAMP(3);

-- 3. Create Transport Provider Profile Table
CREATE TABLE IF NOT EXISTS "transport_provider_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessLicenseNo" TEXT,
    "tinNumber" TEXT,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT,
    "operatingCities" TEXT[],
    "verificationStatus" "CarrierVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationNote" TEXT,
    "verificationDocuments" JSONB,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_provider_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "transport_provider_profiles_userId_key" ON "transport_provider_profiles"("userId");
CREATE INDEX IF NOT EXISTS "transport_provider_profiles_verificationStatus_idx" ON "transport_provider_profiles"("verificationStatus");
CREATE INDEX IF NOT EXISTS "transport_provider_profiles_isActive_idx" ON "transport_provider_profiles"("isActive");

-- 4. Create Transport Vehicles Table
CREATE TABLE IF NOT EXISTS "transport_vehicles" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "payloadCapacityKg" DOUBLE PRECISION NOT NULL,
    "usableCargoVolumeM3" DOUBLE PRECISION NOT NULL,
    "hasRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "makeModel" TEXT,
    "yearOfManufacture" INTEGER,
    "registrationDocUrl" TEXT,
    "inspectionExpiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "verificationStatus" "CarrierVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_vehicles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "transport_vehicles_plateNumber_key" ON "transport_vehicles"("plateNumber");
CREATE INDEX IF NOT EXISTS "transport_vehicles_providerId_idx" ON "transport_vehicles"("providerId");
CREATE INDEX IF NOT EXISTS "transport_vehicles_category_status_idx" ON "transport_vehicles"("category", "status");

-- 5. Create Transport Drivers Table
CREATE TABLE IF NOT EXISTS "transport_drivers" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseCategory" TEXT NOT NULL,
    "licenseDocUrl" TEXT,
    "vehicleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_drivers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "transport_drivers_userId_key" ON "transport_drivers"("userId");
CREATE INDEX IF NOT EXISTS "transport_drivers_providerId_idx" ON "transport_drivers"("providerId");

-- 6. Create Transport Rates Table
CREATE TABLE IF NOT EXISTS "transport_rates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "originCityId" TEXT,
    "destinationCityId" TEXT,
    "minDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDistanceKm" DOUBLE PRECISION,
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "basePickupFee" DECIMAL(14,4) NOT NULL,
    "ratePerKm" DECIMAL(14,4) NOT NULL,
    "ratePerKg" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "ratePerM3" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "additionalPickupFee" DECIMAL(14,4) NOT NULL DEFAULT 100,
    "loadingUnloadingFee" DECIMAL(14,4) NOT NULL DEFAULT 150,
    "coldChainMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_rates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "transport_rates_vehicleCategory_isActive_idx" ON "transport_rates"("vehicleCategory", "isActive");
CREATE INDEX IF NOT EXISTS "transport_rates_originCityId_destinationCityId_idx" ON "transport_rates"("originCityId", "destinationCityId");

-- 7. Create Quotation Snapshots Table
CREATE TABLE IF NOT EXISTS "quotation_snapshots" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rateVersionId" TEXT,
    "originCity" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "baseFee" DECIMAL(14,4) NOT NULL,
    "distanceCharge" DECIMAL(14,4) NOT NULL,
    "weightCharge" DECIMAL(14,4) NOT NULL,
    "volumeCharge" DECIMAL(14,4) NOT NULL,
    "multiStopSurcharge" DECIMAL(14,4) NOT NULL,
    "handlingSurcharge" DECIMAL(14,4) NOT NULL,
    "totalTransportCost" DECIMAL(14,4) NOT NULL,
    "pricingPolicyVersion" TEXT NOT NULL DEFAULT 'V1-FIXED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "quotation_snapshots_orderId_key" ON "quotation_snapshots"("orderId");
CREATE INDEX IF NOT EXISTS "quotation_snapshots_orderId_idx" ON "quotation_snapshots"("orderId");

-- 8. Create Shipments Table
CREATE TABLE IF NOT EXISTS "shipments" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "originCityId" TEXT,
    "destinationCityId" TEXT,
    "originMarketId" TEXT,
    "destinationMarketId" TEXT,
    "requiredCategory" "VehicleCategory" NOT NULL,
    "totalCargoWeightKg" DOUBLE PRECISION NOT NULL,
    "totalCargoVolumeM3" DOUBLE PRECISION NOT NULL,
    "totalTransportCost" DECIMAL(14,4) NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledPickupDate" TIMESTAMP(3),
    "actualPickupDate" TIMESTAMP(3),
    "estimatedArrivalDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "assignedProviderId" TEXT,
    "assignedVehicleId" TEXT,
    "assignedDriverId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "shipments_trackingNumber_key" ON "shipments"("trackingNumber");
CREATE INDEX IF NOT EXISTS "shipments_status_idx" ON "shipments"("status");
CREATE INDEX IF NOT EXISTS "shipments_assignedProviderId_idx" ON "shipments"("assignedProviderId");
CREATE INDEX IF NOT EXISTS "shipments_assignedVehicleId_idx" ON "shipments"("assignedVehicleId");

-- 9. Create Shipment Orders Join Table
CREATE TABLE IF NOT EXISTS "shipment_orders" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "allocatedTransportCost" DECIMAL(14,4) NOT NULL,
    "cargoWeightKg" DOUBLE PRECISION NOT NULL,
    "cargoVolumeM3" DOUBLE PRECISION,
    "deliverySequence" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "shipment_orders_shipmentId_orderId_key" ON "shipment_orders"("shipmentId", "orderId");
CREATE INDEX IF NOT EXISTS "shipment_orders_orderId_idx" ON "shipment_orders"("orderId");

-- 10. Create Shipment Pickups Table
CREATE TABLE IF NOT EXISTS "shipment_pickups" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "pickupLatitude" DOUBLE PRECISION NOT NULL,
    "pickupLongitude" DOUBLE PRECISION NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3),
    "actualArrivalTime" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "collectedQuantityKg" DOUBLE PRECISION NOT NULL,
    "packageCount" INTEGER,
    "cargoCondition" TEXT NOT NULL DEFAULT 'GOOD',
    "photoEvidenceUrl" TEXT,
    "notes" TEXT,
    "farmerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "farmerConfirmedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_pickups_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "shipment_pickups_shipmentId_idx" ON "shipment_pickups"("shipmentId");
CREATE INDEX IF NOT EXISTS "shipment_pickups_farmerId_idx" ON "shipment_pickups"("farmerId");

-- 11. Create Shipment Events Table
CREATE TABLE IF NOT EXISTS "shipment_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "actorId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "shipment_events_shipmentId_idx" ON "shipment_events"("shipmentId");

-- 12. Create Delivery Confirmations Table
CREATE TABLE IF NOT EXISTS "delivery_confirmations" (
    "id" TEXT NOT NULL,
    "shipmentOrderId" TEXT NOT NULL,
    "dispatchedQuantityKg" DOUBLE PRECISION NOT NULL,
    "receivedQuantityKg" DOUBLE PRECISION NOT NULL,
    "shortageQuantityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cargoCondition" TEXT NOT NULL DEFAULT 'SATISFACTORY',
    "verifiedWithOtp" BOOLEAN NOT NULL DEFAULT true,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerNotes" TEXT,
    "hasDispute" BOOLEAN NOT NULL DEFAULT false,
    "photoEvidenceUrl" TEXT,

    CONSTRAINT "delivery_confirmations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_confirmations_shipmentOrderId_key" ON "delivery_confirmations"("shipmentOrderId");

-- 13. Add Foreign Keys safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transport_provider_profiles_userId_fkey') THEN
        ALTER TABLE "transport_provider_profiles" ADD CONSTRAINT "transport_provider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transport_vehicles_providerId_fkey') THEN
        ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "transport_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transport_drivers_providerId_fkey') THEN
        ALTER TABLE "transport_drivers" ADD CONSTRAINT "transport_drivers_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "transport_provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotation_snapshots_orderId_fkey') THEN
        ALTER TABLE "quotation_snapshots" ADD CONSTRAINT "quotation_snapshots_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_assignedProviderId_fkey') THEN
        ALTER TABLE "shipments" ADD CONSTRAINT "shipments_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "transport_provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_assignedVehicleId_fkey') THEN
        ALTER TABLE "shipments" ADD CONSTRAINT "shipments_assignedVehicleId_fkey" FOREIGN KEY ("assignedVehicleId") REFERENCES "transport_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_assignedDriverId_fkey') THEN
        ALTER TABLE "shipments" ADD CONSTRAINT "shipments_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "transport_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_orders_shipmentId_fkey') THEN
        ALTER TABLE "shipment_orders" ADD CONSTRAINT "shipment_orders_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_orders_orderId_fkey') THEN
        ALTER TABLE "shipment_orders" ADD CONSTRAINT "shipment_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_pickups_shipmentId_fkey') THEN
        ALTER TABLE "shipment_pickups" ADD CONSTRAINT "shipment_pickups_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_events_shipmentId_fkey') THEN
        ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_confirmations_shipmentOrderId_fkey') THEN
        ALTER TABLE "delivery_confirmations" ADD CONSTRAINT "delivery_confirmations_shipmentOrderId_fkey" FOREIGN KEY ("shipmentOrderId") REFERENCES "shipment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
