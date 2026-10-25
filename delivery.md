The delivery worker module must be designed as an operational logistics system, not simply a dashboard that displays delivery orders. Its responsibility is to connect confirmed agricultural orders with suitable delivery workers, manage acceptance and pickup, track transportation, confirm successful delivery, and maintain accurate delivery and earnings records.

For your agricultural marketplace, the core principle is: the system finds eligible delivery workers based on location and capability, broadcasts delivery offers, lets workers accept suitable jobs, and controls the entire delivery lifecycle through validated status transitions. The administrator defines the rules, while the system enforces them consistently.

# 1. Delivery worker responsibilities

The delivery worker is responsible for the transportation process between the farmer and the buyer. The worker does not control product prices, change order quantities, approve intercity trading, or independently modify delivery fees.

1\. Maintain an eligible working status

Complete verification, set availability, register vehicle and capacity details, and provide location access when required.

2\. Receive and evaluate delivery offers

Review pickup and destination areas, distance, cargo requirements, expected delivery fee or earnings, and the offer's expiry time.

3\. Collect the agricultural products

Navigate to the farmer, verify the order reference and product quantities, and confirm pickup with the required evidence.

4\. Transport and update progress

Follow the delivery route, update the delivery status, and report delays, access problems, damage, or other incidents.

5\. Complete delivery and reconcile earnings

Verify receipt, submit proof of delivery, close the assigned job, and review earnings and settlement status.

# 2. Delivery worker dashboard sidebar

Since the dashboard UI is already implemented, the following defines the required navigation, page responsibilities, and behavior. Your AI agent should integrate these into the existing interface rather than redesigning it.

| Sidebar item            | Required behavior                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard / Overview    | Show online status, new offers, active deliveries, completed deliveries, pending issues, and earnings summaries.                          |
| Delivery Requests       | Show eligible incoming offers with an expiry countdown, pickup and destination areas, cargo details, distance, and expected compensation. |
| Active Deliveries       | Show accepted jobs, pickup instructions, navigation, required actions, status progression, and delivery deadlines.                        |
| My Deliveries / History | Show completed, cancelled, failed, and other finalized jobs with timestamps, order references, and outcomes.                              |
| Earnings & Payments     | Show completed-job earnings, fees or deductions, pending settlements, paid amounts, and transaction history.                              |
| Availability & Location | Let workers go online or offline, manage permitted location access, select service areas, and review vehicle and capacity information.    |
| Notifications           | Show new offers, assignment changes, cancellations, payment updates, and administrative announcements.                                    |
| Support & Incidents     | Allow workers to report pickup problems, buyer unavailability, damaged products, route issues, disputes, and safety concerns.             |
| Profile & Verification  | Manage permitted profile information, vehicle details, required documents, and verification status.                                       |
| Settings                | Configure supported language, notification preferences, privacy options, and account security.                                            |

The sidebar should show contextual badges where useful, such as the number of pending offers or unresolved incidents. A worker should not be able to access an active delivery action merely by opening a URL; every action must also be authorized by the backend.

Do not add a separate wallet, live map, chat module, or other navigation item unless the existing system supports it or the implementation plan explicitly includes it. Map and communication functionality can initially be embedded within delivery details.

# 3. End-to-end delivery workflow

The system should follow a controlled workflow from order confirmation to final delivery.

### 1

Order confirmed

Order passes the required payment and fulfillment checks.

### 2

Dispatch eligibility checked

Validate pickup readiness, destination, cargo, and delivery rules.

### 3

Eligible workers identified

Filter by location, availability, vehicle capacity, and service area.

### 4

Delivery offer broadcast

Send a time-limited offer to eligible workers.

### 5

Worker accepts

Atomically assign the job to one eligible worker.

### 6

Pickup confirmed

Verify the farmer, order reference, and product handover.

### 7

In transit

Track delivery progress and manage exceptions.

### 8

Delivery verified

Record recipient confirmation or approved proof of delivery.

### 9

Job completed

Finalize delivery records and calculate worker earnings.

## 4. Detailed system behavior and business logic

### A. Worker registration and activation

1. A worker registers and submits the required identity, contact, vehicle, and other verification information.
2. The administrator reviews and approves the account where verification is required.
3. The backend checks the worker's approval status before allowing them to receive or accept delivery jobs.
4. The worker sets their availability to online and grants location permission where required.
5. The system validates that the worker has a supported service area, suitable delivery capacity, and no blocking account restrictions.

