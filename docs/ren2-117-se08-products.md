# REN2-117 · SE-08 Product Catalogue Visual Conversion

**Reference:** Approved 17 November 2026 prototype, `SCREENS.md` SE-08, `js/screens-brand-catalog.js`, `d1280_SE-08.png` and `m390_SE-08.png`. Prototype reviewer toolbar and seed products are **not** copied into the app.

## Implemented in current Next.js route

- Live product loading and pagination through existing NestJS brand-scoped `GET /brands/:brandId/products` proxy.
- Prototype-aligned header and real `Import products` and `Add a product` actions.
- Search by product name/style code and seven status tabs: All, Drafts, Changes requested, In review, Approved, Live, Restricted.
- Desktop product-status-version-action table and responsive mobile cards; product links open authorized editing routes.
- Live API product status and `contentVersion` only, with no invented update timestamps or reviewer explanations.
- Existing category-schema draft creation, idempotent submission, error and permission handling preserved.

## Pagination and correctness

**Filters apply only to loaded pages.** Each tab's count is derived from the current loaded `ProductSummary` rows, not the server's full catalogue. No server-side filter query or total filtered count is assumed. The “Load more products” path still fetches real pages; an empty filtered result is differentiated from an actually empty catalogue.

## Needed for full screen acceptance

- [ ] Lint, typecheck, tests, build, Docker CI.
- [ ] Playwright/browser screenshot comparison at desktop 1280 and mobile 390px against approved images (without toolbar).
- [ ] Authorized Brand A / Brand B API E2E, pagination and state/error recovery.
- [ ] Review status taxonomy, pending/re-review labeling and any additional backend filter API contract before claiming full-catalogue counts.
- [ ] Owner review before merge.

Next SE-09 editor must preserve variant revision, price/claim/media workflow and independent approval invariants. This PR does **not** complete all 40 screens or alter backend APIs.
