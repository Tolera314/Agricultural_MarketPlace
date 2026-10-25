# AgriMarket Buyer Dashboard — Complete Functional Implementation Specification

## System Architecture & Integration Overview
AgriMarket connects Ethiopian agricultural market participants (Farmers, Buyers, Logistics Couriers, Wholesalers) through a location-aware digital marketplace. This document describes the completed functional implementation of the Buyer/Customer Dashboard according to production standards and the approved visual reference.

---

## 1. Core Marketplace Business Rules Implemented

### A. Nearest Eligible Farmer First (Distance-Based Ranking)
- **Principle**: The platform calculates distance using the Haversine formula between the buyer's active delivery destination coordinates and the farm/pickup location coordinates.
- **Strict Sorting**: The default ranking strictly sorts eligible farmers and their products in ascending order of distance (nearest to farthest). A farther farmer never appears ahead of a nearer eligible farmer simply because of lower prices, ratings, or older registration.
- **Fallbacks**: If geolocation permission is denied by the buyer, the marketplace defaults to the buyer's selected delivery address or city center (Addis Ababa default: `9.0125, 38.7636`) without blocking access.
- **Eligibility Verification**: Only listings with active status (`ListingStatus.ACTIVE`) and positive available inventory (`stockQuantity > 0`) from non-suspended farmers are included.

### B. Farmer-Controlled Product Prices & Immutable Order Snapshots
- **Farmer Pricing Autonomy**: Listed product prices are strictly farmer-defined and displayed with their respective agricultural units (`ETB 50 - 80 /kg`, `ETB 450 /kg`, etc.).
- **Transparent Fee Breakdown**: At checkout, the system computes:
  - `productSubtotal`: `sum(item.quantity * item.pricePerUnit)`
  - `deliveryFee`: Local flat fee (ETB 50) within service radius
  - `platformCommission`: 5% transparent platform fee
  - `totalAmount`: `productSubtotal + deliveryFee + platformCommission`
- **Immutable Order Snapshot**: When an order is placed, `OrderItem` locks `agreedUnitPrice`, `quantity`, `subtotal`, and a complete snapshot of listing data (`name`, `unit`, `farmerName`, `farmName`). Subsequent farmer price changes never alter historical or confirmed orders.

### C. Concurrency-Safe Inventory & Idempotency
- **Atomic Stock Reservation**: Order confirmation atomically decrements available stock and transitions exhausted listings to `OUT_OF_STOCK`.
- **Idempotency Protection**: Every checkout transaction accepts an `idempotencyKey` to prevent duplicate orders and double charges resulting from rapid clicks, browser retries, or payment gateway callbacks.

### D. Order Lifecycle & Cancellation Rules
- **State Machine**: Orders transition through `CONFIRMED` → `PREPARING` → `READY_FOR_PICKUP` → `IN_TRANSIT` → `DELIVERED` (or `CANCELLED`).
- **Cancellation Boundary**: Buyer-initiated cancellation is permitted only while the order is in pre-transit status (`CONFIRMED`, `PREPARING`). Once the courier has picked up the goods and transit has started (`IN_TRANSIT`), direct cancellation is blocked and redirected to support/dispute resolution. Cancelling an order automatically restores reserved stock.

### E. Delivery Address Protection
- **Multi-Address Support**: Buyers can save multiple addresses with labels (`Home`, `Office`, `Farm Gate`), street addresses, subcities, and geographic coordinates.
- **Active Order Deletion Guard**: An address currently linked to an active unfulfilled order (`CONFIRMED`, `PREPARING`, `IN_TRANSIT`) cannot be deleted, protecting in-flight delivery couriers.

---

