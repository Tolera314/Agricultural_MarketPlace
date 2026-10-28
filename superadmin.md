# AgriMarket — Complete Superadmin Dashboard & Platform Governance Implementation

## 1. ROLE AND PROJECT CONTEXT

Act as a senior full-stack engineer, software architect, UI/UX engineer, security engineer, and QA engineer working on the existing AgriMarket agricultural marketplace.

AgriMarket is a full-stack agricultural marketplace designed for Ethiopian agricultural commerce. It connects Farmers, Buyers, Delivery Workers, and administrators through a unified platform supporting agricultural products, orders, payments, deliveries, local markets, and intercity trade.

The documented technology stack includes:

- Frontend: Next.js, React, TypeScript, and Tailwind CSS.
- Backend: Node.js, Express, and TypeScript.
- ORM: Prisma.
- Database: PostgreSQL, potentially hosted on Neon.
- Authentication: The project's existing authentication and role-based access-control system.

These are documented expectations. Inspect the actual repository and installed versions before making architectural decisions.

### My assigned responsibility

This is a group project. My responsibility is **the Superadmin module only**.

Other team members own the Farmer, Buyer, Delivery Worker, and ordinary Admin modules.

Your responsibility is to implement a complete, functional, secure, and visually consistent Superadmin system that integrates with the existing application.

Do not rebuild the entire marketplace. Do not replace other team members' modules. Reuse existing database models, APIs, services, authentication mechanisms, layouts, components, and business logic wherever possible.

The finished implementation must be connected to real backend functionality. A static dashboard with hardcoded metrics and nonfunctional buttons is not acceptable.

---

## 2. PRIMARY OBJECTIVE AND VISUAL REFERENCE

Use the supplied AgriMarket Superadmin dashboard screenshot as the primary visual reference.

Reproduce its general structure, layout, spacing, colors, and hierarchy while preserving the established design system of the existing AgriMarket application.

The reference contains:

- AgriMarket branding in the upper-left corner.
- A dark emerald-green sidebar.
- A top header with system search, notifications, and the Superadmin profile.
- A Dashboard title and platform-oversight subtitle.
- A date-range selector.
- Four summary metric cards.
- A Platform Growth line chart.
- A City Trade Overview table.
- A Recent Activities panel.
- A Quick Actions section.
- A Help/Contact Support area near the bottom of the sidebar.

The design should look professional, clean, modern, responsive, and appropriate for a production agricultural marketplace.

Preserve the reference screenshot's intended appearance. Do not invent a completely different dashboard design.

---

## 3. MANDATORY REPOSITORY INSPECTION

Before modifying any code, inspect the current project.

### Frontend

Identify:

- The existing Next.js application structure and router.
- Current dashboard layouts and routes.
- The Admin dashboard and its reusable components.
- Shared sidebar and header components.
- Existing card, table, chart, dialog, and form components.
- Authentication and session hooks.
- API clients and request utilities.
- Existing styling conventions and Tailwind configuration.
- Responsive layout behavior.
- Existing loading, empty, and error-state patterns.

### Backend

Identify:

- Express application initialization.
- Authentication middleware.
- Role-based authorization middleware.
- Existing API route conventions.
- Controllers and service layers.
- Prisma schema and migrations.
- User model and Role enum.
- Existing market, region, order, payment, delivery, and transaction models.
- Existing report, notification, and audit-log functionality.
- Existing validation, error-handling, and logging conventions.
- Current tests and build scripts.

### Git and code safety

1. Inspect the current Git branch and working-tree status.
2. Preserve uncommitted changes.
3. Do not discard or overwrite another teammate's work.
4. Search for existing functionality before creating a replacement.
5. Do not introduce a second authentication system, database client, or API architecture.
6. Avoid unnecessary dependency upgrades.
7. Review schema changes before generating migrations.
8. Do not assume features exist merely because they appear in the screenshot.
9. Do not assume features are missing without checking the code.
10. Identify shared-file conflicts and integration dependencies before changing them.

After inspection, produce a concise architecture summary and implementation plan. Then continue implementing the system in manageable stages. Do not stop after writing the plan.

