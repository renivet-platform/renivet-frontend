# REN2-10 W1 onboarding preview implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Extend the existing W1 onboarding design preview into a navigable, accessible, code-based design provision while the requested Figma artifact and formal reviews remain pending.

**Architecture:** Keep the preview as a data-driven client component under the existing design-only route. Model journeys and states in a pure module, render them without credentials or network calls, and mark every simulated result as illustrative. Do not modify real sign-in, BFF, OpenAPI or authorization behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules and Node test runner.

**Spec:** docs/03-ui-ux/w0.4-screen-state-matrix.md, docs/03-ui-ux/w0.4-complete-designer-implementation-brief.md, live Linear REN2-10 / REN2-16 / REN2-17, and docs/superpowers/specs/2026-10-30-ren2-25-auth-design.md for implemented auth contracts.

## Global Constraints

- The preview is a design provision, not a production authentication or authorization flow.
- Do not send credentials, codes, session tokens or personal information; do not call backend routes.
- Backend sessions and current membership remain authoritative; never infer permissions from the UI.
- Keep fields read-only, state results explicitly simulated, and unknown business rules proposed/TBD.
- Preserve the user's uncommitted tsconfig.json and untracked next-env.d.ts; do not stage them.
- Leave Product, Design, Security and Frontend review status pending until real reviewers decide.
- Keep Figma revision and issue acceptance gaps explicit; do not mark REN2-10 Done.

## Review Focus

1. Account enumeration: all anonymous auth failures remain generic and never confirm an account exists.
2. False success: simulated next states must say no request, code verification, session or permission was created.
3. Stale navigation: switching journey steps resets the selected state to that screen's ready variant.
4. Accessibility: keyboard-operable controls, focus visibility, announced state/heading updates, text labels and contrast.
5. Responsive use: the screen rail, state controls and preview remain usable at 320 px and wide desktop sizes without horizontal page overflow.

---

### Task 1: Pin the proposed journey and state contract

**Files:**
- Modify: tests/onboarding-prototype.test.ts
- Test: tests/onboarding-prototype.test.ts

**Interfaces:**
- Produces stable screen IDs, source CU/SE/AD IDs, preview-only next-step links, and named state variants for sign-in, registration, verification, recovery, session expiry, privileged MFA, seller access and admin permission review.

- [x] Add tests that enumerate each journey screen and assert every next-step ID resolves.
- [x] Add tests for ready, loading, success-preview, validation error, generic denial, expiry, rate limiting, service unavailable, suspension and audit-unavailable states where applicable.
- [x] Run the focused prototype tests and confirm the new assertions fail against the original six-screen model.

### Task 2: Implement the pure journey and state model

**Files:**
- Modify: src/features/identity/onboarding-prototype.ts
- Test: tests/onboarding-prototype.test.ts

- [x] Add the minimum model fields required by the failing tests.
- [x] Keep state copy generic, safe and explicit that outcomes are only design previews.
- [x] Run the focused prototype tests and confirm the expected assertions pass.

### Task 3: Make the preview navigable and accessible

**Files:**
- Modify: src/features/identity/onboarding-prototype-view.tsx
- Modify: src/features/identity/onboarding-prototype.module.css
- Test: tests/onboarding-prototype.test.ts

- [x] Add explicit preview-only next and alternate-step controls; never submit the read-only fields.
- [x] Announce screen and state changes, preserve semantic headings/fieldset labels, and provide visible focus indicators.
- [x] Add structural tests proving this preview imports no auth API and that actions are preview navigation only.
- [x] Run the focused tests and applicable lint/typecheck checks.

### Task 4: Record REN2-10 provision and open acceptance gates

**Files:**
- Modify: src/features/identity/README.md
- Modify: src/app/(auth)/README.md only if needed for cross-reference
- Modify: tests/onboarding-prototype.test.ts

- [x] Document the route, source-screen map, tested contrast pairs and manual keyboard/responsive checks.
- [x] Record Figma, stakeholder review and child issue acceptance as pending; no approval is implied by this PR.
- [x] Run lint, typecheck, full tests and production build. Manual browser/assistive-technology checks are still review follow-up.
- [x] Review the final diff and leave unrelated user changes unstaged.

