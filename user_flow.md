# MASTER PROMPT: COMPLETE END-TO-END SYSTEM WORKFLOW IMPLEMENTATION — AGRIMARKET

## 1. Your Role

Act as a principal software architect, senior business analyst, full-stack engineer, marketplace domain specialist, database architect, security engineer, and QA automation engineer.

Your task is to conduct a complete end-to-end workflow audit and implement all missing, incomplete, disconnected, or incorrectly implemented business workflows in the existing AgriMarket system.

Do not approach this as a collection of independent dashboards. Treat AgriMarket as one integrated, production-oriented agricultural marketplace.

You must understand the complete business lifecycle, from user registration and product discovery through purchasing, payment, farmer fulfillment, delivery, order completion, disputes, administration, and financial reconciliation.

Your implementation must ensure that every actor, feature, database entity, API, notification, and business operation works together correctly.

**Do not redesign the existing UI.** The focus is business logic, user journeys, functionality, integration, data consistency, security, and operational completeness. Preserve the existing design system and improve interfaces only where a workflow genuinely requires it.

---

# 2. Understand the Actual AgriMarket Business Model

AgriMarket is an Ethiopian direct farmer-to-consumer agricultural marketplace.

Its primary purpose is to connect farmers directly with buyers, reduce unnecessary intermediaries, improve market accessibility, and make agricultural product purchasing and distribution more efficient.

### Core business principles

1. Farmers sell their agricultural production directly through the platform.
2. Farmers determine their own product prices.
3. Buyers discover products and farmers according to their location and marketplace coverage.
4. Nearby eligible farmers should appear before distant farmers.
5. The platform supports local and controlled cross-city transactions.
6. Delivery workers handle eligible deliveries.
7. Administrators manage marketplace operations, approvals, disputes, and cross-city logistics rules.
8. Agricultural input companies can sell approved agricultural inputs and farming medicines to farmers.

### Actors

The complete system must support:

- Farmer
- Customer / Buyer
- Delivery Worker
- Administrator
- Agricultural Input Company

Each actor must have a clearly defined workflow, permissions, dashboard, responsibilities, and interactions with other actors.

Do not give every actor access to the same functionality.

---

# 3. Phase One: Complete Repository and Business Workflow Audit

Before implementing anything, inspect the entire existing project.

Do not assume that a feature is missing simply because it is not immediately visible in the interface.

Inspect:

### Frontend

- Every route and page.
- All dashboards.
- Navigation and sidebar items.
- Forms and modal workflows.
- Product discovery and detail pages.
- Cart and checkout.
- Order tracking.
- Farmer and delivery-worker operations.
- Administrative management.
- Agricultural input company workflows.
- Loading, empty, success, and error states.

### Backend

- All API endpoints.
- Business services.
- Authentication and authorization.
- Database models and relationships.
- Validation and transaction handling.
- Payment integration.
- Notification services.
- File storage and verification.
- Background jobs.
- Existing order and delivery state transitions.

### Database

Inspect whether the data model correctly supports:

- Users and roles.
- User profiles.
- Farmer verification.
- Delivery-worker verification.
- Buyer accounts.
- Input company approval.
- Products and categories.
- Product listings and inventory.
- Locations and marketplace coverage.
- Carts and cart items.
- Orders and order items.
- Payments and refunds, where supported.
- Delivery assignments and tracking.
- Disputes and resolutions.
- Notifications.
- Administrative activity logs.

### Audit deliverable

Create a complete workflow inventory containing:

| Module | Existing implementation | Missing functionality | Dependencies | Priority |
|---|---|---|---|---|
| Authentication | Actual findings | Actual findings | Actual dependencies | Priority |
| Onboarding | Actual findings | Actual findings | Actual dependencies | Priority |
| Product marketplace | Actual findings | Actual findings | Actual dependencies | Priority |
| Orders | Actual findings | Actual findings | Actual dependencies | Priority |
| Payments | Actual findings | Actual findings | Actual dependencies | Priority |
| Delivery | Actual findings | Actual findings | Actual dependencies | Priority |
| Administration | Actual findings | Actual findings | Actual dependencies | Priority |
| Agricultural inputs | Actual findings | Actual findings | Actual dependencies | Priority |

