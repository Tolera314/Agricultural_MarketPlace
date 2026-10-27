# Implementation Prompt: Professional Post-Signup Role Selection, User Onboarding, Profile Verification, and Dashboard Routing — AgriMarket

## 1. Your Role and Mission

Act as a senior full-stack software engineer, system architect, security engineer, and UX workflow specialist working on our existing **AgriMarket — Direct Farmer-to-Consumer Agricultural Marketplace in Ethiopia**.

Your task is to inspect the actual project, understand its current architecture and authentication workflow, and implement a production-quality onboarding system that begins immediately after successful user signup and any required account verification.

Do not build a separate demo, redesign existing dashboards, replace working authentication, or introduce duplicate models, APIs, components, or business logic.

**Primary objective:** Every newly registered user must be guided to choose their account role, complete the appropriate onboarding process, and access only the dashboard and capabilities permitted by their role and account status.

The three roles offered in this onboarding flow are:

1. Farmer
2. Delivery Worker
3. Customer / Buyer

Agricultural input companies and administrators are outside this particular role-selection flow. Preserve their existing registration, approval, and access mechanisms.

---

## 2. Mandatory Phase One: Inspect the Existing Project Before Coding

Before modifying any files, investigate the complete existing implementation.

### 2.1 Inspect the frontend

Identify:

- Registration, sign-in, logout, email verification, OTP, and password-reset pages.
- Authentication providers, hooks, context, middleware, and session management.
- Existing onboarding pages, dialogs, modals, forms, profile pages, and reusable form components.
- Existing farmer, buyer, delivery-worker, and admin dashboards.
- Route groups, protected layouts, redirects, and navigation.
- Existing form validation, upload components, localization, notification components, and loading/error states.
- Mobile layouts and responsive behavior.

### 2.2 Inspect the backend and database

Identify:

- User, account, role, profile, farmer, buyer, delivery-worker, document, and verification models.
- Existing API routes, controllers, services, repositories, middleware, and authorization policies.
- Database relations, constraints, migrations, enums, and indexes.
- Existing document-storage mechanisms and file-upload validation.
- Admin approval and rejection workflows.
- Existing notifications, audit logs, and status-transition rules.

Trace the complete process from signup through the frontend, backend, database, authentication/session state, and final dashboard redirect.

### 2.3 Establish the actual project structure

Determine the real framework, package manager, database, ORM, API architecture, authentication provider, storage provider, and testing tools from the repository.

Do not assume a framework or invent file paths.

Produce a concise implementation plan identifying:

1. Existing components and services that can be reused.
2. Existing database entities and authorization rules that must be preserved.
3. Missing functionality and actual implementation gaps.
4. Files that need modification and any genuinely necessary new files.
5. Required database migrations and backward-compatibility concerns.
6. Security risks, integration risks, and acceptance tests.

Then implement the workflow. Do not stop after writing a plan or ask for approval unless you discover a genuinely blocking architectural decision, destructive migration, or missing external credential that prevents safe implementation.

---

## 3. Required User Journey

Implement the following logical flow, integrating it with the project's existing authentication and email/SMS verification requirements.

```text
User signs up
    |
    v
Complete required account verification
    |
    v
Check existing role and onboarding status
    |
    +--> Existing completed account?
    |        |
    |        v
    |   Route according to role and account status
    |
    v
Show role-selection onboarding modal
    |
    +--> Customer / Buyer
    |        |
    |        v
    |   Ensure buyer profile exists
    |        |
    |        v
    |   Buyer dashboard
    |
    +--> Farmer
    |        |
    |        v
    |   Farmer profile form
    |        |
    |        v
    |   Validate and save profile
    |        |
    |        v
    |   Submit verification application
    |        |
    |        v
    |   Pending approval screen
    |        |
    |        v
    |   Admin review and decision
    |
    +--> Delivery Worker
             |
             v
        Delivery profile form
             |
             v
        Validate and save profile
             |
             v
        Submit verification application
             |
             v
        Pending approval screen
             |
             v
        Admin review and decision
```

The diagram describes the intended business flow, not permission to create duplicate status systems. Map it onto existing entities and workflows wherever possible.

### Critical routing rules