---

## 4. MANDATORY DESIGN CONSISTENCY AND SHARED COMPONENT REUSE

**This is a strict requirement: the Superadmin dashboard must look and behave like a natural part of the existing AgriMarket application.**

Before implementing its UI, inspect the Admin, Farmer, Buyer, and Delivery Worker dashboards.

The Admin dashboard is the preferred starting point for identifying reusable administrative layouts and components.

### 4.1 Sidebar reuse

Reuse the existing shared sidebar component if one is available.

Preserve its established:

- Emerald-green or dark-green background.
- Width and dimensions.
- AgriMarket logo and placement.
- Typography.
- Icon library, icon sizes, and alignment.
- Navigation-item height and spacing.
- Active-item highlighting.
- Hover and focus states.
- Border radii and separators.
- Collapsed and expanded behavior.
- Mobile navigation behavior.
- Help or Contact Support section.

Configure the sidebar with the Superadmin-specific navigation items listed in this prompt.

Do not recreate an almost identical sidebar with separate styles if a shared component already exists.

Do not show irrelevant Farmer, Buyer, or Delivery Worker navigation links inside the Superadmin sidebar.

### 4.2 Header reuse

Reuse the existing header or top navigation component wherever possible.

Preserve the established:

- Height and spacing.
- Logo and branding conventions.
- Global search field.
- Notification control.
- User avatar.
- User name and role label.
- Profile dropdown.
- Logout behavior.
- Responsive behavior.

Use the authenticated Superadmin's real profile data.

Extend the existing component through supported props or configuration rather than duplicating it.

### 4.3 Shared design system

Inspect the existing CSS variables, Tailwind configuration, shared styles, and component library.

Reuse the existing conventions for:

- Primary and secondary colors.
- Emerald-green accents.
- Background colors.
- Typography and font sizes.
- Spacing and padding.
- Cards, borders, shadows, and corner radii.
- Buttons and button variants.
- Input fields and search boxes.
- Dropdowns and menus.
- Tables and pagination.
- Status badges.
- Dialogs and confirmation modals.
- Notifications and toasts.
- Loading indicators and skeletons.
- Empty states and error messages.

Do not introduce a conflicting color palette, unrelated typography, duplicate design tokens, or a new design language.

### 4.4 Shared components

Search for existing reusable components before creating new ones.

Where appropriate, reuse:

- Dashboard layouts and page containers.
- Metric cards.
- Charts and chart legends.
- Tables.
- Search and filter controls.
- Date-range selectors.
- Quick-action cards.
- Recent-activity lists.
- Confirmation dialogs.
- Form components.
- Pagination.
- Loading and error states.
- Authentication providers and API utilities.

For example, if the Admin dashboard already has a metric-card component, use it for Total Users, Total Farmers, Total Buyers, and Total Deliveries.

Create new components only when the existing ones cannot reasonably satisfy the requirement.

Keep Superadmin-specific logic within the Superadmin module. If a shared component must change, review its use across all dashboards and ensure other team members' work remains functional.

### 4.5 Visual consistency acceptance criteria

Before completion, verify that:

- The Superadmin sidebar matches the other dashboards.
- The header and profile menu follow the same conventions.
- Colors, typography, spacing, and card styling remain consistent.
- Icons use the existing library and sizing conventions.
- Buttons, tables, dialogs, and status badges are consistent.
- Navigation behavior matches the existing application.
- Mobile and tablet layouts follow established patterns.
- Shared-component changes have not broken other dashboards.
- No unnecessary duplicate layouts or CSS systems were introduced.

**Design rule: reuse first, extend second, create new components only when necessary.**

---

## 5. TEAM OWNERSHIP AND INTEGRATION BOUNDARIES

The other team members own the core marketplace domains.

### Other teams own

- Farmer registration and farmer profiles.
- Buyer accounts and buyer profiles.
- Delivery Worker accounts and delivery workflows.
- Product creation and farmer-controlled product pricing.
- Core order processing and lifecycle.
- Payment-provider integration.
- Core inventory operations.
- Marketplace trading workflows.
- Existing domain-specific business rules.

