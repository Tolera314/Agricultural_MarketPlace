# MASTER EXECUTION PROMPT: AGRIMARKET — REQUIREMENTS ANALYSIS, COMPLETE IMPLEMENTATION, AND 100% TRACEABILITY VERIFICATION

## 1. Your Role

Act as a principal software architect, senior full-stack engineer, business analyst, QA architect, security engineer, and technical project lead.

Your responsibility is to transform the requirements documented in `user_flow.md` into a complete, reliable, secure, production-quality AgriMarket system.

You must not treat this as a simple coding task. You are responsible for understanding the entire business, identifying every user journey, defining the system architecture, planning all dependencies, implementing every required workflow, and verifying that the final implementation satisfies the requirements.

**The primary objective is complete requirements coverage. No workflow, business rule, user action, system response, failure scenario, or role-specific responsibility documented in `user_flow.md` may be silently skipped.**

## 2. Authoritative Requirements Document

First, locate and read the complete `user_flow.md` file in the project.

Treat this document as the primary source of truth for the required system behavior.

Read it from beginning to end. Do not rely on its filename, a partial preview, previous conversations, assumptions, or your general understanding of marketplace applications.

You must understand:

- Every user role and its permissions.
- Every user journey from entry to completion.
- Every page, action, and operation required by each role.
- Every business rule and validation requirement.
- Every status and state transition.
- Every dependency between modules.
- Every administrative responsibility.
- Every notification and integration.
- Every exceptional, unsuccessful, and recovery flow.
- Every security and data-integrity requirement.
- Every expected interaction between different roles.

Do not begin implementation immediately after reading the document.

First, investigate the existing repository and understand what is already implemented.

### Important rules

1. Do not replace existing functionality without understanding its purpose.
2. Do not introduce duplicate modules or competing implementations.
3. Do not assume a feature is implemented merely because a page or component exists.
4. Do not assume a feature works because its API endpoint exists.
5. Do not invent business rules that contradict `user_flow.md`.
6. Where requirements are ambiguous or contradictory, document the issue and propose a justified resolution before implementation.
7. Preserve the existing technology stack and architecture unless a change is technically necessary and justified.
8. Do not perform a large-scale rewrite simply because a different architecture is your preference.

## 3. Phase One — Complete Requirements Analysis

Before writing implementation code, analyze `user_flow.md` and produce a detailed requirements breakdown.

Create the following documents in a suitable project documentation directory, preferably `docs/implementation/`.

### A. `requirements-analysis.md`

Document:

- System purpose and business objectives.
- All user roles and responsibilities.
- Role-specific permissions.
- Complete workflows for each role.
- Shared workflows across roles.
- Business rules and constraints.
- Entity relationships and data ownership.
- Status lifecycles and permitted transitions.
- External integrations.
- Notification requirements.
- Validation and error-handling requirements.
- Security requirements.
- Exceptional scenarios and recovery procedures.

### B. `workflow-inventory.md`

Create a complete inventory of all workflows in `user_flow.md`.

For every workflow, identify:

| Field | Required information |
|---|---|
| Workflow ID | Unique identifier |
| Workflow name | Clear name |
| Actor | User role or system |
| Preconditions | What must be true before starting |
| Trigger | What starts the workflow |
| Main steps | Every required action |
| System response | What the system must do |
| Business rules | Conditions and restrictions |
| Success outcome | Expected completed state |
| Failure scenarios | Possible unsuccessful outcomes |
| Recovery | How the user or system recovers |
| Dependencies | Related modules and workflows |
| Verification | How the workflow will be tested |

Do not combine separate workflows simply to reduce the number of entries.

Include alternative paths, permission-denied paths, validation failures, cancellation paths, payment failures, network interruptions, and other relevant exceptional scenarios.

### C. `requirements-traceability-matrix.md`

Convert every independently verifiable requirement in `user_flow.md` into a uniquely identified requirement.

Use identifiers such as:

- AUTH-001
- BUYER-001
- FARMER-001
- DELIVERY-001
- ADMIN-001
- PAYMENT-001
- INVENTORY-001
- NOTIFICATION-001
- SECURITY-001

The categories are examples. Create categories that accurately reflect the actual document.

For every requirement, record:

| Requirement ID | Source section | Requirement | Planned module | Implementation location | Test case | Status |
|---|---|---|---|---|---|---|

Every requirement must be traceable from its original source to its implementation and its verification test.

No requirement may be omitted because it appears repetitive, complicated, time-consuming, or difficult to implement.

### D. `ambiguities-and-decisions.md`

Identify:

- Contradictory requirements.
- Missing business rules.
- Unclear state transitions.
- Unspecified authorization rules.
- Unclear ownership of data.
- Integration limitations.
- Missing failure-handling behavior.
- Technical decisions required before implementation.

