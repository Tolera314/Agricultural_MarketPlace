# AgriMarket: Complete Workflow Inventory

**Document Version:** 1.0.0  
**Status:** Authoritative Specification  
**Source Document:** `user_flow.md`  

---

## Index of Workflows

- **WF-GUEST-01:** Unauthenticated Marketplace Discovery & Browsing
- **WF-AUTH-01:** Standard User Registration with 6-Digit OTP Verification
- **WF-AUTH-02:** User Authentication, JWT Issuance & Session Management
- **WF-AUTH-03:** Password Recovery via Time-Limited OTP Code
- **WF-AUTH-04:** Federated Google OAuth Sign-in & Account Linking
- **WF-AUTH-05:** Cloudinary Avatar Profile Image Management
- **WF-ONBOARD-01:** Initial Role Selection & Profile Initialization
- **WF-ONBOARD-02:** Multi-Step Farmer Verification Application & Document Streaming
- **WF-ONBOARD-03:** Multi-Step Delivery Worker Verification Application
- **WF-ONBOARD-04:** Agricultural Input Company Application Submission
- **WF-FARMER-01:** Product Listing Creation with Image Upload & Pricing Autonomy
- **WF-FARMER-02:** Product Listing Modification, Status Toggle & Deletion
- **WF-FARMER-03:** Concurrency-Safe Inventory Management & Stock Adjustments
- **WF-FARMER-04:** Farmer Order Fulfillment, Preparation & Handover
- **WF-BUYER-01:** Nearest-First Proximity Marketplace Discovery
- **WF-BUYER-02:** Server-Side Price Calculation & Cart Validation
- **WF-BUYER-03:** Order Creation & Stock Reservation
- **WF-BUYER-04:** Real-Time Order Tracking & Milestone Visualization
- **WF-BUYER-05:** Buyer Delivery Address Management (CRUD)
- **WF-BUYER-06:** Direct 1-on-1 Real-Time Chat with Farmers
- **WF-DELIVERY-01:** Delivery Worker Availability & Real-Time GPS Sharing
- **WF-DELIVERY-02:** Proximity Broadcast & Atomic Job Acceptance
- **WF-DELIVERY-03:** Delivery State Machine Execution & Route Navigation
- **WF-DELIVERY-04:** Digital Proof of Delivery (POD) & Buyer Confirmation OTP
- **WF-DELIVERY-05:** Roadside Incident & Delay Reporting
- **WF-DELIVERY-06:** Cash-on-Delivery (COD) Collection & Daily Reconciliation
- **WF-INTERCITY-01:** Cross-City Bulk Purchase Evaluation & Eligibility Check
- **WF-INTERCITY-02:** Administrator Intercity Route Approval & Dispatch Coordination
- **WF-PAYMENT-01:** Digital Payment Processing (Chapa / Telebirr) & Webhook Verification
- **WF-PAYMENT-02:** Payment Failure, Recovery & Stock Release
- **WF-INPUTS-01:** Input Company Product Management (Seeds & Agrochemicals)
- **WF-INPUTS-02:** Farmer Purchasing of Agricultural Inputs
- **WF-ADMIN-01:** Operational Dashboard Metrics & Live Activity Oversight
- **WF-ADMIN-02:** Farmer Application Review & Verification Adjudication
- **WF-ADMIN-03:** Delivery Worker Application Review & Fleet Verification
- **WF-ADMIN-04:** Inappropriate Product Listing Moderation & Action
- **WF-ADMIN-05:** Intercity Logistics Route Configuration & Quantity Thresholds
- **WF-ADMIN-06:** Dispute Filing, Evidence Investigation & Arbitration
- **WF-ADMIN-07:** COD Cash Reconciliation Review & Settlement Approval
- **WF-SUPERADMIN-01:** Administrator Provisioning & RBAC Role Elevation
- **WF-SUPERADMIN-02:** Global Session Revocation & Account Suspension
- **WF-SUPERADMIN-03:** Platform Commission Rules & Financial Limits Management
- **WF-SUPERADMIN-04:** Database Health Diagnostic & Snapshot Backup Trigger

---

## Detailed Workflow Specifications