Classify every workflow as:

- Fully implemented and verified.
- Partially implemented.
- UI implemented but backend missing.
- Backend implemented but frontend missing.
- Implemented but disconnected from other modules.
- Incorrect business logic.
- Completely missing.
- Broken or insecure.

Do not replace working functionality unnecessarily.

---

# 4. Phase Two: Authentication and User Entry Workflows

## 4.1 Guest browsing

Visitors must be able to:

1. Open the marketplace.
2. Browse products.
3. Search and filter products.
4. Explore farmer profiles.
5. View product details.
6. View publicly available prices and availability.
7. Explore marketplace categories and locations.

Authentication must be required when users attempt to purchase or access private account functionality.

Do not force visitors to register merely to explore the marketplace.

## 4.2 Registration and authentication

Implement the complete lifecycle:

1. User opens signup.
2. User enters required registration information.
3. System validates the information.
4. System creates the account.
5. User completes required email or phone verification according to the existing authentication design.
6. User signs in or receives an authenticated session.
7. User proceeds to role-selection onboarding.
8. System determines the appropriate next workflow.

Support:

- Sign up.
- Sign in.
- Sign out.
- Password recovery.
- Password reset.
- Account verification.
- Session expiration.
- Account suspension.
- Secure session invalidation.

All authentication operations must work with the real backend.

## 4.3 Role selection and onboarding

After signup, present the available role choices:

- Farmer.
- Delivery Worker.
- Customer / Buyer.

### Buyer workflow

When the user selects Buyer:

1. Create or initialize the buyer profile.
2. Complete any mandatory basic account information.
3. Activate buyer access according to existing verification requirements.
4. Redirect to the buyer dashboard.
5. Allow marketplace browsing and purchasing.

Buyer registration must not unnecessarily require the farmer or delivery-worker verification process.

### Farmer workflow

When the user selects Farmer:

1. Open the multi-step farmer onboarding process.
2. Collect the required personal information.
3. Collect contact information.
4. Collect location and farm information.
5. Collect agricultural and farming-related information.
6. Collect required identity and verification documents.
7. Review the application.
8. Allow the user to submit the application.
9. Save the application.
10. Set its appropriate review status.
11. Notify the applicant.
12. Send the application to the administrator's verification queue.

A farmer must not be allowed to perform restricted selling operations before approval.

Allow applicants to view their application status, update permitted information, and respond to requests for corrections.

### Delivery-worker workflow

Implement the equivalent structured onboarding process for delivery workers.

Collect only information justified by the actual operational and legal requirements, including:

- Personal information.
- Contact details.
- Location.
- Transport method.
- Vehicle information where applicable.
- Relevant identity or verification documents.
- Availability and delivery coverage information.

Submit the application for administrative review.

Pending delivery workers must not accept or complete restricted delivery assignments.

### Account lifecycle

Support meaningful states such as:

- Incomplete.
- Submitted.
- Pending review.
- Requires correction.
- Approved.
- Rejected.
- Suspended.
- Deactivated.

Reuse the existing database status model if one already exists.

---

# 5. Phase Three: Farmer Management and Product Lifecycle

The farmer is a central participant in AgriMarket.

Implement the complete process from farmer approval to selling agricultural products.

## 5.1 Farmer approval

Administrator reviews:

- Farmer profile.
- Submitted information.
- Identity documents.
- Location information.
- Supporting verification documents.

Administrator can:

- Approve.
- Reject with a reason.
- Request additional information.
- Suspend an existing approved account when justified.

Every decision must be recorded.

Notify the farmer about the decision and provide the appropriate next steps.

## 5.2 Farmer profile management

Approved farmers should be able to:

- View their profile.
- Update permitted personal information.
- Manage farm details.
- Update selling locations and coverage.
- View verification status.
- Manage their public seller profile.

Changes to sensitive or verified information must follow appropriate re-verification rules.

## 5.3 Product listing lifecycle

The farmer must be able to:

1. Open product management.
2. Select a product category.
3. Enter product information.
4. Upload product images.
5. Set the selling price in ETB.
6. Set the quantity.
7. Select the measurement unit.
8. Provide the product's location.
9. Provide relevant agricultural product information.
10. Review the listing.
11. Publish or submit it according to existing approval requirements.

