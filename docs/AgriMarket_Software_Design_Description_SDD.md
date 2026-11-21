# AgriMarket Direct: Software Design Description (SDD)
**Document Identifier:** AGRI-SDD-2026-V1.0  
**Standard Reference:** IEEE Std 1016-2009 / ISO/IEC/IEEE 42010:2011  
**System Name:** AgriMarket Direct Platform  
**Target Release:** Production Release 1.0  
**Date:** November 2026  

---

## 1. Introduction & Architectural Representation
### 1.1 Purpose
This Software Design Description (SDD) specifies the multi-tier system architecture, subsystem decomposition, persistence schemas, security models, and design invariants for AgriMarket Direct.

### 1.2 Architectural Paradigm
The system is constructed as a **Modular Monolith** with discrete domain boundaries, layered horizontal tiers, and strong type contracts in TypeScript across frontend and backend.

---

## 2. System Decomposition & Layered Architecture
### 2.1 Horizontal Tiers (Figure 1)
1. **Presentation Tier (Client):** Next.js 15+ App Router, React Server/Client Components, TailwindCSS, Progressive Web App (PWA) Service Worker (`frontend/public/sw.js`).
2. **API Gateway & Middleware Tier:** Express.js 4.21, CORS security headers, HttpOnly Cookie parser, JWT verification guards (`backend/src/middleware/auth.ts`), rate limiters.
3. **Application & Domain Services Tier:** Encapsulated domain business modules:
   - `auth.service.ts`: Session state and token rotation.
   - `buyer.service.ts`: Catalog browsing and cart checkout partitioning.
   - `farmer.service.ts`: Crop inventory and listing management.
   - `dispatch.service.ts`: Delivery job generation and driver allocation.
   - `payment.service.ts`: Gateway abstraction (Chapa & Sandbox driver).
   - `message.service.ts`: Audited in-platform communication.
4. **Data Persistence & Integration Tier:** PostgreSQL 15, Prisma ORM 5.22, Cloudinary CDN integration, external Chapa payment API.

---

## 3. Subsystem Design & Architectural Invariants
### 3.1 SDD §3.1: Order Grouping & Cart Partitioning Invariant
- A buyer's checkout cart may aggregate items across $N$ distinct farmers.
- The checkout controller executes an atomic Prisma transaction that decomposes the unified cart into $N$ discrete child `Order` records, each associated with a singular `farmerId`.
- Each child order automatically initiates an independent `DeliveryJob` with a unique origin coordinate (the farmer's verified pickup hub), solving the localized physical routing constraint.

### 3.2 SDD §3.2: Differential Geolocation Privacy Model
- Farm coordinates are split into public representations (`woreda`, `zone`, fuzzy regional centroid) and protected exact latitude/longitude.
- Public endpoints sanitize coordinates, computing Haversine distance server-side:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- Exact coordinates are only unmasked for an authenticated delivery driver once a delivery job transitions to `ACCEPTED` or `IN_TRANSIT`.

### 3.3 SDD §3.3: Relational Persistence with Resilient Read Fallback
- Primary persistence: PostgreSQL managed through Prisma schema migrations (`backend/prisma/schema.prisma`).
- Direct ACID transactional persistence replaces uncoordinated in-memory stores, eliminating cross-module data drift.

### 3.4 SDD §3.4: Dual-Mode Authentication & Token Rotation State Machine
- Access token: 15-minute lifespan, stateless JWT transmitted via secure HttpOnly cookie.
- Refresh token: 7-day lifespan, persisted in database `RefreshToken` table with reuse detection. If an already-rotated token is presented, the entire token family is revoked immediately.

### 3.5 SDD §3.5: Pluggable Payment Driver Architecture
- Payment service uses an internal driver interface (`IPaymentDriver`).
- Production driver communicates with Chapa REST endpoints with HMAC webhook validation.
- Test driver operates deterministic local sandbox emulation, enabling continuous integration pipelines to execute 100% of payment test suites without live API credentials.

---

## 4. Architectural Decision Records (ADRs) Index
Detailed architectural decision rationale, evaluated alternatives, ISO/IEC 25010 trade-offs, and compliance evidence are formally maintained in the version-controlled ADR catalog under `docs/adr/`:
- **ADR-001:** Modular Monolithic Architecture Pattern with Layered Domain Boundaries
- **ADR-002:** Dual-Mode Stateful-Stateless Authentication with HttpOnly JWT Cookies & Token Rotation
- **ADR-003:** Relational Persistence Layer via Prisma PostgreSQL with High-Availability Fallback
- **ADR-004:** Multi-Farmer Cart Partitioning into Discrete Sub-Orders for 1-to-1 Delivery Fulfillment
- **ADR-005:** Consent-Based Differential Geolocation Privacy with Haversine Distance Metric
- **ADR-006:** Decentralized Media Pipeline with Client Canvas Pre-Compression & Cloudinary Offloading
- **ADR-007:** Resilient Payment Gateway Abstraction Supporting Chapa and Offline Sandbox Mock
- **ADR-008:** Multi-Role Authorization Architecture with Two-Phase Administrative Verification Gating
- **ADR-009:** Controlled In-Platform Direct Communication with Content Moderation & Dispute Audit
- **ADR-010:** Progressive Web Application (PWA) Client Architecture with Cache-First Service Worker
