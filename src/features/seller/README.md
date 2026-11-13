# Seller workspace implementation notes

The W2 seller routes are feature-gated by `RENIVET_W2_PORTAL_ENABLED` and remain disabled unless a release owner enables them after the required runtime gates. They use a same-origin, exact allowlist proxy and the backend's first-party session and brand authorization.

Implemented route surfaces:

- `/brands/[brandId]/products`: category-guided product draft creation and list.
- `/brands/[brandId]/products/[productId]`: draft resume, variants, scanned media, price history and claim evidence.
- `/brands/[brandId]/imports`: file upload, mapping, preview, confirmation, results and safe retry.
- `/brands/[brandId]/inventory`: explicit unavailable state while protected inventory routes remain unregistered; no stock values are fabricated.
- `/portal-preview`: static non-operational design handoff only.

The operation-level availability, presentation mode, UX state contract, accessibility notes, and open evidence gates are in `docs/ren2-47/operation-map.json`.

Owner direction accepts the code-first design handoff for now; Figma is deferred for this implementation pass. Known product/API gaps stay unavailable in the UI: price proposals lack an approved source for `ruleVersion`; admin decision actions lack review queue/read-by-id context; inventory, QC queue, submission, publication, and restriction routes are not in the registered backend API. This code handoff does not claim live API/security verification or W2 activation-gate completion.