The system must validate:

- Product information.
- Price.
- Quantity.
- Unit.
- Images.
- Listing status.
- Farmer eligibility.

Do not permit unauthorized users to publish products.

## 5.4 Inventory management

Implement consistent inventory behavior.

Support:

- Available stock.
- Reserved stock where required.
- Sold quantity.
- Stock adjustments.
- Listing deactivation.
- Out-of-stock state.
- Inventory history.

When a valid order is placed, the relevant product quantity must be updated according to the established reservation and order-confirmation rules.

Prevent:

- Negative stock.
- Overselling.
- Concurrent purchase conflicts.
- Duplicate stock deductions.
- Unauthorized inventory modification.

Use database transactions and appropriate concurrency controls.

## 5.5 Farmer order management

Farmers must be able to see orders containing their products.

They should be able to:

- View incoming orders.
- View buyer order information permitted for fulfillment.
- Review ordered products and quantities.
- Confirm or reject orders according to business rules.
- Prepare confirmed orders.
- Mark orders ready for pickup or dispatch where appropriate.
- View delivery status.
- View completed sales.
- Review relevant transaction information.

A farmer must never modify another farmer's order items or private information.

---

# 6. Phase Four: Buyer Marketplace and Purchasing Lifecycle

Implement the complete buyer journey.

## 6.1 Buyer dashboard

The buyer dashboard must be connected to actual backend data.

Support the relevant features:

- Marketplace overview.
- Product discovery.
- Nearby farmers.
- Product categories.
- Search and filters.
- Cart.
- Orders.
- Order tracking.
- Saved items, if implemented.
- Buyer profile.
- Delivery addresses.
- Notifications.
- Purchase history.

Do not use static or mock data.

## 6.2 Location-based marketplace

Location is a core part of the AgriMarket business model.

Implement the existing location-based discovery requirements:

1. Determine the buyer's selected or permitted location.
2. Identify eligible farmers within the configured coverage area.
3. Rank nearby farmers by proximity.
4. Display the closest eligible farmers first.
5. Display relevant products from those farmers.
6. Respect active listing and stock availability.
7. Allow buyers to select supported locations.

Do not expose exact private farm coordinates.

If location permission is denied, allow manual location selection.

Do not fabricate distances or silently assume that an unknown location is accurate.

## 6.3 Product purchasing

Implement:

1. Buyer opens a product.
2. Buyer reviews product information.
3. Buyer checks price, quantity, and seller.
4. Buyer selects the desired quantity.
5. System validates current availability.
6. Buyer adds the item to the cart or chooses Buy Now.
7. System validates the cart.
8. Buyer selects or confirms delivery location.
9. System determines delivery eligibility.
10. System calculates the order total using trusted server-side pricing.
11. Buyer reviews the order.
12. Buyer proceeds to payment or the existing supported payment workflow.
13. System records the transaction state.
14. System creates or confirms the order according to the established payment and order rules.
15. Relevant parties receive notifications.

Authentication is required before purchasing.

Never trust client-supplied product prices, seller identities, inventory values, or totals.

## 6.4 Multi-farmer cart

Inspect whether the existing business model and database support orders containing products from multiple farmers.

Do not assume a multi-farmer order is equivalent to a single-farmer order.

If supported, implement correct order grouping, seller-specific fulfillment, inventory updates, delivery coordination, payment allocation, and order tracking.

If not supported, enforce the existing single-seller checkout policy and communicate the restriction clearly.

Do not introduce multi-seller checkout without implementing its complete financial and operational consequences.

## 6.5 Order tracking

Buyers must be able to view the real status of their purchases.

Use the actual order lifecycle and timestamps.

Display relevant information such as:

- Order submitted.
- Payment status.
- Farmer confirmation.
- Preparation.
- Delivery assignment.
- Pickup.
- Shipment.
- Delivery.
- Completion.
- Cancellation or dispute, where applicable.

Provide accurate status updates rather than simulated progress.

---

# 7. Phase Five: Local and Cross-City Logistics

This is a critical business workflow.

AgriMarket supports local transactions and controlled cross-city transactions.

