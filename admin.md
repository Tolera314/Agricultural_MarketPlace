AgriMarket Administrator Dashboard — Production-Oriented Implementation Specification
Act as a senior software architect, backend engineer, database engineer, security engineer, and QA specialist. Your responsibility is to complete and integrate the Administrator Dashboard of the existing AgriMarket location-based agricultural marketplace.
The attached screenshot is the visual reference for the current administrator dashboard.
CRITICAL UI CONSTRAINT: The administrator dashboard UI has already been implemented. Do not redesign it, replace its layout, generate a new dashboard, change its established brand identity, or rebuild existing pages unnecessarily. Preserve the existing sidebar, cards, tables, charts, typography, colors, responsive behavior, and reusable components. Focus on implementing correct business logic, secure backend APIs, database integration, workflows, validation, and real functionality.
The objective is to make the existing administrator dashboard the operational control center for the agricultural marketplace.
1. Inspect the Existing Codebase First
Before modifying code, inspect the existing repository, including:
Frontend framework, administrator routes, components, and navigation.
Backend architecture, API routes, services, and middleware.
Authentication, role-based access control, and administrator permissions.
Database schema, ORM, migrations, and relationships.
Farmer registration, verification, product listings, and inventory.
Buyer accounts, addresses, carts, orders, and payment workflows.
Delivery worker registration, availability, dispatch, tracking, and incidents.
Local markets, cities, geographic boundaries, and delivery coverage.
Cross-city trading policies and approval workflows.
Payment reconciliation, refunds, commissions, and delivery fees.
Existing reports, audit logs, notifications, and system settings.
Identify what is implemented, incomplete, mocked, duplicated, insecure, or broken.
Produce a concise implementation plan identifying:
Existing functionality that must be preserved.
Missing or defective workflows.
Required backend and database changes.
Administrator permissions and business rules.
Files expected to change.
Testing and acceptance criteria.
Then implement the functionality. Do not stop after producing a plan or modifying the frontend.
Reuse existing models, services, APIs, and components wherever appropriate. Do not create duplicate business logic or replace the architecture without a demonstrated technical need.
2. Administrator Responsibilities
The administrator is responsible for governing marketplace operations and enforcing platform policies.
The administrator must be able to:
Review and verify farmer, buyer, and delivery worker accounts according to applicable policies.
Manage product categories and moderate listings according to documented rules.
Monitor and investigate orders, payments, deliveries, and disputes.
Configure cities, local markets, service areas, and geographic coverage.
Manage cross-city trading eligibility, quantity thresholds, routes, and approval requirements.
Configure authorized platform commissions and delivery pricing policies.
Monitor financial transactions and reconciliation.
Review system alerts, low-stock alerts where applicable, pending approvals, and operational failures.
Generate accurate operational and financial reports.
Manage authorized system settings and administrator permissions.
Review audit logs for sensitive operations.
Administrative access must not silently override farmer-controlled product prices, fabricate payment success, bypass required order states, or modify historical financial records without an authorized and auditable workflow.
3. Administrator Dashboard Overview
Connect all existing dashboard summary cards, charts, recent orders, top products, and system alerts to real backend data.
Summary metrics
Support the existing metrics, including:
Total verified or registered farmers, with the definition clearly stated.
Total registered buyers.
Total orders.

