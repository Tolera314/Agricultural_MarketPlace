# AgriMarket: Inter-City Trade & Bulk Logistics Management Implementation Plan
**Document Identifier:** AGRI-PLAN-INTERCITY-LOGISTICS-2026-V1.0  
**Status:** Approved Architectural Blueprint  
**Target Release:** V1 — Fixed-Price Transportation (with V2 Competitive Tender Extension Points)  

---

## 1. Existing Architecture & Baseline Audit

AgriMarket operates as a direct farmer-to-consumer digital marketplace in Ethiopia built on:
- **Frontend:** Next.js 15+ App Router, React 19, Tailwind CSS, Lucide icons, mobile-first responsive architecture.
- **Backend:** Node.js, Express 5.2.1, TypeScript 5.9, Prisma 7.8, PostgreSQL (hosted on Neon with PostGIS support).
- **Security & Auth:** Access JWT + HTTP-only refresh token rotation, Role-Based Access Control (`FARMER`, `BUYER`, `DELIVERY_WORKER`, `ADMIN`, `SUPERADMIN`), input sanitization, and cryptographic webhook verification.
- **Payment Gateway:** Chapa API for digital bank/card/wallet processing, with cash-on-delivery and Telebirr/CBE Birr support.
- **Geography:** Regional cities, municipal markets, and inter-city trade routes (`IntercityRoute`, `City`, `Market`, `DeliveryZone`).
- **Logistics Baseline:** Intra-city delivery worker fleet with dispatch broadcast engine, multi-stop corridor batching, and offline PWA queues.

---

## 2. Reused vs Modified Modules

### Existing Modules Reused
- `backend/src/config/prisma.ts`: Central database client.
- `backend/src/middleware/requireAuth.ts`: Authentication and role-based route guard.
- `backend/src/services/payment.service.ts`: Chapa initialization, webhook signature verification, and idempotency tracking.
- `backend/src/services/notification.service.ts`: Multi-channel notification pipeline (In-app, SMS, Email).
- `frontend/src/context/AuthContext.tsx`: Client authentication session and user state.
- `frontend/src/components/layout/AdminSidebar.tsx`: Administrative navigation system.

### Existing Modules Modified
- `backend/prisma/schema.prisma`: Add logistics domain models (`Shipment`, `TransportProvider`, `TransportVehicle`, `TransportRate`, etc.).
- `backend/src/services/buyer.service.ts`: Integrate inter-city fulfillment classification and fixed-price quotation snapshot freezing.
- `backend/src/services/farmer.service.ts` / `farmer.controller.ts`: Add inter-city product eligibility, reserved inventory visibility, and pickup handover verification.
- `backend/src/controllers/admin.controller.ts` & `admin.routes.ts`: Add logistics management endpoints.
- `frontend/src/components/farmer/MyProductsContent.tsx`: Add inter-city bulk eligibility controls, minimum bulk quantity, and cargo handling requirements.
- `frontend/src/components/cart/CartDrawer.tsx`: Add fulfillment classification indicators, inter-city transport quotation breakdowns, and transparent cost itemization.
- `frontend/src/app/dashboard/admin/intercity/page.tsx`: Upgrade into comprehensive Inter-City Logistics Control Center.

---

## 3. Database Changes & New Models

### 3.1 New Enums
```prisma
enum FulfillmentType {
  LOCAL_DELIVERY
  INTERCITY_BULK
  INTERCITY_CONSOLIDATED
  UNFULFILLABLE
}

enum ShipmentStatus {
  REQUESTED
  QUOTATION_PENDING
  AWAITING_APPROVAL
  SCHEDULED
  PICKUP_IN_PROGRESS
  LOADING
  READY_FOR_DISPATCH
  IN_TRANSIT
  ARRIVED
  UNLOADING
  DELIVERED
  PARTIALLY_DELIVERED
  FAILED
  CANCELLED
}

enum VehicleCategory {
  LIGHT_PICKUP_1T
  MEDIUM_TRUCK_ISUZU_5T
  HEAVY_TRUCK_15T
  HEAVY_TRUCK_30T
  REEFER_VAN_COLD_CHAIN
  REEFER_TRUCK_COLD_CHAIN
}

enum CarrierVerificationStatus {
  PENDING
  VERIFIED
  REJECTED
  SUSPENDED
}

enum CargoHandlingRequirement {
  STANDARD_DRY
  VENTILATED_CRATE
  COLD_CHAIN_REFRIGERATED
  FRAGILE_PERISHABLE
  BULK_GRAIN_SACK
}
```

