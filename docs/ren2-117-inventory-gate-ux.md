# REN2-117 · Inventory API 404 correction

The user-supplied local screenshot displays `Cannot GET /api/v1/brands/.../inventory/balances` instead of stock balances. This is **not** because the backend inventory API is missing: `InventoryController` and PostgreSQL ledger already implement the route. The `InventoryModule` is deliberately loaded only when `RENIVET_INVENTORY_API_ENABLED=true`.

The frontend now explains an HTTP 404 as an **inactive environment-gated inventory ledger** without exposing internal backend URLs, while distinguishing 401 (session), 403 (brand permission) and 5xx (unavailable ledger). This does not hide or forge stock results.

For disposable local verification, use Engineering OS PR #27's optional opt-in `start-apps.ps1 -EnableLocalInventory` only after reviewed migrations. Staging/production must remain inactive until G07/G08/G17 pass. Never bypass approval gates just to make a screenshot appear populated.

**Still required:** actual local E2E with authorized brand and ledger seed (opening receipt, adjustments, movement, reconciliation), design diff against SE-13 and security negative tests. Frontend PR does not activate backend environments automatically.