## 7.1 Local delivery

For a local purchase:

1. Buyer selects a supported delivery location.
2. System identifies eligible nearby farmers.
3. Buyer places an order.
4. Farmer confirms the order.
5. System determines the appropriate local delivery requirements.
6. Eligible delivery workers are identified.
7. The system broadcasts the assignment to appropriate workers based on location and eligibility.
8. A delivery worker accepts the assignment according to the assignment rules.
9. Farmer prepares the product.
10. Delivery worker collects the product.
11. Delivery worker transports it.
12. Buyer receives the product.
13. Delivery is confirmed.
14. Order reaches its final completed state.
15. Relevant parties receive notifications.

Support assignment expiration, worker rejection, reassignment, and delivery cancellation according to defined policies.

## 7.2 Cross-city purchasing

Cross-city purchasing must not be treated as ordinary local delivery.

The business model requires sufficiently large quantities for truck transportation, subject to administrator-managed rules.

Implement the following:

1. Buyer requests a cross-city purchase.
2. System identifies the destination and origin locations.
3. System evaluates quantity and eligibility using configured administrative rules.
4. If the order does not meet requirements, explain why.
5. If eligible, route it through the appropriate cross-city operational workflow.
6. Apply administrator-managed quantity, coverage, and logistics rules.
7. Allow the responsible administrator or authorized operator to review and manage the transaction where required.
8. Coordinate farmer fulfillment and truck-based transportation.
9. Assign appropriate transport resources and delivery responsibility.
10. Track the shipment.
11. Confirm receipt.
12. Complete the transaction and reconcile its relevant records.

Administrators must be able to manage the applicable cross-city rules without modifying application source code.

Do not hardcode arbitrary minimum quantities or city restrictions.

The system must support different products, units, locations, and operational conditions without assuming that all products use the same quantity threshold.

## 7.3 Delivery-worker workflow

Approved delivery workers must be able to:

- Manage their permitted profile information.
- Manage availability.
- View eligible delivery opportunities.
- Receive relevant assignment notifications.
- Accept or reject assignments.
- View pickup and destination information.
- Confirm pickup.
- Update delivery progress.
- Report delivery problems.
- Confirm delivery completion using the established proof mechanism.
- View completed and cancelled deliveries.
- View permitted earnings or payment information if supported.

Only eligible workers should receive relevant assignments.

Prevent two workers from simultaneously accepting the same assignment.

Do not permit workers to arbitrarily change order status.

Use server-side state-transition validation.

---

# 8. Phase Six: Payment and Financial Workflows

Inspect the existing Chapa integration and actual payment implementation.

Do not create a second payment system unnecessarily.

Implement a reliable transaction lifecycle.

## 8.1 Payment lifecycle

Support the relevant states:

- Initiated.
- Pending.
- Successful.
- Failed.
- Cancelled.
- Expired.
- Refunded, where supported.

Implement:

1. Server-side order-total calculation.
2. Payment initiation.
3. Secure payment-provider interaction.
4. Payment callback or webhook verification.
5. Transaction reference validation.
6. Duplicate callback protection.
7. Idempotent payment processing.
8. Accurate order-payment association.
9. Payment-status synchronization.
10. Failure and recovery handling.

Never trust a browser redirect as proof of successful payment.

Verify payment using the payment provider's supported trusted server-side mechanism.

Do not create duplicate successful transactions when callbacks are delivered multiple times.

## 8.2 Refunds and cancellations

Define the actual cancellation and refund rules for each order stage.

Support:

- Buyer cancellation requests where permitted.
- Farmer rejection.
- Administrative cancellation.
- Delivery-related cancellation.
- Payment failure recovery.
- Refund requests where applicable.
- Refund status tracking.

Do not refund an order simply because a user closes a payment page.

Do not silently release reserved stock or modify financial records without a valid transaction and state transition.

## 8.3 Financial records

Maintain traceable records for:

- Buyer payments.
- Farmer sales.
- Delivery charges.
- Platform fees or commissions, if the existing business model defines them.
- Refunds.
- Adjustments.
- Outstanding balances, if applicable.

Never invent a commission rate or financial policy.

