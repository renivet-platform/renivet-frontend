# REN2-117 Cross-Wave UI Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing Renivet frontend experience with the 17 November prototype’s approved W1/W2 design and connect every approved workflow to real, authorized backend behavior.

**Architecture:** Keep the existing Next.js App Router and same-origin BFF as the browser boundary; NestJS remains authoritative for identity, permissions, business state, and writes. Reuse implemented OpenAPI operations first. A missing API is not inferred from the prototype: its route, data model, permission, idempotency, concurrency, audit, and failure contract must be approved before its backend task begins.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, NestJS 12/Fastify, Drizzle, PostgreSQL 16, Redis, generated OpenAPI types, existing repository tests and disposable integration environments.

**Spec:** `docs/superpowers/specs/2026-11-17-ren2-117-screen-api-matrix.md` and Linear REN2-117.

## Global Constraints

- Match the prototype’s W1/W2 layouts, typography, responsive behavior, motion, vocabulary, and states; never ship the prototype toolbar, seed data, or vanilla JavaScript router.
- Preserve all current routes and functionality until replacement parity is accepted; keep health checks and design-only previews clearly non-operational.
- W3 shopper screens remain design context. Do not claim public browse, saved-item, checkout, payment, delivery, or refund capability without approved W3 contracts.
- Use first-party W1 sessions, backend-resolved permissions, brand membership, same-origin CSRF, idempotency, MFA policy, and maker-checker controls.
- Keep `RENIVET_W2_PORTAL_ENABLED` and `RENIVET_INVENTORY_API_ENABLED` closed unless separately authorized release gates say otherwise.
- No fake records, browser-authoritative business rules, mock success, unapproved APIs, live provider calls, direct `main` pushes, merges, deployments, or data-bearing database migrations.
- All sensitive data stays masked and server-authorized; tenant isolation is enforced in backend queries, not only in route selection.
- New endpoint work requires an approved API contract, traceability, generated OpenAPI/SDK, negative authorization coverage, and backend integration evidence before the frontend consumes it.

## Review Focus

1. **Phone OTP sign-in vs contact verification:** confirm purpose-bound backend purpose; prove a contact-verification challenge cannot create a login session.
2. **Brand switching:** prove each selected brand is derived from authenticated W1 membership and cannot change request scope by editing client state.
3. **Seller application, bank, consent, privacy, staff, and audit screens:** show an explicit unavailable state until a reviewed API and policy exist; never simulate a submitted/verified/saved status.
4. **Draft/live and reviewer independence:** edits remain drafts, stale revisions fail safely, and a submitter cannot approve their own work.
5. **Inventory and imports:** stock files are observations, stock authority stays server-side, H=0 is retained, and feature gates remain closed absent release approval.

---

## Work Sequence

The matrix is the required Stage 0 review artifact. Implementation tasks below follow the issue’s stages; any missing endpoint is held behind an approved child API task and cannot be filled with a guessed route. The repository policy requires a fresh issue branch and owner review at each task PR boundary.

### Task 0: Baseline and route/API inventory

**Files:**
- Create: `docs/superpowers/specs/2026-11-17-ren2-117-screen-api-matrix.md`
- Create: `docs/superpowers/plans/2026-11-17-ren2-117-cross-wave-ui.md`
- Validation: compare the 40 prototype IDs with `SCREENS.md`, compare route rows with `rg --files src/app`, and check Markdown whitespace with `git diff --check`.

**Interfaces:**
- Consumes: 17 Nov archive SHA, `SCREENS.md`, current App Router files, backend registered routes and OpenAPI.
- Produces: 40-screen matrix plus current-page parity, route ownership, wave, API class, and open owner decision for every screen/action.

- [ ] **Step 1: Verify source and route count.** Recompute SHA-256; compare all 40 IDs with `SCREENS.md`; record prototype-only and current-app-only routes.
- [ ] **Step 2: Verify backend operations.** Read registered controllers, AppModule feature gates, executable OpenAPI, generated frontend types, and existing BFF allowlist; classify each action A/B/C/D in the matrix.
- [ ] **Step 3: Complete mobile/desktop and feature parity mapping.** Record current route, proposed route, active feature flags, state coverage, and preserved current behavior for each row.
- [ ] **Step 4: Review and validate the matrix.** Verify 40 unique prototype IDs, all current App Router pages represented in the parity section, and no W3 or legal/provider prerequisite silently promoted to live scope.