Total revenue, using a clearly defined financial accounting basis.
Where appropriate, add supplementary metrics for:
Pending farmer approvals.
Pending delivery worker approvals.
Active deliveries.
Pending intercity approvals.
Failed or disputed transactions.
Unresolved incidents.
Do not overload the existing dashboard with unnecessary cards. Reuse the current layout and show supplementary information through existing sections or appropriately placed detail pages.
Date filtering
The date filter must update the metrics, charts, recent records, and reports that depend on the selected period.
Define and implement consistent date boundaries, timezone handling, and filtering rules.
Distinguish gross order value, collected payments, refunds, platform revenue, farmer revenue, and delivery charges. Do not label total order value as platform revenue.
Exclude failed, cancelled, refunded, or unpaid transactions from a metric when its defined accounting rules require exclusion.
Order overview chart
Use actual order and transaction records to display local and cross-city activity separately where supported.
The chart must respond to the selected date range and must not display hardcoded demonstration data in production.
Top products
Calculate rankings using an explicitly defined metric, such as units sold or completed-order sales value, over the selected period.
Distinguish active listings from actual sales performance. Handle empty datasets and ties consistently.
Recent orders
Display real recent orders with order reference, relevant product or fulfillment summary, buyer, farmer, order type, amount, status, and timestamp as appropriate.
Provide access to authorized order details.
System alerts
Display actionable alerts such as:
Pending account verification.
Cross-city orders awaiting approval.
Delivery jobs without a suitable worker.
Failed payment reconciliation.
Repeated delivery failures.
Low inventory where inventory thresholds are supported.
Security or operational failures requiring administrator attention.
Each alert should navigate to the relevant record or workflow. Resolve or dismiss alerts only through valid state transitions; do not hide an unresolved business problem merely because an administrator clicks a button.
4. Administrator Sidebar — Existing and Additional Modules
Preserve the existing sidebar entries and connect each to its correct backend workflow.
A. Dashboard
Display operational summaries, trends, recent orders, alerts, and actionable pending tasks.
Clicking a metric should navigate to the corresponding filtered detail page where appropriate.
B. Product Management
Allow authorized administrators to:
View product listings and their associated farmers.
Search and filter by category, market, seller, availability, and listing status.
Manage product categories and units of measurement.
Review reported or policy-violating listings.
Suspend or restore listings with an appropriate reason and audit record.
Investigate product information and stock inconsistencies.
Farmers remain responsible for setting their own product prices.
Administrators must not silently replace farmer prices. If exceptional price restrictions are legally required or part of an approved platform policy, implement them as explicit, documented rules with appropriate communication and auditability.
Do not allow listing moderation to corrupt historical order items or their agreed prices.
C. Farmers
Implement the complete farmer administration workflow.
Administrators must be able to:
View farmer profiles and registration status.
Review required verification documents.
Inspect the farmer's registered farm location and service market.
Approve or reject registrations according to the verification policy.
Request additional information where supported.
Suspend or reactivate accounts through authorized procedures.
View listings, inventory, order history, and relevant performance information.
Investigate complaints or verification discrepancies.
Approval workflow:
A farmer registers.