### Superadmin owns

- Administrative user and role governance.
- Authorized permission management.
- Platform-level configuration.
- Regions and markets administration, coordinated with domain owners.
- Intercity route policies, coordinated with domain owners.
- Commission and fee configuration.
- Transaction limit policies.
- Platform-wide reports and analytics.
- Audit-log access.
- Security oversight.
- Supported backup and database operational visibility.

### Integration rules

- Consume existing APIs and services.
- Do not create duplicate domain models.
- Do not independently implement payment processing, inventory management, or delivery assignment.
- Reuse existing domain services for changes affecting marketplace entities.
- Add only the smallest necessary integration changes.
- Document missing APIs or models that require another teammate's work.
- Do not silently rewrite shared business logic.
- Preserve historical transaction data and existing marketplace rules.

The Superadmin governs the platform; it does not replace the underlying domain systems.

---

## 6. SUPERADMIN ROUTING AND AUTHORIZATION

Create or integrate Superadmin pages using the application's existing routing conventions.

Possible routes, if they fit the existing structure:

- `/dashboard/superadmin`
- `/dashboard/superadmin/users`
- `/dashboard/superadmin/settings`
- `/dashboard/superadmin/markets`
- `/dashboard/superadmin/routes`
- `/dashboard/superadmin/commissions`
- `/dashboard/superadmin/transaction-limits`
- `/dashboard/superadmin/reports`
- `/dashboard/superadmin/audit-logs`
- `/dashboard/superadmin/security`
- `/dashboard/superadmin/backup`

These are proposed routes, not instructions to duplicate existing pages or routing structures.

### Authorization requirements

- Only authenticated, authorized Superadmins may access Superadmin-only operations.
- Enforce permissions on the backend for every protected endpoint.
- Do not trust a role supplied by the client.
- A hidden frontend button is not authorization.
- Ordinary Admin users must not gain Superadmin access by manually entering a URL or calling an API.
- Prevent privilege escalation and unauthorized role changes.
- Prevent accidental removal or deactivation of the last active Superadmin.
- Revoke relevant sessions when access is withdrawn, where supported.
- Use the existing authentication and session architecture.
- Return appropriate HTTP errors for unauthorized operations.
- Audit sensitive administrative changes.

Inspect the existing Role enum and authorization model before changing them.

If `SUPERADMIN` already exists, reuse it. If it is missing, implement the smallest compatible schema, middleware, migration, and tests needed to support it.

Provision the initial Superadmin through a secure, documented process. Never hardcode credentials or expose a public endpoint that allows users to promote themselves.

---

## 7. SUPERADMIN SIDEBAR AND NAVIGATION

The Superadmin sidebar should contain the following modules, in this order:

1. Dashboard
2. Users & Roles
3. System Settings
4. Regions & Markets
5. Intercity Routes
6. Commissions & Fees
7. Transaction Limits
8. Reports & Analytics
9. Audit Logs
10. Security
11. Backup & Database

At the bottom, reuse the application's existing Help/Contact Support section if available.

### Navigation behavior

- Highlight the current route.
- Use the same icons, spacing, and interaction patterns as the Admin sidebar.
- Ensure all links navigate to the appropriate module.
- Apply responsive collapse or drawer behavior consistent with other dashboards.
- Use existing authentication and logout mechanisms.
- Display only navigation options authorized for the current user.
- Do not use frontend visibility as a substitute for backend authorization.

Every navigation item must lead to a real implemented screen or a clearly identified, intentionally incomplete module. Do not present nonfunctional placeholder screens as finished features.

---

## 8. SUPERADMIN HEADER

Reuse the shared application header.

Include:

- AgriMarket branding.
- System-wide search over authorized resources.
- Notifications.
- Authenticated Superadmin avatar or initials.
- User name and role.
- Profile dropdown.
- Logout action.

Use existing notification and profile services.

Search must retrieve real, authorized data. If the repository does not support a specific search capability, identify the missing dependency rather than simulating successful results.

