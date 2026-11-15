# REN2-99 provisional inventory surface

## Owner-approved approach

The inventory surface now reads persisted balances and movement history and can create locations through the protected API. Do not display sample balances as if they were real or calculate available-to-sell stock in the browser. The backend routes are opt-in and remain disabled by default until the approved runtime evidence exists.

## Current UI

The code-first W2 workspace includes a live-data Inventory section for balances, location creation and movement history. It fails closed with a retryable error when the backend opt-in is disabled or permissions are missing. The backend OpenAPI now includes the inventory operations behind `RENIVET_INVENTORY_API_ENABLED=true`.

## Acceptance boundary

The UI does not seed records or bypass permissions. Full runtime activation still requires G07/G08/G17 evidence, owner-managed inventory grants, disposable PostgreSQL verification and real persisted records; those release gates remain open.
