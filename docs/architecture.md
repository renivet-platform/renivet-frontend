# Frontend structure — Phase 0.4

## Routing

- `src/app/(storefront)/page.tsx` owns `/` without changing the URL; storefront routes go alongside it.
- `(auth)`, `(customer)`, `(seller)` and `(admin)` reserve route-group boundaries. They **do not provide public pages or authorize any access**.
- `src/app/api/health/route.ts` is the existing backend connectivity probe; `src/app/health/page.tsx` is a static frontend liveness page. Neither is a production readiness signal.

Do not add another `page.tsx` resolving to `/` or create duplicate routes across groups. Route groups do not affect URL paths or enforce permissions. All account/seller/admin routes must implement *server-side* authorization after REN-GOV-001 approval.

## Source ownership

- `components/ui`: generic presentational primitives, no domain logic.
- `components/layout`: composition and layout.
- `components/shared`: cross-feature presentation.
- `features/<capability>`: isolated UI and its feature-specific hooks, server interactions and types when approved.
- `services`: typed HTTP/backend adapters; no raw provider credentials shipped to browsers.
- `stores`: **client-only** ephemeral UI state; never the source of inventory/payment truth.
- `config`: non-secret frontend metadata and runtime configuration rules.
- `lib`: pure cross-cutting helpers; `types`: shared TypeScript contracts; `hooks`: genuinely cross-feature hooks.

## Architecture guardrails

- Server components by default. Only use `"use client"` where interaction needs it.
- Backend remains the authority for identity, inventory, cart, checkout, orders, payments and ledger.
- Do not implement protected route access based on layout groups alone.
- No mock payment transfers or privileged UI to be mistaken for deployed functionality.
- Design artifacts D01–D06 and owner decisions are still In Review; feature logic awaits Phase 4 clearance.
- All modifications are PR-reviewed on `phase0/foundation`; no change to `main`.