- A newly registered account must not be assigned a privileged operational role merely because the user clicked a role card.
- A buyer can enter the buyer dashboard immediately after the role is saved successfully, provided the project's existing account-verification and security requirements are satisfied.
- A farmer or delivery worker must complete the required profile and application submission before entering the verification-pending state.
- Pending, rejected, incomplete, suspended, or approved accounts must receive different access according to their actual status.
- Approval must be enforced by the backend, not only by frontend redirects.
- Returning users must resume their existing onboarding progress rather than being forced to start over.
- Never show the role-selection modal repeatedly to users whose role and onboarding state are already resolved.

---

## 4. Role-Selection Modal

### 4.1 When it appears

Display the onboarding modal after successful signup and all mandatory account-verification steps.

It must not interrupt an existing sign-in session unnecessarily.

On application initialization, resolve the authenticated user's current role, account status, profile completeness, and onboarding status before choosing the destination.

Use the existing routing and authentication architecture. Do not introduce competing redirect logic across multiple components.

### 4.2 Modal content

Use the heading:

**Welcome to AgriMarket**

Supporting text:

"Choose how you want to use AgriMarket. You can buy agricultural products, sell your harvest, or deliver orders to customers."

Display three selectable role cards.

**Farmer**

- Description: Sell your agricultural products directly to buyers.
- Suggested visual: agricultural produce or a farm icon.
- Primary action: "Continue as Farmer".

**Delivery Worker**

- Description: Deliver agricultural orders and earn through delivery work.
- Suggested visual: delivery vehicle or location icon.
- Primary action: "Continue as Delivery Worker".

**Customer / Buyer**

- Description: Discover fresh agricultural products and order directly from farmers.
- Suggested visual: shopping basket or produce icon.
- Primary action: "Continue as Buyer".

Requirements:

- Make the complete card selectable, with a clearly visible selected state.
- Use accessible labels, keyboard navigation, focus indicators, and screen-reader-friendly semantics.
- Prevent multiple submissions while a request is processing.
- Show loading indicators and clear, actionable error messages.
- Do not advance to the next screen until the server confirms that the role operation succeeded.
- Make the layout responsive and usable on small smartphones.
- Preserve the existing design system, brand identity, typography, component library, and established interaction patterns.

Do not create a new visual language or redesign the rest of the application as part of this task.

### 4.3 Role selection and switching

Treat initial role selection as a server-controlled account operation.

If the existing system supports multiple roles, reuse that model and its established authorization policies. If it supports only one primary role, implement selection according to that constraint.

Do not silently allow users to switch from buyer to farmer or delivery worker after onboarding. Any future role-change or additional-role workflow must use explicit backend rules and appropriate verification.

A role selection request must be authenticated, validated, idempotent where practical, and protected against concurrent submissions and unauthorized privilege changes.

---

## 5. Buyer / Customer Onboarding

The buyer path must be the shortest path.

### 5.1 Required behavior

When a user selects "Customer / Buyer":

1. Submit the role-selection request to the backend.
2. Create or retrieve the corresponding buyer profile using the existing data model.
3. Initialize only the required default buyer settings.
4. Persist the completed buyer-onboarding status.
5. Refresh or invalidate the relevant authentication/session cache.
6. Redirect directly to the existing buyer dashboard.

Do not force buyers to complete the farmer or delivery-worker verification forms.

### 5.2 Buyer profile

Reuse existing buyer profile fields. If the system requires additional information for ordering, collect it contextually within the buyer dashboard.

The buyer dashboard already includes areas such as product browsing, orders, saved farmers, favorites, delivery addresses, messages, profile, and settings. Preserve these existing features and their current layout.

Do not invent unnecessary mandatory buyer fields or duplicate profile records.

### 5.3 Validation and recovery

If buyer-profile creation fails:

- Display a useful error.
- Keep the user authenticated.
- Allow the operation to be retried safely.
- Do not mark onboarding complete until the required database operation succeeds.
- Avoid creating duplicate buyer profiles after retries.

---

## 6. Farmer Onboarding and Verification Form

Selecting "Farmer" opens a dedicated, mobile-first profile and verification form.

Do not request every possible field on a single overwhelming screen. Use a professional multi-step form with a visible progress indicator, section validation, draft persistence, and a final review before submission.

Reuse existing farmer registration and profile structures.

