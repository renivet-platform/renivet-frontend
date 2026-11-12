# REN2-25 Next.js Authentication Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the REN2-25 customer authentication UI and same-origin BFF using only current backend identity routes, with reproducible contract, browser, security-negative and responsive evidence.

**Architecture:** Use a pinned backend OpenAPI snapshot to generate frontend operation types. Add narrowly scoped Next.js Route Handlers for the existing backend auth operations; enforce same-origin unsafe requests, preserve backend cookie/CSRF semantics, and map errors to safe responses. Build accessible App Router screens for registration/email verification, password sign-in, recovery, active session/logout, and expiry.

**Tech Stack:** Next.js 16.4.2, React 19, TypeScript, Tailwind 4, Node 22 tests, Chrome DevTools Protocol browser E2E already used by this repo, `openapi-typescript` pinned for type generation.

**Spec:** `docs/superpowers/specs/2026-10-30-ren2-25-auth-design.md`

## Global Constraints

- Backend main commit `6a85d53` owns the NestJS/OpenAPI contract; do not invent routes, request fields, OTP login, phone delivery, brand authorization, or other service behavior.
- Register and login use verified email + password; passphrases are 8–128 characters and paste/password managers remain enabled.
- OTP is six numeric digits and is used only for email verification and password recovery; no client timer or delivery claim is invented.
- The backend owns identity/session state. The `__Host-renivet_session` cookie stays Secure, HttpOnly, host-only, SameSite=Lax, Path=/; raw session tokens never enter UI code/storage.
- Unsafe BFF calls require exact same-origin `Origin` and `Sec-Fetch-Site: same-origin`; logout also forwards the session-bound `X-CSRF-Token`.
- Return `Cache-Control: no-store` for auth/session responses; never log credentials, OTP, CSRF/session tokens, or full contacts.
- Keep changes on `feature/REN2-25-nextjs-auth-screens`; preserve pre-existing edits in the user's frontend checkout; never merge or deploy.
- Treat the code-authored design as interim. Do not claim actual Figma revision, independent approval, or configured OTP delivery.

## Review Focus

1. Missing or hostile `Origin`/Fetch Metadata must be rejected before any unsafe backend request; test cross-origin registration and logout CSRF denial.
2. Backend timeout, malformed JSON, 401/403/429/503 and missing `Set-Cookie` must remain generic and must not produce false success; test representative error and timeout cases.
3. A challenge ID, code, email, password, CSRF token or session token must not be copied into URLs/storage/logs; test request flow and browser-visible locations/storage.
4. Mobile viewport and keyboard focus must keep forms usable without horizontal overflow; test narrow and desktop widths plus sequential keyboard navigation.
5. An unauthenticated or expired session must never render protected content, and logout must require current CSRF proof; test expiry redirect and denied logout.

---

### Task 1: Versioned OpenAPI contract and generated client types

**Files:**
- Create: `openapi/renivet-backend.openapi.json` from backend `origin/main` at `6a85d53`
- Create: `src/generated/renivet-api.d.ts` (generated)
- Create: `docs/auth-api-contract.md`
- Modify: `package.json`, `package-lock.json`
- Test: `tests/auth-openapi.test.ts`

**Interfaces:**
- Consumes: NestJS OpenAPI `paths` and `components.schemas` from the exact source snapshot.
- Produces: generated `paths`/`components` types consumed by BFF and identity UI; `npm run api:types` regenerates deterministically.

- [x] **Step 1: Write `auth-openapi.test.ts` first.** Parse the checked-in snapshot and assert the exact existing operations and methods: register POST, sessions POST, session GET/DELETE, challenges POST, challenge verification POST; assert there is no OTP-session operation; assert required request/response schemas for the flows exist.
- [x] **Step 2: Run `npx tsx --test tests/auth-openapi.test.ts`.** Expected: FAIL because the snapshot does not yet exist.
- [x] **Step 3: Add the backend snapshot and provenance note.** Record backend `origin/main` SHA `6a85d53`; document that the spec is a consumer snapshot and backend remains authoritative.
- [x] **Step 4: Add pinned `openapi-typescript` and `api:types` script.** Use the CLI on the snapshot to generate `src/generated/renivet-api.d.ts`; avoid hand-editing generated output.
- [x] **Step 5: Run type generation and the focused test.** Expected: PASS and no uncommitted generated diff after a second generation.

### Task 2: Secure same-origin auth BFF

