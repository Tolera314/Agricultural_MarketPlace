# AgriMarket — Location-Based Ethiopian Agricultural Marketplace

> **An enterprise-grade, full-stack digital marketplace connecting Farmers, Buyers, Couriers, and Wholesalers across Ethiopia.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%2B-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2d3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-emerald.svg)](https://web.dev/progressive-web-apps/)
[![Tests Passing](https://img.shields.io/badge/Tests-184%2F184%20Passing-brightgreen.svg)]()

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. System Architecture](#2-system-architecture)
- [3. Enterprise Security & Session Management](#3-enterprise-security--session-management)
- [4. Native Autofill & Credential Standards](#4-native-autofill--credential-standards)
- [5. Progressive Web App (PWA) & Cache Isolation](#5-progressive-web-app-pwa--cache-isolation)
- [6. Input Validation & Boundary Enforcement](#6-input-validation--boundary-enforcement)
- [7. User Roles & Onboarding Lifecycles](#7-user-roles--onboarding-lifecycles)
- [8. Logistics, Geolocation & Escrow](#8-logistics-geolocation--escrow)
- [9. API Specifications & Endpoints](#9-api-specifications--endpoints)
- [10. Project Directory Structure](#10-project-directory-structure)
- [11. Environment Variables & Setup](#11-environment-variables--setup)
- [12. Local Development & Production Build](#12-local-development--production-build)
- [13. Automated Test Suites](#13-automated-test-suites)
- [14. License & Credits](#14-license--credits)

---

## 1. Executive Summary

AgriMarket is an agricultural digital marketplace specifically engineered for the Ethiopian agricultural economy. The platform bridges the gap between rural smallholder farmers, urban consumers, commercial buyers, and independent logistics couriers.

### Key Value Propositions

- **Direct Farm-to-Consumer:** Eliminates arbitrary middleman margins, providing farmers fair market pricing in Ethiopian Birr (ETB).
- **Dual Telecommunications Localization:** Fully compliant with Ethiopian mobile networks, natively validating and routing via Ethio Telecom (`+251 9...`) and Safaricom Ethiopia (`+251 7...`).
- **Flexible Verification:** Dual-channel OTP verification using Ethio Telecom / Geez SMS gateway for mobile users, with automatic fallback to Brevo transactional email when an optional email address is provided.
- **Rural Connectivity Optimization:** Features client-side HTML5 Canvas document compression for Kebele IDs and land deeds (reducing 15 MB mobile camera photos down to < 500 KB), and SMS-based draft application resumption.
- **Strict Privacy & Security:** Built with military-grade session isolation, cryptographic refresh token rotation, zero client-side credential storage, and an auth-aware service worker preventing private data leaks on shared devices.

---

## 2. System Architecture

AgriMarket follows a decoupled, resilient client-server architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (Next.js 16)                        │
│  - React 19 Client Components & Context Providers                       │
│  - In-Memory Auth Manager (No JWTs in Web Storage)                      │
│  - Service Worker v1.1.0 with Auth-Aware Cache Isolation                │
│  - Responsive Mobile-First Tailwind v4 Theming (Dark/Light)             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / Secure HttpOnly Cookies
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Express 5 API Gateway Engine                      │
│  - Sliding Window In-Memory Rate Limiters (Auth, Recovery, OTP)         │
│  - Input Validation & Canonical E.164 Phone Normalization               │
│  - Token Family Rotation & Reuse Detection (SHA-256 Hashing)            │
│  - Role-Based Access Control (RBAC: BUYER, FARMER, WORKER, ADMIN)       │
└──────────────────┬─────────────────┬─────────────────┬──────────────────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
          ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
          │  PostgreSQL /  │ │ Geez SMS /    │ │  Brevo Email   │
          │  Neon Serverless│ │ Ethio Telecom │ │  SMTP Gateway  │
          │  Prisma 7.8    │ │ Notification  │ │  (Verification)│
          └────────────────┘ └───────────────┘ └────────────────┘
```

### Technology Matrix

| Layer | Primary Technology | Version / Tooling |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js App Router | `16.1.6` |
| **UI Library** | React | `19.0.0` |
| **Language** | TypeScript | `5.0+` (Strict Type Safety) |
| **CSS & Design** | Tailwind CSS & Lucide React | `Tailwind v4`, `Lucide Icons` |
| **Backend Runtime** | Node.js | `20.x+` (ESM Native) |
| **API Framework** | Express | `5.2.1` |
| **ORM & Database** | Prisma Client & PostgreSQL | `Prisma 7.8.0`, `PostgreSQL 16` |
| **Authentication** | Cryptographic Session Management | JWT Access (15m) + HttpOnly Cookie (7d) |
| **SMS Gateway** | Geez SMS / Ethio Telecom | HTTP REST SMS Delivery |
| **Email Gateway** | Brevo (Sendinblue) | Transactional SMTP |
| **PWA Engine** | Custom Service Worker | Cache-First Public / Network-Only Private |

---

## 3. Enterprise Security & Session Management

> **Security Rule:** A JSON Web Token (JWT) alone does not make an application secure. Session revocation, token lifecycle management, secure cookie flags, and database-level versioning are mandatory.

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

1. **Zero Credential Web Storage:**
   - Access tokens, refresh tokens, and passwords are **never** stored in `localStorage`, `sessionStorage`, or `IndexedDB`.
   - Protects completely against Cross-Site Scripting (XSS) credential theft.

2. **Cryptographic Token Family Rotation:**
   - Every refresh request invalidates the prior refresh token and issues a new token linked to the same session `family`.
   - **Reuse Detection:** If an invalidated or stolen token is ever presented again, the system identifies the breach, invalidates the **entire token family**, and revokes all active sessions for that user.

3. **Atomic Revocation & Token Versioning:**
   - The `User` database record contains an integer `tokenVersion` (`@default(1)`).
   - Any sensitive operation (Password Reset, "Sign Out All Devices", Admin Suspend) atomically increments `user.tokenVersion`.
   - The `requireAuth` middleware verifies `jwt.tokenVersion === dbUser.tokenVersion`, immediately rejecting previously issued tokens without waiting for their expiration.

4. **HttpOnly Cookie Configuration:**
   ```typescript
   {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     path: '/',
     maxAge: 7 * 24 * 60 * 60 * 1000
   }
   ```

5. **Anti-User Enumeration:**
   - The Forgot Password endpoint (`POST /api/auth/forgot-password`) always returns a standardized generic message:
     `"If an account exists with that identifier, a verification code has been sent."`
   - Prevents attackers from harvesting registered phone numbers and emails.

6. **Sliding-Window Rate Limiting:**
   - `authRateLimiter`: 20 requests / 15 minutes for registration and login.
   - `passwordRecoveryLimiter`: 5 recovery attempts / 15 minutes.
   - `otpVerificationLimiter`: 6 verification attempts / 15 minutes.

7. **Google OAuth 2.0 & Identity Linking Architecture:**
   - **Google Identity Verification:** Verified on the trusted server using official `google-auth-library` (`verifyIdToken` with signature, expiration, issuer, and audience validation against `GOOGLE_CLIENT_ID`).
   - **Stable Identity Identifier:** Accounts link to Google's immutable `sub` claim in the `LinkedIdentity` model (`@@unique([provider, providerSub])`), never relying solely on display names.
   - **Account Takeover Defense:** When a Google account email matches an existing local account that has not yet been linked, the server **strictly refuses silent merging**. It returns `409 Conflict` with `requiresLinkVerification: true`. The client prompts the user for their existing account password to confirm ownership via `POST /api/auth/google/link`.
   - **Safe Customer Role Defaults:** All new users registered via Google automatically receive the `BUYER` role and `PENDING_ROLE` onboarding status. Public OAuth can never self-grant elevated permissions (`ADMIN` or `SUPERADMIN`).
   - **Safe Password-less Handling:** Google-first accounts store `passwordHash: null` rather than dummy strings. Standard password login attempts return an intuitive message instructing the user to sign in with Google or reset their password.

---

## 4. Native Autofill & Credential Standards

> **Autofill Rule:** Native browser autofill is not application-managed storage. Applications must configure the correct HTML autocomplete attributes and let the browser or password manager save and suggest credentials securely.

AgriMarket strictly follows W3C and HTML Living Standard form specifications:

| Form Field | Standard HTML Attribute | Accessibility & Form Context |
| :--- | :--- | :--- |
| **Full Name** | `autoComplete="name"` | `<input id="fullName" name="fullName" type="text">` |
| **Phone Number** | `autoComplete="tel"` | `<input id="phone" name="phone" type="tel">` |
| **Email Address** | `autoComplete="email"` | `<input id="email" name="email" type="email">` |
| **Registration Password** | `autoComplete="new-password"` | `<input id="password" name="password" type="password">` |
| **Login Identifier** | `autoComplete="username"` | Dual input supporting phone or email |
| **Login Password** | `autoComplete="current-password"` | `<input id="password" name="password" type="password">` |
| **Password Reset** | `autoComplete="new-password"` | `<input id="newPassword" name="newPassword">` |
| **6-Digit OTP / Code** | `autoComplete="one-time-code"` | Supports mobile SMS autofill detection |

### Design Standards Enforced

- **Explicit `<label>` association:** All inputs possess matching `id` and `htmlFor` attributes.
- **Semantic `<form>` elements:** Forms submit through standard submit events with `noValidate` allowing rich custom tooltips while retaining native password manager save prompts.
- **Zero dynamic field renaming:** Input names and DOM elements remain stable across re-renders to prevent breaking autofill heuristics.
- **No JS credential interception:** The application never stores user credentials in custom client-side key-value stores.

---

## 5. Progressive Web App (PWA) & Cache Isolation

> **PWA Privacy Rule:** Service workers must strictly respect authentication. Never cache private dashboards, orders, or delivery data where another user on a shared mobile phone or device could view them.

AgriMarket features a Progressive Web App (PWA) engine with **Strict Auth-Aware Cache Isolation** in `public/sw.js` (v1.1.0):

```
                                  [Service Worker Fetch Event]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [Is Private Route / API?]                                     [Is Public Static Asset?]
  - /dashboard/*, /onboarding/*                                  - /, /login, /signup
  - /admin/*, /orders/*, /api/*                                  - /offline, CSS, JS, Images
                 │                                                             │
                 ▼                                                             ▼
       [STRICT NETWORK ONLY]                                         [STALE-WHILE-REVALIDATE]
   Fetch with { cache: 'no-store' }                               Serve from cache instantly;
   If network fails:                                              update from network in background.
   Serve /offline fallback page.
   NEVER WRITE TO LOCAL CACHE!
```

### PWA Capabilities

- **Offline Shell & Fallback:** Users receive a branded, responsive `/offline` page when disconnected from cellular networks.
- **Zero Cross-User Leakage:** A farmer or delivery courier signing out of a shared phone will never leave cached orders, addresses, or profile data visible to the next user.
- **Modern Web Manifest:** Configured with emerald green theme color (`#075C3B`), standalone launch display, and direct marketplace shortcuts.

---

## 6. Input Validation & Boundary Enforcement

Every input in the system is validated and sanitized at both the frontend boundary and the backend service layer:

### 1. Full Name Validation
- **Boundary:** Minimum 2 characters, maximum 100 characters.
- **International Character Support:** Native acceptance of Ethiopian Ge'ez / Amharic script (e.g. `አበበ ቢቂላ`, `ኃይሌ ገብረሥላሴ`) and Oromo / Tigrinya orthographies.
- **Sanitization:** Surrounding whitespace is automatically trimmed.

### 2. Ethiopian Phone Number Normalization
- **Canonical Representation:** Stored strictly as E.164 (`+251XXXXXXXXX`).
- **Input Flexibility:** Accepts local formats (`0911223344`, `0711223344`), raw numbers without plus (`251911...`), and symbols (`+251 (91) 122-3344`).
- **Carrier Validation:**
  - Ethio Telecom: `+251 9...`
  - Safaricom Ethiopia: `+251 7...`
  - Rejects invalid prefixes (`08...`, foreign numbers) with descriptive error messages.

### 3. Email Address Validation
- **Optionality:** Email is optional during registration to accommodate farmers who only possess a mobile phone.
- **Syntax & Normalization:** Validated against RFC 5322 regex and stored strictly lowercase and trimmed.

### 4. Password Policy
- **Boundary:** Minimum 8 characters, maximum 128 characters.
- **Complexity Requirements:** At least 1 uppercase letter (`[A-Z]`), at least 1 digit (`[0-9]`), and at least 1 special symbol (`[^A-Za-z0-9]`).
- **Integrity:** Passwords are never trimmed, truncated, or logged.

### 5. Geographic Coordinate Boundaries
- **Latitude:** Strictly `[-90.0, 90.0]`.
- **Longitude:** Strictly `[-180.0, 180.0]`.
- **Accuracy:** Non-negative float representing meters (`accuracy >= 0`).
- **Heading:** Compass degrees `[0.0, 360.0]`.

---

## 7. User Roles & Onboarding Lifecycles

AgriMarket implements a 5-tier Role-Based Access Control (RBAC) hierarchy:

```text
BUYER  ──►  FARMER  ──►  DELIVERY_WORKER  ──►  ADMIN  ──►  SUPERADMIN
```

### Onboarding Lifecycles

```
[New User Registration]
       │
       ▼
[Dual-Channel OTP Verification]
       │
       ▼
[Role Selection: /onboarding/select-role]
       │
       ├─► BUYER ──────────► Profile Created ──► Immediate COMPLETED Status ──► Marketplace
       │
       ├─► FARMER ─────────► Farm Details ──► Kebele/Land Deed Upload (Compressed) ──► PENDING_VERIFICATION
       │                                                                                      │
       └─► DELIVERY_WORKER ─► Vehicle & License ──► GPS Consent ──────────────────────► Admin Approval
```

### Rural Connectivity Optimizations

1. **Client-Side Document Compression:**
   - Farmers uploading Kebele IDs or land certificates frequently capture 8–15 MB photos on mobile cameras.
   - Browser-side HTML5 canvas dynamically resizes and converts images to JPEG (`quality: 0.82`, max dimension 1600px), reducing payload size by ~95% (< 500 KB) before upload.
2. **Automated SMS Draft Resumption:**
   - When a farmer pauses onboarding to locate cooperative letters or land deeds, saving a draft automatically triggers an SMS via Geez SMS containing a session link to resume in 1-click.
3. **Real-Time Verification Webhooks:**
   - Admin verification or rejection in `/dashboard/admin` sends immediate automated SMS notifications to the applicant's phone number.

---

## 8. Logistics, Geolocation & Escrow

- **Consent-First Tracking:** Couriers must explicitly grant location permissions. Coordinates are logged with timestamp, accuracy, heading, and speed under strict user ownership.
- **Disaster Dispatching:** Haversine geofencing matches orders with couriers operating in the matching woreda or municipal delivery zone.
- **ETB Escrow Mechanism:** Payments remain safely in escrow until the customer inspects fresh produce and confirms delivery via secure PIN or signature.

---

## 9. API Specifications & Endpoints

All endpoints return standardized JSON structures:
- Success: `{ "success": true, "message"?: string, "data": { ... } }`
- Error: `{ "success": false, "error": { "field"?: string, "message": string } }`

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user with phone & password | No |
| `POST` | `/api/auth/login` | Dual identifier login (phone or email) | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit registration OTP | No |
| `POST` | `/api/auth/resend-otp` | Resend verification code via SMS/Email | No |
| `POST` | `/api/auth/refresh` | Rotate session & receive new access token | Cookie |
| `POST` | `/api/auth/logout` | Revoke current refresh token and clear cookie | No |
| `POST` | `/api/auth/logout-all` | Revoke all active sessions (increments version)| Yes (JWT) |
| `POST` | `/api/auth/forgot-password` | Request password reset recovery code | No |
| `POST` | `/api/auth/verify-reset-code` | Validate 6-digit password recovery code | No |
| `POST` | `/api/auth/reset-password` | Set new password with verified code | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & role | Yes (JWT) |

### Onboarding & Verification (`/api/onboarding`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/onboarding/status` | Current onboarding and verification status | Yes (JWT) |
| `POST` | `/api/onboarding/select-role` | Select BUYER, FARMER, or DELIVERY_WORKER | Yes (JWT) |
| `POST` | `/api/onboarding/draft` | Save draft onboarding application (Sends SMS)| Yes (JWT) |
| `GET` | `/api/onboarding/draft` | Retrieve saved draft application data | Yes (JWT) |
| `POST` | `/api/onboarding/upload` | Upload compressed verification document | Yes (JWT) |
| `GET` | `/api/onboarding/documents/:filename`| Secure document download (Ownership check)| Yes (JWT) |
| `POST` | `/api/onboarding/submit-farmer`| Submit farmer verification application | Yes (JWT) |
| `POST` | `/api/onboarding/submit-worker`| Submit courier verification application | Yes (JWT) |

### Geolocation & Couriers (`/api/location`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/location/share` | Submit real-time consented GPS coordinate | Yes (Worker) |
| `GET` | `/api/location/admin/records` | Audit trail of courier locations | Yes (Admin) |

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
│   │   └── schema.prisma               # Models: User, RefreshToken, OTPVerification, etc.
│   ├── src/
│   │   ├── config/                     # Prisma & Database Connections
│   │   ├── controllers/                # Request Handlers (Auth, Onboarding, Location, etc.)
│   │   ├── middleware/                 # Rate Limiting, RBAC & requireAuth Guards
│   │   ├── routes/                     # Mounted Express Route Modules
│   │   ├── services/                   # Business Logic, Tokens & Notifications
│   │   ├── tests/                      # Automated Integration & Boundary Test Suites
│   │   │   ├── boundary.test.ts        # 79 Input Boundary & Normalization Assertions
│   │   │   ├── auth.test.ts            # 32 Session Security & Token Rotation Assertions
│   │   │   ├── location.test.ts        # 8 Geolocation Range Assertions
│   │   │   ├── delivery.test.ts        # 18 Logistics & Courier Assertions
│   │   │   └── onboarding.test.ts      # 8 Onboarding & State Machine Assertions
│   │   ├── app.ts                      # Express App Definition & CSP Configuration
│   │   └── index.ts                    # Server Bootstrap (Port 5000)
│   └── package.json
│
└── frontend/                           # Next.js 16 + React 19 Frontend
    ├── public/
    │   ├── icons/                      # PWA High-Resolution Icons (192, 512, Maskable)
    │   ├── images/                     # Curated Agricultural Photography
    │   ├── manifest.webmanifest        # Progressive Web App Manifest
    │   └── sw.js                       # Auth-Aware Service Worker v1.1.0
    ├── src/
    │   ├── app/
    │   │   ├── login/                  # Standards-Compliant Login Page
    │   │   ├── signup/                 # Multi-Step Signup & OTP Verification
    │   │   ├── forgot-password/        # Password Recovery Request
    │   │   ├── reset-password/         # Secure Password Reset with 6-Digit Code
    │   │   ├── verify-otp/             # Standalone OTP Verification View
    │   │   ├── offline/                # Branded PWA Offline Fallback
    │   │   ├── onboarding/             # Role Selection & Verification Wizards
    │   │   └── dashboard/              # Buyer, Farmer, Worker & Admin Dashboards
    │   ├── components/                 # Reusable UI & Layout Components
    │   ├── context/                    # AuthContext & ThemeContext
    │   └── lib/                        # In-Memory Auth Manager & API Bridges
    └── package.json
```

---

## 11. Environment Variables & Setup

All environment variables are centralized in the single `.env` file at the root of the project:

```ini
# Application Ports & URLs
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Database (PostgreSQL / Neon Serverless)
DATABASE_URL=postgresql://neondb_owner:npg_gL9hUqF4vNyd@ep-tiny-paper-a859vbt4-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&connect_timeout=15

# Cryptographic Authentication Secrets
JWT_SECRET=super_secret_jwt_agrimarket_ethiopia_2026_enterprise_grade_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# SMS Provider (Geez SMS / Ethio Telecom)
GEEZ_SMS_TOKEN=your_geez_sms_api_token
GEEZ_SMS_SENDER_ID=AgriMarket

# Email Provider (Brevo / Sendinblue SMTP)
BREVO_SMTP_KEY=your_brevo_smtp_key
BREVO_SMTP_USER=your_brevo_verified_sender@domain.com
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
```

---

## 12. Local Development & Production Build

### 1. Prerequisites
- **Node.js:** `v20.x` or `v22.x`
- **npm:** `v10.x+`
- **PostgreSQL:** Local instance or cloud database (Neon)

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Initialize Database
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 4. Run Development Servers
Open two terminal windows:

```bash
# Terminal 1: Start Backend (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 3000)
cd frontend
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 5. Production Compilation
```bash
# Build Backend
cd backend
npm run build

# Build Frontend
cd ../frontend
npm run build
```

---

## 13. Automated Test Suites

AgriMarket includes an automated test harness covering security, boundaries, authentication, location, and logistics.

To run all test suites simultaneously:
```bash
cd backend
npm test
```

### Breakdown of Test Suites

| Suite Name | Command | Test File | Assertions | Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Boundary Suite** | `npm run test:boundary` | `boundary.test.ts` | **79 Passed** | Full name length & Unicode, Ethiopian phone E.164, email syntax, password policy, OTP length, GPS range `[-90, 90]`. |
| **Auth & Security**| `npm run test:auth` | `auth.test.ts` | **32 Passed** | Dual identifier login, token family rotation, reuse theft detection, anti-enumeration, single-use reset OTP, atomic versioning. |
| **Google OAuth**   | `npm run test:google` | `google-auth.test.ts` | **39 Passed** | Google credential verification, stable `sub` identity linking, account takeover protection (409 conflict), password verification, safe default customer role (`BUYER`), suspended account rejection. |
| **Location Suite** | `npm run test:location` | `location.test.ts` | **8 Passed** | Explicit user consent, numeric coordinate verification, accuracy bounds, role-based location access. |
| **Delivery Suite** | `npm run test:delivery` | `delivery.test.ts` | **18 Passed** | Courier assignment, status transitions, vehicle capacity, live tracking updates. |
| **Onboarding Suite**| `npm run test:onboarding`| `onboarding.test.ts` | **8 Passed** | Multi-step role transition, draft persistence, document upload validation, admin approval/rejection. |
| **Total** | — | — | **184 Passed, 0 Failed** | **100% Passing Test Rate** |

---

## 14. License & Credits

- **License:** Proprietary — All Rights Reserved. Built for Ethiopian Agricultural Commerce.
- **Architected By:** Senior Full-Stack Engineering & Application Security Team.
- **Special Thanks:** Built with support from Ethiopian agricultural cooperatives, local transport providers, and rural market communities.