---

## 9. SUPERADMIN DASHBOARD

Implement the complete dashboard shown in the screenshot.

### 9.1 Page heading

Display:

**Superadmin Dashboard**

Subtitle:

**Full system control and oversight**

Include a date-range selector with supported options such as:

- Last 7 days.
- Last 30 days.
- Last 90 days.
- Custom range, if supported.

Use consistent date handling across all applicable dashboard widgets.

### 9.2 Summary metric cards

Create four metric cards using the existing shared card component.

**Total Users**
- Count the actual supported user population.
- Define the treatment of unverified, suspended, and deleted accounts.
- Avoid double-counting related profiles.
- Show a comparison with the previous period only when valid data exists.

**Total Farmers**
- Count actual Farmer accounts or profiles according to the existing schema.
- Apply documented status rules.
- Display valid trend information where possible.

**Total Buyers**
- Count actual Buyer accounts or profiles.
- Apply consistent inclusion rules.
- Display valid trend information where possible.

**Total Deliveries**
- Use actual delivery records.
- Define whether the metric counts created deliveries, completed deliveries, or deliveries associated with the selected period.
- Keep the definition consistent with the reporting module.

### Metric rules

- Retrieve metrics from real backend data.
- Apply date filters consistently.
- Use timezone-aware date boundaries.
- Use efficient database aggregation.
- Handle empty databases safely.
- Avoid fetching every database record merely to calculate counts.
- Never hardcode screenshot values as production data.
- Never fabricate growth percentages.
- Display unavailable metrics appropriately.
- Document how each metric is calculated.

### 9.3 Platform Growth

Implement an interactive line chart showing:

- User growth.
- Order growth.
- Date range.
- Chart legend.
- Tooltips.
- Appropriate axes.
- Responsive layout.

Reuse the existing charting library if available. If no suitable library exists, select a compatible option only when necessary.

Use real time-series aggregates.

If historical snapshots do not exist, calculate trends from reliable creation timestamps and clearly explain any limitations. Do not mistake current totals for historical totals.

Provide loading, empty, and error states.

### 9.4 City Trade Overview

Implement a table or responsive list containing available intercity trading information.

Potential columns:

- Origin.
- Destination.
- Order count.
- Trade value.
- Route or policy status.
- Action to view details.

Requirements:

- Use real route, market, and order records.
- Reuse the existing intercity and geographic services.
- Distinguish route configuration status from order status.
- Define trade value consistently with the existing financial model.
- Apply bounded queries and pagination.
- Provide an empty state when there is no trade data.
- Do not fabricate routes, values, or statuses.

### 9.5 Recent Activities

Display actual recent administrative activities where records are available.

Examples:

- Administrator created.
- Role changed.
- Permission updated.
- Platform setting changed.
- Market configured.
- Route updated.
- Commission policy changed.
- Security event recorded.

Display the actor, action, affected resource, timestamp, and outcome where supported.

Requirements:

- Reuse existing audit-log or activity infrastructure.
- Do not invent events.
- Do not expose passwords, tokens, or unnecessary sensitive information.
- Limit the number of records returned.
- Provide a link to Audit Logs for authorized users.

### 9.6 Quick Actions

Implement these four actions:

1. Manage Users.
2. Configure Markets.
3. Update Fees.
4. View Reports.

Each action must navigate to the appropriate module and respect its authorization rules.

If an action performs a consequential operation rather than navigation, require appropriate validation, confirmation, and audit logging.

### 9.7 Dashboard states

Support:

- Initial loading.
- Partial loading where appropriate.
- Empty datasets.
- API errors.
- Permission errors.
- Date-range changes.
- Responsive layouts.

Do not fill failed API responses with fake numbers to make the dashboard look complete.

---

## 10. USERS & ROLES MODULE

Implement secure administrative account management.

### 10.1 Administrative user list

Display supported fields such as:

- Name.
- Email or approved identifier.
- Role.
- Account status.
- Creation date.
- Last login or activity, if recorded.
- Authorized actions.

Provide:

