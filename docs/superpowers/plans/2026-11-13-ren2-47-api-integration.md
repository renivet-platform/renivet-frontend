# REN2-47 — API-connected W2 workspace completion

## Authorized scope

Two coordinated repositories: backend and frontend. Owner approved backend + frontend PRs and previously accepted code-first UI in place of Figma for this implementation pass. Preserve W1 sessions, server-derived brand access, CSRF, idempotency, and all existing API/release gates. Never register missing inventory/QC/publication/admin queue routes or invent permissions, rule versions, evidence, or success states.

## Current evidence and plan

- Latest bases: backend `fe4dc005` and frontend `f6dfa136` (2026-11-13).
- Frontend product draft, detail, media, claims and import screens already call registered APIs through the exact same-origin W2 proxy.
- Add the missing seller SKU update/deactivate interactions using registered APIs.
- Add a brand-scoped inventory route that explains API unavailability while backend inventory routes remain unregistered; do not display invented stock.
- Refresh REN2-95's backend source pin and test the operation map against current registered OpenAPI.
- Keep operations decisions disabled until the backend provides protected queues and decision context; keep W2 behind its activation gates.
- Backend source changes are not required to connect the currently supported seller screens. The coordinated backend branch will carry integration verification and current endpoint traceability, without enabling gated routes.

## Verification

Frontend: focused REN2-47 tests, lint, typecheck, full tests and production build. Backend: lint, typecheck, full tests, build and `api:check`; a single transient staging startup failure was seen in one full test run and passed immediately when isolated, so repeat the full test suite. Use only disposable PostgreSQL integration test data.

## Child trace

REN2-95 current API handoff; REN2-96 product editor APIs; REN2-97 SKU/price/media/claim APIs; REN2-98 import APIs; REN2-99 inventory unavailable surface; REN2-100 operations API boundary. Existing merged work is credited only where the source, API calls, and tests prove it; no unsupported child is represented as fully live.