### Step 1: Personal Information

Collect the fields required by the existing verification policy:

- Full legal name.
- Phone number.
- Email address, when applicable.
- Date of birth or age eligibility, only if required by the business or applicable rules.
- Primary language preference: English, Amharic, or Afaan Oromo.
- Existing account contact details should be prefilled where appropriate.

Contact details must be normalized and validated. Do not allow a user to overwrite a previously verified contact value without going through the existing verification process.

### Step 2: Identity Verification

Collect the identity details and evidence required by the actual farmer-verification policy.

Potential fields include:

- Government-issued identity type.
- Identity number, only if required.
- Fayda identification information or document, if supported and required by the project's approved verification process.
- Identity document images or PDF files, where appropriate.
- A clear explanation of how submitted documents will be used.

Inspect the existing Fayda and document-upload requirements before deciding which fields are mandatory.

Do not require every farmer to provide documents that the actual verification policy does not require. Do not collect biometric data or sensitive identity information without an explicit business and legal justification.

### Step 3: Farm and Location Information

Collect:

- Farm or business name, if applicable.
- Region.
- Zone, where applicable.
- Woreda or district.
- Kebele or locality, where applicable.
- Village or a useful location description.
- Farm location or coordinates, if supported by the existing location service.
- Farming or production categories.
- Approximate cultivated area, if required by the existing verification policy.
- Additional farm details only when they materially support verification or marketplace operations.

Use the project's authoritative city, region, and location data rather than creating duplicate location tables or unrestricted text fields.

For location selection, use dependent dropdowns when the existing location data supports them. Provide a manual fallback if GPS permission is denied or location detection is unavailable.

Never make browser GPS permission a substitute for identity verification.

### Step 4: Agricultural Activity and Selling Details

Collect the minimum information needed to prepare the farmer's marketplace profile:

- Main agricultural product categories.
- Types of products the farmer expects to sell.
- Production season or availability information, if supported.
- Preferred selling city or service area, using the existing marketplace coverage model.
- Optional short description of the farm.

Do not require the farmer to create a product listing during account verification unless the existing business workflow explicitly requires it.

After approval, the farmer should be able to create and manage listings through the existing farmer dashboard, subject to the system's inventory and marketplace rules.

### Step 5: Supporting Documents and Consent

Allow the farmer to upload only the document types required by the applicable verification policy.

Examples may include:

- Identity evidence.
- Farm-related evidence, where required.
- Additional supporting documentation explicitly required by the existing policy.

For each document, show its type, upload status, validation errors, and whether it is required.

Provide explicit consent and privacy information where necessary. Do not use preselected consent for optional data processing.

### Step 6: Review and Submit

Before submission, display a summary of all required information and uploaded documents.

Allow the user to return to previous steps and correct information without losing valid entries.

On submission:

1. Validate all fields on the client and server.
2. Recheck file types, file sizes, ownership, and required documents.
3. Persist the profile and verification application using a transaction where appropriate.
4. Record the application status and submission timestamp.
5. Create the appropriate administrative review task or application record.
6. Notify the user that the application was submitted.
7. Redirect to the farmer verification-status page.

Use the existing notification infrastructure. If SMS or email delivery fails after the application has been saved, do not incorrectly report the application as unsaved.

### Farmer status and access rules

**Draft / Incomplete**

- The farmer can continue editing their application.
- Selling and other restricted farmer operations remain unavailable.

**Pending Review**

- The farmer can view their submitted profile and application status.
- The farmer can see which information was submitted and when.
- Restricted selling capabilities remain unavailable until approval.
- The user can correct information only if the existing review policy permits changes or the application is returned for correction.

**Needs Correction / Rejected**

- Display the administrator's permitted explanation or rejection reason.
- Provide a clear correction and resubmission path where permitted.
- Preserve previous application history and audit records.
- Do not expose internal administrator notes or other applicants' information.

**Approved**

- Enable the appropriate farmer permissions after the server confirms approval.
- Allow access to the existing farmer dashboard.
- Enable product listing, inventory management, and order-management capabilities according to the existing authorization rules.

**Suspended / Deactivated**

- Block restricted farmer operations.
- Explain the account status and provide the appropriate support or appeal path.
- Do not automatically restore privileges when the user signs in again.