- Search.
- Role filtering.
- Status filtering.
- Pagination.
- Sorting where appropriate.
- A detail view.

Avoid exposing password hashes, session tokens, verification documents, or unnecessary personal data.

### 10.2 Administrator provisioning

Allow authorized Superadmins to create or invite administrative users using the existing onboarding architecture.

Requirements:

- Validate required information.
- Prevent duplicate accounts.
- Assign only permitted roles.
- Use secure invitation or verified onboarding where supported.
- Never store or expose plaintext passwords.
- Never send credentials insecurely.
- Handle repeated requests safely.
- Record provisioning events.

### 10.3 Role and permission management

Inspect the actual role system first.

If the existing roles are `FARMER`, `BUYER`, `DRIVER`, `ADMIN`, and `SUPERADMIN`, reuse them unless there is a justified requirement for additional administrative roles.

If granular permissions already exist, integrate with them.

Potential permission categories:

- User management.
- Platform configuration.
- Market and route administration.
- Financial policy configuration.
- Report access.
- Audit-log access.
- Security management.
- Backup operations.

Do not build an unnecessarily complicated permission engine if the current role model is sufficient.

### 10.4 Account status management

Where supported, allow authorized Superadmins to activate, deactivate, or suspend administrator accounts.

- Confirm consequential actions.
- Capture a reason where appropriate.
- Prevent removal of the last active Superadmin.
- Revoke sessions when necessary.
- Record the actor, target, and outcome.
- Use transactions and concurrency controls where appropriate.

---

## 11. SYSTEM SETTINGS

Build a structured interface for supported platform-level settings.

Potential categories:

- Platform information.
- Supported languages.
- Account verification policies.
- Notification configuration.
- Operational defaults.
- Marketplace policies.
- Safe security-related settings.

Requirements:

- Inspect the current configuration architecture first.
- Reuse existing settings storage if available.
- Introduce a settings model only when justified.
- Validate every change on the backend.
- Require confirmation for consequential changes.
- Show meaningful success and error feedback.
- Audit sensitive changes.
- Document whether a change affects existing records or future operations.

Never expose or edit database passwords, authentication signing keys, provider credentials, API secrets, or raw environment files through the dashboard.

Manage infrastructure secrets through the appropriate deployment or secrets-management environment.

---

## 12. REGIONS & MARKETS

Provide authorized management of geographic marketplace configuration.

Where supported, manage:

- Regions.
- Cities.
- Markets.
- Market availability.
- Geographic identifiers.
- Market status.
- Relevant trading eligibility policies.

Requirements:

- Reuse existing geographic models.
- Validate names and relationships.
- Prevent duplicate identifiers.
- Preserve database referential integrity.
- Confirm consequential changes.
- Avoid deleting records referenced by historical orders.
- Record administrative changes.
- Coordinate shared API or schema changes with the responsible teammate.

Do not implement unrelated mapping or geolocation features unless they are part of the existing project requirements.

---

## 13. INTERCITY ROUTES

Provide authorized configuration and oversight of intercity trading routes.

Potential fields:

- Origin.
- Destination.
- Route identifier.
- Availability.
- Minimum eligible quantity or load.
- Applicable logistics requirements.
- Applicable fee policy.
- Activation status.
- Effective dates, where supported.

Requirements:

- Reuse existing route and market models.
- Validate origin and destination.
- Prevent duplicate routes where prohibited.
- Validate policy constraints.
- Preserve confirmed orders and historical records.
- Audit route creation, modification, and deactivation.
- Coordinate changes with the intercity-trading owner.

Do not introduce live GPS tracking, route optimization, or delivery dispatch unless the existing application explicitly supports them and they are within the agreed scope.

---

## 14. COMMISSIONS & FEES

Implement controlled configuration of supported marketplace fee policies.

Potential policy types:

- Platform commission.
- Delivery fees.
- Intercity service fees.
- Other explicitly supported marketplace charges.

Requirements:

