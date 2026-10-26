import { AuditAction, VerificationStatus, ListingStatus, OrderStatus } from '@prisma/client';
export interface DateFilterOptions {
    period?: 'today' | '7d' | '30d' | 'month' | 'all' | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}
export declare class AdminService {
    /**
     * Helper to write an immutable audit log entry
     */
    static logAction(data: {
        actorId?: string | undefined;
        action: AuditAction;
        entityType: string;
        entityId: string;
        previousValue?: any;
        newValue?: any;
        reason?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
    }): Promise<void>;
    /**
     * Main Admin Dashboard Overview Metrics
     */
    static getDashboardOverview(filter?: DateFilterOptions): Promise<{
        metrics: {
            totalFarmers: number;
            totalFarmersTrend: string;
            verifiedFarmers: number;
            pendingFarmers: number;
            totalBuyers: number;
            totalBuyersTrend: string;
            totalOrders: number;
            totalOrdersTrend: string;
            totalRevenue: number;
            totalRevenueFormatted: string;
            totalRevenueTrend: string;
            platformCommission: number;
        };
        chartData: {
            day: string | undefined;
            date: string | undefined;
            local: number;
            intercity: number;
        }[];
        topProducts: {
            id: string;
            name: string;
            soldCount: number;
            image: string;
        }[];
        recentOrders: {
            id: string;
            title: any;
            route: any;
            priceFormatted: string;
            status: string;
            rawStatus: import("@prisma/client").$Enums.OrderStatus;
            date: string;
            tradeType: import("@prisma/client").$Enums.TradeType;
            image: any;
        }[];
        systemAlerts: {
            id: string;
            type: string;
            message: string;
            time: string;
            link: string;
        }[];
    }>;
    /**
     * Product Management
     */
    static getProducts(query: {
        categoryId?: string;
        status?: ListingStatus;
        search?: string;
        stock?: string;
    }): Promise<{
        id: string;
        name: string;
        category: string;
        farmerName: string;
        farmerPhone: string;
        pricePerUnit: number;
        unit: string;
        stockQuantity: number;
        status: import("@prisma/client").$Enums.ListingStatus;
        qualityGrade: import("@prisma/client").$Enums.QualityGrade;
        intercityEligible: boolean;
        images: string[];
        createdAt: Date;
    }[]>;
    static updateProductStatus(productId: string, status: ListingStatus, reason: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import("@prisma/client").$Enums.ListingStatus;
        farmerId: string;
        farmerProfileId: string;
        categoryId: string;
        description: string | null;
        qualityGrade: import("@prisma/client").$Enums.QualityGrade;
        pricePerUnit: import("@prisma/client-runtime-utils").Decimal;
        unit: string;
        stockQuantity: import("@prisma/client-runtime-utils").Decimal;
        minOrderQty: import("@prisma/client-runtime-utils").Decimal;
        maxOrderQty: import("@prisma/client-runtime-utils").Decimal | null;
        harvestDate: Date | null;
        productionDate: Date | null;
        expiryDate: Date | null;
        pickupLatitude: number;
        pickupLongitude: number;
        intercityEligible: boolean;
    }>;
    /**
     * Farmers Management
     */
    static getFarmers(query: {
        status?: VerificationStatus;
        search?: string;
    }): Promise<{
        id: string;
        userId: string;
        farmerName: string;
        phone: string;
        email: string | null;
        farmName: string;
        description: string | null;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
        verificationNote: string | null;
        isOrganic: boolean;
        marketName: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        listingsCount: number;
        createdAt: Date;
    }[]>;
    static verifyFarmer(farmerProfileId: string, status: VerificationStatus, note: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
        farmName: string;
        farmDescription: string | null;
        farmSizeHectares: number | null;
        isOrganic: boolean;
        certifications: string[];
        verificationNote: string | null;
        farmLatitude: number;
        farmLongitude: number;
        marketId: string | null;
    }>;
    /**
     * Buyers Management
     */
    static getBuyers(query: {
        search?: string;
    }): Promise<{
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
        isActive: boolean;
        address: string;
        orderCount: number;
        totalSpendFormatted: string;
        createdAt: Date;
    }[]>;
    static updateBuyerStatus(userId: string, isActive: boolean, reason: string, adminId: string): Promise<{
        fullName: string;
        email: string | null;
        id: string;
        phone: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Delivery Workers Management
     */
    static getWorkers(query: {
        status?: VerificationStatus;
        availability?: string;
        search?: string;
    }): Promise<{
        id: string;
        userId: string;
        fullName: string;
        phone: string;
        email: string | null;
        vehicleType: import("@prisma/client").$Enums.VehicleType;
        vehiclePlate: string;
        vehicleCapacityKg: number | null;
        availability: import("@prisma/client").$Enums.WorkerAvailability;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
        activeJobCount: number;
        lastLocation: {
            latitude: number;
            longitude: number;
        } | null;
        createdAt: Date;
    }[]>;
    static verifyWorker(workerProfileId: string, status: VerificationStatus, reason: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        vehicleType: import("@prisma/client").$Enums.VehicleType;
        vehiclePlate: string | null;
        vehicleCapacityKg: number | null;
        availability: import("@prisma/client").$Enums.WorkerAvailability;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
        lastLatitude: number | null;
        lastLongitude: number | null;
        lastAccuracy: number | null;
        lastLocationAt: Date | null;
        locationConsentGranted: boolean;
        locationConsentAt: Date | null;
        activeJobCount: number;
        deliveryZoneId: string | null;
    }>;
    /**
     * Orders Management
     */
    static getOrders(query: {
        tradeType?: string;
        status?: OrderStatus;
        search?: string;
    }): Promise<{
        id: string;
        buyerName: string;
        buyerPhone: string;
        tradeType: import("@prisma/client").$Enums.TradeType;
        status: import("@prisma/client").$Enums.OrderStatus;
        deliveryAddress: string;
        itemCount: number;
        itemSummary: string;
        totalAmount: number;
        productSubtotal: number;
        deliveryFee: number;
        platformCommission: number;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        assignedWorker: string | null;
        deliveryStatus: import("@prisma/client").$Enums.DeliveryStatus;
        createdAt: Date;
    }[]>;
    static getOrderById(orderId: string): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            idempotencyKey: string | null;
            status: import("@prisma/client").$Enums.PaymentStatus;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            orderId: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            gatewayReference: string | null;
            gatewayResponse: import("@prisma/client/runtime/client").JsonValue | null;
            paidAt: Date | null;
            refundedAt: Date | null;
            refundAmount: import("@prisma/client-runtime-utils").Decimal | null;
            refundReason: string | null;
        } | null;
        deliveryJob: ({
            worker: {
                fullName: string;
                id: string;
                phone: string;
            } | null;
            events: {
                id: string;
                status: import("@prisma/client").$Enums.DeliveryStatus;
                notes: string | null;
                jobId: string;
                occurredAt: Date;
                imageUrl: string | null;
                latitude: number | null;
                longitude: number | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.DeliveryStatus;
            orderId: string;
            pickupLatitude: number;
            pickupLongitude: number;
            assignedWorker: string | null;
            pickupAddress: string | null;
            dropoffAddress: string | null;
            dropoffLatitude: number;
            dropoffLongitude: number;
            requiredVehicleType: import("@prisma/client").$Enums.VehicleType | null;
            requiredCapacityKg: number | null;
            broadcastRadiusKm: number;
            offerExpirySeconds: number;
            acceptedAt: Date | null;
            pickedUpAt: Date | null;
            deliveredAt: Date | null;
            failedAt: Date | null;
            proofOfDeliveryUrl: string | null;
            cashCollected: import("@prisma/client-runtime-utils").Decimal | null;
        }) | null;
        adminApproval: ({
            admin: {
                fullName: string;
            } | null;
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            orderId: string;
            requestedAt: Date;
            adminId: string | null;
            decisionAt: Date | null;
            decisionNotes: string | null;
        }) | null;
        buyer: {
            fullName: string;
            email: string | null;
            id: string;
            phone: string;
        };
        items: {
            id: string;
            createdAt: Date;
            orderId: string;
            listingId: string;
            listingSnapshot: import("@prisma/client/runtime/client").JsonValue;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            agreedUnitPrice: import("@prisma/client-runtime-utils").Decimal;
            subtotal: import("@prisma/client-runtime-utils").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        buyerId: string;
        tradeType: import("@prisma/client").$Enums.TradeType;
        status: import("@prisma/client").$Enums.OrderStatus;
        deliveryAddress: string;
        deliveryLatitude: number;
        deliveryLongitude: number;
        intercityRouteId: string | null;
        productSubtotal: import("@prisma/client-runtime-utils").Decimal;
        deliveryFee: import("@prisma/client-runtime-utils").Decimal;
        platformCommission: import("@prisma/client-runtime-utils").Decimal;
        taxAmount: import("@prisma/client-runtime-utils").Decimal;
        discountAmount: import("@prisma/client-runtime-utils").Decimal;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        buyerNotes: string | null;
        cancellationReason: string | null;
        confirmedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    static updateOrderStatus(orderId: string, status: OrderStatus, reason: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        buyerId: string;
        tradeType: import("@prisma/client").$Enums.TradeType;
        status: import("@prisma/client").$Enums.OrderStatus;
        deliveryAddress: string;
        deliveryLatitude: number;
        deliveryLongitude: number;
        intercityRouteId: string | null;
        productSubtotal: import("@prisma/client-runtime-utils").Decimal;
        deliveryFee: import("@prisma/client-runtime-utils").Decimal;
        platformCommission: import("@prisma/client-runtime-utils").Decimal;
        taxAmount: import("@prisma/client-runtime-utils").Decimal;
        discountAmount: import("@prisma/client-runtime-utils").Decimal;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        buyerNotes: string | null;
        cancellationReason: string | null;
        confirmedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    /**
     * Intercity Trade & Approvals
     */
    static getIntercityRoutes(): Promise<{
        id: string;
        origin: string;
        destination: string;
        status: import("@prisma/client").$Enums.RouteStatus;
        requiresApproval: boolean;
        minTransactionLimit: number;
        maxTransactionLimit: number | null;
        estimatedTransitDays: number | null;
        createdAt: Date;
    }[]>;
    static getIntercityApprovals(): Promise<{
        id: string;
        orderId: string;
        buyerName: string;
        productSummary: string;
        originCity: string;
        destinationCity: string;
        totalAmountFormatted: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        requestedAt: Date;
        decisionAt: Date | null;
        decisionNotes: string | null;
        reviewedBy: string | null;
    }[]>;
    static decideIntercityApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', notes: string, adminId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ApprovalStatus;
        orderId: string;
        requestedAt: Date;
        adminId: string | null;
        decisionAt: Date | null;
        decisionNotes: string | null;
    }>;
    /**
     * Markets & Geographic Regions
     */
    static getMarketsAndCities(): Promise<{
        cities: {
            id: string;
            name: string;
            regionName: string | null;
            coordinates: {
                latitude: number;
                longitude: number;
            };
            marketsCount: number;
            isActive: boolean;
        }[];
        markets: {
            id: string;
            name: string;
            cityName: string;
            serviceRadiusKm: number;
            coordinates: {
                latitude: number;
                longitude: number;
            };
            isActive: boolean;
        }[];
    }>;
    /**
     * Transactions, Financial Ledger & Reconciliation
     */
    static getTransactions(): Promise<{
        transactions: {
            id: string;
            orderId: string;
            buyerName: string;
            amount: number;
            amountFormatted: string;
            commission: number;
            deliveryFee: number;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            date: Date;
        }[];
        reconciliations: {
            id: string;
            workerName: string;
            workerPhone: string;
            amountFormatted: string;
            status: import("@prisma/client").$Enums.ReconciliationStatus;
            submittedAt: Date | null;
            notes: string | null;
        }[];
    }>;
    /**
     * Reports & Analytics
     */
    static getReports(period?: '7d' | '30d' | 'month' | 'all'): Promise<{
        period: "7d" | "month" | "30d" | "all";
        summary: {
            totalOrders: number;
            grossVolume: number;
            grossVolumeFormatted: string;
            platformCommission: number;
            platformCommissionFormatted: string;
            deliveryFees: number;
            localOrders: number;
            intercityOrders: number;
            registeredBuyers: number;
        };
        farmerStatusCounts: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.FarmerProfileGroupByOutputType, "verificationStatus"[]> & {
            _count: number;
        })[];
        paymentMethodBreakdown: any;
    }>;
    /**
     * Platform Settings & Pricing Rules
     */
    static getSettings(): Promise<{
        pricingRules: {
            id: string;
            name: string;
            description: string | null;
            type: import("@prisma/client").$Enums.PricingRuleType;
            scope: import("@prisma/client").$Enums.PricingRuleScope;
            value: number;
            isActive: boolean;
        }[];
        platform: {
            name: string;
            tagline: string;
            currency: string;
            supportedLanguages: string[];
            supportContact: string;
        };
    }>;
    static updatePricingRule(ruleId: string, value: number, isActive: boolean, adminId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        intercityRouteId: string | null;
        categoryId: string | null;
        description: string | null;
        marketId: string | null;
        type: import("@prisma/client").$Enums.PricingRuleType;
        scope: import("@prisma/client").$Enums.PricingRuleScope;
        value: import("@prisma/client-runtime-utils").Decimal;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    }>;
    /**
     * Audit Logs
     */
    static getAuditLogs(query: {
        limit?: number;
        entityType?: string;
    }): Promise<{
        id: string;
        actorName: string;
        actorRole: string;
        action: import("@prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string;
        reason: string | null;
        occurredAt: Date;
        previousValue: import("@prisma/client/runtime/client").JsonValue;
        newValue: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
}
//# sourceMappingURL=admin.service.d.ts.map