Important: An online worker is not automatically eligible for every order. An online worker may be excluded if their vehicle cannot carry the load, their service area does not cover the destination, or they have reached their active-job limit.

### B. Finding eligible workers

When an order is ready for dispatch, the backend must:

- Retrieve the verified pickup coordinates of the farmer.
- Retrieve the buyer's delivery destination.
- Identify the delivery mode: local or cross-city.
- Find workers who are approved, online, available, and suitable for the cargo.
- Check worker location freshness, service coverage, vehicle capacity, and route eligibility.
- Rank eligible workers using a configurable dispatch strategy, prioritizing proximity to pickup while considering suitability and workload.
- Send delivery offers according to the configured broadcast strategy.

The system should not use a worker's old GPS location as if it were current. If the location is stale or unavailable, apply a configurable eligibility rule rather than silently assuming the worker is nearby.

### C. Broadcasting and accepting offers

Use a configurable dispatch strategy. For example, the system can initially notify a small group of suitable nearby workers, then expand to additional workers if no one accepts before the timeout.

When a worker accepts an offer:

1. The backend rechecks that the offer is valid and has not expired.
2. It verifies that the order is still unassigned and the worker remains eligible.
3. It atomically assigns the delivery job to the worker.
4. It invalidates competing offers for the same job.
5. It notifies the farmer, buyer, and assigned worker as appropriate.
6. It makes the assignment visible in Active Deliveries.

If two workers accept nearly simultaneously, only one may win. Use a database transaction, conditional update, or equivalent concurrency-safe mechanism to prevent duplicate assignments.

If nobody accepts, the system should retry with a broader eligible group and eventually notify an administrator if dispatch remains unsuccessful.

### D. Pickup and handover

After assignment, the worker receives the necessary pickup instructions and a protected view of the order details.

The worker must be able to:

- View the farmer's pickup location and approved contact information.
- Navigate to the pickup point.
- Confirm arrival.
- Verify the order reference and product quantities.
- Record discrepancies, missing products, packaging problems, or a failed pickup.
- Confirm collection only when the required handover checks are complete.

The backend must prevent a worker from marking an order as collected before the job is assigned and the applicable pickup requirements have been satisfied.

If products are missing or damaged, the worker must report the discrepancy and follow the configured resolution procedure. The worker must not independently alter the farmer's price or the buyer's order total.

### E. Transportation and delivery

Once pickup is confirmed, the delivery moves to In Transit.

The worker can view the buyer's delivery destination, navigate to the destination, and report delays or incidents. If live tracking is implemented, location updates should be permission-based, appropriately rate-limited, and restricted to authorized viewers.

On arrival, the worker must:

1. Confirm arrival at the destination.
2. Verify the recipient using the configured delivery procedure.
3. Record the delivered quantity and any approved exceptions.
4. Capture proof of delivery, such as a recipient confirmation, delivery code, signature, or photo when supported and appropriate.
5. Submit the completion action to the backend.
6. Receive confirmation that the delivery has been recorded successfully.

The system must not mark a delivery completed solely because the worker is near the destination. GPS proximity can support verification but is not sufficient proof of handover by itself.

### F. Failed delivery and incidents

The worker must have an incident-reporting workflow for cases such as:

- Farmer unavailable at pickup.
- Buyer unavailable at destination.
- Incorrect address or inaccessible location.
- Product quantity mismatch or damaged goods.
- Vehicle breakdown or unsafe road conditions.
- Delivery timeout or failed contact.
- Buyer refusing the delivery.

The system should record the incident, timestamp, relevant evidence, and reason code. It should then follow the configured resolution policy, which may involve a retry, reassignment, return to the farmer, or administrator review.

Workers must not be able to cancel a paid order, issue a refund, or change financial records simply by reporting an incident.

# 5. Local versus cross-city delivery

The delivery module must support two distinct delivery modes.