---

## 7. Delivery Worker Onboarding and Verification Form

Selecting "Delivery Worker" opens a dedicated delivery-worker registration and verification flow.

The delivery-worker form must reflect actual delivery operations, not simply duplicate the farmer form.

Use a multi-step structure similar to the farmer flow, while collecting role-specific information.

### Step 1: Personal Information

Collect the required fields:

- Full legal name.
- Verified phone number.
- Email address, where applicable.
- Preferred language.
- Date of birth or eligibility information, only where required.

Prefill existing account information and preserve previously verified contact details.

### Step 2: Identity Verification

Collect the identity details and documents required by the delivery-worker verification policy.

Potential information includes:

- Government-issued identity type.
- Required identity document.
- Fayda information or supporting evidence if required and supported.
- Additional evidence only when justified by the existing policy.

Validate identity information securely and ensure that private identity documents are not publicly accessible.

### Step 3: Vehicle and Transport Information

Collect the information appropriate to the delivery method:

- Delivery method: motorcycle, car, pickup, truck, bicycle, or another supported option.
- Vehicle ownership or authorized-use information, where required.
- Vehicle registration details, when applicable.
- Driving licence information and supporting documents when required for the selected vehicle.
- Vehicle capacity or load category.
- Vehicle registration or insurance evidence where applicable under the actual policy.

Do not require a motor-vehicle licence for a delivery method that does not legally require one.

Use conditional form fields: for example, licence and vehicle-registration requirements should depend on the selected transport method and applicable policy.

### Step 4: Delivery Coverage and Availability

Collect:

- Preferred operating city or service area.
- Supported delivery zones.
- Local delivery eligibility.
- Cross-city delivery eligibility, if supported by the existing business model.
- Typical transport or cargo capacity, where relevant.
- Availability preferences, if supported.
- Agreement to location and dispatch requirements.

The marketplace should use the existing location-based delivery workflow to identify eligible workers.

Do not automatically enable continuous location tracking during registration. Request location permission when the user activates an appropriate feature that requires it, explain why it is needed, and handle permission denial gracefully.

### Step 5: Documents, Review, and Submission

Allow the required identity, licence, and vehicle documents to be uploaded.

Display a review screen before submission.

On final submission:

1. Validate the profile and required documents.
2. Save the delivery-worker profile and verification application.
3. Record the submission timestamp and current application status.
4. Create or update the administrative review task.
5. Notify the user of successful submission.
6. Redirect to the delivery verification-status page.

### Delivery-worker status and access rules

**Incomplete / Draft**

- Allow the worker to resume profile completion.
- Do not allow delivery assignments.

**Pending Review**

- Allow the worker to view their profile and application status.
- Do not allow the worker to receive or accept operational delivery assignments.

**Needs Correction / Rejected**

- Display permitted feedback and required corrections.
- Support resubmission according to the existing review policy.

**Approved**

Approval is necessary but not sufficient for dispatch eligibility.

The delivery service must also verify the applicable operational requirements, such as:

- Worker is approved and not suspended.
- Required identity and vehicle documents are valid.
- Worker is online and eligible to accept assignments.
- Location permission and usable location are available when required by dispatch.
- Worker is within the relevant service area.
- Vehicle capacity and delivery type satisfy the assignment.
- Worker is not already committed beyond permitted capacity.

Only then may the existing dispatch workflow offer eligible deliveries to the worker.

Reuse the existing delivery lifecycle and assignment logic. Do not create a second delivery-assignment system as part of onboarding.

---

## 8. Verification Status and User Feedback

Create or reuse a clear status page for farmers and delivery workers.

The page should display:

- Selected account role.
- Current verification status.
- Submission date.
- Whether the application is complete.
- Required corrections, if any.
- The next expected action.
- A support or contact option where available.

Use understandable language rather than database enums or internal error messages.

Example status messages:

**Pending review:** "Your application has been submitted and is waiting for administrator review. We will notify you when its status changes."

**Needs correction:** "Your application needs additional information. Review the requested changes and resubmit it."

**Approved:** "Your application has been approved. Your account is ready for the next steps."

**Documents expired:** "One or more required documents need to be updated before you can use the affected services."

