# REN2-117 · W2 SE-07 Brand Home visual and API parity (slice 3)

**Source:** `w1-w2-ideal-prototype-2026-11-17.zip`, `SCREENS.md` SE-07, `js/screens-brand-ops.js`, `screenshots/d1280_SE-07.png`, `screenshots/m390_SE-07.png`, shared W2 UI tokens.

## Implementation

- Replaces the previous text-heavy workspace landing page with the approved **4 KPI cards → Needs your attention → Guidance / Tip** arrangement.
- Keeps existing authenticated W2 API calls to `GET /brands/:brandId/access` and `GET /brands/:brandId/products`; brand scope still enforced by the real API and same-origin proxy.
- All displayed counts are derived from actual service responses. **First-page** review/status counts are clearly marked as partial if pagination exists; the total count is labeled as the server-reported total.
- Attention items are **persisted restricted/rejected products only**, linking to their actual product editor. Demo claims, fake import counts, stock holds, suggested owner names and fictional tasks were deliberately excluded.
- Existing authorized navigation, branding and mobile menu are owned by `WorkspaceShell`, not duplicated here.
- “Add a product” opens the real product workspace, which owns the backend create flow; it does not fabricate product creation or inventory mutations.

## Review and QA

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and Docker CI.
- [ ] Confirm desktop/mobile screenshots against the source at 1280/390px, excluding prototype reviewer toolbar.
- [ ] Run authenticated brand A and B E2E with permitted/denied scope and actual service results.
- [ ] Test loading, service unavailable, access denied, empty catalogue, pagination and restricted/rejected products.
- [ ] Do not merge or enable unapproved W2 feature gates without owner approval.

**Not included:** SE-08 product list, SE-09 product editor, SE-12 imports, SE-13 stock, or the remaining seller/admin routes. Those require their own visual and contract slices; no feature is deemed complete because a route exists.

[REN2-117](https://linear.app/renivet/issue/REN2-117) · [W1 slice 2 PR #65](https://github.com/renivet-platform/renivet-frontend/pull/65).