- Inspect the financial schema and calculation services.
- Reuse the existing currency and decimal-precision conventions.
- Validate rates, amounts, bounds, and conditions.
- Prevent invalid or negative fee configurations where prohibited.
- Define how policies apply to new transactions.
- Preserve historical order prices and transaction amounts.
- Do not retroactively recalculate completed transactions without an explicit, authorized adjustment workflow.
- Require confirmation for high-impact changes.
- Audit who changed the policy, when, why, and the relevant previous and new values.

The Superadmin configures policy. The existing financial service applies the policy to transactions.

Do not duplicate payment processing or fabricate financial records.

---

## 15. TRANSACTION LIMITS

Implement supported financial and marketplace policy limits.

Potential controls:

- Maximum order value.
- Maximum transaction amount.
- Daily transaction limits.
- Refund approval thresholds.
- Intercity order thresholds.
- Administrative approval requirements.

Requirements:

- Reuse existing order and financial policies where available.
- Validate limits on the backend.
- Define currency and time window.
- Apply limits through the responsible domain services.
- Define whether changes apply to new or existing pending transactions.
- Prevent concurrent requests from bypassing limits.
- Audit policy changes.
- Protect high-impact operations with appropriate authorization.

If the current architecture cannot enforce a requested limit, document the missing dependency. Do not claim a UI setting is effective unless the backend actually applies it.

---

## 16. REPORTS & ANALYTICS

Provide platform-wide reporting based on authorized real data.

Potential reports:

- User registration trends.
- Role distribution.
- Farmer verification and approval statistics.
- Buyer activity.
- Order volumes.
- Delivery performance.
- Local versus intercity trading.
- Market activity.
- Commission and fee summaries.
- Payment and refund summaries.
- Reconciliation status.
- Administrative activity.

### Financial definitions

Keep these concepts separate:

- Gross order value.
- Successfully collected payments.
- Refunds.
- Platform commission revenue.
- Delivery fees.
- Farmer-attributed revenue.
- Outstanding or unreconciled amounts.

Do not label total marketplace sales as platform revenue.

Use the existing financial source of truth and clearly defined calculations.

### Reporting requirements

- Date filters.
- Consistent timezone handling.
- Server-side pagination and filtering.
- Appropriate authorization.
- Privacy-conscious output.
- Safe export functionality where supported.
- Audit events for sensitive report exports where required.

Never fabricate reporting data or claim accounting accuracy without verifying the underlying calculations.

---

## 17. AUDIT LOGS

Implement a protected interface for reviewing administrative activity.

Where supported, capture:

- Actor identifier.
- Actor role.
- Action performed.
- Affected resource.
- Timestamp.
- Reason for sensitive actions.
- Relevant before-and-after values.
- Request or correlation identifier.
- Outcome.

Use existing audit infrastructure when available. Otherwise, implement the minimum compatible model and service.

Requirements:

- Create audit events on the server.
- Coordinate sensitive writes and audit records transactionally where appropriate.
- Protect logs against unauthorized modification and deletion.
- Restrict access by permission.
- Support useful filters and pagination.
- Sanitize sensitive values.
- Never record passwords, access tokens, session tokens, or secrets.

Audit logs must identify the acting user through trusted server-side authentication, not client-supplied identity.

---

## 18. SECURITY

Implement or verify the Superadmin security oversight interface using actual application data.

Potential features:

- Recent security events.
- Failed authentication summaries.
- Suspicious administrative activity.
- Administrative account status.
- Session revocation where supported.
- Security configuration visibility.
- Relevant audit events.

Requirements:

- Use actual security records.
- Do not fabricate threat detections.
- Protect sensitive security information.
- Restrict access to authorized Superadmins.
- Apply server-side permission checks.
- Use safe error handling and rate limiting.
- Do not expose secrets or unnecessary infrastructure details.

Verify the implementation of:

- Authentication.
- Role-based authorization.
- Input validation.
- Resource-level access control.
- SQL injection protections.
- CSRF protection where applicable.
- Appropriate CORS configuration.
- Rate limiting.
- Safe error responses.
- Session invalidation.
- Privilege escalation prevention.
- Concurrency controls for high-risk operations.
- Logging without sensitive-data leakage.