The backend creates the account with the appropriate pending or restricted status.
The administrator receives a pending-review item.
The administrator reviews the required information and documents.
The administrator approves, rejects, or requests additional information.
The backend records the decision, responsible administrator, timestamp, and reason.
The farmer receives a notification through configured channels.
Only an approved and otherwise eligible farmer can perform restricted marketplace operations.
Never trust a frontend-submitted approval flag. Enforce the account state in the backend.
Protect sensitive verification documents and restrict access to authorized administrators.
D. Buyers
Allow administrators to:
Search and review buyer accounts.
View relevant account status and transaction history.
Investigate buyer reports and order disputes.
Apply authorized account restrictions.
Restore access after appropriate review.
Protect buyer addresses, contact details, and transaction information. Administrators should access sensitive information only where required for their responsibilities.
Do not allow routine buyer account management to expose passwords, authentication tokens, or unnecessary payment information.
E. Delivery Workers
Implement worker onboarding and delivery operations management.
Administrators must be able to:
Review worker registration and required verification.
Review vehicle type, capacity, service area, and eligibility information.
Approve, reject, suspend, or reactivate workers through authorized workflows.
Monitor online availability and sufficiently recent location information where permitted.
View active assignments, completed jobs, delivery failures, and unresolved incidents.
Investigate worker complaints and delivery discrepancies.
Review earnings and settlement status without altering provider-confirmed payment records arbitrarily.
Reassign a delivery job only through a validated, auditable workflow.
Worker availability and location must be derived from actual authorized system data, not fabricated status indicators.
An administrator must not assign an unsuitable worker to a delivery that exceeds the worker's capacity or violates route requirements.
F. Orders
Implement a complete administrative order-management workflow.
Administrators must be able to search, filter, and inspect orders by:
Order reference.
Buyer and farmer.
Product or fulfillment group.
Local or cross-city trade type.
City, market, or route.
Order and payment status.
Delivery status.
Date range.
Dispute or exception status.
Order details should show:
Buyer and farmer information appropriate to the administrator's role.
Order items and agreed unit-price snapshots.
Quantities, subtotals, and applicable charges.
Payment status and provider references.
Fulfillment jobs and assigned workers.
Status history.
Relevant incidents, cancellations, refunds, and audit records.
Administrative actions must follow explicit rules.
Do not allow administrators to arbitrarily mark unpaid orders as paid, mark uncollected products as delivered, or change historical order prices.
For cancellations, exceptions, refunds, and reassignment, implement the existing business policy and ensure related order, inventory, payment, and delivery states remain consistent.
G. Intercity Trade
This module is essential to the marketplace business model.
Implement administrator-controlled intercity trading policies.
Administrators must be able to configure:
Supported origin and destination cities.
Enabled intercity routes.
Minimum order quantity or load thresholds.
Accepted product categories.
Vehicle and transportation requirements.
Intercity delivery and logistics fees.
Applicable platform commissions.
Approval requirements.
Cancellation, return, and exception policies.
Route-specific operational restrictions.
The backend must validate these policies whenever an intercity order is created, approved, dispatched, or materially changed.
Intercity approval workflow
The buyer requests an order from a farmer in another city.

The backend identifies the origin and destination markets.
The backend checks route eligibility, quantity or load thresholds, inventory, pricing, and other required conditions.
The order enters the appropriate pending-approval state if approval is required.
The administrator reviews the order and its logistics and financial breakdown.
The administrator approves or rejects the request, recording the reason.
The backend validates the decision and updates the order's approval state.
If approved, the order proceeds through the required payment and fulfillment workflow.
Dispatch begins only when all required conditions are satisfied.
The exact sequence between approval and payment must follow the existing payment architecture and configured business rules. If payment authorization or a deposit is required before approval, implement that explicitly rather than charging the buyer twice or accepting an unfulfillable order.
The administrator controls trading eligibility and applicable charges, but the farmer continues to set the product price.
H. Markets & Regions
Implement geographic marketplace management.
Administrators must be able to:
Create and manage cities, markets, regions, and delivery zones.
Define supported service coverage.
Configure geographic boundaries or permitted radius-based service areas.
Assign farmers and operational service areas where the business rules require it.
Configure local market eligibility.
Manage enabled intercity routes and associated coverage.
Review invalid, missing, or conflicting geographic records.
Use the existing geographic data model where possible. If geographic queries are required, use the existing spatial database functionality or an appropriate PostGIS implementation.
Validate coordinates and geographic boundaries. Prevent overlapping or conflicting configurations from silently producing inconsistent market assignments.
A nearest city must not automatically be treated as the correct market if route accessibility or configured market boundaries indicate otherwise.
When a market or route changes, validate the effect on new orders. Do not silently invalidate confirmed orders without an explicit migration, exception, or grandfathering policy.
I. Transactions
Implement a read-first, auditable financial administration module.
Administrators must be able to inspect:
Payment transactions and provider references.
Payment success, pending, and failure states.
Refund requests and their outcomes.
Farmer settlement records where supported.
Delivery worker earning and settlement records.
Platform commissions and applicable fees.
Reconciliation discrepancies.
Financial transaction history.
Payment status must be derived from trusted backend verification and payment-provider reconciliation.
A manual reconciliation operation must be distinct from directly changing a payment status.
Refunds must use the configured provider integration and authorization policy. Record the refund request, amount, reason, initiator, provider result, and resulting transaction state.
Prevent duplicate refunds, duplicate settlement records, and repeated payment processing.
Do not expose provider secret keys, payment credentials, or unnecessary personal financial information.
J. Reports
Implement real operational and financial reports, including:
Farmer registrations and approvals.
Buyer registrations.
Product listings and inventory status.
Orders by status, market, and date.
Local versus intercity trade activity.
Delivery performance and failed delivery rates.
Payment collections and failures.
Refunds and reconciliation discrepancies.
Platform revenue and commission reports.
Farmer and delivery worker settlement summaries.
Clearly define each metric and the records used to calculate it.
Use appropriate filters, pagination, and date ranges. Support export formats only when implemented and authorized.
Exports must respect administrator permissions and must not leak passwords, authentication tokens, sensitive verification documents, or unrelated personal data.
K. Settings