### WF-GUEST-01: Unauthenticated Marketplace Discovery & Browsing
| Field | Specification |
|---|---|
| **Actor** | Guest Visitor |
| **Preconditions** | User is not logged in. |
| **Trigger** | User navigates to `/`, `/products`, `/farmers`, or `/categories`. |
| **Main Steps** | 1. User loads catalog. 2. User searches keywords or filters by category. 3. System computes distance from default hub or user-permitted location. 4. User views product details, prices, and public farmer profiles. |
| **System Response** | Returns active listings with stock; hides private farm coordinates and administrative data; provides "Buy Now" and "Talk with Farmer" buttons. |
| **Business Rules** | No forced login walls for browsing. Only authenticated users can access checkout or messaging. |
| **Success Outcome** | Guest discovers products with full transparency into price and availability. |
| **Failure Scenarios** | 1. No internet connection $\rightarrow$ Offline fallback page shown. 2. Backend unavailable $\rightarrow$ Cached resilient catalog rendered. |
| **Recovery** | User retries or adjusts search filters. |
| **Dependencies** | Public API endpoints (`/api/buyer/products`, `/api/buyer/categories`). |
| **Verification** | Automated test: unauthenticated GET requests return 200 with sanitized data. |

---

### WF-AUTH-01: Standard User Registration with 6-Digit OTP Verification
| Field | Specification |
|---|---|
| **Actor** | Unregistered User |
| **Preconditions** | User has a valid Ethiopian phone number or email address. |
| **Trigger** | User submits the signup form at `/signup`. |
| **Main Steps** | 1. User enters Full Name, Phone, optional Email, Password. 2. System validates format and password strength. 3. System creates User record (`isVerified: false`). 4. System creates OTP record and dispatches via Geez SMS / Brevo Email. 5. UI displays 6-digit OTP modal. 6. User enters code. 7. System verifies code and activates account (`isVerified: true`). 8. User redirected to `/onboarding/select-role`. |
| **System Response** | Sends SMS/Email; returns user session token upon successful OTP match. |
| **Business Rules** | Rate limited (10 signups / 15m; 5 OTP attempts / 15m). OTP expires in 10 minutes. Phone numbers must follow E.164 format (`+2519...`). |
| **Success Outcome** | User is authenticated with verified status and redirected to role selection. |
| **Failure Scenarios** | 1. Duplicate phone/email $\rightarrow$ 409 Conflict with inline error. 2. Expired OTP $\rightarrow$ 400 Bad Request with "Resend OTP" button. 3. Invalid OTP $\rightarrow$ Shake animation with attempt counter decrement. |
| **Recovery** | User clicks "Resend Code" after 30s cooldown or updates their phone/email. |
| **Dependencies** | `prisma.user`, `prisma.oTPVerification`, Brevo SMTP, Geez SMS Gateway. |
| **Verification** | Automated test: register user, verify OTP in database, inspect JWT return. |

---

### WF-ONBOARD-02: Multi-Step Farmer Verification Application & Document Streaming
| Field | Specification |
|---|---|
| **Actor** | Authenticated User with `Role.FARMER` |
| **Preconditions** | User is logged in and selected role `FARMER` (`onboardingStatus: IN_PROGRESS`). |
| **Trigger** | User opens `/onboarding/farmer`. |
| **Main Steps** | 1. Step 1: Personal Info. 2. Step 2: Identification documents (National ID/Fayda). 3. Step 3: Farm details, Kebele/Woreda, GPS map coordinates. 4. Step 4: Agricultural categories & expected crops. 5. Step 5: Terms declaration & submission. 6. Documents stream directly to Cloudinary. 7. Creates `FarmerProfile` with `verificationStatus: PENDING`. 8. Redirects to `/dashboard/farmer?onboardingSuccess=true`. |
| **System Response** | Stores full dossier in PostgreSQL; files in Cloudinary; creates admin review notification; shows celebration banner on farmer dashboard while gating selling actions. |
| **Business Rules** | Farm name $\ge 2$ characters. Valid ID document mandatory. Farmer cannot publish active products or accept orders until verified by Admin. |
| **Success Outcome** | Application queued in Admin verification portal; farmer dashboard accessible in read-only exploration mode. |
| **Failure Scenarios** | 1. Upload exceeds 10MB $\rightarrow$ Client & server reject with clear size error. 2. Invalid file type $\rightarrow$ Magic bytes validation rejects non-PDF/PNG/JPEG. |
| **Recovery** | User adjusts files and clicks retry without losing step data (auto-saved draft). |
| **Dependencies** | `upload.ts`, `cloudinary.service.ts`, `prisma.farmerProfile`, `FarmerOnboardingForm.tsx`. |
| **Verification** | Test document upload stream; verify `FarmerProfile` record created with status `PENDING`. |