## 2. API Endpoints Reference (`/api/buyer`)

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/buyer/dashboard` | Public / Buyer | Aggregated dashboard metrics, nearby farmers, popular categories, recent orders |
| `GET` | `/api/buyer/farmers/nearby` | Public / Buyer | Haversine distance-ranked eligible farmers (`lat`, `lng`, `radius`) |
| `GET` | `/api/buyer/products` | Public / Buyer | Product search & filtering (`search`, `category`, `sortBy`, `minPrice`, `maxPrice`) |
| `POST` | `/api/buyer/checkout/calculate` | Public / Buyer | Cost calculation (subtotal, delivery fee, 5% fee, total) |
| `POST` | `/api/buyer/orders` | Buyer (RBAC) | Idempotent order creation with immutable price snapshots & atomic stock reservation |
| `GET` | `/api/buyer/orders` | Buyer (RBAC) | Buyer order history with status filters |
| `GET` | `/api/buyer/orders/:orderId` | Buyer (RBAC) | Order detail view |
| `POST` | `/api/buyer/orders/:orderId/cancel`| Buyer (RBAC) | Pre-transit order cancellation & stock restoration |
| `GET` | `/api/buyer/orders/:orderId/tracking`| Buyer (RBAC) | Delivery progress, assigned courier details, and timeline |
| `GET` | `/api/buyer/addresses` | Buyer (RBAC) | Buyer delivery addresses list |
| `POST` | `/api/buyer/addresses` | Buyer (RBAC) | Add new delivery address with coordinates |
| `PUT` | `/api/buyer/addresses/:id` | Buyer (RBAC) | Update delivery address |
| `DELETE` | `/api/buyer/addresses/:id` | Buyer (RBAC) | Delete address with active order protection |
| `GET` | `/api/buyer/saved-farmers` | Buyer (RBAC) | List saved farmers and their active harvests |
| `POST` | `/api/buyer/saved-farmers/:id/toggle`| Buyer (RBAC)| Save / unsave farmer |
| `GET` | `/api/buyer/favorites` | Buyer (RBAC) | List favorited products |
| `POST` | `/api/buyer/favorites/:id/toggle`| Buyer (RBAC) | Toggle product favorite |
| `GET` | `/api/buyer/notifications` | Buyer (RBAC) | In-app notification feed |
| `PATCH` | `/api/buyer/notifications/:id/read` | Buyer (RBAC) | Mark notification as read |
| `POST` | `/api/buyer/support` | Buyer (RBAC) | Submit order-related inquiry or dispute |

---

## 3. Automated Test Results

### Suite: `buyer.test.ts` (14 Tests)
- [x] **Test 1**: Dashboard overview returns authentic metrics (Total Orders: 5, Saved Farmers: 12, Spent: ETB 8,450).
- [x] **Test 2**: Strictly ranks eligible farmers nearest-first (`Abebe 2.1km < Mekannen 3.1km < Heran 4.7km`).
- [x] **Test 3**: Gracefully supports default location when location permission is denied.
- [x] **Test 4**: Browse products defaults to nearest-first distance ranking.
- [x] **Test 5**: Optional sorting by `price_asc` functions without breaking default nearest ranking.
- [x] **Test 6**: Transparent checkout calculation verifies farmer-controlled price subtotal and platform fee.
- [x] **Test 7**: Concurrency-safe inventory validation rejects purchasing unavailable stock.
- [x] **Test 8**: Order creation creates immutable price snapshot and atomically decrements inventory.
- [x] **Test 9**: Idempotency key prevents duplicate orders and double stock deductions on network retry.
- [x] **Test 10**: Permitted order cancellation succeeds prior to courier dispatch.
- [x] **Test 11**: Rejects cancellation once order is in transit, directing to dispute/support.
- [x] **Test 12**: Protects addresses required by active deliveries from accidental deletion.
- [x] **Test 13**: Saved farmers and favorite products toggle persistently without side effects.
- [x] **Test 14**: Enforces RBAC: Rejects unauthenticated (401) and incorrect role (403) from buyer order creation.

### Suite: `location.test.ts` (8 Tests)
- [x] Consent-based geolocation sharing & RBAC audit controls: 8 passed, 0 failed.

**Total automated tests passing**: 22 passed, 0 failed.