Financial calculations must be performed and validated on the server.

---

# 9. Phase Seven: Agricultural Input Company Workflow

Agricultural input companies are a separate marketplace participant.

Their workflow must not be mixed with ordinary farmer selling operations.

## 9.1 Company registration and approval

Support:

1. Company registration.
2. Company profile submission.
3. Contact information.
4. Required business verification documents.
5. Product and business category information.
6. Application submission.
7. Administrative review.
8. Approval, rejection, or correction request.
9. Notification of the decision.

Only approved companies can perform restricted selling operations.

## 9.2 Input product management

Approved companies should be able to:

- Create agricultural input listings.
- Manage product descriptions.
- Specify product categories.
- Set prices.
- Manage stock.
- Upload product images.
- Update or deactivate listings.
- View orders for their products.

Agricultural inputs may include farming medicines and other agricultural supplies.

Apply relevant product information, safety, and legal requirements where applicable.

Do not assume all agricultural inputs have the same regulatory or documentation requirements.

## 9.3 Farmer purchasing agricultural inputs

Implement the appropriate workflow for farmers to:

1. Browse available agricultural inputs.
2. Search and filter products.
3. View company and product information.
4. Add eligible products to a cart.
5. Authenticate where required.
6. Place orders.
7. Pay using supported payment methods.
8. Track orders.
9. Receive purchased inputs.

Preserve clear separation between agricultural production listings and agricultural input listings.

If the existing architecture supports different product types, use that model rather than duplicating marketplace logic.

---

# 10. Phase Eight: Complete Administrator Workflow

The administrator is responsible for marketplace governance and operational management.

Implement the actual workflows behind every administrative dashboard module.

## 10.1 Dashboard overview

Display real operational information, including:

- Registered users.
- Farmers awaiting approval.
- Delivery workers awaiting approval.
- Input companies awaiting approval.
- Active farmers.
- Active products.
- Active orders.
- Pending orders.
- Deliveries in progress.
- Completed transactions.
- Payment and dispute summaries.
- Marketplace activity.

Every metric must be derived from actual backend data.

Do not use fabricated statistics.

## 10.2 User management

Administrators should be able to:

- Search and filter users.
- View authorized user details.
- Review role and account status.
- Review verification status.
- Approve or reject applications.
- Request corrections.
- Suspend and reactivate accounts according to policy.
- View relevant activity history.

Do not allow administrators to bypass audit logging.

## 10.3 Product and category management

Support:

- Product categories.
- Marketplace product management.
- Product visibility and moderation.
- Listing review where required.
- Inappropriate listing reporting.
- Product deactivation where justified.

Respect the farmer's right to set product prices. Do not let administrators arbitrarily change farmer prices unless a documented business policy authorizes it.

## 10.4 Location and coverage management

Administrators must be able to manage:

- Supported cities.
- Locations and service areas.
- Marketplace coverage.
- Delivery coverage.
- Cross-city eligibility.
- Quantity thresholds.
- Applicable transport rules.

Changes must be validated and applied consistently throughout the marketplace.

Do not allow location configuration changes to corrupt existing orders or tracking records.

## 10.5 Order and logistics management

Administrators must be able to:

- View and search orders.
- Filter by status, location, date, and actor.
- Review order details.
- Monitor fulfillment.
- Monitor delivery assignments.
- Manage eligible cross-city transactions.
- Investigate operational failures.
- Handle permitted cancellations.
- Resolve delivery exceptions.
- View the full order event history.

Administrative actions must respect permissions and existing transaction rules.

## 10.6 Disputes and complaints

Implement an end-to-end dispute process.

1. Buyer or another authorized participant reports a problem.
2. System records the complaint.
3. Relevant order and transaction information is attached.
4. Administrator receives the case.
5. Administrator reviews evidence.
6. Relevant parties can provide permitted responses.
7. Administrator records the decision.
8. The system performs the authorized resolution.
9. Relevant users are notified.
10. The dispute is closed with an auditable history.

Support appropriate outcomes such as rejection, correction, cancellation, or refund when allowed by business policy.

Do not allow dispute resolution to silently modify completed financial records.

## 10.7 Audit logs

Record important administrative actions, including:

- Approval decisions.
- Rejections.
- Account suspensions.
- Product moderation.
- Location-rule changes.
- Cross-city decisions.
- Order interventions.
- Dispute resolutions.
- Financial adjustments.

Audit records must identify the responsible administrator, operation, affected resource, timestamp, and appropriate before-and-after information without storing unnecessary sensitive data.

---

# 11. Phase Nine: Notifications and Communication

Notifications must connect the complete business lifecycle.

Use SMS as the primary notification channel and email as the configured fallback where supported by the existing implementation.

Support the existing notification infrastructure rather than adding unnecessary providers.

### Notification events

| Event | Relevant recipient |
|---|---|
| Account verification | User |
| Role application submitted | Applicant / Admin |
| Application approved | Applicant |
| Application rejected | Applicant |
| Additional information requested | Applicant |
| Product order submitted | Buyer / Farmer |
| Order confirmed | Buyer |
| Order rejected | Buyer |
| Payment confirmed | Buyer |
| Payment issue | Buyer |
| Delivery assignment available | Eligible delivery workers |
| Delivery accepted | Relevant participants |
| Product picked up | Buyer |
| Delivery completed | Buyer / Farmer |
| Delivery exception | Relevant participants / Admin |
| Dispute submitted | Admin / Relevant participants |
| Dispute resolved | Relevant participants |
| Input company application decision | Company |

Notifications must reflect actual business events.

A notification failure must not incorrectly reverse a successful order or payment.

Support:

- Notification status.
- Retry policies.
- Duplicate prevention.
- Delivery history where appropriate.
- User notification preferences where implemented.

---

# 12. Phase Ten: Unified Business State Management

All modules must agree about the current state of a transaction.

Do not independently change order status in different dashboards without a shared state-transition policy.

Define valid transitions for:

- User applications.
- Farmer listings.
- Inventory.
- Orders.
- Payments.
- Delivery assignments.
- Disputes.
- Refunds.

For example, an order lifecycle may include:

```text
Order Submitted
      |
      v
Payment / Order Validation
      |
      v
Farmer Confirmation
      |
      v
Preparation
      |
      v
Delivery Assignment
      |
      v
Pickup
      |
      v
In Transit
      |
      v
Delivered
      |
      v
Completed
```

Cancellation and rejection must be separate, explicitly defined transitions.

The exact states must be reconciled with the existing database and business rules.

For every state transition, define:

1. Who can initiate it?
2. What conditions must be satisfied?
3. Which database records change?
4. Which inventory operations occur?
5. Whether payment operations are affected.
6. Which notifications are sent?
7. Which dashboards are updated?
8. Whether the operation can be reversed?
9. What happens if part of the operation fails?

Implement transactions, idempotency, concurrency control, and auditability where necessary.

---

# 13. Phase Eleven: Cross-Module Integration

This is one of the most important requirements.

Do not implement isolated features that look functional but do not communicate.

Verify the following complete scenarios.

### Scenario A: Farmer joins AgriMarket

Farmer registers → selects Farmer → completes onboarding → uploads documents → submits application → administrator reviews → approves → farmer receives notification → farmer creates a product listing → listing becomes available to eligible buyers.

### Scenario B: Buyer purchases from a nearby farmer

Guest browses → selects a product → clicks Buy Now → signs in or registers → selects Buyer → completes required onboarding → resumes purchase → selects quantity → system validates stock → buyer pays → order is recorded → farmer is notified → farmer confirms → delivery is arranged → buyer tracks → delivery is completed → inventory and transaction records are updated.

### Scenario C: Delivery worker joins

Worker registers → selects Delivery Worker → completes profile → submits verification documents → administrator approves → worker becomes eligible for assignments → receives a location-relevant assignment → accepts → collects product → updates delivery progress → confirms completion.

### Scenario D: Cross-city order

Buyer selects a distant destination → system checks cross-city eligibility → quantity and administrative rules are evaluated → eligible transaction enters the managed cross-city process → logistics are coordinated → shipment is tracked → buyer receives the product → transaction is completed.

### Scenario E: Agricultural input purchase

Company registers → submits documents → administrator approves → company lists farming inputs → farmer discovers inputs → places an order → payment is verified → company fulfills the order → delivery or collection is completed.