| Rule        | Local delivery                         | Cross-city delivery                                |
| ----------- | -------------------------------------- | -------------------------------------------------- |
| Eligibility | Supported local market and destination | Approved intercity route and destination           |
| Vehicle     | Suitable for the product and quantity  | Suitable for the load, route, and distance         |
| Assignment  | Eligible nearby workers                | Eligible intercity workers or logistics providers  |
| Charges     | Configured local delivery rules        | Configured intercity logistics and delivery rules  |
| Approval    | Standard order authorization           | Additional admin approval when required            |
| Tracking    | Pickup to buyer destination            | Origin city through intercity route to destination |
| Completion  | Verified recipient handover            | Verified handover and required intercity records   |

For cross-city delivery, the system must check the approved route, required minimum quantity or other configured trade conditions, vehicle suitability, delivery charges, and any necessary administrative approval before dispatch.

The administrator controls the intercity policies. The system calculates the applicable fees, and the farmer's product price remains unchanged.

If a single order contains products from multiple farmers or requires multiple vehicles, the backend must support separate fulfillment jobs linked to the same customer order. Each job must have its own assignment, tracking, and completion records.

# 6. Delivery job states and transition rules

Use a backend-controlled state machine instead of allowing workers to set arbitrary status values.

| State                | Meaning                                          | Permitted next steps                                  |
| -------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| `PENDING_DISPATCH`   | Order is ready for delivery assignment           | `OFFERING`, `CANCELLED`                               |
| `OFFERING`           | Eligible workers are receiving offers            | `ASSIGNED`, `PENDING_DISPATCH`, `CANCELLED`           |
| `ASSIGNED`           | A worker has accepted the job                    | `PICKUP_IN_PROGRESS`, `PENDING_DISPATCH`, `CANCELLED` |
| `PICKUP_IN_PROGRESS` | Worker is completing pickup checks               | `PICKED_UP`, `INCIDENT_REPORTED`                      |
| `PICKED_UP`          | Product handover is confirmed                    | `IN_TRANSIT`, `INCIDENT_REPORTED`                     |
| `IN_TRANSIT`         | Product is being transported                     | `ARRIVED`, `INCIDENT_REPORTED`                        |
| `ARRIVED`            | Worker has reached the destination               | `DELIVERED`, `INCIDENT_REPORTED`                      |
| `INCIDENT_REPORTED`  | A delivery exception needs resolution            | An explicitly authorized recovery state               |
| `DELIVERED`          | Delivery has been verified and recorded          | Terminal state                                        |
| `CANCELLED`          | Job was cancelled through an authorized workflow | Terminal state                                        |

These are recommended states, not a reason to duplicate an existing working state machine. Your agent must inspect the current codebase and map these concepts onto existing statuses where appropriate.

Every transition must be validated by the backend against the current state, actor permissions, and business rules. Terminal states must not be reopened through an ordinary worker action.

If a job is cancelled after pickup, the system must not simply discard it. It must initiate the configured return or recovery workflow.

# 7. Earnings and payment behavior

The delivery worker's earnings must be calculated from the applicable delivery pricing policy, not from the farmer's product price alone.

The system must distinguish:

- The buyer's total order amount.
- The farmer's product revenue.
- The delivery charge paid by the buyer.
- The delivery worker's earned compensation.
- Any platform commission, deductions, or other authorized charges.
- The amount actually settled to the worker.

A completed delivery may create an earning record, but it must not automatically imply that the worker has been paid.

Recommended earning states are `PENDING`, `APPROVED`, `PAYABLE`, `PAID`, and `ADJUSTED`, adapted to the existing financial model.

Earning records must be linked to the delivery job and protected against duplicate calculation. Any adjustment must be auditable, authorized, and associated with a reason.

# 8. Copy-ready implementation prompt for your AI agent

The following prompt is intended for your existing project. It explicitly prohibits unnecessary UI redesign.

# Implementation Task: Complete the Delivery Worker Module in the Existing Agricultural Marketplace

Act as a senior backend engineer, logistics-system architect, database engineer, and QA engineer. Implement the complete delivery worker business workflow in the existing location-based agricultural marketplace.

**Important: The delivery worker dashboard UI is already implemented. Do not redesign the UI, change the established brand identity, replace the sidebar, or rebuild existing pages unnecessarily.** Inspect the existing project and connect the current interface to correct, secure, persistent backend functionality.

## 1. Inspect Before Modifying

Inspect the repository, existing delivery worker routes and pages, authentication, role-based authorization, database schema, order and payment modules, farmer and buyer profiles, location services, notification infrastructure, and existing status transitions.

Identify:

- What is already implemented and working.
- What is incomplete, mocked, duplicated, or insecure.
- Which database entities and services can be reused.
- Which existing UI actions are not connected to real backend operations.
- How the current system represents local and cross-city orders.

Prepare a concise implementation plan with findings, dependencies, files expected to change, and acceptance criteria. Preserve existing working functionality and avoid creating duplicate business logic.

Do not begin a broad refactor or replace the architecture without demonstrating why it is necessary.

## 2. Delivery Worker Account and Availability

Implement backend-enforced eligibility for delivery workers.

A worker must satisfy all required account verification, approval, service-area, vehicle, and account-status rules before receiving and accepting delivery offers.

Support online and offline availability, location permission handling, service-area configuration, and relevant vehicle and capacity information.

Reject delivery requests from unapproved, suspended, unavailable, or otherwise ineligible workers.

Do not trust client-submitted role, account approval, compensation, location verification, or job assignment fields without server-side validation.

## 3. Delivery Offer Matching and Broadcast

When an order is eligible for delivery, identify suitable workers using:

- Distance from the farmer's pickup location.
- Current or sufficiently recent worker location.
- Online and available status.
- Vehicle type and carrying capacity.
- Cargo handling requirements.
- Local or cross-city route eligibility.
- Active workload and configurable assignment limits.

Implement a configurable offer-broadcast strategy. Notify a suitable nearby group first and expand the candidate pool after a configurable timeout if nobody accepts.

Persist each offer with its worker, delivery job, creation time, expiry time, and status. Prevent duplicate active offers where inappropriate and prevent expired or withdrawn offers from being accepted.

Support retries, notification failures, and escalation to an administrator when dispatch cannot find a suitable worker.

## 4. Concurrency-Safe Assignment

When a worker accepts an offer, validate the offer and worker eligibility again on the backend.

Use a database transaction, conditional update, or equivalent concurrency-safe approach to ensure that only one worker can be assigned to a delivery job.

Withdraw or invalidate competing offers after successful assignment and notify relevant parties.

Make offer acceptance idempotent so repeated requests cannot create duplicate assignments. Handle cancellation, timeout, worker unavailability, and reassignment without corrupting order or delivery records.

## 5. Pickup and Delivery Workflow

Implement the valid delivery lifecycle using the existing status model or a carefully mapped state machine.

Required capabilities:

- View assigned job and authorized pickup/destination details.
- Confirm arrival at pickup.
- Verify the order reference and product handover.
- Record missing products, quantity discrepancies, and pickup incidents.
- Confirm pickup only after required checks.
- Start transportation after successful pickup.
- Record arrival at the buyer's destination.
- Verify receipt using the configured delivery procedure.
- Submit proof of delivery when required.
- Finalize the job and update relevant order and delivery records.

Enforce all state transitions on the backend. A worker must not mark an unassigned job as picked up or complete an order without satisfying required verification steps.

Use explicit reason codes and evidence for delivery failures. Support authorized recovery, reassignment, and return-to-farmer workflows when required.

## 6. Location and Tracking

Use the existing location infrastructure where available.

Support permission-based worker location updates and configurable location freshness rules. Validate coordinates, protect location data, and restrict access to authorized participants.

If real-time tracking already exists, integrate it with delivery status and the existing map interface. If it does not exist, implement the required backend support and identify any frontend integration that remains necessary.

Do not claim to provide continuous background tracking on mobile browsers unless the existing technology and permissions actually support it.

Use geographic distance for initial matching. Introduce route distance or estimated travel time only if a suitable routing service is configured.

## 7. Local and Cross-City Dispatch

For local deliveries, validate the applicable market, destination, delivery coverage, and worker eligibility.

For cross-city deliveries, validate the approved route, origin and destination cities, required quantity or load constraints, vehicle capacity, configured fees, and required administrative approvals.

Do not dispatch a cross-city order before the required conditions and approvals have been satisfied.

Preserve farmer-controlled product prices. Calculate delivery charges and worker compensation according to administrator-configured pricing rules without silently changing the farmer's price.

Support multiple fulfillment jobs for an order when products come from different farmers or require separate transportation arrangements.

## 8. Delivery Worker Dashboard Integration

Connect the existing dashboard pages and sidebar items to real backend data and actions.

Dashboard / Overview:

- Current availability.
- New offers.
- Active delivery count.
- Completed delivery count.
- Relevant incident alerts.
- Earnings and settlement summaries.

Delivery Requests:

- Valid, unexpired offers.
- Pickup and destination areas.
- Cargo requirements.
- Relevant distance information.
- Expected compensation where available.
- Accept and decline actions.
- Clear loading, empty, expired, and error states.

Active Deliveries:

- Assigned job details.
- Pickup instructions.
- Valid status actions.
- Navigation and destination information.
- Incident reporting.
- Proof-of-delivery submission.

My Deliveries / History:

- Authorized historical delivery records.
- Status, timestamps, order references, and outcomes.

Earnings & Payments:

- Earnings records linked to delivery jobs.
- Pending and settled amounts.
- Payment history and authorized adjustments.

Availability & Location:

- Online/offline status.
- Location permission and freshness information.
- Service area and vehicle configuration.

Notifications:

- New offers, expiry, assignments, cancellations, and payment updates.

Support & Incidents:

- Incident submission, reason codes, supporting evidence, and resolution status.

Profile & Verification:

- Existing verification workflow, profile information, and vehicle details.

Settings:

- Existing language, notification, privacy, and account-security options.

Reuse existing components and APIs where appropriate. Do not introduce mock statistics or hardcoded delivery records into production pages.

## 9. Notifications and Reliability

Integrate the existing notification service for delivery offers, offer expiry, assignment confirmation, pickup, delivery status, cancellation, incidents, and settlement updates.

Use background jobs and retryable processing where appropriate. Handle duplicate events and repeated callbacks safely.

If the architecture supports an outbox pattern, use it for critical database changes and notification dispatch so committed assignments do not silently lose their notifications.

Do not mark an offer as successfully delivered to a worker unless the notification provider or delivery channel reports the appropriate outcome.

## 10. Earnings and Auditability

Calculate worker compensation from explicit pricing rules and the applicable delivery record.

Maintain distinct records for delivery charges, worker earnings, settlement status, and financial adjustments.

Prevent duplicate earnings from repeated completion requests. Record administrative adjustments with actor, timestamp, amount, and reason.

Never expose other workers' earnings or private financial details.

## 11. Security and Data Integrity

Enforce authentication and role-based authorization on every protected API.

Validate ownership of delivery jobs, offer expiry, current status, allowed transitions, and all monetary inputs.

Prevent:

- Unauthorized access to buyer or farmer contact information.
- Assignment of the same job to multiple workers.
- Acceptance of expired or invalid offers.
- Duplicate pickup or delivery completion.
- Unauthorized cancellation or reassignment.
- Duplicate payment or earning records.
- Invalid status transitions and arbitrary price changes.
- Exposure of sensitive GPS coordinates or verification documents.

Use database constraints and transactions where needed. Keep the database as the source of truth for assignment and delivery state.

## 12. Testing and Acceptance Criteria

Add or update automated tests covering:

- Worker eligibility and verification.
- Nearby-worker matching and unavailable workers.
- Stale location and insufficient capacity.
- Offer expiry and notification failure.
- Two workers accepting simultaneously.
- Repeated acceptance and completion requests.
- Valid and invalid state transitions.
- Pickup discrepancies and failed deliveries.
- Local versus cross-city restrictions.
- Cancellation, reassignment, and return workflows.
- Duplicate earnings prevention.
- Unauthorized access and cross-worker data isolation.

Run existing tests, type checking, linting, and production builds as available. Fix regressions introduced by the implementation.

At completion, report:

1. Existing functionality discovered.
2. Features implemented.
3. Files and database changes.
4. API endpoints and business rules added or updated.
5. Tests executed and their actual results.
6. Remaining external integrations, configuration, or deployment requirements.

Do not claim that real-time tracking, notifications, payments, or delivery completion work unless they have been implemented and verified.

## 9. Final architectural rule

Keep the delivery worker module connected to the existing order, inventory, payment, notification, and administrator modules through defined service boundaries.

The delivery module owns delivery offers, assignments, pickup, transportation, delivery proof, incidents, and delivery-specific earnings records. The order module owns the customer's order, the inventory module owns stock consistency, and the payment module owns payment and settlement records.

This separation is essential: a worker completing a delivery should trigger the correct business events, but should not directly manipulate unrelated financial records or bypass order validation.