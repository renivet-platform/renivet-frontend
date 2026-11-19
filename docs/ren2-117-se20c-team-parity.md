# REN2-117 — SE-20C Team & Access source parity

Source: approved 17 November 2026 prototype (`js/screens-brand-ops.js`, `d1280_SE-20C.png`, `m390_SE-20C.png`) and actual screenshot mismatch reported by owner 19 Nov.

## Implemented
- Complete replacement of the old raw-permission header/table with the approved **Team & access** header, **Person / Role / Status / Action** table, owner protection and right-column **Roles** guide.
- Live backend `GET /brands/:brandId/access/team-v2` (backend PR #97); no fake member names, emails, roles or invitation states.
- Modal `Invite someone` with accessible email + least-privilege preset roles, 7-day expiration and server-side email delivery; **Cancel invitation**, **Remove access** with confirmation, refresh/error/busy states.
- Verified-email invitation acceptance route `/brands/invitations/accept` with session-derived CSRF.
- Includes mobile member cards, keyboard focus and reduced-motion styling.
- No raw access grant strings exposed as customer-facing labels.

## Dependencies / acceptance
- Backend PR #97 migration 0046 and role/CSRF-authorized API must be applied in the **same controlled environment** before functional acceptance.
- SMTP or Resend sender must be configured; no fake sent status if delivery fails.
- Run live brand owner vs catalogue editor vs stock manager vs stranger cross-brand tests; test invite expiration/cancel/revoke, last-owner/self protection, first login and no MFA prompts in development. Run actual 1280/390 screenshots against prototype; UI CI screenshots alone do not establish pixel parity.
- Do not merge into production until schema, migration, email delivery and role tests pass. Owner approval required.

**Inventory** is separate: it already exists in NestJS under `RENIVET_INVENTORY_API_ENABLED` but should only be switched on in local/disposable approved environments until G07/G08/G17 have evidence.