### Scenario F: Dispute resolution

Buyer reports an order problem → system records evidence → administrator investigates → relevant participants are notified → administrator makes an authorized decision → refund, correction, or other permitted action is processed → records and order status are updated → dispute is closed.

### Scenario G: Failed payment

Buyer initiates payment → provider does not confirm success → order remains in its correct payment state → buyer receives a clear explanation → system verifies whether payment is pending or failed → duplicate payment is prevented → buyer can safely retry when appropriate.

### Scenario H: Farmer runs out of stock

Buyer attempts to purchase → system detects insufficient availability → transaction is rejected or adjusted safely → buyer receives an understandable message → farmer inventory remains consistent → buyer can select another available product.

Implement these as real connected workflows, not static UI demonstrations.

---

# 14. Phase Twelve: Security, Reliability, and Data Integrity

Audit every workflow for security and operational weaknesses.

### Authentication and authorization

- Enforce authentication on protected operations.
- Enforce role and permission checks on the backend.
- Validate account and verification status.
- Enforce ownership of orders, listings, and private resources.
- Prevent privilege escalation.
- Protect administrative operations.

### Data integrity

- Prevent duplicate orders.
- Prevent duplicate payments.
- Prevent overselling.
- Prevent invalid state transitions.
- Prevent unauthorized inventory changes.
- Prevent incorrect refunds.
- Preserve transactional consistency.
- Validate all critical inputs on the server.

### Reliability

- Handle network failures.
- Handle provider timeouts.
- Handle duplicate webhooks.
- Handle background-job retries.
- Handle partial operational failures.
- Preserve recoverable user input.
- Provide accurate user-facing error messages.

### Privacy

- Protect identity documents.
- Protect private contact information.
- Restrict access to financial records.
- Avoid exposing exact private farm coordinates.
- Keep internal administrative information private.

---

# 15. Phase Thirteen: End-to-End Testing

Build comprehensive tests using the project's existing test infrastructure.

Do not test only whether pages load.

Test complete business workflows across multiple actors and modules.

### Role-based test accounts

Create isolated test fixtures for:

- Guest visitor.
- New buyer.
- Existing buyer.
- Pending farmer.
- Approved farmer.
- Pending delivery worker.
- Approved delivery worker.
- Pending input company.
- Approved input company.
- Administrator.
- Suspended account.

Never use real production identities or production payment credentials in automated tests.

### Required testing categories

**Authentication tests**
- Signup.
- Login.
- Verification.
- Role selection.
- Onboarding.
- Logout.
- Session expiration.

**Marketplace tests**
- Guest browsing.
- Product search.
- Location-based discovery.
- Farmer ranking.
- Product detail.
- Availability.

**Farmer tests**
- Application submission.
- Approval.
- Product creation.
- Inventory updates.
- Order confirmation.
- Order rejection.

**Buyer tests**
- Cart.
- Checkout.
- Purchase.
- Payment.
- Order history.
- Tracking.
- Cancellation.

**Delivery tests**
- Worker approval.
- Assignment broadcasting.
- Acceptance.
- Pickup.
- Delivery.
- Reassignment.
- Failed delivery.

**Input company tests**
- Registration.
- Approval.
- Listing.
- Inventory.
- Farmer purchase.
- Fulfillment.

**Administrator tests**
- User management.
- Approvals.
- Product moderation.
- Location management.
- Cross-city operations.
- Dispute management.
- Audit logs.

**Integration tests**
- Buyer-to-farmer order lifecycle.
- Farmer-to-delivery-worker coordination.
- Payment-to-order synchronization.
- Cross-city logistics.
- Input company-to-farmer purchasing.
- Dispute-to-refund resolution.

### Failure-path testing

For every important workflow, test:

- Invalid input.
- Unauthorized access.
- Duplicate submission.
- Concurrent requests.
- Network interruption.
- Database failure.
- Payment failure.
- Notification failure.
- Expired session.
- Resource no longer available.

Verify that no failure leaves the system in an inconsistent state.

---

# 16. Phase Fourteen: Implementation Strategy

Do not attempt a massive uncontrolled rewrite.

Implement in dependency order.

