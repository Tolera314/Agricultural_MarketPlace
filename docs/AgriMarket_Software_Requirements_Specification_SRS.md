# AgriMarket Direct: Software Requirements Specification (SRS)
**Document Identifier:** AGRI-SRS-2026-V1.0  
**Standard Reference:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018  
**System Name:** AgriMarket Direct Platform  
**Target Release:** Production Release 1.0  
**Date:** November 2026  

---

## 1. Introduction and Scope
### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the complete functional and non-functional requirements for the AgriMarket Direct platform, an Ethiopian agricultural e-commerce and localized fulfillment ecosystem.

### 1.2 System Overview & High-Level Objectives
AgriMarket Direct is a multi-actor platform connecting smallholder Ethiopian farmers directly with urban and institutional buyers, minimizing intermediary markups, improving market access, and providing localized dispatch.
- **SRS §1.1:** Direct Producer-to-Consumer Connectivity: Enable farmers to publish listings and retain fair market pricing.
- **SRS §1.2:** High Availability & Low Operating Cost: Guarantee sub-second response times and 99.5% uptime within low-cost hosting constraints (`render.yaml`).

---

## 2. User Roles and Security Requirements
### 2.1 Role-Based Access Control (RBAC)
- **SRS §2.1:** User Credential Security & Session Management: The system shall enforce stateful-stateless session management using HttpOnly JWT cookies and cryptographic refresh token rotation.
- **SRS §2.2:** Multi-Actor Permissions: Support four discrete roles: `BUYER`, `FARMER`, `DELIVERY_WORKER`, and `ADMIN`.

---

## 3. Platform Accessibility & Client Operations
- **SRS §3.1:** Mobile First Architecture: Full responsiveness across Android, iOS, and desktop viewports.
- **SRS §3.2:** Offline Accessibility & Resilience: Progressive Web Application (PWA) with service-worker caching for catalog navigation during intermittent rural cellular network drops.

---

## 4. Farmer Onboarding & KYC Ingestion
- **SRS §4.1:** Two-Phase Verification State Machine: Farmers register in a `PENDING` state and require administrative document review before publishing active listings.
- **SRS §4.2:** Proof of Identity Ingestion: Ingestion of National ID / Kebele Identification.
- **SRS §4.3:** Farm Geospatial Registration: Recording of farm location coordinates, regional administrative woreda/zone, and crop category certifications.

---

## 5. Delivery Worker Onboarding & Logistics Verification
- **SRS §5.1:** Worker KYC Ingestion: Mandatory driver's license, vehicle registration, and background verification.
- **SRS §5.2:** Discrete Vehicle Class Assignment: Categorization into motorcycle, three-wheel (Bajaj), pickup truck, or refrigerated van.

---

## 6. Product Discovery, Location Privacy & Order Management
- **SRS §6.1:** Relational Catalog Consistency: Direct ACID transactional persistence of all inventory quantities, preventing race conditions or phantom stock sales.
- **SRS §6.2:** Differential Geolocation Privacy: Public product discovery endpoints (`GET /api/buyer/products`) shall sanitize raw coordinates, exposing regional woreda centroids and server-computed Haversine distances. Raw GPS coordinates shall be unmasked solely to assigned delivery workers during active transit.
- **SRS §6.3:** Media Offloading: Decentralized image ingestion utilizing client-side Canvas pre-compression (75–85% payload reduction) and CDN streaming via Cloudinary.
- **SRS §6.4:** Multi-Farmer Cart Partitioning: When a buyer checks out a basket containing goods from multiple farmers, the platform shall atomically partition the cart into independent child sub-orders mapped 1-to-1 to discrete localized `DeliveryJob` instances.

---

## 7. In-Platform Communication & Dispute Resolution
- **SRS §7.1:** Audited Direct Messaging: In-platform contextual messaging between buyers, farmers, and drivers with administrative dispute access, preventing platform disintermediation.

---

## 8. Financial Transactions & Payment Processing
- **SRS §8.1:** Payment Gateway Integration: Seamless payment processing supporting Chapa (Telebirr, CBE Birr) with cryptographic HMAC-SHA256 webhook verification.
- **SRS §8.2:** Deterministic Sandbox Emulation: Offline internal sandbox driver for continuous integration test automation when live banking secrets are absent.

---

## 9. Administrative Governance & Quality Assurance
- **SRS §9.1:** Centralized Operations Oversight: Administrative dashboards for dispute resolution, onboarding verification, and audit logs.
- **SRS §9.2:** Metric Tracking: Real-time tracking of GMV, delivery completion velocity, and merchant dispute rates.

---

## 10. Non-Functional Software Quality Requirements (ISO/IEC 25010)
- **SRS §10.1:** Reliability: Zero order loss during network disconnections; fault-tolerant database fallback.
- **SRS §10.2:** Maintainability: Strict modular architecture with end-to-end traceability across requirements, ADRs, code, and tests.