Do not promise a specific review duration unless the business has an established and enforceable service-level commitment.

The status page must refresh correctly when the administrator approves, rejects, suspends, or requests corrections.

Use existing notifications, polling, or real-time infrastructure as appropriate. Do not add a new real-time dependency merely to refresh a simple status.

---

## 9. Admin Verification Integration

Inspect the existing administrator dashboard and verification workflow before implementing anything new.

Integrate farmer and delivery-worker applications into the existing administrative management system.

Administrators with the appropriate permission must be able to:

- View pending applications.
- Filter by role and status.
- Open an individual application.
- Review submitted profile information.
- Securely inspect supporting documents.
- Identify missing or invalid information.
- Approve an application.
- Reject an application with a permitted reason.
- Request corrections if supported.
- Suspend an approved account when authorized.
- Review the application's history and relevant audit events.

### Approval requirements

The backend must validate the administrator's authority before applying a decision.

Approval or rejection must update the authoritative application and account state consistently. Use transactions and concurrency controls where appropriate.

Record the administrator, action, timestamp, application version or relevant state, and decision reason where applicable.

Notify the user after the decision has been committed successfully.

If notification delivery fails, retain the decision and retry the notification through the existing mechanism.

Do not let a frontend action, modified request body, or direct API call bypass administrator approval.

---

## 10. Database and API Design

First inspect and reuse existing entities. Introduce new fields, tables, or migrations only where the current schema cannot represent the required workflow.

A clean conceptual model may include:

- User / Account.
- Role assignment or primary role.
- Farmer profile.
- Buyer profile.
- Delivery-worker profile.
- Verification application.
- Verification document metadata.
- Application review history or audit events.

These are conceptual responsibilities, not mandatory new tables.

### Required data integrity

- Enforce valid role values.
- Ensure profile ownership is tied to the authenticated user.
- Prevent duplicate profiles for the same role and account.
- Prevent unauthorized role escalation.
- Prevent duplicate active verification applications where the business rules prohibit them.
- Preserve submitted application history.
- Keep application status and account permissions consistent.
- Add appropriate foreign keys, uniqueness constraints, indexes, and validation.
- Use transactions for related state changes that must succeed or fail together.

Never store passwords, authentication tokens, or raw sensitive identity documents in general profile fields.

Use the existing secure storage mechanism for documents. Store protected file references and required metadata in the database, and apply authorization checks whenever a document is accessed.

### API responsibilities

Map the following responsibilities onto the actual API architecture:

- Retrieve the authenticated user's onboarding state.
- Submit the initial role selection.
- Retrieve and update the user's own profile.
- Save and resume an onboarding draft.
- Upload required verification documents.
- Submit a verification application.
- Retrieve the current application status.
- Allow authorized administrators to review and decide applications.

Use the project's established endpoint conventions rather than blindly creating endpoints with these exact names.

For each operation, enforce authentication, ownership, role permissions, validation, and correct status transitions on the server.

Use consistent error responses that the frontend can translate into useful user-facing messages.

---

## 11. Authentication, Routing, and Authorization

Implement a single, predictable account-routing decision based on server-authoritative account state.

Conceptually:

- No authenticated session → existing public or sign-in flow.
- Authenticated account with required verification incomplete → existing verification flow.
- Authenticated account with unresolved initial role → role-selection onboarding.
- Buyer with completed buyer onboarding → buyer dashboard.
- Farmer with incomplete onboarding → farmer onboarding form.
- Farmer with pending application → farmer verification-status page.
- Approved farmer → farmer dashboard.
- Delivery worker with incomplete onboarding → delivery onboarding form.
- Delivery worker with pending application → delivery verification-status page.
- Approved delivery worker → appropriate delivery dashboard.
- Rejected, suspended, or deactivated account → appropriate restricted state.

Adapt these decisions to the existing account model and policy.

### Security requirements

- Never trust a role or approval status supplied only by the client.
- Never grant privileged permissions from a URL parameter.
- Protect direct dashboard URLs and backend operations.
- Validate access on every sensitive API request.
- Prevent users from editing another user's profile or application.
- Protect against mass assignment of role, approval, suspension, and verification fields.
- Prevent stale frontend session data from preserving permissions after revocation.
- Preserve existing CSRF, session, cookie, and token protections where applicable.
- Ensure sign-out and account switching clear stale onboarding state.
- Handle multiple browser tabs and concurrent updates without granting inconsistent access.

