# Admin Screen Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the existing live admin review capability discoverable as dedicated queue and detail screens without weakening backend authorization or inventing records.

**Architecture:** Keep the existing `AdminOperationsConsole` as the stateful implementation and add URL-addressable queue/detail views around it. Queue links select one of the existing five backend review queues; detail links load the same persisted item through the existing detail endpoint and reuse the current MFA/CSRF/maker-checker decision form. No new persistence or authorization rules are introduced.

**Tech Stack:** Next.js App Router, React, TypeScript, existing W2 request/session helpers, CSS modules, Node test runner.

**Spec:** Existing admin requirements in `src/features/admin/README.md` and current W2 review API contracts.

## Global Constraints

- Backend remains the authorization source; all reads and writes use existing authenticated W2 endpoints.
- No fake records, seed records, permission grants, or MFA bypasses.
- Decision writes require the existing fresh MFA, CSRF, idempotency, stale-revision, and maker-checker protections.
- Empty, denied, unavailable, loading, and conflict states remain visible.
- Preserve unrelated untracked work.

## Review Focus

- Invalid queue or item URL: render a safe not-found state and link back to operations.
- Empty or permission-denied queues: render the existing backend-derived state, not a fabricated card.
- Deep-linked item that is stale or no longer pending: show the existing conflict/not-found error.
- Browser back/refresh: preserve queue/detail URL and reload persisted data.
- Decision submission from a deep link: reuse existing MFA/CSRF/idempotency flow and show receipt/error state.

---

### Task 1: Add URL-addressable admin queue/detail views

**Files:**
- Create: `src/app/(admin)/operations/[queue]/page.tsx`
- Create: `src/app/(admin)/operations/[queue]/[id]/page.tsx`
- Modify: `src/features/admin/operations-console.tsx`
- Modify: `src/features/admin/operations-console.module.css`
- Test: `tests/admin-routes.test.ts`

**Interfaces:**
- Consumes: existing `AdminOperationsConsole` queue definitions and `w2Request` review endpoints.
- Produces: `/operations/<queue>` and `/operations/<queue>/<id>` URL contracts.

- [x] **Step 1: Write failing route tests**
  - Assert every allowed queue maps to a queue page.
  - Assert invalid queue values produce a not-found response.
  - Assert the detail page receives queue and id parameters.

- [x] **Step 2: Run route tests and verify RED**
  - Run: `npm test -- tests/admin-routes.test.ts`
  - Expected: FAIL because the dynamic routes and URL state are absent.

- [x] **Step 3: Implement URL state**
  - Add a shared `queue`/`item` prop interface to `AdminOperationsConsole`.
  - On queue changes, use Next router navigation to keep the queue URL synchronized.
  - On “Review details”, navigate to the detail URL while preserving backend loading/error behavior.
  - On detail pages, render the same console focused on the requested queue/item; no client-side authorization decisions.
  - Add a visible “Back to queue” control and retain accessible loading, empty, denied, unavailable, stale, and decision states.

- [x] **Step 4: Run route tests and verify GREEN**
  - Run: `npm test -- tests/admin-routes.test.ts`
  - Expected: PASS.

- [x] **Step 5: Run frontend checks**
  - Run: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
  - Expected: all exit 0.

- [ ] **Step 6: Commit**
  - `git add src/app/(admin)/operations src/features/admin/operations-console.tsx src/features/admin/operations-console.module.css tests/admin-routes.test.ts`
  - `git commit -m "feat(REN2-116): add addressable admin review screens"`

## Self-review coverage

This plan intentionally does not add admin permission-management, audit-history, or release-gate screens because no authoritative backend read APIs for those screens are registered in the current contract. Those require separate backend-owned tasks rather than fabricated frontend views.