Do not claim the application is secure merely because a checklist appears in the prompt. Verify actual behavior and tests.

---

## 19. BACKUP & DATABASE

Implement only functionality supported by the existing deployment architecture.

Potential features:

- Database health status.
- Safe database-provider information.
- Backup-job status.
- Backup history.
- Backup timestamps.
- Backup success or failure summaries.
- Authorized triggering of an existing backup job.

Requirements:

- Never expose connection strings, database credentials, or secrets.
- Do not expose arbitrary database queries.
- Do not add destructive database operations without an explicitly approved design.
- Do not claim a backup exists without verifying the underlying mechanism.
- Do not claim a backup is restorable without evidence or a tested restore procedure.
- Require strong authorization for sensitive operations.
- Audit backup requests and results.
- Reuse the existing deployment and backup infrastructure.

If backup infrastructure is absent, document the missing dependency and implement safe status visibility only where supported. Do not create a fake backup interface.

---

## 20. BACKEND API AND DATABASE INTEGRATION

Use the existing Express API architecture, Prisma schema, middleware, and services.

Before creating an endpoint, search for equivalent functionality.

Logical API capabilities may include:

- Dashboard metrics.
- Platform growth analytics.
- City trade summaries.
- Recent administrative activities.
- Administrative user management.
- Role and permission management.
- System settings.
- Market and route policies.
- Commission and transaction-limit policies.
- Reports.
- Audit logs.
- Security events.
- Backup status.

Follow existing endpoint naming, versioning, and response conventions. Do not create duplicate endpoints merely because they are listed here.

### Backend requirements

- Reuse existing authentication middleware.
- Enforce Superadmin authorization server-side.
- Validate request bodies, parameters, and identifiers.
- Return consistent response structures and appropriate HTTP status codes.
- Use database transactions for related sensitive writes.
- Apply database constraints and uniqueness rules where appropriate.
- Use efficient, bounded queries.
- Prevent unauthorized mass assignment.
- Keep business logic in appropriate services.
- Avoid leaking stack traces, secrets, or sensitive database errors.
- Add tests for new functionality.
- Document shared API changes required by teammates.

Do not create duplicate User, Order, Payment, Product, Market, or Delivery models.

---

## 21. FRONTEND IMPLEMENTATION AND USER EXPERIENCE

Follow the existing frontend architecture and component conventions.

Recommended component responsibilities, adapted to the actual repository:

- Superadmin page or route layout.
- Shared sidebar configuration.
- Shared header configuration.
- Dashboard metric cards.
- Platform Growth chart.
- City Trade table.
- Recent Activities list.
- Quick Action cards.
- Search and filter controls.
- Date-range selector.
- Confirmation dialogs.
- Form validation and feedback.

### UI requirements

- Responsive desktop, tablet, and mobile layouts.
- Consistent spacing and typography.
- Accessible labels and keyboard navigation.
- Clear active navigation states.
- Loading indicators for asynchronous operations.
- Useful empty states.
- Clear success and error messages.
- Confirmation for consequential actions.
- Form validation messages.
- Protection against duplicate submissions.
- Proper disabled states during pending requests.
- No unnecessary horizontal overflow on mobile.
- No inert buttons or misleading success messages.

Reuse installed dependencies and shared components. Do not install unnecessary libraries or duplicate existing styles.

---

## 22. TESTING REQUIREMENTS

Use the testing framework already present in the repository.

### Authorization tests

- Unauthenticated requests cannot access protected APIs.
- Ordinary Admin users cannot access Superadmin-only operations.
- Unauthorized role changes are rejected.
- Users cannot promote themselves to Superadmin.
- The last active Superadmin cannot be accidentally removed.
- Revoked administrators cannot continue using invalidated privileges.

### Dashboard tests

- Metric counts match test data.
- Date filters produce correct results.
- Empty datasets are handled.
- Time-series calculations use appropriate timestamps.
- City trade summaries use actual records.
- Recent activities contain only authorized information.

### User and policy tests