---

### WF-FARMER-01: Product Listing Creation with Image Upload & Pricing Autonomy
| Field | Specification |
|---|---|
| **Actor** | Verified Farmer |
| **Preconditions** | Farmer profile `verificationStatus === 'VERIFIED'`. |
| **Trigger** | Farmer clicks "Add Product" in `/dashboard/farmer/products`. |
| **Main Steps** | 1. Farmer fills name, category, price per unit (ETB), quantity, unit (`kg`, `quintal`), grade (`A`, `B`, `C`), intercity eligibility. 2. Uploads produce photo. 3. Clicks "Publish Listing". 4. Backend validates authorization and inputs. 5. Creates `ProductListing` and `ListingImage`. |
| **System Response** | Saves listing to PostgreSQL; returns 201 Created; listing immediately visible in public catalog. |
| **Business Rules** | Price per unit is strictly farmer-determined. Unverified farmers receive `403 Forbidden` (`VERIFICATION_REQUIRED`). Stock must be $> 0$. |
| **Success Outcome** | Listing is live and searchable by nearby buyers. |
| **Failure Scenarios** | 1. Unverified farmer attempts submit $\rightarrow$ Blocked with verification notice modal. 2. Negative price/quantity $\rightarrow$ 400 Validation error. |
| **Recovery** | Farmer corrects fields or completes verification. |
| **Dependencies** | `prisma.productListing`, `farmer.controller.ts`, `MyProductsContent.tsx`. |
| **Verification** | Integration test: verified farmer creates listing; unverified farmer receives 403. |

---

### WF-BUYER-01: Nearest-First Proximity Marketplace Discovery
| Field | Specification |
|---|---|
| **Actor** | Customer / Buyer |
| **Preconditions** | Marketplace contains active product listings with positive stock. |
| **Trigger** | Buyer visits `/products` or buyer dashboard. |
| **Main Steps** | 1. Client provides coordinates (or selected city). 2. Backend queries active listings from PostgreSQL. 3. Computes Haversine distance to each farmer's pickup location. 4. Sorts results ascending by distance ($d$). 5. Sanitizes coordinates to approximate distance strings. |
| **System Response** | Returns ranked list of products and nearby verified farmers. |
| **Business Rules** | Closest eligible farmers must appear first. Exact farm GPS coordinates are never returned to buyer clients. |
| **Success Outcome** | Buyer sees fresh local produce ranked by proximity. |
| **Failure Scenarios** | 1. Location permission denied $\rightarrow$ Fallback to city center coordinates. |
| **Recovery** | Buyer manually selects delivery city from dropdown. |
| **Dependencies** | `prisma.productListing`, `buyer.service.ts`, `useGeolocation.ts`. |
| **Verification** | Unit test: distance calculation verified with known Addis Ababa / Mojo coordinates. |

---

### WF-BUYER-03: Order Creation & Concurrency-Safe Stock Reservation
| Field | Specification |
|---|---|
| **Actor** | Customer / Buyer |
| **Preconditions** | Buyer is authenticated; selected items exist with sufficient stock. |
| **Trigger** | Buyer clicks "Place Order" in checkout. |
| **Main Steps** | 1. Buyer submits cart items, delivery address, payment method. 2. Backend opens `prisma.$transaction`. 3. Recalculates product subtotal using server-side prices. 4. Evaluates platform commission and delivery fee. 5. Checks stock: `stockQuantity >= orderedQuantity`. 6. Decrements stock quantity atomically. 7. Creates `Order` and `OrderItem` records. 8. Creates `DeliveryJob` record. 9. Dispatches notifications to farmer. |
| **System Response** | Locks order; returns created order reference; clears buyer cart. |
| **Business Rules** | Client prices are completely ignored. Overselling is strictly prevented via row-level transactional locking. If stock is exhausted, listing status transitions to `OUT_OF_STOCK`. |
| **Success Outcome** | Order confirmed, inventory updated, delivery dispatch triggered. |
| **Failure Scenarios** | 1. Insufficient stock $\rightarrow$ Transaction aborts, 400 Bad Request returned with available quantity. 2. Payment failure $\rightarrow$ Stock reservation rolled back. |
| **Recovery** | Buyer adjusts order quantity or selects alternative product. |
| **Dependencies** | `prisma.order`, `prisma.orderItem`, `prisma.productListing`, `buyer.service.ts`. |
| **Verification** | Concurrency test: simulate 2 concurrent requests for the last 5 kg of tomatoes; verify only 1 succeeds. |