A redirect is a user-experience feature, not an authorization boundary.

---

## 12. Form Quality, Accessibility, and Mobile UX

The onboarding process must be easy for users with limited technical experience, particularly farmers and delivery workers using smartphones.

Requirements:

- Mobile-first responsive layouts.
- Clear section headings and concise instructions.
- A visible progress indicator for multi-step forms.
- Required-field indicators and inline validation.
- Validation summaries for longer forms.
- Keyboard accessibility and visible focus states.
- Accessible field labels and error announcements.
- Appropriate input types for telephone numbers, dates, and numeric fields.
- Conditional fields that appear only when relevant.
- Draft saving and safe resume behavior.
- Confirmation before discarding substantial unsaved work.
- Clear loading, success, empty, and failure states.
- Upload progress, file restrictions, retry support, and clear document previews where safe.
- No loss of completed fields when navigating between steps.
- No unnecessary page reloads.
- Support for English, Amharic, and Afaan Oromo through the existing localization system.

Do not hardcode new strings across the application if it already uses translation files or a localization service.

Keep form logic modular, reusable, and maintainable. Avoid deeply nested components, duplicate validation logic, giant components, and unnecessary dependencies.

---

## 13. Privacy and Document Security

Verification information must be treated as private user data.

Implement the following protections according to the existing infrastructure:

- Validate file size, extension, and actual file content.
- Allow only explicitly supported document types.
- Use secure storage and non-public document access.
- Verify upload ownership.
- Prevent path traversal and unsafe file handling.
- Use signed or otherwise access-controlled download mechanisms where appropriate.
- Avoid logging identity numbers, private document contents, passwords, or authentication secrets.
- Limit access to verification documents to authorized reviewers and the relevant account owner.
- Avoid exposing document URLs, identity details, or internal review notes to unauthorized users.
- Apply data minimization and retention rules consistent with the project's approved privacy policy.
- Ensure uploaded documents cannot be executed as application code.

Do not add invasive collection, biometric processing, or unnecessary sensitive fields simply because they are technically possible.

---

## 14. Failure Handling and Recovery

Explicitly handle these scenarios:

1. User closes the browser halfway through onboarding.
2. User signs out and returns later.
3. Role selection is submitted twice.
4. Network failure occurs during profile saving.
5. A document upload succeeds but the final application submission fails.
6. A required document is missing or invalid.
7. The verification application is submitted while another request is running.
8. An administrator reviews the same application concurrently with another administrator.
9. An administrator rejects or suspends an account while the user is signed in.
10. A notification fails after a successful database update.
11. A buyer profile already exists.
12. A user attempts to access a dashboard through a direct URL.
13. A user changes a request to claim another role or approval status.
14. GPS or document-upload permission is denied.
15. A migration or database constraint reveals inconsistent legacy records.

Provide recoverable errors wherever possible. Never mark an application as approved, submitted, or completed solely because a frontend action succeeded.

---

## 15. Testing Requirements

Use the existing test framework and run the appropriate tests after implementation.

### Role-selection tests

- All three roles appear for a new eligible user.
- Selecting Buyer saves the correct role and opens the buyer dashboard.
- Selecting Farmer opens the farmer onboarding form.
- Selecting Delivery Worker opens the delivery onboarding form.
- Repeated submissions do not create duplicate profiles.
- Existing users with completed onboarding do not see the initial selection again.
- A failed server request does not advance the workflow incorrectly.

### Farmer tests

- Required profile information is validated.
- Invalid or missing required documents prevent submission.
- Drafts can be resumed.
- Successful submission creates the correct pending state.
- Pending farmers cannot create active listings or perform restricted selling operations.
- Approved farmers can access permitted farmer functionality.
- Rejected or suspended farmers cannot bypass restrictions.

### Delivery-worker tests

- Conditional vehicle and licence requirements work correctly.
- Invalid documents prevent submission.
- Pending workers cannot receive or accept assignments.
- Approved but offline or ineligible workers cannot receive inappropriate assignments.
- Eligible workers can use the existing dispatch workflow.
- Suspended workers lose restricted permissions.

