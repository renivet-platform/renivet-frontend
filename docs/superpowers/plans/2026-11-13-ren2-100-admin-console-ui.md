# REN2-100 Admin Console UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an accessible, professional W2 operations console that clearly presents taxonomy, QC, price, claims, and publication review work while keeping unavailable actions disabled until safe, authorized review context exists.

**Architecture:** Add a server-rendered route under the reserved admin route group and a focused presentational feature. It will not fetch or expose protected data because the current frontend has no verified server-side admin-role check and the backend API has no reviewer queue/read-by-id endpoints for these decisions. The UI must show honest unavailable states and must not invent metrics, evidence, or approval controls.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, CSS Modules, Node test runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-10-ren2-47-brand-admin-portal-design.md`; Linear REN2-100 acceptance checklist at https://linear.app/renivet/issue/REN2-100/w2-u106-build-renivet-admin-taxonomy-pricing-claims-and-qc-review.

## Global Constraints

- Backend remains the authority for reviewer identity, tenant scope, permissions, MFA, maker-checker, and every decision.
- Never display invented product, price, claim, stock, audit, or queue data.
- No browser-supplied role flag, mock API, fake success, mutation retry, or action without frozen revision and evidence context.
- Figma and external review evidence remain deferred/open under the owner’s prior direction; this UI does not satisfy those evidence gates.
- G07/G08/G14/G17 and the Linear requirement for real-API/security evidence remain open.
- Deliver only REN2-100 frontend scope in one fresh issue branch and one PR; do not merge or start another issue.

## Review Focus

- Anonymous users must see only non-sensitive explanatory UI; no protected rows or evidence are fetched or rendered.
- Missing reviewer queue APIs must be described accurately, not masked as an empty queue.
- Mutation routes may exist without safe read context; no decision action may be enabled solely because an endpoint exists.
- Responsive layouts and keyboard navigation must preserve section labels and gate explanations.
- Avoid made-up counts, freshness/SLA claims, claim verification states, and taxonomy publish results.

---

### Task 1: Build the gated admin operations console

**Files:**
- Create: `src/app/(admin)/operations/page.tsx`
- Create: `src/features/admin/operations-console.tsx`
- Create: `src/features/admin/operations-console.module.css`
- Modify: `src/features/admin/README.md`
- Test: `tests/ren2-100-admin-console.test.ts`

**Interfaces:**
- Produces a static, non-sensitive operations workspace at `/operations` with named sections for Overview, Taxonomy, QC, Pricing, Claims, and Publishing.
- Each section states which authoritative queue/read context or permission evidence is missing; all unavailable actions remain visibly disabled or omitted.

- [x] **Step 1: Write tests** for the section inventory, explicit unavailable reasons, absence of fake summary values, and absence of enabled decision controls.
- [x] **Step 2: Run the focused tests** and confirm they fail before implementation.
- [x] **Step 3: Implement** the server-rendered route and responsive accessible console using existing Renivet tokens/patterns; keep all data/action states factual and gated.
- [x] **Step 4: Update the admin feature README** with the route, non-sensitive scope, API gaps, and release gates.
- [x] **Step 5: Run focused tests, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; review the diff for tenant-data exposure, misleading availability, keyboard/accessibility issues, and unrelated edits.**

---

## Acceptance Boundary

This PR can deliver the screen and truthful gate states. It cannot satisfy REN2-100’s requirements for real reviewer journeys, permission-denial proof, frozen evidence, maker-checker decisions, audit results, or G07/G08/G14 release evidence while those APIs and authorized test contexts are absent. Report those items as **NOT MET / NOT EXECUTED**, not as completed.