---

### WF-DELIVERY-02: Proximity Broadcast & Atomic Job Acceptance
| Field | Specification |
|---|---|
| **Actor** | Delivery Worker & System Dispatch Engine |
| **Preconditions** | Order is in `CONFIRMED` status; workers are `ONLINE` and `VERIFIED`. |
| **Trigger** | Order confirmed by farmer or payment gateway. |
| **Main Steps** | 1. Dispatch engine queries online verified delivery workers within 10 km radius. 2. Matches required vehicle capacity. 3. Inserts `DeliveryOffer` records with 60s expiration. 4. Workers receive push/in-app alert. 5. First worker clicks "Accept Offer". 6. Backend initiates `prisma.$transaction`. 7. Verifies offer is still `PENDING` and job `UNASSIGNED`. 8. Sets `DeliveryJob.assignedWorker = workerId`, `status: ASSIGNED`. 9. Cancels competing offers. |
| **System Response** | Assigns job to winning worker; removes job from other workers' feeds. |
| **Business Rules** | Atomic assignment: two workers can never accept the same delivery. Unverified or offline workers never receive broadcasts. |
| **Success Outcome** | Delivery job assigned to courier; pickup address and navigation revealed. |
| **Failure Scenarios** | 1. Worker clicks accept after another worker already accepted $\rightarrow$ 409 Conflict "Job already claimed". 2. All offers expire $\rightarrow$ Dispatch expands radius and re-broadcasts. |
| **Recovery** | Worker's feed refreshes to display next available job. |
| **Dependencies** | `dispatch.service.ts`, `worker.controller.ts`, `prisma.deliveryJob`, `prisma.deliveryOffer`. |
| **Verification** | Test race condition where 2 worker tokens attempt to accept the same offer simultaneously. |

---

### WF-DELIVERY-04: Digital Proof of Delivery (POD) & Buyer Confirmation OTP
| Field | Specification |
|---|---|
| **Actor** | Delivery Worker & Customer / Buyer |
| **Preconditions** | Job is `IN_TRANSIT`; worker arrives at buyer delivery address. |
| **Trigger** | Worker clicks "Complete Delivery" in mobile hub. |
| **Main Steps** | 1. Worker takes physical delivery photo. 2. Worker requests 6-digit confirmation OTP from buyer. 3. If COD, worker inputs cash collected amount. 4. Worker submits modal form. 5. Image streams to Cloudinary. 6. Backend validates OTP against order record. 7. Sets `DeliveryJob.status = 'DELIVERED'`, `Order.status = 'DELIVERED'`. 8. If COD, creates `CashReconciliation` record. |
| **System Response** | Closes active delivery; updates buyer order tracking to "Delivered"; updates farmer dashboard to "Sale Completed". |
| **Business Rules** | Delivery cannot be completed without valid buyer OTP or uploaded POD image. Cash collected for COD must match order total. |
| **Success Outcome** | Order fully fulfilled; worker earnings credited; buyer order marked delivered. |
| **Failure Scenarios** | 1. Invalid buyer OTP $\rightarrow$ 400 Bad Request "Incorrect delivery OTP". 2. Cloudinary network timeout $\rightarrow$ Cached in PWA IndexedDB for auto-sync. |
| **Recovery** | Worker re-checks OTP with buyer and resubmits. |
| **Dependencies** | `ProofOfDeliveryModal.tsx`, `worker.controller.ts`, `cloudinary.service.ts`. |
| **Verification** | Verify order and delivery job status transitions to `DELIVERED` with stored Cloudinary URL. |

---

