# REN2-117 · SE-12/12A/12C + SE-13 Prototype Implementation

**Reference:** approved `w1-w2-ideal-prototype-2026-11-17.zip` (`SCREENS.md`, `d1280_SE-12*.png`, `m390_SE-12*.png`, `d1280_SE-13.png`, `m390_SE-13.png`).

## UI delivered
- **SE-12**: source cards (Renivet CSV, Shopify, Unicommerce, generic), authentic export-file upload via signed intent, import mode and source timestamp; safe, explicit “history not connected” state (no fake import list).
- **SE-12A**: accessible stage indicator, existing real mapping → frozen preview, category mapping and conflict handling, respecting CSRF, idempotency and versioning. Exactly one `aria-current="step"`.
- **SE-12C**: server-backed confirmation and result rows/retry, only after a successful backend receipt. No fictional stock changes.
- **SE-13**: information panel explaining physical − quarantine − unsellable − allocated − buffer, four KPI cards based only on returned authorized backend balances and reconciliation data, and the existing real stock actions/ledger tables unchanged. Any backend failure is displayed as unavailable, not as zero inventory.

## Gaps that remain
- The current OpenAPI offers import workflows by batch ID but **no scoped list-history endpoint** for past imports. Do not fabricate row history or a previous upload.
- The current balance response includes physical, allocated and ATP but does not expose the quarantined/unsellable/buffer components separately; the UI does not invent those columns.
- Inventory API may still be behind the owner-approved activation gate. This frontend PR does not enable it.
- Real role-isolated browser E2E, signed-upload provider checks, 1280/390px image diffs and user approval required. CI/browser smoke passing is not pixel-level parity approval.
- The existing MFA/CSRF API enforcement remains as-is; REN2-116 deferral must be applied centrally, never through an unguarded frontend bypass.

No backend API, migration, release flag or production deployment changed. This completes a **visual/interaction conversion of four screen IDs**, not the missing historical import API nor the full 40-screen task.