### Security tests

- Unauthenticated requests cannot submit protected operations.
- Users cannot modify another user's profile.
- Users cannot self-approve or modify administrative decisions.
- Users cannot change privileged roles through a crafted request.
- Unauthorized users cannot access identity documents.
- Backend authorization remains effective when the frontend is bypassed.
- Existing authentication and other roles continue working.

### Regression tests

Verify that the changes do not break:

- Sign-in, signup, and email/SMS verification.
- Existing buyer dashboard features.
- Farmer dashboard and product-management workflows.
- Delivery dispatch and order lifecycle.
- Administrator approval tools.
- Existing database migrations and user records.
- Language switching and responsive layouts.

Run linting, type checking, relevant unit/integration tests, and production builds using the repository's actual scripts. Report failures honestly and distinguish pre-existing issues from newly introduced regressions.

---

## 16. Implementation Standards

Follow these engineering principles:

- Reuse existing architecture and components.
- Keep modules focused on a single responsibility.
- Use small, reusable functions and predictable interfaces.
- Centralize shared validation and state-transition logic.
- Avoid duplicate role checks scattered across components.
- Enforce authorization in the backend.
- Keep database changes minimal and reversible where possible.
- Preserve existing functionality and established design patterns.
- Do not use mock data to claim production integration.
- Do not hardcode administrative approvals.
- Do not introduce new services or dependencies without a demonstrated need.
- Do not refactor unrelated modules merely for stylistic reasons.
- Add comments only when logic is not self-explanatory.
- Follow the repository's naming conventions and established error-handling patterns.

Before applying a migration, inspect its impact on existing records. Never delete production data or reset the database to make the workflow pass.

---

## 17. Definition of Done

The task is complete only when:

1. The real project has been inspected and the implementation matches its architecture.
2. New users encounter role selection at the correct point in the existing signup flow.
3. Buyers proceed directly to their existing dashboard after successful role assignment.
4. Farmers and delivery workers complete their appropriate profile and verification forms.
5. Drafts and incomplete applications can be resumed.
6. Verification applications are persisted and appear in the actual administrator review workflow.
7. Administrative decisions update the authoritative application and account state.
8. Restricted operations remain unavailable until their required approval and eligibility conditions are satisfied.
9. Existing authentication, dashboard features, and delivery workflows continue to work.
10. The forms are accessible, responsive, localized, and usable on small screens.
11. Appropriate tests pass, or remaining failures are documented with exact evidence.
12. No unnecessary duplicate schema, APIs, approval logic, or dashboard systems have been introduced.

## 18. Final Implementation Report

After completing the work, provide a concise but evidence-based report containing:

1. **Repository findings:** Existing architecture and relevant modules discovered.
2. **Implemented workflow:** Actual signup-to-role-selection-to-dashboard flow.
3. **Files changed:** Exact paths and the responsibility of each change.
4. **Database changes:** Migrations, new fields or tables, constraints, and compatibility considerations.
5. **Verification workflow:** How applications reach administrators and how decisions affect permissions.
6. **Security:** Where backend authorization, ownership checks, and document protections are enforced.
7. **Tests:** Commands executed and their actual results.
8. **Outstanding issues:** Any incomplete functionality, blockers, or pre-existing failures.
9. **Manual verification guide:** Steps to test Buyer, Farmer, and Delivery Worker flows, including approval and rejection scenarios.

Do not report a feature as implemented unless you can identify the actual code and verify its behavior.

**Final instruction:** Inspect first, map the existing implementation, then integrate this workflow into the real AgriMarket codebase. The result must be secure, production-oriented, maintainable, and consistent with our direct farmer-to-consumer marketplace—not a superficial role-selection popup or a disconnected demonstration.
---------------------------------------
My professional recommendation
Before you let the agent implement this, keep one architectural rule especially clear: role selection, profile completion, verification approval, and operational eligibility are four different things.

For example, a delivery worker may have selected the delivery role, completed their profile, and been approved by an administrator, but still be offline or outside the delivery area. That worker should not automatically receive an order.

Likewise, a farmer who has submitted an application must not be able to sell simply by manually opening the farmer dashboard URL.

This separation will help AgriMarket grow without turning onboarding into a security weakness or creating inconsistent account states.