### 3.2 New Entities
1. `TransportProviderProfile`: Transporter corporate identity, business registration, fleet managers, verification status, and ratings.
2. `TransportVehicle`: Commercial vehicle registration plate, category, legal payload (kg), cargo volume (m³), refrigeration features, documents, and live status.
3. `TransportDriver`: Driver license category, contact, and assigned vehicle.
4. `TransportRate`: Admin-configured fixed-price rate matrices (origin, destination, distance bands, payload rates, volume rates, stop surcharges).
5. `TransportRateVersion`: Immutable historical snapshot of rates active at specific timestamps.
6. `Shipment`: Physical freight transit record uniting one or more customer orders with an assigned truck and driver.
7. `ShipmentOrder`: Maps an `Order` to a `Shipment`, preserving individual order weight, allocated transport fee, and delivery sequence.
8. `ShipmentPickup`: Gate collection event at each individual farmer's location, verifying actual scale weight, produce quality, and loading photos.
9. `ShipmentEvent`: Immutable audit log of every transportation milestone.
10. `DeliveryConfirmation`: Final buyer offloading receipt verifying delivered quantity vs dispatched quantity, 6-digit delivery OTP, and shortage logging.
11. `QuotationSnapshot`: Immutable record of calculated transport charges locked upon order confirmation.

---

## 4. New Backend Modules & APIs

### 4.1 Backend Services
- `backend/src/services/logistics/fulfillment.service.ts`: Central classification engine (Local vs Inter-City Bulk vs Consolidated).
- `backend/src/services/logistics/pricing.service.ts`: V1 Fixed-price quotation engine with V2 Strategy pattern interface.
- `backend/src/services/logistics/provider.service.ts`: Transporter registration, vehicle onboarding, and verification.
- `backend/src/services/logistics/shipment.service.ts`: Shipment lifecycle state machine, pickup logging, dispatch, and delivery OTP verification.
- `backend/src/services/logistics/consolidation.service.ts`: Multi-order corridor grouping and weight-proportional cost allocation.

### 4.2 API Routes (`/api/logistics/*`)
- `POST /api/logistics/fulfillment/evaluate`: Evaluates origin, destination, weight, volume, and returns fulfillment eligibility.
- `POST /api/logistics/quotations/calculate`: Generates a fixed-price transport quotation with itemized breakdown and expiration token.
- `GET /api/logistics/providers/profile`: Transporter profile and verification status.
- `POST /api/logistics/providers/register`: Onboard commercial transport provider.
- `GET /api/logistics/providers/vehicles`: Transporter fleet list.
- `POST /api/logistics/providers/vehicles`: Register commercial vehicle.
- `GET /api/logistics/providers/available-shipments`: Available fixed-price shipment assignments.
- `POST /api/logistics/providers/shipments/:id/accept`: Transporter accepts shipment assignment.
- `POST /api/logistics/shipments/:id/pickups/:pickupId/confirm`: Log farmer gate handover.
- `POST /api/logistics/shipments/:id/milestone`: Update transit status (`IN_TRANSIT`, `ARRIVED`, etc.).
- `POST /api/logistics/shipments/:id/deliver`: Buyer verifies delivery with 6-digit OTP and records received weight.
- `GET /api/logistics/admin/overview`: Logistics KPIs, volume, active fleet.
- `GET /api/logistics/admin/shipments`: Filterable shipment ledger.
- `POST /api/logistics/admin/consolidate`: Combine compatible orders into a consolidated shipment.
- `GET /api/logistics/admin/rates`: View active and historical transport rate rules.
- `POST /api/logistics/admin/rates`: Create or update transport rate rules.

---

## 5. Business Rules & Logic

1. **Farmer Price Sovereignty:** Farmers set and retain 100% control over their product price per unit. The platform never overrides or silently alters product prices.
2. **Transparent Cost Itemization:** Buyers must see product cost, transportation fee, loading/unloading fees, and platform commission separately before order confirmation.
3. **Fixed-Price V1 Commitment:** V1 relies solely on admin-configured fixed-price rate rules. No competitive bidding is exposed to users in V1.
4. **Immutable Price Snapshots:** Once an order is confirmed, its transportation fee cannot change, even if an admin updates rate rules later.
5. **Vehicle Capacity Integrity:** A vehicle cannot be assigned to a shipment if total cargo weight exceeds `payloadCapacityKg` or cargo volume exceeds `usableCargoVolumeM3`.
6. **Strict Precedence in Multi-Stop Shipments:** All farmer pickups must be completed and loaded before the truck commences delivery to destination buyer drop-offs.
7. **Delivery Verification by Buyer Only:** Drivers cannot verify delivery on behalf of buyers. Buyers must submit their 6-digit OTP and confirm physical scale weight.
8. **Shortage & Dispute Isolation:** If received weight < dispatched weight, the system records the discrepancy, issues a `PARTIALLY_DELIVERED` status, and creates an automated dispute record for administrative resolution.