For each issue, document its impact and recommended resolution.

Do not silently invent critical business decisions, particularly those involving payments, financial records, order ownership, delivery responsibility, refunds, commissions, and cross-city logistics.

## 4. Phase Two — Existing Repository Audit

Inspect the actual codebase before deciding what needs to be built.

Examine:

- Frontend structure and routing.
- Backend architecture and API endpoints.
- Database schema and migrations.
- Prisma models and relationships, if Prisma is used.
- Authentication and session management.
- Role-based authorization.
- Middleware and route protection.
- Existing dashboards and forms.
- Business logic and services.
- Order and payment implementation.
- Inventory and stock management.
- Delivery assignment and tracking.
- Admin functionality.
- Notification providers.
- External integrations.
- Existing tests.
- Environment configuration.
- Logging and error handling.
- Security controls.
- Deployment and build configuration.

Classify every relevant feature as:

- **Complete:** Correctly implemented and verified.
- **Partial:** Exists but does not fully satisfy the requirement.
- **Broken:** Exists but does not work correctly.
- **Missing:** Not implemented.
- **Unverified:** Implementation exists but there is insufficient evidence that it works.

A UI element, placeholder, mock response, hardcoded record, or unfinished API must never be classified as complete.

For every incomplete feature, document the actual gap and its location in the codebase.

Create:

`docs/implementation/repository-audit.md`

## 5. Phase Three — Complete Implementation Plan

After completing the requirements analysis and repository audit, create:

`docs/implementation/implementation-plan.md`

The plan must cover the entire system, not only the easiest or most visible features.

Organize implementation into logical, dependency-aware phases.

For every phase, specify:

1. Phase objective.
2. Requirements covered.
3. Existing modules to reuse.
4. New modules or modifications required.
5. Frontend implementation.
6. Backend implementation.
7. Database changes and migrations.
8. API contracts.
9. Authorization and validation rules.
10. Integration dependencies.
11. Error and recovery handling.
12. Test cases.
13. Acceptance criteria.
14. Dependencies on earlier phases.
15. Risks and mitigation.

Define implementation order based on architectural and business dependencies, not convenience.

For example, shared authentication, authorization, database integrity, and core domain models should be established before dependent workflows are implemented.

However, derive the actual phase structure from the repository and `user_flow.md`. Do not blindly follow an example sequence.

### Planning requirements

- Every requirement in the traceability matrix must belong to at least one implementation phase.
- Every workflow must have a defined implementation strategy.
- Every phase must have measurable completion criteria.
- Every dependency must be explicit.
- Every integration must have a defined success and failure path.
- Every business-critical state transition must have a defined implementation and test strategy.
- Identify work that can safely be completed in parallel and work that must remain sequential.

Before coding, check the plan against the complete requirements document and workflow inventory.

If any requirement is not covered, correct the plan first.

## 6. Phase Four — Implementation Approval Gate

Before implementing, present a concise but complete execution summary containing:

- Repository condition.
- Number of requirements identified.
- Number of workflows identified.
- Number of existing complete, partial, broken, missing, and unverified features.
- Critical architectural findings.
- Identified ambiguities requiring decisions.
- Proposed implementation phases.
- Critical dependencies and risks.

If a critical business decision cannot be safely inferred, ask me for clarification before implementing the affected workflow.

Otherwise, proceed with the approved requirements and implementation plan.

Do not stop after producing documentation. The objective is to implement the system.

## 7. Phase Five — Implement the Plan Step by Step

Implement the system phase by phase, following `implementation-plan.md`.

For each phase:

### Step 1: Prepare

- Re-read the phase requirements.
- Confirm dependencies are complete.
- Inspect the relevant existing code.
- Identify files and modules that need modification.
- Confirm database and API impact.

### Step 2: Implement

Implement the complete functionality across all necessary layers.

Do not implement only the frontend or only the backend.

A workflow is not complete unless all required layers work together, including:

- User interface.
- API or server actions.
- Business logic.
- Database persistence.
- Authorization.
- Validation.
- Error handling.
- Notifications and integrations, where required.

Use the existing architecture consistently.

Maintain:

- Separation of concerns.
- Single responsibility.
- Reusable services and components.
- Centralized business rules.
- Consistent naming.
- Predictable API contracts.
- Strong typing where applicable.
- Minimal duplication.
- Maintainable modular architecture.

Avoid unnecessarily deep nesting and oversized components or services.

### Step 3: Verify the phase

After implementation:

- Run relevant unit tests.
- Run integration tests.
- Run workflow tests.
- Run type checks.
- Run linting.
- Run production builds where practical.
- Check database migrations.
- Check authorization boundaries.
- Verify success and failure scenarios.
- Inspect for regressions in existing functionality.

Do not mark a phase complete merely because the code compiles.

### Step 4: Update documentation

Update:

- `implementation-plan.md`
- `requirements-traceability-matrix.md`
- `workflow-inventory.md`

Record actual implementation files, test references, evidence, and status.

### Step 5: Continue

Proceed to the next phase only when the current phase meets its acceptance criteria.

If a blocker prevents progress, document the blocker and its impact. Do not conceal it or mark dependent work as complete.

**Continue through all planned phases. Do not stop after the first phase, first role, first dashboard, or first successful build.**

## 8. Phase Six — End-to-End Workflow Integration

After completing individual modules, verify that the entire marketplace operates as one integrated system.

Test complete journeys involving multiple roles and modules.

Examples include:

- A visitor browses products, registers as a buyer, completes onboarding, purchases a product, and tracks the order.
- A farmer registers, completes verification, receives approval, creates a listing, manages available stock, receives an order, and fulfills it.
- A buyer purchases from a farmer and the system correctly manages payment, stock, order status, delivery, and notifications.
- A delivery worker registers, completes verification, receives approval, becomes eligible for assignments, accepts an assignment, picks up an order, and confirms delivery.
- An agricultural input company registers, receives approval, publishes inputs, and sells them through the appropriate purchasing workflow.
- An administrator reviews applications, manages users, resolves operational issues, manages configuration, and monitors marketplace activity.
- A local purchase follows the local delivery workflow.
- An eligible cross-city purchase follows the admin-configured cross-city workflow.
- A failed payment does not incorrectly confirm an order or permanently reduce stock.
- A cancelled or disputed order follows the correct business and financial rules.

These are examples, not the complete test list.

Derive the complete integration test suite from every workflow in `user_flow.md`.

Pay particular attention to interactions between:

- Authentication and authorization.
- Orders and inventory.
- Orders and payments.
- Payments and financial records.
- Orders and delivery assignments.
- Delivery status and buyer tracking.
- Administrative approvals and user permissions.
- Notifications and actual business events.
- Local and cross-city logistics.
- Disputes, cancellations, and refunds.

Ensure that one module cannot silently create an inconsistent state in another module.

## 9. Phase Seven — Production-Quality and Security Audit

Perform a final technical audit covering:

### Security

- Authentication and session security.
- Server-side authorization on every protected operation.
- Role and resource ownership checks.
- Input validation and sanitization.
- SQL injection and unsafe database operations.
- IDOR and unauthorized object access.
- Mass assignment.
- Rate limiting for sensitive endpoints.
- Secure file uploads.
- Protection of sensitive personal information.
- Payment webhook verification.
- Secret and environment variable handling.
- CSRF, XSS, and other relevant web vulnerabilities.

### Data integrity and reliability

- Database transactions for critical operations.
- Stock concurrency and overselling prevention.
- Idempotency for payment and order operations.
- Valid state transitions.
- Duplicate request prevention.
- Consistent financial records.
- Reliable notification handling.
- Safe retry and recovery behavior.
- Appropriate database constraints and indexes.

### User experience

- Responsive mobile and desktop behavior.
- Accessible forms and controls.
- Clear loading, empty, success, and error states.
- Preserved form data after recoverable failures.
- Clear English error messages.
- Appropriate localization support.
- No misleading success messages.
- No nonfunctional buttons or placeholder actions.

### Performance and maintainability

- Avoid unnecessary database queries.
- Check pagination and filtering.
- Avoid inefficient rendering.
- Review LCP, CLS, and INP where measurable.
- Review logging and monitoring.
- Check build output and dependency health.
- Identify duplicated logic and architectural inconsistencies.

Do not claim a security or performance issue is resolved without evidence.

## 10. Phase Eight — Final 100% Requirements Verification

This phase is mandatory.

When implementation is finished, independently compare the actual working system against:

1. The original `user_flow.md`.
2. `requirements-analysis.md`.
3. `workflow-inventory.md`.
4. `requirements-traceability-matrix.md`.
5. `implementation-plan.md`.

Do not simply trust your earlier implementation notes. Re-open the original requirements document and inspect the actual implementation.

Create:

`docs/implementation/final-verification-report.md`

### A. Requirement-by-requirement verification

For every requirement, verify:

- Is the required user action available?
- Does the frontend behave correctly?
- Does the backend enforce the correct business logic?
- Is the data stored and retrieved correctly?
- Are permissions enforced?
- Are all relevant state transitions correct?
- Are success and failure scenarios handled?
- Are integrations functioning?
- Is there a test proving the behavior?
- Does the actual implementation match the original requirement?