### Task 1: Shared design foundation and app shells

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create or modify: focused primitives under `src/components/ui/` and shells under `src/components/layout/`
- Test: design token, semantic structure, state vocabulary, reduced-motion, and responsive component tests under `tests/`

**Interfaces:**
- Consumes: approved token roles, typography and component rules from the source design; current feature components.
- Produces: shared customer, identity, brand, and admin shells; reusable fields, badges, state blocks, tables/cards, steppers, decision panels, toast/live region, and mobile navigation.

- [ ] **Step 1: Add failing tests** for token roles, keyboard focus, labels/error association, live-region feedback, reduced motion, responsive navigation and semantic landmarks.
- [ ] **Step 2: Implement tokens and primitives** without moving business logic into generic UI components.
- [ ] **Step 3: Implement separate persona shells** with 390px navigation and justified desktop-first notices for taxonomy/audit.
- [ ] **Step 4: Run focused tests, lint, typecheck, and build**; inspect all changed route screenshots at 390px and desktop widths.

### Task 2: W1 identity, account, brand selection, privacy entry points

**Files:**
- Modify: `src/features/identity/*`, `src/app/(auth)/*`, and same-origin auth handlers only as needed.
- Create: route-specific screens only after route ownership is approved in the matrix.
- Test: `tests/auth-*.test.ts`, new route/component tests, and backend auth integration tests for any approved contract changes.

**Interfaces:**
- Consumes: generated auth API client, existing first-party session, OTP challenge purpose, CSRF and destination policies.
- Produces: redesigned connected sign-in/register/recovery/account experiences and a preserved destination after authentication.

- [ ] **Step 1: Add failing route tests** for neutral identity messaging, real email registration/recovery/session actions, safe expired/rate-limited errors, and context return.
- [ ] **Step 2: Implement only supported W1 flows** with single-input OTP presentation and real server receipts.
- [ ] **Step 3: Keep phone sign-in, consent, preferences, data requests, device-session management, and policy pages unavailable or content-gated** until the matrix records an approved contract/content owner.
- [ ] **Step 4: Run auth unit, proxy, contract, and browser flows** including invalid/expired challenges and CSRF rejection.

### Task 3: W2 brand workspace, catalogue, media, pricing, claims, imports, inventory

**Files:**
- Modify: `src/features/seller/*`, `src/app/(seller)/brands/[brandId]/*`, `src/lib/server/w2-proxy.ts`, generated API types only from backend OpenAPI.
- Test: existing seller/import tests plus focused responsive, route, API failure, permission, stale-version, upload and idempotency tests.

**Interfaces:**
- Consumes: brand membership/access, product draft/detail/list, variant, category, media, price, claim, import and—only when registered and enabled—inventory APIs.
- Produces: redesigned SE-07/08/09/12/12A/12C/13/20C workflows whose visible values and successful writes come from server responses.

- [ ] **Step 1: Add failing screen-to-operation tests** for brand-scoped loading, empty, denied, service error, retry, conflict, and unavailable release gates.
- [ ] **Step 2: Implement the shared brand shell and dashboard** from persisted access/catalogue data, avoiding fictitious KPI values.
- [ ] **Step 3: Port product draft, variants, secure media, price proposals, evidence claims, and submission** using existing operations and exact returned revisions.
- [ ] **Step 4: Port CSV/XLSX import mapping, preview, confirm, result, and retry** while keeping imports drafts-only and stock observations separate.
- [ ] **Step 5: Port inventory only through registered, gated APIs**; verify P/Q/U/A/B and H=0 semantics without enabling a gate.
- [ ] **Step 6: Run seller API contract, tenant-isolation, focused UI, keyboard, and desktop/mobile checks.**

### Task 4: W2 seller onboarding, team mutation and payout-bank flows