- Duplicate administrator creation is rejected.
- Role changes follow authorization rules.
- Invalid settings are rejected.
- Invalid commission and transaction-limit values are rejected.
- Historical transaction amounts are preserved.
- Sensitive changes produce audit records.
- Conflicting concurrent changes are handled safely.
- Unauthorized operations do not modify data.

### Operational tests

- Audit-log access is restricted.
- Secrets are never returned by settings APIs.
- Backup status reflects the real infrastructure.
- Errors do not expose sensitive information.
- Frontend states handle loading, errors, and empty responses.

Run the relevant:

- Backend tests.
- Frontend tests.
- Type checks.
- Lint checks.
- Production builds.
- Integration checks.

Do not skip failing tests to claim success. Do not report tests that were not executed.

---

## 23. IMPLEMENTATION PHASES

Implement the system in the following order.

### Phase 1 — Repository audit

Inspect the codebase, identify reusable components, understand authorization, and document missing dependencies.

### Phase 2 — Authorization foundation

Verify or implement Superadmin access control, secure provisioning, and authorization tests.

### Phase 3 — Shared layout and dashboard

Reuse the existing sidebar, header, design tokens, and components. Implement the dashboard with real data.

### Phase 4 — Users & Roles

Implement administrative user management and secure role and permission changes.

### Phase 5 — Platform configuration

Implement System Settings, Regions & Markets, Intercity Routes, Commissions & Fees, and Transaction Limits.

### Phase 6 — Oversight modules

Implement Reports & Analytics, Audit Logs, Security, and supported Backup & Database functionality.

### Phase 7 — Verification and integration

Run tests, type checks, builds, and relevant end-to-end checks. Review shared-file changes and confirm that other dashboards still function.

If a feature depends on a missing API or infrastructure owned by another teammate, implement the compatible portion and document the dependency instead of fabricating functionality.

---

## 24. DEFINITION OF DONE

A feature is complete only when its supported behavior is implemented and verified.

Verify the following wherever applicable:

- The page exists and follows the shared AgriMarket design.
- Existing sidebar and header components are reused.
- The backend operation exists.
- Server-side authorization is enforced.
- Input validation is enforced.
- Data is persisted correctly.
- Existing business rules remain intact.
- Loading, empty, and error states work.
- Sensitive actions are audited.
- Relevant automated tests pass.
- Integration with existing services works.
- No hardcoded production metrics are presented as real.
- No unrelated teammate code has been overwritten.
- No secrets have been introduced into source control.

A visually complete dashboard with no real backend integration is not finished.

A button that only displays a success message without performing the intended action is not finished.

A feature blocked by missing infrastructure must be reported as incomplete or partially implemented.

---

## 25. FINAL IMPLEMENTATION REPORT

At completion, provide:

1. Summary of implemented Superadmin functionality.
2. Files created and modified.
3. Existing shared components and services reused.
4. API endpoints added or modified.
5. Database schema and migration changes.
6. Role and permission rules implemented.
7. Tests actually executed and their results.
8. Frontend and backend build results.
9. Required environment variables and setup steps.
10. Known limitations and incomplete features.
11. Integration work needed from other teammates.
12. Exact commands to run the application locally.
13. Confirmation that the Superadmin UI follows the existing AgriMarket dashboard design.

Report actual verification results. Never claim that a feature works, a test passes, or a backup is restorable without evidence.

---

## FINAL INSTRUCTION

Build the AgriMarket Superadmin control system as a secure, integrated extension of the existing group project.

**Priorities:**

1. Inspect the existing repository before changing code.
2. Reuse the existing AgriMarket sidebar, header, design system, and shared components.
3. Preserve the supplied Superadmin dashboard design.
4. Implement secure server-side authorization.
5. Integrate with existing APIs, services, and database models.
6. Build functional modules backed by real data.
7. Respect other teammates' ownership.
8. Preserve financial integrity and historical records.
9. Test actual behavior and fix implementation errors.
10. Report incomplete dependencies honestly.

Start with repository inspection, then proceed through the implementation phases. Do not stop after producing a plan or a static UI mockup.