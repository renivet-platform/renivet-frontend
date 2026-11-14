# REN2-47 W2 portal acceptance evidence

This document records the implementation and verification evidence for the W2 brand and admin portal epic. It does not create seed data, grant permissions, enable the runtime gate, or claim a production release.

## Child coverage

| Issue | Implemented surface | Evidence |
| --- | --- | --- |
| REN2-95 | `docs/ren2-47/operation-map.json`, seller workspace routes, operations console route map | `tests/ren2-47-operation-map.test.ts`, `tests/ren2-47-portal-preview.test.ts`, `tests/ren2-47-portal-contrast.test.ts` |
| REN2-96 | `src/features/seller/product-workspace.tsx`, `product-detail-workspace.tsx` | `tests/ren2-47-catalog-state.test.ts`, live API proxy coverage |
| REN2-97 | `src/features/seller/product-detail-workspace.tsx`, media, price and claim editors | `tests/ren2-47-catalog-state.test.ts`, `tests/ren2-47-api-integration.test.ts` |
| REN2-98 | `src/features/seller/import-workspace.tsx`, `import-workspace-state.ts` | `tests/ren2-47-import-state.test.ts`, live API proxy coverage |
| REN2-99 | Existing inventory availability route remains explicitly gated; no unregistered stock authority is exposed | `tests/ren2-47-api-integration.test.ts` |
| REN2-100 | `src/features/admin/operations-console.tsx` with five persisted queues, detail views and maker-checker decisions | `tests/ren2-100-admin-console.test.ts`, admin review proxy coverage |

## Required runtime gates

- `RENIVET_W2_PORTAL_ENABLED=true` is required before seller W2 routes and the `/api/w2` proxy are available. The default remains fail-closed.
- Backend W1 membership and global permissions remain authoritative. The UI does not grant access.
- Mutations require same-origin CSRF evidence, a fresh MFA step-up, idempotency, and the relevant row/revision precondition.
- Admin review requires owner-managed global grants and two independent MFA-enabled reviewers. No grants or review rows are seeded by this change.
- Real seller-created persisted records are required to exercise the five admin queues; an empty queue is a valid result until those records exist.
- Seller price proposals now require an explicit server-issued INR `ruleVersion`; the UI never invents a pricing rule.
- REN2-99 inventory remains a truthful gated screen because no authoritative inventory API is registered; no stock data or actions are fabricated.

## Verification run

Executed from the frontend epic branch:

- `npm test` — PASS (60 tests)
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm run build` — PASS

Manual acceptance still requires an authorized disposable environment with the runtime flag enabled, owner-managed permissions, and real records created through the seller flow. Production deployment and database mutation were not performed.