**Files:**
- Backend: approved `src/modules/identity/` or `src/modules/access/` operations, repositories/DTOs, OpenAPI, tests, and migrations only if approved and needed.
- Frontend: `src/features/seller/*`, W2 BFF allowlist, generated types, and onboarding/team/payout routes.
- Test: real PostgreSQL 16 permission/transaction tests, negative cross-brand access, upload privacy tests, and frontend integration tests.

**Interfaces:**
- Consumes: a separately approved application, invitation, role, private evidence, and bank verification contract.
- Produces: persisted draft/submit/correction/team/bank actions with permission checks, idempotency, audit trail, and explicit status receipts.

- [ ] **Step 1: Do not implement until Product/Security/Privacy/Finance approve each missing contract and scope.**
- [ ] **Step 2: Add failing backend authorization, masking, ownership, audit and replay tests** for each approved operation.
- [ ] **Step 3: Implement API/database changes** with disposable PG16 testing; never migrate existing databases.
- [ ] **Step 4: Regenerate OpenAPI/types and add the exact BFF allowlist only after contract checks pass.**
- [ ] **Step 5: Connect the screens and test persisted success plus denied, retry and stale states.**

### Task 5: Platform operations, review queues, taxonomy and sensitive admin screens

**Files:**
- Modify: `src/features/admin/*`, `src/app/(admin)/*`, and the BFF allowlist only for registered, approved endpoints.
- Backend only for separately approved missing staff, audit, privacy, bank, or inventory-review contracts.
- Test: admin queue/decision, permission, MFA-policy, CSRF, idempotency, maker-checker and audit integration tests.

**Interfaces:**
- Consumes: backend global permissions, persisted application/review/taxonomy/price/claim/publication data, and exact record context.
- Produces: mobile-usable review queues and decision panels that require persisted evidence, reasons where required, and server-confirmed outcomes.

- [ ] **Step 1: Add failing tests** for own-submission denial, wrong global permission, empty/error/detail unavailable, and stale reviewed revisions.
- [ ] **Step 2: Port existing review/taxonomy/application screens** with the shared shell and registered APIs.
- [ ] **Step 3: Leave staff grants, audit, privacy requests, bank review, and inventory exceptions as explicit blockers** until their contracts and evidence are approved and registered.
- [ ] **Step 4: Run adversarial permission and maker-checker checks** plus mobile and desktop interaction review.

### Task 6: Cross-route state, accessibility, and integration hardening

**Files:**
- Modify: route components and tests identified by Tasks 2–5; update `docs/ren2-47/acceptance-evidence.md` and screen/API matrix.
- Test: all frontend scripts, backend scripts, API contract checks, and authorized real FE↔BE tests.

**Interfaces:**
- Consumes: completed screen implementations and live generated contract.
- Produces: documented route parity, failure coverage, desktop/mobile screenshots, and a W3 readiness handoff without claiming W3 checkout.

- [ ] **Step 1: Execute prototype scenarios S1–S4, B1–B8, A1–A5** against the real integration environment; record each PASS/FAIL/NOT EXECUTED with evidence.
- [ ] **Step 2: Run accessibility and responsive QA** at 320/375/390/768/1024/1280/1440px, reduced-motion, keyboard, screen reader and browser coverage.
- [ ] **Step 3: Run frontend lint/typecheck/tests/build and backend lint/typecheck/tests/build/api:check**; run disposable PostgreSQL and contract suites for changed backend surfaces.
- [ ] **Step 4: Conduct adversarial API and route review** for cross-brand reads/writes, unauthorized admin actions, stale retries, sensitive logs, and release gates.
- [ ] **Step 5: Prepare staged route replacement and rollback documentation**; production route/flag cutover remains an owner decision outside this PR.

## Definition of ready for code

- The matrix has owner review for screen-to-route mapping, W3 boundary, visual tokens, and the current-route parity inventory.
- Each missing API being implemented has a reviewed operation contract and task; unavailable legal/finance/provider decisions remain explicitly blocked.
- Required predecessor API and security issues are confirmed merged in GitHub, not inferred from Linear status alone.
- No feature gate, production setting, shared database, secret, or deployment is changed by this plan.
