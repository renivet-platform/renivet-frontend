# REN2-47 implementation plan

**Repositories:** `renivet-frontend` and `renivet-backend` (owner approved coordinated PRs for both). **Frontend base:** `origin/main` at `05f2b6a42f48886ecee74401d5988a80d99ff6b7`. **Backend base:** `origin/main` at `53dd0d0de75de2d204c0ee306f2b1bfe7347b693`. **Branch in each repo:** `epic/REN2-47-brand-admin-portal-ux`.

The front-end and back-end governance PRs are merged. REN2-53's backend PR #65 is also merged and verified in backend `origin/main`, and its Linear status is Done. No Engineering OS repository edits are in the approved scope.

## Verification checkpoint — 2026-11-11

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm test`: PASS (44 tests)
- `npm run build`: PASS (Next.js 16.4.4). Next.js updated the expected agent guidance and `tsconfig.json` files as part of its normal build; keep the generated Next.js guidance block.
- backend `npm run api:check`: NOT COMPLETED; its generated OpenAPI export stalled without output and was stopped after more than 90 seconds.

## Issue order and work

1. **REN2-95 — UX map and API handoff.** Add a route/operation/role/state matrix for all 47 operations in the current W2 v1.5 candidate OpenAPI, identifying each as interactive, headless, or gated/unavailable. Define navigation, responsive states, accessibility, error mapping, and current W0/design evidence gaps. Tests validate the complete matrix and ensure no operation is falsely described as live. Owner direction on 2026-11-11 accepts the code-first preview for this pass and defers Figma; live API/security evidence and release gates remain separate.
2. **REN2-96 — Progressive product editor.** Add typed category/product adapters, category tree/version guidance, parent draft create/edit/resume, save/error/403/409/session-expiry states, and accessible category/field validation using only registered routes. Unit and route-handler tests; commit `REN2-96: build accessible progressive product editor`.
3. **REN2-97 — Variants, media, prices, and claims.** Add the variant matrix, duplicate-option validation, signed media upload/status/reorder, price proposal history, and claim evidence UI using live routes and backend state. Test mismatch/denial/retry/stale/idempotency behavior; commit `REN2-97: build product variant and evidence workspace`.
4. **REN2-98 — Import wizard.** Add source upload, field mapping, immutable preview/diff, stale-preview stop, idempotent confirm, result/progress display, and retry of failed rows using registered import contracts. Test sensitive error redaction, stale preview, and retained successful-row state; commit `REN2-98: build seller import workflow`.
5. **REN2-99 — Stock console.** Inventory controllers exist in backend source but are deliberately not registered in `AppModule`. G07/G08/G17 are open. Do not expose those routes or seed permissions. Build a clearly gated console surface and document the API evidence still required; never derive authoritative stock locally.
6. **REN2-100 — Operations console.** Use registered taxonomy, price, and claim operations; do not simulate absent QC queue/publication/restriction routes. QC/publication services exist internally, but HTTP adapters and the owner-approved permission mapping are absent; G07/G08/G14/G17 remain open. Build only safe registered API surfaces and explicitly gate the rest.

## Cross-issue implementation layout

- `src/app/(seller)/...` and `src/app/(admin)/...`: server-rendered protected pages and layouts.
- `src/features/catalog`, `imports`, `inventory`, and `admin`: focused screen components, state models, and adapters.
- `src/app/api/w2/...` and `src/lib/server/w2-proxy.ts`: same-origin allowlisted BFF that forwards only first-party session/CSRF evidence to the backend.
- `src/generated/renivet-api.d.ts` and `openapi/renivet-backend.openapi.json`: synchronized generated contract artifacts; source backend main SHA is recorded in REN2-95 handoff.
- `tests/`: focused state/validation, API allowlist/proxy, and component behavior tests aligned with each issue.

## Verification and final gate

- Per child: focused tests, `npm run lint`, `npm run typecheck`, and `npm run build` before the child commit.
- At final integration: complete `npm test`, lint, typecheck, build, API contract synchronization checks, and route/accessibility review.
- Do not claim live W2 activation or G07/G08/G17 completion. Code-first design is accepted for this pass by owner direction; runtime/API and permission evidence remain release gates.
- The owner-approved backend + frontend scope means one epic PR per repo. Do not open a final PR until the implementation and remaining required runtime evidence are review-ready.