Implement authorized platform configuration, including:
Platform name and supported languages where configurable.
Notification channel configuration.
Supported product categories and measurement units.
Default local delivery policies.
Cross-city trade thresholds and eligibility rules.
Delivery and commission pricing policies.
Account verification requirements.
Operational timeouts and dispatch policies.
Other existing application settings.
Validate every configuration change on the backend.
Apply settings changes predictably and document whether they affect only new transactions or also permitted ongoing operations.
Never expose environment secrets or let a normal administrator modify infrastructure-level credentials through a public settings form.
5. Additional Sidebar Modules
Add these modules only if their functionality is missing and is within the existing architecture's scope.
A. Approvals
Create a consolidated administrative review queue for:
Farmer registrations.
Delivery worker registrations.
Cross-city orders awaiting authorization.
Other supported requests requiring approval.
Each item must display the information needed to make a decision, its current state, and the actions the administrator is authorized to perform.
Record the decision, reason, actor, and timestamp. Prevent duplicate or conflicting decisions when multiple administrators review the same item.
B. Disputes & Support
Provide a centralized place to review order disputes, delivery incidents, buyer complaints, farmer complaints, and worker support requests.
Allow authorized administrators to:
Review the case and related order.
Inspect permitted supporting evidence.
Request additional information.
Record decisions and resolution notes.
Trigger permitted refunds, returns, or reassignment workflows.
Track case status and resolution time.
Do not let dispute resolution bypass financial authorization or modify historical transactions without the appropriate workflow.
C. Notifications
Allow administrators to review relevant operational notifications, approval reminders, and system alerts.
Provide supported notification actions, read/unread state, and links to authorized records.
If administrative announcements are supported, provide a controlled publishing workflow with audience selection, content validation, and an audit trail.
D. Audit Logs
Create a protected audit-log module for sensitive administrative and financial actions.
Record:
Actor and role.
Action performed.
Affected record.
Timestamp.
Relevant before-and-after values where appropriate.
Reason for sensitive decisions.
Correlation or request reference where available.
Audit records must not be editable or deletable through ordinary administrator operations.
Protect the logs from unauthorized access and avoid recording passwords, tokens, or unnecessary sensitive data.
E. Administrator Users & Permissions
If the application supports multiple administrators, implement role-based administrative permissions rather than giving every administrator unrestricted access.
Possible roles include:
Super Administrator.
Marketplace Operations Administrator.
Verification Administrator.
Finance Administrator.
Logistics Administrator.
Read-only Auditor.
Define actual roles according to operational requirements. Do not assume that every deployment requires all of them.
Restrict sensitive actions such as approving financial adjustments, issuing refunds, changing pricing policies, modifying administrator permissions, or altering geographic trade rules.
Require stronger authorization or a second approval for high-risk operations where appropriate.
Do not allow an administrator to grant themselves privileges outside their authorized role.
6. Critical Business Rules
Enforce the following rules throughout the backend:
Farmers control their own product prices.
The marketplace defaults to nearest eligible farmers first for buyer discovery.
Location ranking must not override product availability or delivery eligibility.
Administrators manage geographic boundaries and local market policies.

