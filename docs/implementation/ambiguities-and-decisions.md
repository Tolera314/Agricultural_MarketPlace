# AgriMarket: Ambiguities, Architectural Decisions & Resolutions

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Source Document:** `user_flow.md`  

---

## 1. Architectural Ambiguities & Technical Decisions

### Decision 1: Single-Seller vs. Multi-Farmer Cart Checkout
- **Context & Ambiguity:** `user_flow.md` Section 6.4 instructs: *"Inspect whether the existing business model and database support orders containing products from multiple farmers... If supported, implement correct order grouping... If not supported, enforce the existing single-seller checkout policy and communicate the restriction clearly."*
- **Database Inspection:**
  - `schema.prisma` models `Order` with `items OrderItem[]` where each item links to a `ProductListing`.
  - However, `DeliveryJob` has a 1-to-1 relationship with `Order` (`orderId String @unique`) and defines a single physical pickup coordinate pair: `pickupLatitude` and `pickupLongitude`.
  - If a buyer checks out with potatoes from Farm A (Sebeta) and coffee from Farm B (Sidama) in a single `Order`, a local delivery worker assigned to that job cannot pick up from two disparate geographical points simultaneously.
- **Architectural Resolution:**
  - **Cart Level:** The buyer cart allows adding items from different farmers for discovery convenience.
  - **Checkout Level (Order Partitioning):** At checkout submission, the system groups items by `farmerId`. It generates a discrete child `Order` per farmer (sharing a common transaction or payment group identifier).
  - **Operational Consequence:** Each farmer receives their own order and confirms pickup; each order spawns its own `DeliveryJob` with correct pickup coordinates; delivery workers can accept and fulfill jobs independently.

---

### Decision 2: Unifying `buyer.service.ts` with PostgreSQL Prisma
- **Context & Ambiguity:** The white-box code audit revealed that `backend/src/services/buyer.service.ts` currently performs catalog searches and order creation against an in-memory class named `ResilientBuyerStore`. Meanwhile, `admin.service.ts`, `farmer.controller.ts`, `worker.controller.ts`, and `message.service.ts` interact directly with Neon PostgreSQL via Prisma.
- **Impact:**
  - Products created by verified farmers via `POST /api/farmer/products` were stored in PostgreSQL `product_listings` table, but were invisible in buyer searches because `buyer.service.ts` searched `resilientStore.listings`.
  - Orders placed by buyers in checkout were stored in Node.js memory (`resilientStore.orders`), so administrators querying `prisma.order` could not see buyer orders.
- **Architectural Resolution:**
  - Bridge `buyer.service.ts` directly to Prisma.
  - All read queries (`searchProducts`, `getProductDetails`, `getNearbyFarmers`, `getAddresses`, `getOrders`) must query PostgreSQL tables: `product_listings`, `orders`, `order_items`, `buyer_addresses`.
  - All write mutations (`createBuyerOrder`, `createAddress`, `cancelOrder`) must write to PostgreSQL tables inside database transactions (`prisma.$transaction`).
  - Retain `ResilientBuyerStore` strictly as a graceful degradation fallback if the external database is temporarily unreachable.

---

### Decision 3: Farmer Dashboard Frontend Integration
- **Context & Ambiguity:** In `backend/src/controllers/farmer.controller.ts`, the backend has complete PostgreSQL CRUD endpoints (`getFarmerDashboard`, `getMyProducts`, `createProduct`, `updateProduct`, `deleteProduct`) protected by `requireAuth` and strict `verificationStatus === 'VERIFIED'` gating.
- However, `frontend/src/components/farmer/MyProductsContent.tsx` was rendering a local React state array `INITIAL_PRODUCTS: Product[] = [...]` and modifying it in browser memory without calling `farmerApi`.
- **Architectural Resolution:**
  - Connect `MyProductsContent.tsx` to `farmerApi.getMyProducts()`.
  - Wire product creation to `farmerApi.createProduct()`, triggering backend validation and Cloudinary image uploading.
  - Wire product editing to `farmerApi.updateProduct()` and deletion to `farmerApi.deleteProduct()`.
  - In `FarmerDashboardContent.tsx`, replace static `STATS` with real metrics returned by `GET /api/farmer/dashboard` (`totalProducts`, `activeProducts`, `totalOrders`, `pendingOrders`).

---

### Decision 4: Agricultural Input Company Role & Category Model
- **Context & Ambiguity:** `user_flow.md` Section 9 introduces Agricultural Input Companies as a separate marketplace participant providing certified seeds, fertilizers, and plant medicines to farmers.
- In `backend/prisma/schema.prisma`, `enum Role` currently defines:
  ```prisma
  enum Role {
    FARMER
    BUYER
    DELIVERY_WORKER
    ADMIN
    SUPERADMIN
  }
  ```
  `schema.prisma` already defines `Category` taxonomy with slugs such as `seeds` and `seeds-inputs`.
- **Architectural Resolution:**
  - Agricultural Input Companies register and operate through the commercial verified provider workflow.
  - Input listings are categorized under dedicated input categories (`seeds-inputs`, `fertilizers-agrochem`).
  - To preserve existing database schema compatibility and avoid destructive migrations on the live database, input products leverage the existing `ProductListing` model with specialized metadata (e.g. usage instructions, safety certifications in `description` and `qualityGrade`).
  - In a future planned migration, `Role.INPUT_COMPANY` and dedicated `input_company_profiles` will be formally added.

---

### Decision 5: Chapa Payment Gateway & Sandbox Fallback
- **Context & Ambiguity:** `user_flow.md` § 8.1 requires integrating Chapa for digital payments and validating server-side webhooks. The root `.env` currently contains configurations for Neon DB, Brevo SMTP, Geez SMS, Google OAuth, and Cloudinary, but does not define `CHAPA_SECRET_KEY`.
- **Architectural Resolution:**
  - Create `backend/src/services/payment.service.ts` encapsulating the Chapa API contract:
    - `initializePayment(orderId, amount, currency, email, phone)`
    - `verifyWebhookSignature(signature, payload)`
    - `verifyTransaction(txRef)`
  - When `CHAPA_SECRET_KEY` is present in `.env`, execute live HTTPS API calls to `https://api.chapa.co/v1/transaction/initialize` and verify with Chapa's webhook signature.
  - When `CHAPA_SECRET_KEY` is absent (development/testing mode), gracefully process the transaction through a deterministic sandbox mock that records payments in PostgreSQL `payments` table with status `COMPLETED`, ensuring complete checkout flow functionality without external blockers.

---

### Decision 6: Location Privacy & Farm Coordinates
- **Context & Ambiguity:** `user_flow.md` § 6.2 states: *"Do not expose exact private farm coordinates."*
- However, the server needs precise coordinates to calculate accurate distances using the Haversine formula and to give delivery workers precise pickup navigation.
- **Architectural Resolution:**
  - **Database Level:** Stores exact `Float` pairs (`pickupLatitude`, `pickupLongitude`) in `product_listings` and `farmLatitude`, `farmLongitude` in `farmer_profiles`.
  - **Public Buyer Endpoints (`/api/buyer/products`, `/api/buyer/farmers`):** Coordinates are stripped before serialization. Only formatted distance strings (e.g. `"2.5 km"`) and broad location names (e.g. `"Sebeta, Oromia"`) are returned.
  - **Assigned Worker Endpoints (`/api/worker/deliveries/active`):** Coordinates are provided only to the worker who has accepted the active delivery job for physical route navigation.
