# REN2-117 · AD-20 globally authorized audit log

The original 17-Nov W1/W2 prototype has an `AD-20` filtered audit table. This implementation connects the frontend to actual append-only PostgreSQL audit events, **not** the fictional prototype event history.

## End-to-end design
- Backend PR #102: scoped `GET /api/v1/admin/access-audit?limit=30&cursor=...`, protected by `PlatformPermissionGuard` and `RequirePlatformAdminPermission('access_audit.read')`; same-statement permission check; no payload hash/IP hash exposed; keyset cursor paging.
- Frontend this PR: exact GET-only same-origin BFF allowlist (`/api/w2/admin/access-audit`), responsive event list, controlled loading, 401/403, pagination and current-page search; no fake records, writes or export.
- Database schema already exists as `access.security_audit_events` and is immutable by trigger.

## Acceptance remaining
- [ ] Backend OpenAPI/generated schema/contract traceability pass.
- [ ] Backend/Frontend CI and browser responsive screenshots pass.
- [ ] Authenticated global staff admin read, 403 for non-admin/brand staff, permission revocation, no PII leakage.
- [ ] Exact visual reference comparison at 1280/390 against approved AD-20 screenshot.
- [ ] Owner review before merge.

This does not implement other missing AD-05 bank, AD-06 staff, AD-09 stock exception or AD-19 privacy decision APIs.
