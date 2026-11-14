# Admin UI

## Operations review console

- `/operations` loads persisted taxonomy, QC, pricing, claim-evidence, and publication queues through the same-origin W2 BFF.
- NestJS requires global W1 permissions for every queue and exact detail read. A 403 is shown as a permission state; route groups and client state do not grant access.
- Decisions re-fetch the W1 session, require MFA step-up and session CSRF, use idempotency keys, and send exact revision/row-version identifiers. Backend transactions recheck permissions, maker-checker constraints, state and version.
- W2 remains disabled unless `RENIVET_W2_PORTAL_ENABLED=true`. No taxonomy data or review records are seeded. The W1 permission assignments and operational release gates remain owner-controlled.