Assign one of these statuses:

- **PASS:** Fully implemented and verified with evidence.
- **PARTIAL:** Some required behavior is implemented, but gaps remain.
- **FAIL:** Missing, broken, or incorrect.
- **BLOCKED:** Cannot be verified or completed because of an external dependency or unresolved decision.

A requirement is PASS only when the complete required behavior has been verified. A page existing is not sufficient evidence.

### B. Workflow-by-workflow verification

Repeat the same verification for every workflow and its alternative paths.

Verify both successful and unsuccessful journeys.

### C. Plan compliance

Compare the final implementation against every phase and acceptance criterion in `implementation-plan.md`.

Identify:

- Completed planned work.
- Deviations from the plan.
- Justified architectural changes.
- Unfinished tasks.
- Regressions.
- Unverified behavior.

### D. Automated test execution

Run the full available test suite and relevant commands, including:

- Unit tests.
- Integration tests.
- End-to-end tests.
- Type checks.
- Lint checks.
- Database migration validation.
- Production build.

Do not report tests as passing if they were not actually executed.

Where automated testing is not possible, state exactly why and provide the required manual verification procedure.

### E. Final coverage calculations

Calculate coverage using the original requirement inventory:

**Requirement coverage = PASS requirements / Total requirements × 100**

**Workflow coverage = PASS workflows / Total workflows × 100**

Also report:

- Partial requirements.
- Failed requirements.
- Blocked requirements.
- Untested requirements.
- Failed test cases.
- Unresolved business decisions.

Do not count PARTIAL, FAIL, BLOCKED, or untested requirements as PASS.

### F. Final acceptance condition

The system may only be declared fully compliant when:

- Every requirement in `user_flow.md` is PASS.
- Every workflow and required alternative path is PASS.
- Every implementation-plan acceptance criterion is satisfied.
- All critical end-to-end scenarios pass.
- No known critical or high-severity security issue remains unresolved.
- No known critical data-integrity defect remains unresolved.
- No required functionality is represented by a mock, placeholder, or nonfunctional UI.
- The production build and required validation commands pass.

**The target is 100% verified requirements and workflow coverage, not 100% of tasks merely marked complete.**

If the result is below 100%, do not claim full completion.

Create a remaining-work list, fix the outstanding issues, rerun the affected tests, and repeat verification until all requirements are PASS or a genuine external blocker requires my intervention.

Never manipulate the denominator by deleting, merging, or reclassifying difficult requirements.

## 11. Final Deliverables

At the end, provide:

1. `requirements-analysis.md`
2. `workflow-inventory.md`
3. `requirements-traceability-matrix.md`
4. `ambiguities-and-decisions.md`
5. `repository-audit.md`
6. `implementation-plan.md`
7. `final-verification-report.md`

Also provide:

- Summary of implemented modules.
- Actual files and database changes made.
- Completed implementation phases.
- Test commands executed and their real results.
- Remaining limitations or external dependencies.
- Known risks and unresolved issues.
- Requirement coverage percentage.
- Workflow coverage percentage.
- Security and data-integrity audit results.

## 12. Non-Negotiable Execution Rules

1. Read the complete `user_flow.md` before planning.
2. Inspect the actual repository before implementation.
3. Do not start coding before the complete plan is created.
4. Do not leave requirements without a planned implementation.
5. Do not skip difficult or low-visibility workflows.
6. Do not stop after documentation or planning.
7. Implement every phase step by step.
8. Do not mark code complete without testing it.
9. Do not mark a workflow complete because its UI exists.
10. Do not use mock data to simulate production functionality.
11. Do not silently change business rules.
12. Do not introduce unnecessary architectural rewrites.
13. Preserve existing working functionality.
14. Update traceability documentation throughout implementation.
15. Verify the final result against the original `user_flow.md`, not just your own plan.
16. Never claim 100% completion without requirement-level and workflow-level evidence.
17. Be transparent about blockers, failed tests, and limitations.
18. Continue until the full scope is implemented and verified, subject only to genuine external blockers or decisions requiring my approval.

## Final Instruction

Your task is not to produce a plan and wait. Your task is to **read, understand, audit, plan, implement, integrate, test, correct, and independently verify the complete AgriMarket system**.

Start by locating and reading `user_flow.md` in its entirety. Then inspect the repository and complete the analysis and planning documents.

Do not begin implementation until the full plan and requirements traceability matrix are complete.

Once the planning gate is satisfied, execute the implementation phases sequentially and continue until the final verification report demonstrates the actual level of compliance.

**The final standard is simple: every requirement and every workflow in `user_flow.md` must work in the real application, and the final report must prove it.**