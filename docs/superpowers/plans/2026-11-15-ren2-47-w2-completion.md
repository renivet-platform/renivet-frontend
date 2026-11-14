# REN2-47 W2 completion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the remaining W2 seller/admin UX gaps without inventing backend authority or bypassing release gates.

**Architecture:** Extend the existing authenticated seller workspace and admin operations console. Use the generated API contract, same-origin proxy, persisted backend state, MFA/CSRF and idempotency already used by neighboring flows. Keep unsupported inventory and pricing-rule discovery fail-closed.

**Tech Stack:** Next.js 16, React 19, TypeScript, typed OpenAPI client, NestJS/Drizzle backend.

**Spec:** Linear REN2-95 through REN2-100 and approved owner decisions recorded on those issues.

## Global Constraints

- Backend authorization is authoritative; no UI-only grants.
- No fabricated seed records or production database mutations.
- Mutations require CSRF, idempotency and row/revision preconditions; privileged actions require fresh MFA.
- W2 remains runtime-gated by `RENIVET_W2_PORTAL_ENABLED=true`.
- Inventory remains unavailable until registered authoritative inventory APIs exist.

## Review Focus

- A seller must never submit a price without an explicit server-issued rule version.
- An admin must not approve their own submission.
- Expired claims and retired taxonomy versions must be visibly non-actionable.
- Stale mutations must preserve the draft and offer a safe reload.
- Empty, denied and unavailable queues must remain distinct.

### Task 1: Seller price proposal editor (REN2-97)

Add an explicit per-variant INR price proposal form to the existing product detail workspace. Require selling price, MRP, valid window, reason code, MFA and a user-entered server rule version; submit through the registered PATCH endpoint with If-Match and idempotency. Add focused state tests.

### Task 2: Admin maker-checker and expiry safeguards (REN2-100)

Load the authenticated reviewer identity, show submitter/reviewer context, disable decisions for self-submitted records, disable verification of expired claims, and expose explicit audit/history labels while preserving backend enforcement. Add source-level tests.

### Task 3: W2 acceptance evidence (REN2-95/96/98/99)

Update the operation map/evidence to distinguish live flows from intentionally gated inventory and unsupported pricing-rule discovery, then run the complete frontend and backend verification suites.

### Final verification

Run frontend tests, typecheck, lint and build; run backend tests, typecheck, lint, build and `api:check`; review the diff; commit each child logically on the epic branch; push and open separate owner-review PRs.