### WF-INTERCITY-01: Cross-City Bulk Purchase Evaluation & Eligibility Check
| Field | Specification |
|---|---|
| **Actor** | Bulk Buyer & System |
| **Preconditions** | Buyer selects items from a farmer located in a different administrative city. |
| **Trigger** | Buyer proceeds to checkout with cross-city items. |
| **Main Steps** | 1. System checks origin market and destination city. 2. Identifies matching `IntercityRoute`. 3. Validates order meets minimum quantity threshold (e.g. 500 kg or 10,000 ETB). 4. If below threshold, checkout displays warning explaining truckload requirements. 5. If eligible, order created with status `PENDING_APPROVAL`. 6. Creates `AdminApproval` record. 7. Administrator reviews logistics feasibility in intercity console. |
| **System Response** | Routes order to administrative authorization queue before freight assignment. |
| **Business Rules** | Cross-city orders cannot bypass minimum thresholds or admin authorization. |
| **Success Outcome** | High-volume cross-city order queued for logistics coordination. |
| **Failure Scenarios** | 1. Route suspended or inactive $\rightarrow$ Order rejected with route explanation. 2. Below threshold $\rightarrow$ Prompts buyer to increase order quantity for freight viability. |
| **Recovery** | Buyer increases quantity or changes to local regional supplier. |
| **Dependencies** | `prisma.intercityRoute`, `prisma.adminApproval`, `admin.service.ts`. |
| **Verification** | Test cross-city order below threshold (fails) and above threshold (creates `PENDING_APPROVAL`). |

---

### WF-ADMIN-02: Farmer Application Review & Verification Adjudication
| Field | Specification |
|---|---|
| **Actor** | Administrator / Superadmin |
| **Preconditions** | At least one farmer application is in `PENDING` status. |
| **Trigger** | Administrator opens `/dashboard/admin/farmers`. |
| **Main Steps** | 1. Admin views table of pending applications. 2. Clicks "Review Dossier". 3. Inspects farmer national ID, land certificate document, farm coordinates, produce categories. 4. Clicks "Approve & Verify Account" or "Reject Application" with decision notes. 5. Backend updates `FarmerProfile.verificationStatus`, sets `User.isVerified = true` and `User.status = 'ACTIVE'`. 6. Writes immutable record to `audit_logs`. 7. Triggers automated SMS and Email notification to farmer. |
| **System Response** | Unlocks farmer's product listing capabilities; dispatches approval alert. |
| **Business Rules** | Rejections must include documented reasoning. Action must be recorded in audit log with admin ID. |
| **Success Outcome** | Farmer account activated for marketplace trading. |
| **Failure Scenarios** | 1. Admin session expired $\rightarrow$ 401 Unauthorized, redirected to login. |
| **Recovery** | Admin logs in and resumes adjudication. |
| **Dependencies** | `admin.controller.ts`, `admin.service.ts`, Brevo SMTP, Geez SMS, `AuditLog`. |
| **Verification** | Test verify action: confirm `FarmerProfile.verificationStatus === 'VERIFIED'`, audit log created, notification dispatched. |

---

### WF-ADMIN-06: Dispute Filing, Evidence Investigation & Arbitration
| Field | Specification |
|---|---|
| **Actor** | Buyer, Delivery Worker, Farmer & Administrator |
| **Preconditions** | An order has been placed or delivered. |
| **Trigger** | Buyer clicks "Report Issue" in order tracking or support tab. |
| **Main Steps** | 1. User submits reason (e.g. "Produce Damaged", "Item Missing", "Excessive Delay"), explanation, and optional evidence image. 2. Backend creates `Dispute` record with status `OPEN`. 3. Admin opens `/dashboard/admin/reports`. 4. Reviews order details, delivery POD photo, delivery event timestamps, and farmer dispatch logs. 5. Admin enters resolution decision (e.g. "Full Refund Approved", "Replacement Issued", "Dispute Dismissed"). 6. Backend updates `Dispute.status = 'RESOLVED'`, logs action in `audit_logs`, and notifies parties. |
| **System Response** | Arbitrates dispute with auditable decision trail; adjusts order payment status if refund approved. |
| **Business Rules** | Financial resolutions must not alter historical order item snapshots. All decisions must be auditable. |
| **Success Outcome** | Dispute fairly settled and recorded in platform governance ledger. |
| **Failure Scenarios** | 1. Unauthorized user attempts to resolve dispute $\rightarrow$ 403 Forbidden. |
| **Recovery** | Only authenticated administrators can adjudicate dispute cases. |
| **Dependencies** | `prisma.dispute`, `prisma.order`, `admin.service.ts`. |
| **Verification** | Test creating dispute, reviewing evidence, and verifying resolution status transition. |
