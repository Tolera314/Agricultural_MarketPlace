-- AlterTable: Add accuracy and consent tracking to delivery_worker_profiles
ALTER TABLE "delivery_worker_profiles"
ADD COLUMN IF NOT EXISTS "lastAccuracy" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "locationConsentGranted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "locationConsentAt" TIMESTAMP(3);

-- CreateTable: user_location_records for consent-based geolocation audit & tracking
CREATE TABLE IF NOT EXISTS "user_location_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "consentGranted" BOOLEAN NOT NULL DEFAULT true,
    "consentPurpose" TEXT NOT NULL DEFAULT 'DELIVERY_DISPATCH',
    "consentVersion" TEXT NOT NULL DEFAULT '1.0',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_location_records_pkey" PRIMARY KEY ("id")
);

-- Foreign Key
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_location_records_userId_fkey'
    ) THEN
        ALTER TABLE "user_location_records"
        ADD CONSTRAINT "user_location_records_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "user_location_records_userId_capturedAt_idx" ON "user_location_records"("userId", "capturedAt");
CREATE INDEX IF NOT EXISTS "user_location_records_latitude_longitude_idx" ON "user_location_records"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "user_location_records_isRevoked_idx" ON "user_location_records"("isRevoked");