**Files:**
- Create: `src/lib/server/auth-proxy.ts`
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/sessions/route.ts`
- Create: `src/app/api/auth/session/route.ts`
- Create: `src/app/api/auth/challenges/route.ts`
- Create: `src/app/api/auth/challenges/[challengeId]/verify/route.ts`
- Test: `tests/auth-proxy.test.ts`

**Interfaces:**
- Consumes: generated operation types; backend base URL resolved server-side using `BACKEND_INTERNAL_URL`, then `NEXT_PUBLIC_API_BASE_URL`, then local default.
- Produces: only the fixed auth URLs above; safe JSON response, forwarded backend `Set-Cookie`, and no-store headers.

- [x] **Step 1: Write failing tests for exact-origin enforcement, cross-site denial, secure cookie forwarding, session-cookie forwarding, CSRF header forwarding, timeout mapping, and safe upstream error handling.** Use a disposable local HTTP server so request/response behavior is real.
- [x] **Step 2: Run `npm test -- --test-name-pattern="auth BFF"`.** Expected: FAIL because the helper and handlers do not exist.
- [x] **Step 3: Implement `proxyAuthRequest(request, path, method)` with fixed per-route callers, JSON size/content checks, timeout, selected-header forwarding, safe fallback, allowlisted response headers and `Cache-Control: no-store`.** Unsafe requests must reject nonmatching/missing `Origin` or `Sec-Fetch-Site` before fetch; dynamic challenge IDs must pass UUID validation.
- [x] **Step 4: Add each Route Handler as a minimal method adapter to the exact backend path; do not add a catch-all path.** Forward cookie and CSRF headers only when required; preserve each backend `Set-Cookie` header on session create/refresh/logout.
- [x] **Step 5: Run focused proxy tests.** Expected: all assertions pass, including an upstream call count of zero for rejected cross-origin requests.

### Task 3: Accessible authentication journeys

**Files:**
- Create: `src/features/identity/auth-api.ts`
- Create: `src/features/identity/auth-forms.tsx`
- Create: `src/features/identity/auth.module.css`
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/recover/page.tsx`
- Create: `src/app/(auth)/account/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/features/identity/README.md`, `src/app/(auth)/README.md`
- Test: `tests/auth-design.test.ts`, `tests/auth-flow.e2e.mjs`

**Interfaces:**
- Consumes: typed operations, same-origin `/api/auth/*` BFF, current forest color token and design spec.
- Produces: `/sign-in`, `/register`, `/recover`, `/account`; email/password auth, email verification/recovery OTP, session status and CSRF-protected logout.

- [x] **Step 1: Write failing design/unit tests.** Verify selected text/background pairs meet 4.5:1 contrast and OTP/passphrase validators accept only the current backend constraints without changing valid pasted values.
- [x] **Step 2: Run the focused test.** Expected: FAIL before the design tokens and validators exist.
- [x] **Step 3: Implement a reusable form component and mobile/desktop design.** Visible labels, error association, focus styles, pending/success/error live regions, numeric six-digit OTP paste/autofill, password visibility, and no analytics/storage/URL persistence of secrets.
- [x] **Step 4: Implement the four routes against the generated typed API.** Registration must request email-verification challenge only after accepted registration; recovery must send `newPassword` only to password-recovery verification; sign-in relies on backend Set-Cookie; account renders only after successful session inspection; logout uses in-memory CSRF proof.
- [x] **Step 5: Add Chrome browser E2E using the existing repository CDP convention and a disposable in-process API contract double.** Cover successful registration→verification→sign-in→session→logout, generic credential/OTP denial, provider/service outage, expired session and cross-site/CSRF rejection; assert keyboard labels/focus, no secret in URL or `document.cookie`, no horizontal overflow at 320/390/1440 widths, and write screenshot evidence only under ignored `visual-artifacts/`.
- [x] **Step 6: Run the focused unit and browser E2E tests.** Expected: all flow/security/accessibility assertions pass.

### Task 4: CI, documentation and final verification

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/auth-api-contract.md`, `src/features/identity/README.md`, `src/app/(auth)/README.md`
- Test: existing suite plus auth contract, proxy, design, browser E2E.

**Interfaces:**
- Consumes: tests and generated types from Tasks 1–3.
- Produces: repeatable CI checks for generated contract drift and auth browser regressions; updated user-facing repository handoff.

- [x] **Step 1: Add CI type-generation drift check and auth browser E2E to the existing visual job.** Do not weaken existing lint, typecheck, unit, build, Docker/security, health-bridge or screenshot gates.
- [ ] **Step 2: Run the full frontend CI command set locally:** `npm run api:types`, `npm run lint`, `npm run typecheck`, `npm test`, production build, health bridge integration, auth browser E2E, existing desktop/mobile visual regression and repository security check.
- [x] **Step 3: Review generated output and the full diff.** Confirm only existing API paths are used, no secrets/real data are present, the base checkout is unchanged, and formal Figma/provider gaps are documented without claiming approval.
- [ ] **Step 4: Commit verified changes on the feature branch, push it, and open a PR linked to REN2-25.** Never merge; leave Linear status unchanged unless separately instructed.
