# AgriMarket: Requirements Traceability Matrix (RTM)

**Document Version:** 1.0.0  
**Status:** Authoritative Traceability Baseline  
**Source Document:** `user_flow.md`  

---

## Traceability Table

| Requirement ID | Source Section | Specific Verifiable Requirement | Planned Module | Implementation Location | Test Case ID | Status |
|---|---|---|---|---|---|---|
| **GUEST-001** | § 4.1 | Visitors can browse product catalog without registration | Marketplace Catalog | `frontend/src/app/products/page.tsx` | TC-GUEST-01 | PASS |
| **GUEST-002** | § 4.1 | Visitors can search keywords and filter by categories | Catalog Search | `frontend/src/app/products/page.tsx` | TC-GUEST-02 | PASS |
| **GUEST-003** | § 4.1 | Visitors can view public farmer profile cards and prices | Farmer Directory | `frontend/src/app/farmers/page.tsx` | TC-GUEST-03 | PASS |
| **GUEST-004** | § 4.1 | Public endpoints do not expose private farm coordinates | API Sanitization | `backend/src/controllers/buyer.controller.ts` | TC-GUEST-04 | PASS |
| **GUEST-005** | § 4.1 | Attempting to purchase or message as guest prompts Auth Modal | Auth Guarding | `components/auth/AuthRequiredModal.tsx` | TC-GUEST-05 | PASS |
| **AUTH-001** | § 4.2 | User can register with Name, Phone, optional Email, Password | Auth Module | `backend/src/controllers/auth.controller.ts` | TC-AUTH-01 | PASS |
| **AUTH-002** | § 4.2 | Passwords must be hashed using strong one-way cryptography | Crypto Service | `backend/src/services/auth.service.ts` | TC-AUTH-02 | PASS |
| **AUTH-003** | § 4.2 | 6-digit OTP code dispatched via Geez SMS / Brevo Email on signup | OTP Engine | `backend/src/services/auth.service.ts` | TC-AUTH-03 | PASS |
| **AUTH-004** | § 4.2 | Account remains unverified (`isVerified: false`) until OTP matched | State Machine | `backend/src/controllers/auth.controller.ts` | TC-AUTH-04 | PASS |
| **AUTH-005** | § 4.2 | User can request new OTP with 30s rate-limited cooldown | Rate Limiter | `backend/src/routes/auth.routes.ts` | TC-AUTH-05 | PASS |
| **AUTH-006** | § 4.2 | User authentication issues JWT access token and refresh cookie | Session Manager | `backend/src/controllers/auth.controller.ts` | TC-AUTH-06 | PASS |
| **AUTH-007** | § 4.2 | Refresh token family reuse detection invalidates compromised tokens | Security Service | `backend/src/services/auth.service.ts` | TC-AUTH-07 | PASS |
| **AUTH-008** | § 4.2 | Password recovery generates time-limited reset OTP code | Recovery Service | `backend/src/controllers/auth.controller.ts` | TC-AUTH-08 | PASS |
| **AUTH-009** | § 4.2 | Google OAuth login and account linking supported | Identity Link | `backend/src/controllers/auth.controller.ts` | TC-AUTH-09 | PASS |
| **AUTH-010** | § 4.2 | User can upload avatar streamed directly to Cloudinary | Cloud Storage | `backend/src/services/cloudinary.service.ts` | TC-AUTH-10 | PASS |
| **ONBOARD-001**| § 4.3 | New user redirected to role selection (`BUYER`, `FARMER`, `WORKER`)| Onboarding | `app/onboarding/select-role/page.tsx` | TC-ONB-01 | PASS |
| **ONBOARD-002**| § 4.3 | Buyer role selection immediately activates buyer profile | Buyer Init | `backend/src/controllers/onboarding.controller.ts` | TC-ONB-02 | PASS |
| **ONBOARD-003**| § 4.3 | Farmer onboarding captures personal, farm, crops & ID documents | Farmer Onboarding | `components/onboarding/FarmerOnboardingForm.tsx` | TC-ONB-03 | PASS |
| **ONBOARD-004**| § 4.3 | Farmer ID and land certificate stream directly to Cloudinary | Cloud Storage | `backend/src/controllers/onboarding.controller.ts` | TC-ONB-04 | PASS |
| **ONBOARD-005**| § 4.3 | Farmer application submitted with `verificationStatus: PENDING` | State Machine | `backend/src/controllers/onboarding.controller.ts` | TC-ONB-05 | PASS |
| **ONBOARD-006**| § 4.3 | Delivery worker onboarding captures vehicle specs & driver license | Worker Onboarding | `components/onboarding/WorkerOnboardingForm.tsx` | TC-ONB-06 | PASS |
| **ONBOARD-007**| § 4.3 | Pending applicants directed to dashboards with celebration banner | Route Guard | `frontend/src/components/auth/RouteGuard.tsx` | TC-ONB-07 | PASS |
| **ONBOARD-008**| § 4.3 | Unverified farmers/workers gated from restricted selling/deliveries | Access Gate | `farmer.controller.ts` & `worker.controller.ts` | TC-ONB-08 | PASS |
| **FARMER-001** | § 5.1 | Administrator can review farmer dossier and approve account | Admin Portal | `backend/src/controllers/admin.controller.ts` | TC-FARM-01 | PASS |
| **FARMER-002** | § 5.1 | Approval activates account (`ACTIVE`) and notifies farmer via SMS | Notification Svc | `backend/src/services/admin.service.ts` | TC-FARM-02 | PASS |
| **FARMER-003** | § 5.2 | Farmer can view and update public farm profile details | Profile Manager | `app/dashboard/farmer/profile/page.tsx` | TC-FARM-03 | PASS |
| **FARMER-004** | § 5.3 | Farmer can create product listing with photo, price, unit & stock | Listing Engine | `backend/src/controllers/farmer.controller.ts` | TC-FARM-04 | PARTIAL |
| **FARMER-005** | § 5.3 | Farmer price per unit in ETB is strictly respected and immutable | Pricing Policy | `backend/src/controllers/farmer.controller.ts` | TC-FARM-05 | PASS |
| **FARMER-006** | § 5.3 | Product photo uploads stream directly to Cloudinary | Cloud Storage | `backend/src/middleware/upload.ts` | TC-FARM-06 | PASS |
| **FARMER-007** | § 5.3 | Unverified farmers are blocked from publishing active listings | Enforcement Gate| `backend/src/controllers/farmer.controller.ts` | TC-FARM-07 | PASS |
| **FARMER-008** | § 5.4 | Farmer can update stock quantity, toggle status or delete listing | Inventory Control| `backend/src/controllers/farmer.controller.ts` | TC-FARM-08 | PARTIAL |
| **FARMER-009** | § 5.4 | Stock decrement occurs inside database transaction on valid order | Concurrency Lock | `backend/src/services/buyer.service.ts` | TC-FARM-09 | PARTIAL |
| **FARMER-010** | § 5.4 | Negative stock and overselling are strictly prevented | Data Integrity | `backend/src/services/buyer.service.ts` | TC-FARM-10 | PARTIAL |
| **FARMER-011** | § 5.5 | Farmer can view incoming orders containing their products | Order Management | `app/dashboard/farmer/orders/page.tsx` | TC-FARM-11 | PARTIAL |
| **FARMER-012** | § 5.5 | Farmer can mark orders as preparing and ready for courier pickup | State Machine | `backend/src/controllers/farmer.controller.ts` | TC-FARM-12 | PARTIAL |
| **BUYER-001**  | § 6.1 | Buyer dashboard displays real overview metrics from backend API | Buyer Dashboard | `app/dashboard/buyer/page.tsx` | TC-BUY-01 | PASS |
| **BUYER-002**  | § 6.2 | Products and farmers are ranked nearest-first by Haversine formula| Proximity Engine | `backend/src/services/buyer.service.ts` | TC-BUY-02 | PASS |
| **BUYER-003**  | § 6.2 | Exact farm GPS coordinates are withheld; only formatted km shown | Privacy Control | `backend/src/services/buyer.service.ts` | TC-BUY-03 | PASS |
| **BUYER-004**  | § 6.3 | Buyer can select product quantity and add to cart | Cart Management | `frontend/src/context/CartContext.tsx` | TC-BUY-04 | PASS |
| **BUYER-005**  | § 6.3 | Server verifies stock and recalculates total price on checkout | Server Pricing | `backend/src/services/buyer.service.ts` | TC-BUY-05 | PASS |
| **BUYER-006**  | § 6.3 | Client-supplied prices and totals are completely ignored | Security Check | `backend/src/services/buyer.service.ts` | TC-BUY-06 | PASS |
| **BUYER-007**  | § 6.3 | Order creation persists immutable order item snapshots | Order Engine | `backend/src/services/buyer.service.ts` | TC-BUY-07 | PARTIAL |
| **BUYER-008**  | § 6.4 | Multi-farmer cart or single-seller checkout policy enforced | Cart Policy | `backend/src/services/buyer.service.ts` | TC-BUY-08 | PASS |
| **BUYER-009**  | § 6.5 | Buyer can track order through live preparation and delivery steps | Order Tracking | `app/dashboard/buyer/page.tsx` | TC-BUY-09 | PASS |
| **BUYER-010**  | § 6.5 | Buyer can manage multiple delivery addresses with default flag | Address Manager | `backend/src/controllers/buyer.controller.ts` | TC-BUY-10 | PASS |
| **BUYER-011**  | § 6.5 | Buyer can save favorite farmers and bookmark products | Favorites | `backend/src/controllers/buyer.controller.ts` | TC-BUY-11 | PASS |
| **BUYER-012**  | § 6.5 | Buyer can initiate direct 1-on-1 chat with farmer | Chat Messaging | `components/chat/BuyerChatView.tsx` | TC-BUY-12 | PASS |
| **DELIVERY-001**| § 7.1 | Verified delivery worker can toggle availability (`ONLINE`/`OFFLINE`)| Fleet Hub | `backend/src/controllers/worker.controller.ts` | TC-DEL-01 | PASS |
| **DELIVERY-002**| § 7.1 | Worker can share high-accuracy hardware GPS coordinates | Location Service | `backend/src/controllers/location.controller.ts`| TC-DEL-02 | PASS |
| **DELIVERY-003**| § 7.1 | Dispatch engine broadcasts offers to nearby online workers | Dispatch Engine | `backend/src/services/dispatch.service.ts` | TC-DEL-03 | PASS |
| **DELIVERY-004**| § 7.1 | Worker can atomically accept delivery offer inside transaction | Atomic Acceptance| `backend/src/controllers/worker.controller.ts` | TC-DEL-04 | PASS |
| **DELIVERY-005**| § 7.1 | Competing delivery offers automatically withdrawn upon acceptance | State Machine | `backend/src/services/dispatch.service.ts` | TC-DEL-05 | PASS |
| **DELIVERY-006**| § 7.1 | Worker advances job: `ASSIGNED` $\rightarrow$ `PICKUP` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `DELIVERED` | State Machine | `components/worker/ActiveDeliverySection.tsx` | TC-DEL-06 | PASS |
| **DELIVERY-007**| § 7.1 | Worker uploads delivery proof photo streamed to Cloudinary | Cloud POD | `components/worker/ProofOfDeliveryModal.tsx` | TC-DEL-07 | PASS |
| **DELIVERY-008**| § 7.1 | Worker confirms delivery with buyer 6-digit verification OTP | POD Validation | `components/worker/ProofOfDeliveryModal.tsx` | TC-DEL-08 | PASS |
| **DELIVERY-009**| § 7.1 | Worker collects cash on COD orders and records collected amount | Cash Management | `components/worker/ProofOfDeliveryModal.tsx` | TC-DEL-09 | PASS |
| **DELIVERY-010**| § 7.1 | Worker submits daily COD cash reconciliation record | Reconciliation | `components/worker/CodReconciliationModal.tsx` | TC-DEL-10 | PASS |
| **DELIVERY-011**| § 7.1 | Worker can report roadside delay or dispute incidents | Incident Report | `components/worker/ReportIncidentModal.tsx` | TC-DEL-11 | PASS |
| **DELIVERY-012**| § 7.1 | Worker can view earnings ledger and delivery performance history | Earnings Hub | `backend/src/controllers/worker.controller.ts` | TC-DEL-12 | PASS |
| **INTERCITY-001**| § 7.2 | System detects cross-city order and evaluates route eligibility | Logistics Engine| `backend/src/services/admin.service.ts` | TC-INT-01 | PASS |
| **INTERCITY-002**| § 7.2 | Minimum bulk quantity thresholds evaluated before order placement | Rule Validator | `backend/src/services/superadmin.service.ts` | TC-INT-02 | PASS |
| **INTERCITY-003**| § 7.2 | Cross-city orders create `AdminApproval` record (`PENDING_APPROVAL`)| Approval Queue | `backend/src/services/admin.service.ts` | TC-INT-03 | PASS |
| **INTERCITY-004**| § 7.2 | Administrator can approve or reject intercity bulk trade orders | Admin Action | `backend/src/controllers/admin.controller.ts` | TC-INT-04 | PASS |
| **INTERCITY-005**| § 7.2 | Superadmin can configure intercity trade routes and transit days | Route Manager | `backend/src/controllers/superadmin.controller.ts`| TC-INT-05 | PASS |
| **PAY-001**    | § 8.1 | Order total calculated server-side including platform fee & delivery| Payment Engine | `backend/src/services/buyer.service.ts` | TC-PAY-01 | PASS |
| **PAY-002**    | § 8.1 | Payment method selection supported (Telebirr, CBEBirr, Chapa, COD)| Checkout UI | `app/dashboard/buyer/page.tsx` | TC-PAY-02 | PASS |
| **PAY-003**    | § 8.1 | Payment records enforce unique idempotency key preventing duplicates| Data Integrity | `prisma/schema.prisma` | TC-PAY-03 | PASS |
| **PAY-004**    | § 8.1 | Client redirects not trusted as proof; server verifies transaction | Security Check | `backend/src/services/buyer.service.ts` | TC-PAY-04 | PASS |
| **PAY-005**    | § 8.2 | Failed payment leaves order in correct state and allows safe retry | Failure Recovery| `backend/src/services/buyer.service.ts` | TC-PAY-05 | PASS |
| **PAY-006**    | § 8.2 | Order cancellation triggers stock restoration in transaction | Stock Rollback | `backend/src/services/buyer.service.ts` | TC-PAY-06 | PARTIAL |
| **PAY-007**    | § 8.3 | Platform commissions and delivery charges recorded accurately | Financial Ledger| `backend/src/services/admin.service.ts` | TC-PAY-07 | PASS |
| **PAY-008**    | § 8.3 | COD reconciliation status reviewed and approved by administrators | Cash Audit | `backend/src/controllers/admin.controller.ts` | TC-PAY-08 | PASS |
| **INPUT-001**  | § 9.1 | Agricultural input company can submit registration & trade docs | Input Company | `app/onboarding/select-role/page.tsx` | TC-INP-01 | PARTIAL |
| **INPUT-002**  | § 9.1 | Administrator reviews and verifies input company applications | Admin Portal | `backend/src/controllers/superadmin.controller.ts`| TC-INP-02 | PARTIAL |
| **INPUT-003**  | § 9.2 | Input company can list approved seeds, fertilizers & crop medicines| Input Catalog | `backend/src/controllers/farmer.controller.ts` | TC-INP-03 | PARTIAL |
| **INPUT-004**  | § 9.2 | Inputs listings include technical usage guidelines and safety info | Product Detail | `backend/src/controllers/buyer.controller.ts` | TC-INP-04 | PARTIAL |
| **INPUT-005**  | § 9.3 | Farmers can discover and purchase inputs directly from dashboard | Farmer Buying | `app/dashboard/farmer/page.tsx` | TC-INP-05 | PARTIAL |
| **INPUT-006**  | § 9.3 | Inputs orders tracked separately from agricultural produce sales | Order Separation| `backend/src/services/buyer.service.ts` | TC-INP-06 | PARTIAL |
| **ADMIN-001**  | § 10.1| Operational dashboard displays real counts derived from database | Admin Dashboard | `app/dashboard/admin/page.tsx` | TC-ADM-01 | PASS |
| **ADMIN-002**  | § 10.2| Administrator can search, filter, and review users across all roles | User Manager | `app/dashboard/admin/buyers/page.tsx` | TC-ADM-02 | PASS |
| **ADMIN-003**  | § 10.2| Administrator can suspend or reactivate user accounts with reason | Account Control | `backend/src/controllers/admin.controller.ts` | TC-ADM-03 | PASS |
| **ADMIN-004**  | § 10.3| Administrator can pause, activate, or remove inappropriate listings | Moderation | `app/dashboard/admin/products/page.tsx` | TC-ADM-04 | PASS |
| **ADMIN-005**  | § 10.3| Administrator is strictly barred from altering farmer product prices| Price Protection| `backend/src/controllers/admin.controller.ts` | TC-ADM-05 | PASS |
| **ADMIN-006**  | § 10.4| Superadmin can create and manage supported cities and local markets | Market Hub | `app/dashboard/superadmin/markets/page.tsx` | TC-ADM-06 | PASS |
| **ADMIN-007**  | § 10.5| Administrator can view and filter all marketplace orders | Order Oversight | `app/dashboard/admin/orders/page.tsx` | TC-ADM-07 | PASS |
| **ADMIN-008**  | § 10.5| Administrator can intervene in failed or cancelled deliveries | Exception Handle| `backend/src/controllers/admin.controller.ts` | TC-ADM-08 | PASS |
| **ADMIN-009**  | § 10.6| Dispute process allows buyers to report issues with order evidence | Dispute Engine | `backend/src/controllers/buyer.controller.ts` | TC-ADM-09 | PASS |
| **ADMIN-010**  | § 10.6| Administrator investigates dispute evidence and records decision | Dispute Arbiter | `backend/src/controllers/admin.controller.ts` | TC-ADM-10 | PASS |
| **ADMIN-011**  | § 10.7| All administrative actions recorded in immutable `AuditLog` table | Audit Ledger | `backend/src/services/admin.service.ts` | TC-ADM-11 | PASS |
| **ADMIN-012**  | § 10.7| Superadmin can provision new administrators with temporary creds | Admin Provision | `app/dashboard/superadmin/users/page.tsx` | TC-ADM-12 | PASS |
| **ADMIN-013**  | § 10.7| Superadmin can revoke user active sessions and refresh tokens | Security Control| `backend/src/controllers/superadmin.controller.ts`| TC-ADM-13 | PASS |
| **ADMIN-014**  | § 10.7| Superadmin can run database health check and trigger backup dump | Health & Backup | `app/dashboard/superadmin/backup/page.tsx` | TC-ADM-14 | PASS |
| **NOTIF-001**  | § 11.0| Notification engine uses Geez SMS as primary and Brevo as fallback | Notification Svc| `backend/src/services/notification.service.ts` | TC-NTF-01 | PASS |
| **NOTIF-002**  | § 11.0| Verification decisions trigger automated SMS and Email alerts | Event Trigger | `backend/src/services/admin.service.ts` | TC-NTF-02 | PASS |
| **NOTIF-003**  | § 11.0| Order placement alerts farmer via in-app and SMS notification | Event Trigger | `backend/src/services/buyer.service.ts` | TC-NTF-03 | PASS |
| **NOTIF-004**  | § 11.0| Delivery assignment broadcasts alert eligible delivery workers | Event Trigger | `backend/src/services/dispatch.service.ts` | TC-NTF-04 | PASS |
| **NOTIF-005**  | § 11.0| In-app notification bell displays unread count and mark-as-read | In-App Bell | `app/dashboard/buyer/page.tsx` | TC-NTF-05 | PASS |
| **NOTIF-006**  | § 11.0| Notification failure does not cause order or payment rollback | Reliability | `backend/src/services/notification.service.ts` | TC-NTF-06 | PASS |
| **SEC-001**    | § 12.0| Server-side authorization verified on every protected API route | Security Guard | `backend/src/middleware/requireAuth.ts` | TC-SEC-01 | PASS |
| **SEC-002**    | § 12.0| IDOR checks prevent buyers/farmers from accessing foreign records | Access Control | `message.service.ts` & `buyer.service.ts` | TC-SEC-02 | PASS |
| **SEC-003**    | § 12.0| Input validation enforces type checks, length caps, and sanitization| Input Validator | `controllers/` | TC-SEC-03 | PASS |
| **SEC-004**    | § 12.0| SQL injection prevented by Prisma parameterized queries | SQL Injection | `backend/src/config/prisma.ts` | TC-SEC-04 | PASS |
| **SEC-005**    | § 12.0| Rate limiting active on auth, recovery, and verification routes | Rate Limiter | `backend/src/middleware/rateLimiter.ts` | TC-SEC-05 | PASS |
| **SEC-006**    | § 12.0| Sensitive Cloudinary API secrets kept strictly on backend | Secret Guard | `backend/src/config/cloudinary.ts` | TC-SEC-06 | PASS |
| **SEC-007**    | § 12.0| Content-Security-Policy (CSP) headers configured on Express | HTTP Headers | `backend/src/app.ts` | TC-SEC-07 | PASS |
| **SEC-008**    | § 12.0| CORS restricted to authorized frontend origins | CORS Filter | `backend/src/app.ts` | TC-SEC-08 | PASS |
| **SEC-009**    | § 12.0| Transactional integrity enforced across all state-changing ops | Transactions | `prisma.$transaction` | TC-SEC-09 | PASS |
| **SEC-010**    | § 12.0| Anti-self messaging and anti-self purchasing strictly blocked | Business Rule | `message.service.ts` & `buyer.service.ts` | TC-SEC-10 | PASS |
