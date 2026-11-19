# REN2-117 · Exact SE-12 import flow replacement

The approved `w1-w2-ideal-prototype-2026-11-17.zip` source defines separate import pages:
- `/brands/:id/imports` — import history with source/date/products/state, **New import** button.
- `/brands/:id/imports/new` — five stages Source → File → Match columns → Preview → Results, one visible at a time.
- `/brands/:id/imports/:batchId` — persisted backend result rows.

This PR fully replaces the hybrid old single-page upload/field-mapping stack. Source selection cards choose a matching template; file stage handles signed upload, source date and conflict policy; mapping/preview/confirm/retry retain the authoritative server's immutable revisions, CSRF and idempotency. All stock quantities are observations, never physical stock changes from a CSV.

**Important auth policy:** the existing front end unconditionally required an authenticator code for every action, contradicting REN2-116's controlled development-only defer mode. New flow obtains `mfaEnforcementMode` from `getCurrentSession()`: only skips code if server explicitly says `deferred`. Absent/unknown stays `enforced`. There is no manual bypass and the backend MfaGuard remains authoritative.

Import history `GET /brands/:id/product-imports` is added in **backend PR (companion)**, not a fake list. Full E2E needs deployed frontend/backend branches in a controlled environment, a valid brand/cookie, real CSV or XLSX, 1280/390 reference screenshot comparison, failed/duplicate row retry, and version/role negatives.

This is not a production release or owner visual signoff. No merges performed.
