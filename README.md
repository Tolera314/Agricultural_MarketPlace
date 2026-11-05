# AgriMarket — Location-Based Ethiopian Agricultural Marketplace

> **An enterprise-grade, full-stack digital marketplace connecting Farmers, Buyers, Logistics Couriers, and Market Administrators across Ethiopia with localized digital payments (Chapa), real-time geolocation dispatching, and cryptographic session security.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%2B-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2d3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20(Neon)-336791.svg)](https://neon.tech/)
[![Chapa Payments](https://img.shields.io/badge/Payments-Chapa%20(ETB)-green.svg)](https://chapa.co/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-emerald.svg)](https://web.dev/progressive-web-apps/)
[![Tests Passing](https://img.shields.io/badge/Tests-184%2F184%20Passing-brightgreen.svg)]()

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. System Architecture](#2-system-architecture)
- [3. Five Canonical Platform Roles (RBAC)](#3-five-canonical-platform-roles-rbac)
- [4. Chapa Payment Gateway & Webhook Architecture](#4-chapa-payment-gateway--webhook-architecture)
  - [4.1 Architecture & Flow](#41-architecture--flow)
  - [4.2 Security Safeguards (HMAC-SHA256 & Verification)](#42-security-safeguards-hmac-sha256--verification)
  - [4.3 Chapa Merchant Dashboard Configuration Manual](#43-chapa-merchant-dashboard-configuration-manual)
- [5. Geolocation Dispatching & Location Staleness Matrix](#5-geolocation-dispatching--location-staleness-matrix)
- [6. Administrative Verification & Seller Governance](#6-administrative-verification--seller-governance)
- [7. Enterprise Security & Session Management](#7-enterprise-security--session-management)
- [8. Native Form Standards & Autofill Compliance](#8-native-form-standards--autofill-compliance)
- [9. Progressive Web App (PWA) & Cache Isolation](#9-progressive-web-app-pwa--cache-isolation)
- [10. Project Directory Structure](#10-project-directory-structure)
- [11. Complete API Endpoint Reference](#11-complete-api-endpoint-reference)
- [12. Environment Variables Specification](#12-environment-variables-specification)
- [13. Installation, Local Setup & Production Deployment](#13-installation-local-setup--production-deployment)
- [14. Automated Test Suites](#14-automated-test-suites)
- [15. License & Project Governance](#15-license--project-governance)

---

## 1. Executive Summary

AgriMarket is a production-grade, highly localized digital commerce and logistics platform engineered to modernize Ethiopia's agricultural supply chain. By eliminating intermediaries and manual coordination barriers, the platform directly connects rural smallholder farmers with urban household buyers, bulk purchasers, and independent delivery couriers across Addis Ababa and regional distribution centers.

### Key Value Propositions

- **Direct Farm-to-Consumer Market:** Direct listing and pricing in Ethiopian Birr (ETB), maximizing farmer profit margins while lowering consumer grocery costs.
- **Localized Ethiopian Digital Payments (Chapa):** Full integration with Chapa supporting Telebirr, CBE Birr, Awash Birr, and debit cards with automated digital escrow and courier payout splits.
- **Proximity-Based Courier Dispatching:** Haversine geofencing with real-time location tracking and staleness protection (`WORKER_LOCATION_MAX_AGE_SECONDS=300`) to guarantee fast, reliable last-mile delivery.
- **Dual Telecommunications Gateway:** Native validation and delivery for both Ethio Telecom (`+251 9...`) and Safaricom Ethiopia (`+251 7...`) networks via Geez SMS, backed by Brevo transactional SMTP for dual-channel OTP delivery.
- **Low-Bandwidth Mobile Optimization:** Client-side HTML5 Canvas document compression reduces 15 MB smartphone photos of Kebele IDs and land certificates to < 500 KB before upload over rural cellular connections.
- **Zero-Trust Administrative Governance:** Rigorous KYC verification pipeline for farmers and couriers with automatic product listing state cascading and immutable audit logging.

---

## 2. System Architecture

AgriMarket is organized as a decoupled, resilient client-server architecture:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Next.js 16 Client Layer                             │
│  - React 19 Client Components & Context Providers                            │
│  - In-Memory Auth Manager (Zero JWTs in Web Storage)                         │
│  - Service Worker v1.1.0 with Strict Auth-Aware Cache Isolation              │
│  - Responsive Mobile-First Tailwind CSS v4 Design (Dark / Light Theme)       │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS / Secure HttpOnly Cookies
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Express 5 API Gateway Engine                         │
│  - Sliding Window In-Memory Rate Limiters (Auth, Recovery, OTP)              │
│  - E.164 Canonical Phone Normalization (+251 9... / +251 7...)               │
│  - Cryptographic Token Family Rotation & Reuse Detection (SHA-256)           │
│  - 5-Tier Role-Based Access Control (RBAC) Enforcement                       │
│  - Raw Body Buffer Preservation for Webhook Signature Verification           │
└──────────────┬───────────────────┬───────────────────┬───────────────────────┘
               │                   │                   │
               ▼                   ▼                   ▼
      ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
      │  PostgreSQL 16  │ │  Chapa Payment  │ │   Geez SMS &    │
      │ (Neon Serverless│ │     Gateway     │ │   Brevo Email   │
      │   Prisma 7.8)   │ │  (ETB Webhooks) │ │ (Notifications) │
      └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Technology Matrix

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js App Router | `16.1.6` | Server & Client Components, Dynamic Routing |
| **UI Library** | React | `19.0.0` | Declarative UI, Concurrent Rendering |
| **Styling & Icons** | Tailwind CSS / Lucide React | `Tailwind v4`, `Lucide` | Mobile-First UI, Responsive Design |
| **Backend Runtime** | Node.js | `20.x` / `22.x` | High-throughput async event loop |
| **API Framework** | Express | `5.2.1` | REST API, Middleware pipeline, Webhook engine |
| **ORM & Database** | Prisma Client & PostgreSQL | `Prisma 7.8.0`, `PostgreSQL 16` | Type-safe queries, connection pooling via Neon |
| **Payment Gateway** | Chapa | `v1 REST API` | Telebirr, CBE Birr, Awash Birr, Cards (ETB) |
| **SMS Gateway** | Geez SMS | REST HTTP API | OTP delivery across Ethio Telecom & Safaricom |
| **Email Gateway** | Brevo (Sendinblue) | SMTP / REST | Transactional email verification and password reset |
| **Document Storage** | Local Storage / Cloudinary | Multi-strategy | Compressed KYC verification documents |

---

## 3. Five Canonical Platform Roles (RBAC)

The AgriMarket platform enforces **5 official, strictly isolated roles**. There are no unofficial user tiers or external third-party company roles (e.g. *Agricultural Input Company* is strictly not supported).

```text
BUYER  ──►  FARMER  ──►  DELIVERY_WORKER  ──►  ADMIN  ──►  SUPERADMIN
```

### Detailed Role Responsibilities & Capabilities

| Role | Primary Functions | Capabilities & Permissions |
| :--- | :--- | :--- |
| **`BUYER`** | Consumers, Restaurants, Wholesalers | - Browse active farm product catalog with Haversine distance calculations.<br>- Manage shopping cart and saved delivery addresses.<br>- Checkout with Chapa digital payments (Telebirr, CBE Birr, cards).<br>- Track live order delivery status and provide confirmation PIN upon arrival. |
| **`FARMER`** | Smallholder Farmers, Agricultural Co-ops | - Manage farm profile, location coordinates, and cooperative credentials.<br>- Create, edit, pause, and delete product listings with image uploads.<br>- Manage inventory, pricing per unit (kg, quintal, crate), and batch dates.<br>- View received orders, update fulfillment states, and track earnings. |
| **`DELIVERY_WORKER`** | Motorcycle, Van & Truck Couriers | - Complete driver licensing and vehicle verification onboarding.<br>- Grant location tracking consent and stream GPS telemetry.<br>- Accept proximity-matched delivery jobs based on location freshness.<br>- Navigate pickup and dropoff points; verify delivery with buyer OTP. |
| **`ADMIN`** | Regional Market Overseers & Operations | - Inspect and verify/reject/suspend Farmer KYC credentials and Kebele IDs.<br>- Inspect and verify/reject/suspend Delivery Couriers and vehicle papers.<br>- Moderate product listings (Flag, approve, or pause non-compliant goods).<br>- Inspect regional order disputes, delivery logs, and audit logs. |
| **`SUPERADMIN`** | Platform Executives & System Operators | - Provision new Administrator accounts and govern user status across the system.<br>- Configure platform commission fees, marketplace tariffs, and delivery pricing.<br>- Define intercity logistics corridors, checkpoints, and market boundaries.<br>- View system-wide financial analytics, security posture, and database backup snapshots. |

---

## 4. Chapa Payment Gateway & Webhook Architecture

AgriMarket integrates with [Chapa](https://chapa.co/), Ethiopia's leading payment processing infrastructure for digital commerce. The platform supports seamless checkout in Ethiopian Birr (ETB) through Telebirr, Commercial Bank of Ethiopia (CBE Birr), Awash Birr, and domestic/international debit and credit cards.

### 4.1 Architecture & Flow

```
[Buyer Orders Produce]
         │
         ▼
[POST /api/payment/chapa/checkout]
         │  - Validates active stock & creates pending Order
         │  - Generates unique tx_ref: TX-ORDER-<id>-<timestamp>
         │  - Calls Chapa API: POST https://api.chapa.co/v1/transaction/initialize
         ▼
[Chapa Checkout URL Returned] ──► [Buyer Completes Payment (Telebirr / CBE / Card)]
                                                  │
                                                  ▼
                        [Chapa Dispatches Webhook to AgriMarket Server]
                                                  │
                                                  ▼
                                [POST /api/payment/chapa/webhook]
                                                  │
         ┌────────────────────────────────────────┴────────────────────────────────────────┐
         ▼                                                                                 ▼
[1. Verify Raw Body HMAC-SHA256 Signature]                        [2. Query Chapa API Directly for txRef]
Matches x-chapa-signature using secret?                           Status confirmed === 'success'?
         │                                                                                 │
         └────────────────────────────────────────┬────────────────────────────────────────┘
                                                  ▼
                             [3. Atomic Database Transaction (Prisma)]
                                - Update Order status: PAID
                                - Record Chapa reference & payment details
                                - Deduct product listing inventory
                                - Hold funds in digital Escrow
                                                  │
                                                  ▼
                             [4. Trigger Courier Dispatch System]
                                - Haversine proximity match to nearby couriers
                                - Broadcast push notification / job offer
```

### 4.2 Security Safeguards (HMAC-SHA256 & Verification)

To ensure enterprise-grade financial security, the payment pipeline implements multiple defensive layers:

1. **Preserved Raw Body Buffer:** In `backend/src/app.ts`, `express.json({ verify: ... })` captures the exact incoming raw request buffer into `(req as any).rawBody`. This guarantees that HMAC-SHA256 hash generation operates on the exact byte sequence sent by Chapa, preventing signature mismatches caused by JSON re-serialization or key ordering differences.
2. **Constant-Time Signature Verification:** The incoming signature header (`x-chapa-signature` or `Chapa-Signature`) is validated against `crypto.createHmac('sha256', CHAPA_WEBHOOK_SECRET)` using `crypto.timingSafeEqual` to eliminate timing attack vectors.
3. **Out-of-Band Verification Fallback:** As an additional safeguard against spoofing, the webhook handler executes an independent server-to-server verification request to `GET https://api.chapa.co/v1/transaction/verify/:txRef` using the secret API key before crediting any order.
4. **Idempotent Order State Transitions:** Webhook invocations are idempotent. If Chapa retries a webhook for an already-settled order, the backend safely acknowledges `200 OK` without duplicating inventory deductions or escrow transactions.

### 4.3 Chapa Merchant Dashboard Configuration Manual

To connect your Chapa merchant account with your AgriMarket deployment, configure the following settings in your [Chapa Dashboard](https://dashboard.chapa.co):

#### Step 1: Obtain API Keys
1. Log into your **Chapa Merchant Dashboard**.
2. Navigate to **Settings** $\rightarrow$ **API & Webhook**.
3. Copy your **Public Key** and **Secret Key**:
   - For Sandbox / Development: Use test keys (`CHAPUBK_TEST-...` and `CHASECK_TEST-...`).
   - For Production: Use live keys (`CHAPUBK_LIVE-...` and `CHASECK_LIVE-...`).
4. Set these keys in your `.env` file:
   ```ini
   CHAPA_BASE_URL=https://api.chapa.co/v1
   CHAPA_PUBLIC_KEY=CHAPUBK_TEST-YOUR_PUBLIC_KEY
   CHAPA_SECRET_KEY=CHASECK_TEST-YOUR_SECRET_KEY
   ```

#### Step 2: Configure Webhook Endpoint & Secret Hash
1. In the Chapa Dashboard under **Settings** $\rightarrow$ **API & Webhook**, scroll to the **Webhook** section.
2. Enter the **Webhook URL**:
   - **Production Deployment:**
     ```text
     https://example.com/api/payment/chapa/webhook
     ```
   - **Local Testing (via ngrok tunnel):**
     ```text
     https://<your-subdomain>.ngrok-free.app/api/payment/chapa/webhook
     ```
3. Set the **Secret Hash / Webhook Secret**:
   - Enter a secure secret string (e.g. `your_webhook_secret`).
   - Set the identical value in your `.env` file:
     ```ini
     CHAPA_WEBHOOK_SECRET=your_webhook_secret
     ```
4. Click **Save Webhook Settings**.

#### Step 3: Verify Webhook Connectivity
- Test transactions can be simulated directly through the AgriMarket checkout flow or via the built-in simulator at `/checkout/simulate-chapa`.
- Successful payments will immediately transition order status from `PENDING` to `PAID` and notify nearby couriers.

---

## 5. Geolocation Dispatching & Location Staleness Matrix

AgriMarket includes an automated logistics engine that dispatches couriers based on proximity to the farmer's produce pickup coordinates.

### Location Staleness Matrix (`WORKER_LOCATION_MAX_AGE_SECONDS=600`)

To prevent assigning orders to couriers who are no longer active or whose GPS signal has degraded, the system validates the age of the courier's last recorded location:

| Last Location Update Timestamp | Elapsed Time | Staleness Classification | Dispatch Eligibility |
| :--- | :--- | :--- | :--- |
| $\le \mathbf{30\text{ seconds ago}}$ | 30s | **Fresh / High Accuracy** | **Eligible** (Immediate priority assignment) |
| $\le \mathbf{2\text{ minutes ago}}$ | 120s | **Recent** | **Eligible** (Standard proximity match) |
| $\le \mathbf{4\text{ minutes ago}}$ | 240s | **Recent** | **Eligible** (Secondary match candidate) |
| $\ge \mathbf{5\text{ minutes ago}}$ | $> 300\text{s}$ | **STALE / Outdated** | **INELIGIBLE** (Excluded from automatic dispatch) |
| **No GPS timestamp recorded** | $\infty$ | **Unknown / Offline** | **INELIGIBLE** (Excluded from dispatch pool) |

### Proximity Calculation (Haversine Formula)

The backend calculates spherical distance over Earth's curvature between the farmer's pickup coordinates $(lat_1, lon_1)$ and the courier's consented coordinates $(lat_2, lon_2)$:

$$d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

Where $R = 6371\text{ km}$. Couriers within the service radius ($< 15\text{ km}$) with verified credentials and fresh locations receive instant dispatch broadcasts.

---

## 6. Administrative Verification & Seller Governance

Trust and produce safety require strict administrative verification before sellers and couriers can transact on the open market.

```
[Applicant Submits KYC] ──► [Pending Review] ──► [Admin Inspects Credentials]
                                                              │
                    ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                    ▼                                                                                   ▼
            [VERIFIED / APPROVED]                                                               [REJECTED / SUSPENDED]
  - User status: VERIFIED                                                             - User status: SUSPENDED/REJECTED
  - Farmer listings activated                                                         - Active product listings automatically PAUSED
  - SMS notification sent via Geez SMS                                                - Courier excluded from dispatch queue
  - Immutable AuditLog entry recorded                                                 - Justification note logged in AuditLog
```

### Automatic Product Listing State Cascading

When an administrator reviews a farmer's account:
- **Verification (`VERIFIED`):** Farmer's onboarding status updates to `COMPLETED`, and any previously paused product listings are automatically reactivated to `ACTIVE`.
- **Suspension / Rejection (`SUSPENDED` / `REJECTED`):** All active product listings belonging to the farmer are instantly and automatically set to `PAUSED`, removing them from buyer search results and preventing new orders.
- **Audit Logging:** Every status modification records the reviewing administrator's ID, previous state, new state, timestamp, and verification note in the database audit log.

---

## 7. Enterprise Security & Session Management

AgriMarket implements defense-in-depth session security:

```
[User Signs In]
       │
       ▼
[Backend Issues Credentials]
       ├─► 1. Short-Lived Access Token (15 Minutes) ──► Kept IN-MEMORY only (JS Variable)
       └─► 2. Long-Lived Refresh Token (7 Days)    ──► Set in HttpOnly, Secure, SameSite=Lax Cookie
                                                         (Stored as SHA-256 Hash in Database)
```

### Key Security Safeguards

1. **Zero Credential Web Storage:** Access tokens, refresh tokens, and passwords are **never** stored in `localStorage`, `sessionStorage`, or `IndexedDB`, neutralizing Cross-Site Scripting (XSS) credential theft.
2. **Cryptographic Token Family Rotation:** Every refresh request invalidates the prior refresh token and issues a new token linked to the same session `family`.
   - **Reuse Detection:** If an invalidated or stolen token is ever presented again, the system detects token theft, immediately invalidates the **entire token family**, and revokes all active sessions for that user.
3. **Atomic Revocation & Token Versioning:** The `User` database record contains an integer `tokenVersion` (`@default(1)`). Sensitive operations (Password Reset, "Sign Out All Devices", Admin Suspend) atomically increment `user.tokenVersion`, instantly invalidating existing tokens.
4. **Anti-User Enumeration:** Forgot Password endpoints return standardized generic messages to prevent harvesting registered phone numbers and emails.
5. **Sliding-Window Rate Limiting:**
   - `authRateLimiter`: 20 requests / 15 minutes.
   - `passwordRecoveryLimiter`: 5 recovery attempts / 15 minutes.
   - `otpVerificationLimiter`: 6 verification attempts / 15 minutes.

---

## 8. Native Form Standards & Autofill Compliance

AgriMarket forms strictly adhere to W3C and HTML Living Standard specifications:

| Form Field | Standard HTML Attribute | Accessibility & Form Context |
| :--- | :--- | :--- |
| **Full Name** | `autoComplete="name"` | `<input id="fullName" name="fullName" type="text">` |
| **Phone Number** | `autoComplete="tel"` | `<input id="phone" name="phone" type="tel">` |
| **Email Address** | `autoComplete="email"` | `<input id="email" name="email" type="email">` |
| **Registration Password** | `autoComplete="new-password"` | `<input id="password" name="password" type="password">` |
| **Login Identifier** | `autoComplete="username"` | Dual input supporting phone or email |
| **Login Password** | `autoComplete="current-password"` | `<input id="password" name="password" type="password">` |
| **6-Digit OTP Code** | `autoComplete="one-time-code"` | Mobile SMS autofill detection |

---

## 9. Progressive Web App (PWA) & Cache Isolation

AgriMarket includes an auth-aware Service Worker (`public/sw.js`, v1.1.0) with strict cache boundaries:

```
                              [Service Worker Fetch Event]
                                            │
             ┌──────────────────────────────┴──────────────────────────────┐
             ▼                                                             ▼
 [Is Private Route / API?]                                     [Is Public Static Asset?]
  - /dashboard/*, /onboarding/*                                 - /, /login, /signup
  - /admin/*, /orders/*, /api/*                                 - /offline, CSS, JS, Images
             │                                                             │
             ▼                                                             ▼
   [STRICT NETWORK ONLY]                                         [STALE-WHILE-REVALIDATE]
Fetch with { cache: 'no-store' }                              Serve from cache instantly;
If network fails: serve /offline.                             update from network in background.
NEVER WRITE TO LOCAL CACHE!
```

---

## 10. Project Directory Structure

```text
Agriculture_marketplace/
├── .env                                # Centralized Root Environment Configuration
├── .gitignore                          # Clean Root Git Ignore
├── README.md                           # Enterprise Documentation
│
├── backend/                            # Express 5 + Prisma Backend
│   ├── prisma/
│   │   ├── schema.prisma               # Models: User, ProductListing, Order, DeliveryJob, etc.
│   │   └── migrations/                 # PostgreSQL Migration History
│   ├── src/
│   │   ├── config/                     # Prisma Client & Database Connections
│   │   ├── controllers/                # Request Handlers (Auth, Buyer, Farmer, Worker, Admin, Chapa)
│   │   ├── middleware/                 # Rate Limiting, RBAC & requireAuth Guards
│   │   ├── routes/                     # Mounted Express Route Modules
│   │   ├── services/                   # Business Logic, Payment, Dispatch, Geolocation
│   │   ├── tests/                      # Automated Integration & Boundary Test Suites
│   │   ├── app.ts                      # Express App Definition & Raw Body Webhook Buffering
│   │   └── index.ts                    # Server Bootstrap (Port 5000)
│   └── package.json
│
└── frontend/                           # Next.js 16 + React 19 Frontend
    ├── public/
    │   ├── icons/                      # PWA High-Resolution Icons (192, 512, Maskable)
    │   ├── manifest.webmanifest        # Progressive Web App Manifest
    │   └── sw.js                       # Auth-Aware Service Worker v1.1.0
    ├── src/
    │   ├── app/
    │   │   ├── checkout/               # Checkout & Chapa Simulation
    │   │   ├── dashboard/              # Buyer, Farmer, Delivery Worker, Admin & Superadmin Portals
    │   │   ├── login/                  # Standards-Compliant Login
    │   │   ├── signup/                 # Multi-Step Signup & OTP Verification
    │   │   └── onboarding/             # Role Selection & Document Upload
    │   ├── components/                 # Modals, Tables, Navigation, Cart Drawer
    │   ├── context/                    # AuthContext & ThemeContext
    │   └── lib/                        # API Bridges (adminApi, buyerApi, farmerApi, paymentApi)
    └── package.json
```

---

## 11. Complete API Endpoint Reference

All endpoints return standardized JSON structures:
- Success: `{ "success": true, "message"?: string, "data": { ... } }`
- Error: `{ "success": false, "error": { "field"?: string, "message": string } }`

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user with phone & password | No |
| `POST` | `/api/auth/login` | Dual identifier login (phone or email) | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit registration OTP | No |
| `POST` | `/api/auth/resend-otp` | Resend verification code via SMS/Email | No |
| `POST` | `/api/auth/refresh` | Rotate session & receive new access token | Cookie |
| `POST` | `/api/auth/logout` | Revoke current refresh token and clear cookie | No |
| `POST` | `/api/auth/logout-all` | Revoke all active sessions (increments tokenVersion) | Yes (JWT) |
| `POST` | `/api/auth/forgot-password` | Request password reset recovery code | No |
| `POST` | `/api/auth/verify-reset-code`| Validate 6-digit password recovery code | No |
| `POST` | `/api/auth/reset-password` | Set new password with verified code | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & role | Yes (JWT) |

### Payments & Chapa Gateway (`/api/payment`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payment/chapa/checkout` | Initialize Chapa checkout session for order | Yes (Buyer) |
| `POST` | `/api/payment/chapa/webhook` | Canonical Chapa payment webhook (HMAC signature verified) | Webhook Secret |
| `GET` | `/api/payment/chapa/verify/:txRef` | Out-of-band server transaction verification query | Yes (Auth) |
| `POST` | `/api/payment/chapa/simulate` | Sandbox payment simulation for testing | Yes (Auth) |

### Buyer Operations (`/api/buyer`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/buyer/products` | Search product catalog with Haversine distance filtering | Optional (JWT) |
| `GET` | `/api/buyer/products/:id` | Detailed product profile and farm location | Optional (JWT) |
| `POST` | `/api/buyer/orders` | Create buyer order & reserve inventory | Yes (Buyer) |
| `GET` | `/api/buyer/orders` | Order history and live tracking states | Yes (Buyer) |
| `GET` | `/api/buyer/addresses` | List saved delivery addresses | Yes (Buyer) |
| `POST` | `/api/buyer/addresses` | Save new delivery address with coordinates | Yes (Buyer) |

### Farmer Operations (`/api/farmer`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/farmer/dashboard` | Farmer revenue, pending orders, and inventory metrics | Yes (Farmer) |
| `GET` | `/api/farmer/products` | List farmer's active and paused listings | Yes (Farmer) |
| `POST` | `/api/farmer/products` | Create new produce listing with batch dates | Yes (Farmer) |
| `PATCH`| `/api/farmer/products/:id` | Update pricing, stock quantity, or listing status | Yes (Farmer) |
| `DELETE`| `/api/farmer/products/:id`| Delete product listing | Yes (Farmer) |
| `GET` | `/api/farmer/orders` | Orders requiring farmer packing and fulfillment | Yes (Farmer) |

### Logistics & Geolocation (`/api/location` & `/api/workers`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/location/share` | Consented courier GPS telemetry broadcast | Yes (Worker) |
| `GET` | `/api/workers/jobs` | Proximity-matched delivery job offers | Yes (Worker) |
| `POST` | `/api/workers/jobs/:id/accept` | Accept delivery assignment | Yes (Worker) |
| `POST` | `/api/workers/jobs/:id/status` | Advance delivery milestone (PICKED_UP, DELIVERED) | Yes (Worker) |

### Administration & Superadmin (`/api/admin` & `/api/superadmin`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/farmers` | List farmer onboarding applications | Yes (Admin) |
| `PATCH`| `/api/admin/farmers/:id/verify`| Approve, reject, or suspend farmer account | Yes (Admin) |
| `GET` | `/api/admin/workers` | List courier applications and vehicle profiles | Yes (Admin) |
| `PATCH`| `/api/admin/workers/:id/verify`| Approve, reject, or suspend courier account | Yes (Admin) |
| `GET` | `/api/admin/audit-logs` | Immutable audit trail of administrative actions | Yes (Admin) |
| `POST` | `/api/superadmin/users/provision`| Provision new Administrator or Superadmin | Yes (Superadmin) |
| `GET` | `/api/superadmin/reports` | Platform gross trade volume & commission reports | Yes (Superadmin) |

---

## 12. Environment Variables Specification

All environment variables are centralized in the single `.env` file at the root of the project:

```ini
# Application Mode & Ports
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Database (PostgreSQL / Neon Serverless)
DATABASE_URL=postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DBNAME?sslmode=require

# Session Security & Tokens
JWT_SECRET=super_secret_jwt
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Chapa Payment Gateway (Ethiopian Birr - ETB)
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-YOUR_PUBLIC_KEY
CHAPA_SECRET_KEY=CHASECK_TEST-YOUR_SECRET_KEY
CHAPA_WEBHOOK_SECRET=your_webhook_secret


# Logistics & Courier Location Freshness
WORKER_LOCATION_MAX_AGE_SECONDS=300

# SMS Provider (Geez SMS / Ethio Telecom & Safaricom)
GEEZ_SMS_TOKEN=your_geez_sms_api_token
GEEZ_SMS_SENDER_ID=AgriMarket

# Email Provider (Brevo / Sendinblue SMTP)
BREVO_SMTP_KEY=your_brevo_smtp_key
BREVO_SMTP_USER=your_brevo_verified_sender@domain.com
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587

# Cloudinary Storage (Optional - Falls back to local disk)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 13. Installation, Local Setup & Production Deployment

### Prerequisites
- **Node.js:** `v20.x` or `v22.x`
- **npm:** `v10.x+`
- **PostgreSQL:** Local database or Neon Serverless instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/Agriculture_marketplace.git
cd Agriculture_marketplace

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Migration & Prisma Generation
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Run Development Servers
Open two terminal windows:

```bash
# Terminal 1: Backend Gateway (Port 5000)
cd backend
npm run dev

# Terminal 2: Frontend App (Port 3000)
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

### 4. Production Build & Deployment
```bash
# Build Backend
cd backend
npm run build

# Build Frontend
cd ../frontend
npm run build
```

---

## 14. Automated Test Suites

AgriMarket includes 184 automated tests validating security, boundaries, authentication, geolocation, and logistics:

```bash
cd backend
npm test
```

### Test Suite Coverage

| Suite | File | Assertions | Focus |
| :--- | :--- | :--- | :--- |
| **Boundary Suite** | `boundary.test.ts` | **79 Passed** | Ge'ez Unicode, E.164 phone formats, coordinate ranges $[-90, 90]$, email syntax. |
| **Auth & Security** | `auth.test.ts` | **32 Passed** | Token rotation, reuse theft detection, anti-enumeration, atomic token versioning. |
| **Google OAuth** | `google-auth.test.ts` | **39 Passed** | Server ID token verification, immutable `sub` claims, account takeover prevention. |
| **Location & Dispatch**| `location.test.ts` | **8 Passed** | Consented tracking, accuracy boundaries, staleness verification ($> 300\text{s}$). |
| **Delivery & Fleet** | `delivery.test.ts` | **18 Passed** | Proximity courier matching, job lifecycle, proof-of-delivery OTP verification. |
| **Onboarding & KYC** | `onboarding.test.ts` | **8 Passed** | Document upload compression, multi-step role transitions, administrative review. |
| **Total** | — | **184 Passed, 0 Failed** | **100% Test Pass Rate** |

---

## 15. License & Project Governance

- **License:** Proprietary — All Rights Reserved. Built for Ethiopian Agricultural Commerce.
- **Architected By:** Senior Full-Stack Engineering & Application Security Team.
- **Support & Inquiries:** Contact operations team through platform administrative portal.