Cross-city trade is subject to configured route, quantity, logistics, and approval rules.
Delivery workers are selected according to location, availability, vehicle capacity, and route eligibility.
Orders, payments, inventory, and delivery jobs have distinct but coordinated lifecycles.
Historical confirmed-order prices must remain stable.
Only trusted backend verification can establish successful payment.
Administrative actions must respect authorization and valid state transitions.
Financial adjustments must be explicit, authorized, and auditable.
Buyer, farmer, and delivery worker information must be protected according to least-privilege access.
Notifications and background tasks must tolerate retries and duplicate events.
Administrative configuration changes must not silently corrupt existing transactions.
7. Database and API Integration
Reuse existing database models and API routes wherever possible.
Create or update the necessary operations for:
Dashboard metrics and reporting.
Farmer, buyer, and delivery worker management.
Product moderation.
Order inspection and authorized resolution.
Intercity route configuration and approval.
Market and region configuration.
Financial reconciliation and refund workflows.
Reports and exports.
Support cases.
Notifications and audit logs.
Administrator permissions and settings.
Use database transactions, constraints, idempotency controls, and appropriate locking where required.
Ensure sensitive operations are enforced on the backend, not merely hidden in the frontend.
Avoid duplicating existing models for orders, payments, products, markets, or delivery jobs.
8. Reliability and Security
Implement and verify:
Server-side role-based access control.
Validation of all incoming parameters.
Protection against unauthorized record access.
Concurrency-safe approval and assignment operations.
Idempotent payment and refund processing.
Inventory consistency.
Auditable financial changes.
Secure handling of uploaded verification documents.
Protection against SQL injection and unsafe query construction.
Rate limiting on sensitive operations.
Appropriate error handling and logging.
Safe background job retries.
Data minimization and appropriate location privacy.
Pagination and efficient queries for large datasets.
Use understandable error messages in the user interface while retaining useful diagnostic details in protected server logs.
Do not leak stack traces, secrets, private records, or internal database errors to clients.
9. UI Integration Requirements
Preserve the existing administrator dashboard design in the supplied screenshot.
Connect the current cards, charts, recent-order list, system alerts, and sidebar to real functionality.
Every navigation item must lead to a valid page. Every action button must perform its advertised operation. Filters and date controls must affect actual queries.
Reuse existing design components and established responsive behavior.
Do not introduce mock metrics, fabricated orders, hardcoded financial totals, or placeholder approval actions into production.
Implement appropriate loading, empty, success, and error states within the existing design system.
10. Testing and Acceptance Criteria
Create or update tests covering:
Administrator authentication and role permissions.
Farmer and worker verification workflows.
Duplicate and conflicting approvals.
Product moderation and farmer price protection.
Order state validation.
Intercity route and threshold enforcement.
Geographic boundary and market assignment behavior.
Payment verification and reconciliation.
Refund authorization and duplicate prevention.
Delivery worker eligibility and reassignment.
Dashboard metric accuracy.
Date filtering and revenue calculations.
Report authorization and export security.
Audit-log integrity.
Concurrent administrative actions.
Unauthorized access to buyer, farmer, and worker information.
Run the available tests, type checks, linting, and production build. Fix regressions introduced by the implementation.

Do not report a feature or test as successful unless it has actually been implemented or executed.
11. Completion Report
At completion, provide:
Findings from the initial codebase inspection.
Existing features preserved.
Features implemented or corrected.
Files and database migrations changed.
API endpoints and permission rules added or modified.
Important business logic and state transitions.
Tests executed and their actual results.
External services or configuration still required.
Remaining incomplete work and known limitations.
Final objective: deliver a secure, functional, auditable administrator control center for AgriMarket without redesigning the existing UI or weakening the marketplace's location-based discovery, farmer-controlled pricing, delivery, or cross-city trading rules.
