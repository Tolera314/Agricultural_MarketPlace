import prisma from '../../config/prisma.js';
import { BusinessRuleError, NotFoundError } from '../../utils/errors.js';
import type { VehicleCategory, CarrierVerificationStatus } from './types.js';

export const providerService = {
  /**
   * Retrieve the transport provider profile for the authenticated user.
   */
  async getProfileByUserId(userId: string) {
    const profile = await prisma.transportProviderProfile.findUnique({
      where: { userId },
      include: {
        vehicles: true,
        drivers: true,
        user: { select: { fullName: true, phone: true, email: true, isVerified: true } },
      },
    });
    return profile;
  },

  /**
   * Register a new commercial transport provider profile.
   */
  async registerProvider(
    userId: string,
    data: {
      companyName: string;
      businessLicenseNo?: string;
      tinNumber?: string;
      contactPhone: string;
      contactEmail?: string;
      operatingCities: string[];
      verificationDocuments?: any;
    }
  ) {
    // Check if user already has a provider profile
    const existing = await prisma.transportProviderProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new BusinessRuleError('Transport provider profile already exists for this account.', 'PROVIDER_EXISTS', 'userId', 400);
    }

    return await prisma.$transaction(async (tx) => {
      // Elevate or update user role to TRANSPORT_PROVIDER if standard role
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
        await tx.user.update({
          where: { id: userId },
          data: { role: 'TRANSPORT_PROVIDER' },
        });
      }

      const created = await tx.transportProviderProfile.create({
        data: {
          userId,
          companyName: data.companyName,
          businessLicenseNo: data.businessLicenseNo || null,
          tinNumber: data.tinNumber || null,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail || null,
          operatingCities: data.operatingCities || ['Addis Ababa'],
          verificationDocuments: data.verificationDocuments || null,
          verificationStatus: 'PENDING',
        },
      });

      return created;
    });
  },

  /**
   * Retrieve all vehicles owned by a provider.
   */
  async getVehicles(providerId: string) {
    return prisma.transportVehicle.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      include: {
        drivers: true,
        assignments: {
          where: { status: { in: ['SCHEDULED', 'PICKUP_IN_PROGRESS', 'LOADING', 'IN_TRANSIT'] } },
        },
      },
    });
  },

  /**
   * Register a new commercial truck/vehicle.
   */
  async addVehicle(
    providerId: string,
    data: {
      plateNumber: string;
      category: VehicleCategory;
      payloadCapacityKg: number;
      usableCargoVolumeM3: number;
      hasRefrigeration?: boolean;
      makeModel?: string;
      yearOfManufacture?: number;
      registrationDocUrl?: string;
      inspectionExpiryDate?: string;
    }
  ) {
    // Validate unique plate number
    const existing = await prisma.transportVehicle.findUnique({ where: { plateNumber: data.plateNumber.trim() } });
    if (existing) {
      throw new BusinessRuleError(`Vehicle with license plate "${data.plateNumber}" is already registered.`, 'DUPLICATE_PLATE', 'plateNumber', 400);
    }

    if (data.payloadCapacityKg <= 0 || data.usableCargoVolumeM3 <= 0) {
      throw new BusinessRuleError('Payload capacity and cargo volume must be greater than zero.', 'INVALID_CAPACITY', 'payloadCapacityKg', 400);
    }

    return prisma.transportVehicle.create({
      data: {
        providerId,
        plateNumber: data.plateNumber.trim().toUpperCase(),
        category: data.category,
        payloadCapacityKg: data.payloadCapacityKg,
        usableCargoVolumeM3: data.usableCargoVolumeM3,
        hasRefrigeration: Boolean(data.hasRefrigeration),
        makeModel: data.makeModel || null,
        yearOfManufacture: data.yearOfManufacture || null,
        registrationDocUrl: data.registrationDocUrl || null,
        inspectionExpiryDate: data.inspectionExpiryDate ? new Date(data.inspectionExpiryDate) : null,
        verificationStatus: 'PENDING', // Requires admin inspection
        status: 'AVAILABLE',
      },
    });
  },

  /**
   * Update vehicle operational status or details.
   */
  async updateVehicle(
    vehicleId: string,
    providerId: string,
    updates: {
      status?: string;
      currentLatitude?: number;
      currentLongitude?: number;
    }
  ) {
    const vehicle = await prisma.transportVehicle.findFirst({
      where: { id: vehicleId, providerId },
    });
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found or does not belong to provider.', 'VEHICLE_NOT_FOUND', 'vehicleId');
    }

    return prisma.transportVehicle.update({
      where: { id: vehicleId },
      data: updates,
    });
  },

  /**
   * Register a commercial truck driver.
   */
  async addDriver(
    providerId: string,
    data: {
      fullName: string;
      phone: string;
      licenseNumber: string;
      licenseCategory: string;
      licenseDocUrl?: string;
      vehicleId?: string;
      userId?: string;
    }
  ) {
    return prisma.transportDriver.create({
      data: {
        providerId,
        fullName: data.fullName,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseDocUrl: data.licenseDocUrl || null,
        vehicleId: data.vehicleId || null,
        userId: data.userId || null,
      },
    });
  },

  /**
   * Admin: Verify or suspend a transport provider.
   */
  async adminVerifyProvider(
    providerId: string,
    status: CarrierVerificationStatus,
    note?: string
  ) {
    return prisma.transportProviderProfile.update({
      where: { id: providerId },
      data: {
        verificationStatus: status,
        verificationNote: note || null,
      },
    });
  },

  /**
   * Admin: Verify commercial truck safety and capacity documents.
   */
  async adminVerifyVehicle(
    vehicleId: string,
    status: CarrierVerificationStatus
  ) {
    return prisma.transportVehicle.update({
      where: { id: vehicleId },
      data: { verificationStatus: status },
    });
  },
};