---

## 6. Security & Concurrency Requirements

1. **Atomic Inventory Reservation:** Product listings maintain `reservedQuantity`. Stock is reserved inside database transactions so available inventory ($stock - reserved$) cannot drop below zero.
2. **Resource Authorization:** Strict ownership checks ensure users can never query, accept, or update shipments, pickups, or orders belonging to another entity.
3. **Idempotent Payment Processing:** Chapa callbacks check for previously settled transaction references to prevent duplicate payments or payouts.
4. **OTP Security:** Delivery confirmation OTPs are 6-digit cryptographically random strings with 15-minute expirations and a 5-attempt brute-force threshold.

---

## 7. Implementation Sequence

1. **Phase 1:** Codebase audit & architecture documentation (*Complete*).
2. **Phase 2:** Prisma schema models, migration generation, and TypeScript domain types.
3. **Phase 3:** Fulfillment classification engine & fixed-price transport calculation service.
4. **Phase 4:** Concurrency-safe inventory reservation and checkout integration.
5. **Phase 5:** Transport provider and vehicle management services and APIs.
6. **Phase 6:** Shipment creation, multi-stop assignment, and status transition state machine.
7. **Phase 7:** Farmer and buyer frontend workflows (bulk ordering, transparent quotation breakdown, pickup handover, delivery OTP).
8. **Phase 8:** Transport provider frontend portal (vehicle management, available assignments, milestone updater).
9. **Phase 9:** Admin logistics management dashboard (10 operational modules).
10. **Phase 10:** Shipment consolidation engine and weight-based cost allocation.
11. **Phase 11:** Chapa payment ledger, financial breakdown, and notification dispatcher.
12. **Phase 12:** Automated unit, integration, and security test suites.
13. **Phase 13:** End-to-end regression testing, production build verification, and final delivery report.

---

## 8. Testing Strategy

1. **Unit Tests:**
   - Geodetic distance calculations & route threshold evaluation.
   - Fixed-price transport quotation math (distance bands, weight tiers, cold chain multiplier).
   - Weight-proportional cost allocation with exact penny rounding.
   - Vehicle payload and cargo volume capacity validation.
   - Shipment state machine transition guards.
2. **Integration Tests:**
   - End-to-end inter-city bulk order placement with Chapa payment initialization.
   - Multi-stop farmer gate collection handover.
   - Full delivery verification via 6-digit OTP.
   - Partial delivery shortage handling and dispute initiation.
   - Consolidated shipment creation and cost breakdown.
3. **Security Tests:**
   - Cross-user resource access denial (IDOR).
   - Replay attack defense on payment webhooks.
   - Concurrent purchasing stock preservation.

---

## 9. Implementation & Verification Status (100% Complete)

| Phase | Description | Status | Verification Evidence |
|---|---|---|---|
| **Phase 1** | Codebase Audit & Architectural Plan | Completed | `docs/INTERCITY_BULK_LOGISTICS_PLAN.md` blueprint |
| **Phase 2** | Database Schema & Prisma Client | Completed | Idempotent SQL migration + Prisma Client generation |
| **Phase 3** | Fulfillment Classification & Fixed-Price Engine | Completed | Haversine + road factor, HMAC quotation signing |
| **Phase 4** | Atomic Concurrency & Checkout Integration | Completed | Concurrency-safe inventory reservations in `buyer.service.ts` |
| **Phase 5** | Carrier & Fleet Management Engine | Completed | `provider.service.ts` with vehicle and driver validation |
| **Phase 6** | Shipment State Machine & Gate Lifecycle | Completed | Strict state machine transitions in `shipment.service.ts` |
| **Phase 7** | Farmer Handover & Buyer Verification UI | Completed | `deliveries/page.tsx`, `buyer/page.tsx` with OTP & scale check |
| **Phase 8** | Transport Provider Fleet Portal | Completed | `frontend/src/app/dashboard/transport/page.tsx` |
| **Phase 9** | Admin Logistics Control Center | Completed | `frontend/src/app/dashboard/admin/intercity/page.tsx` |
| **Phase 10** | Corridor Consolidation & Cost Allocation | Completed | Exact penny rounding reconciliation in `consolidation.service.ts` |
| **Phase 11** | Chapa Escrow & Notification Dispatcher | Completed | `payment.service.ts` async shipment creation trigger |
| **Phase 12** | Automated Testing Suite | Completed | `npm run test:logistics` passed 34/34 tests (0 failures) |
| **Phase 13** | Production Build & Full-Stack Verification | Completed | Zero TypeScript compilation errors in backend & frontend |

