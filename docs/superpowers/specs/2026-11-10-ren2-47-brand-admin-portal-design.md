# REN2-47 — Brand and admin portal design

## Intent

Build the W2 brand and operations journeys in the existing Next.js frontend. Sellers need one clear place to create and complete catalog products, import existing catalogs, and inspect stock. Operations reviewers need focused views for taxonomy, QC, prices, claims, and approval states. The backend remains the authority for permissions, catalog lifecycle, imports, and stock.

## Goals

- Deliver the six REN2-47 child slices in their dependency order with one tested commit per child.
- Use the real backend OpenAPI that is generated from registered routes; update the stale frontend API artifact before building typed adapters.
- Provide responsive, accessible navigation and complete loading, empty, validation, denied, conflict, unavailable, and retry states.
- Keep server authorization and brand scoping in the backend. UI route groups and hidden controls are never treated as access checks.
- Clearly identify code previews and any route still waiting for a backend activation gate.

## Non-goals and boundaries

- Backend implementation is authorized as a coordinated second PR. This does not authorize route activation, permission grants, Engineering OS contract changes, new inventory authority, mock endpoints, or fake success states.
- Do not expose sensitive brand or admin data in static markup, client state, logs, or error messages.
- Do not make G07/G08/G17 pass by adding frontend code. Backend route activation remains a separate release decision.
- Owner direction on 2026-11-11: a code-first Next.js handoff satisfies the design-medium requirement for this implementation pass; a Figma file is not needed now. Keep Figma deferred and do not claim live API/security or runtime-gate approval.

## Approaches considered

1. **Build every screen against candidate v1.5 APIs.** Rejected: candidate operations are not proof of registered routes, and several stock/QC operations are not in current backend OpenAPI.
2. **Build only static screenshots/prototypes.** Rejected: it would not use the implemented product, media, price, claim, and import APIs or exercise real errors.
3. **Build a code-first portal using only registered backend contracts, with explicit unavailable states for gated/missing operations.** Chosen: it delivers real flows where APIs exist without implying that unavailable operations work.

## Route and feature shape

- Seller workspace: product list, progressive draft creation/editing, SKU and variant editor, media status/ordering, proposed price and claim evidence, and import mapping/preview/results/retry.
- Stock workspace: locations, stock balances/freshness, observations, adjustment requests, cycle counts, and reconciliation status only where a corresponding registered contract exists. Unsupported controls remain unavailable with a plain explanation; no local stock arithmetic becomes authoritative.
- Operations workspace: show taxonomy, price, and claim areas with clear unavailable states until safe read/review context is registered. QC queue, publication, restriction, and other missing registered operations are not simulated.
- Use the reserved `(seller)` and `(admin)` route groups only with a server-side backend check before rendering protected data. Never rely on a route group or client-side role flag for authorization.

## API and security boundary

- Refresh `openapi/renivet-backend.openapi.json` from backend `origin/main` and regenerate `src/generated/renivet-api.d.ts`; record the source commit in the issue handoff.
- Add a same-origin, explicitly allowlisted BFF for only the registered W2 operations used by these screens. Forward the host-only session cookie and CSRF evidence; reject cross-origin requests; do not accept browser-supplied authorization headers or arbitrary upstream paths.
- Use backend responses as the source for membership and permission decisions. A 401/403/404 response is presented as a neutral denial; a 409 is a stale/conflict state; 503/network failures are retryable only for safe reads. Never auto-retry a mutation.
- Use the API's idempotency and conditional-update headers where required. Direct object uploads use only backend-issued signed URLs and the declared upload metadata.
- Do not render actual protected pages in an unauthenticated session. Keep operational routes dormant or gated where no safe server-side access check/API exists.

## Visual and accessibility direction

- Use Renivet's current token/color foundation, a calm neutral canvas, clear brand identity, high-contrast primary actions, compact information hierarchy, and consistent sidebar/top-bar navigation.
- Give each task one primary action, explain current state before the action, and keep form labels, errors, progress, status badges, and recovery actions visible at narrow widths.
- Keyboard order, focus visibility, semantic landmarks, labelled controls, error summary links, and live announcements for save/import outcomes are part of acceptance.

## Acceptance and open evidence

- Child code, tests, and CI are recorded per issue; child commits do not automatically mark Linear issues complete.
- REN2-95 uses the owner-approved code-first handoff for this pass; Figma is deferred. Any separate issue-specific stakeholder reviews remain the responsibility of their named reviewers.
- G07/G08/G17 remain external activation gates; absent stock/QC routes stay unavailable and are listed as evidence gaps.
- The backend and frontend repositories each require a distinct epic branch and owner-reviewed PR. REN2-53 PR #65 is merged in backend `origin/main`; its Linear status is Done.
- If these gaps remain when child implementation ends, do not call the epic acceptance complete or silently open a final PR as fully satisfied. Report the exact missing evidence and request owner direction for any partial review handoff.
