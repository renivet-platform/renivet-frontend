# REN2-117 · Exact SE-08 product listing redesign

Approved 17 November 2026 prototype is visual source (`screens-brand-catalog.js`, `d1280_SE-08.png`, `m390_SE-08.png`).

- `/brands/:id/products`: clean Products title/subtitle, Import products and Add a product actions, search/status chips, product table, mobile cards, server pagination.
- `/brands/:id/products/new`: separate categorized draft creation form. Backend's existing schema pinning and idempotent product creation are preserved; no legacy inline form intrudes on the product list.
- Removed `BrandAccessPanel` from catalogue: raw role and permission codes should never occupy the primary product UI. Security remains server-enforced.
- No fictional updated timestamps/reviewer notes or category paths are inserted where the ProductSummaryModel lacks those fields. A separate backend DTO extension can supply those attributes accurately.
- Current backend already has brand-scoped `GET/POST /products`, owner auth, price/claims/variants via the detail editor. This PR changes layout and route, not finance/stock authority.
- Pending: real data E2E + 1280/390 screenshots compared against the approved source, search-pagination tests, accessibility and product creation with a published taxonomy. No merge/deploy performed.