Recommended implementation sequence:

| Priority | Implementation phase |
|---|---|
| P0 | Authentication, roles, permissions, account states |
| P0 | Database integrity and shared business-state rules |
| P1 | Farmer and delivery-worker onboarding and verification |
| P1 | Product listings and inventory |
| P1 | Guest browsing and buyer purchasing |
| P1 | Orders, payment, and transaction consistency |
| P1 | Delivery assignment and fulfillment |
| P2 | Location-based marketplace and cross-city operations |
| P2 | Agricultural input companies |
| P2 | Administrative operational workflows |
| P2 | Disputes, refunds, and audit trails |
| P3 | Notification reliability and operational improvements |
| P3 | Comprehensive end-to-end regression testing |

Adjust this order when the real repository reveals dependencies that require a different sequence.

For each implementation phase:

1. Explain the existing architecture.
2. Identify the affected modules.
3. Identify database and API dependencies.
4. Define the intended workflow.
5. Implement backend business logic.
6. Implement or connect frontend operations.
7. Add appropriate validation and authorization.
8. Add tests.
9. Run regression checks.
10. Verify integration with dependent modules.
11. Record completion evidence.

Do not mark a workflow complete merely because its frontend page exists.

---

# 17. Definition of Complete System

The AgriMarket system is considered functionally complete only when:

- All actors can complete their legitimate end-to-end journeys.
- All role-specific dashboards are connected to real data.
- Every important button performs its intended operation.
- Forms validate and save real information.
- Every business process has a valid beginning and ending.
- All related modules remain synchronized.
- Orders, payments, inventory, and deliveries remain consistent.
- Administrators can manage the marketplace operationally.
- Notifications reflect actual events.
- Security and authorization are enforced on the backend.
- Failure and recovery paths are implemented.
- Users receive understandable English error messages.
- The system works on desktop and mobile.
- Critical workflows are covered by automated tests.
- Production builds and deployment checks succeed.

---

# 18. Final Deliverables and Report

After the audit and implementation, produce the following documentation.

### A. Complete workflow specification

Document all actors, their responsibilities, their actions, and the end-to-end business processes.

### B. System workflow diagrams

Create clear diagrams showing:

- Overall system architecture.
- User registration and onboarding.
- Farmer product lifecycle.
- Buyer purchase lifecycle.
- Payment lifecycle.
- Delivery lifecycle.
- Cross-city logistics.
- Agricultural input company lifecycle.
- Administrator approval and management.
- Dispute and refund lifecycle.

Use Mermaid or another format already supported by the repository.

### C. Implementation report

For every workflow, provide:

| Workflow | Previous state | Implemented changes | Tests | Final status |
|---|---|---|---|---|

### D. Database and API report

Document:

- Models changed.
- Relationships added or corrected.
- Migrations.
- APIs added or modified.
- Permissions.
- State transitions.
- Integration dependencies.

### E. Testing report

Include actual:

- Unit-test results.
- Integration-test results.
- End-to-end-test results.
- Type-check results.
- Lint results.
- Production-build results.

### F. Remaining work

Clearly identify:

- Unimplemented functionality.
- External integration requirements.
- Missing credentials.
- Business decisions requiring approval.
- Known limitations.
- Outstanding security issues.

Never label unverified functionality as complete.

---

# FINAL INSTRUCTION

Your responsibility is to make AgriMarket operate as a complete, interconnected agricultural marketplace, not merely to make individual dashboards look functional.

Think through the entire lifecycle of every operation.

When a buyer performs an action, consider its effects on the farmer, inventory, payment, delivery worker, administrator, notifications, and database.

When an administrator changes a rule, consider how it affects future marketplace operations.

When a transaction fails, consider how to preserve financial integrity, stock consistency, and user trust.

When implementing a feature, verify its entire journey from the initiating user action to the final business outcome.

**Audit first. Identify gaps. Plan dependencies. Implement in controlled phases. Test across roles. Verify end-to-end behavior. Document actual results.**

Do not remove existing working features, introduce mock data, invent business rules, or replace established architecture without a demonstrated technical reason.

The final result must be a coherent, secure, maintainable, reliable, and production-oriented AgriMarket system.