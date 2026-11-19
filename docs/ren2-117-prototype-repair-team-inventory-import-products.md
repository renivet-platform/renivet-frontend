# REN2-117 · Prototype-first repair — Team, Inventory, Imports, Products

Reviewed against `w1-w2-ideal-prototype-2026-11-17.zip` and user-supplied screenshots (18 November). This PR is an **implementation slice**, not a full "all screens end to end" completion.

## What changed

| Screen | Actual change | Backend status |
| --- | --- | --- |
| SE-20C Team & access | Replaced raw permission debug chips with approved Person / Role / Status / Action table, two-column roles guide, active/invited/removed badges and lone-owner protection | Existing protected GET; paired **backend PR #100** returns real name, email and invitation expiry. Invite/revoke writes still require a secured lifecycle API |
| SE-13 Inventory | Simplified owner-friendly heading/actions and expandable availability explanation; added real location/out-of-stock filters, honest empty state and useful disabled-module diagnostics | Existing protected NestJS inventory module; **Engineering OS PR #28** activates local-only startup; production/staging gates unchanged |
| SE-12/A/C Imports | Distinct Imports index and explicit New import wizard; one source-card selector, no duplicate dropdown; retained real signed upload, mapping, preview, confirmation, result and retry | Existing NestJS APIs; server-reported MFA enforcement mode now controls whether a step-up code is requested, consistent with REN2-116 |
| SE-08 Products | Removed raw access debug panel; aligned columns to Product/Status/Version/Updated/Action and added category labels | Paired **backend PR #101** returns real product `categoryId`/`updatedAt`; optional until deployed. No invented dates |

## Critical unfinished workflows

**Team invitation/removal is NOT yet working.** The button remains disabled instead of pretending to send mail. Proper implementation requires an audited, versioned membership-invite/accept/revoke API with CSRF, per-brand permission and last-owner protections; the current backend only supports scoped reads.

**Inventory production rollout is NOT enabled.** `RENIVET_INVENTORY_API_ENABLED=true` must be set only in an approved disposable local backend after inventory migrations. Full staging/production activation still needs G07/G08/G17 and owner go/no-go.

**Privacy, bank, seller onboarding, admin and W3 backend gaps remain.** No unsupported endpoints or mock states were introduced.

## Verification gates before merge

- [ ] Frontend lint, typecheck, unit, browser visual + Docker CI pass.
- [ ] Backend PRs #100 and #101 CI pass, including real scoped DTO/schema tests.
- [ ] Compare actual 1280/390 screenshots with original SE-08, SE-12, SE-13, SE-20C images, excluding the prototype review toolbar.
- [ ] Test real Brand A/B sessions (read, 403, expired session) and authorized import upload/preview/confirm with MFA deferred and enforced.
- [ ] Test local inventory with migration, flag ON in dev and OFF/404 before activation; no unauthorized reads or writes.
- [ ] Review legal/privacy access to member email and authorization for membership roles.
- [ ] Owner review of design and PRs before merge; do not deploy or claim full REN2-117 completion.
