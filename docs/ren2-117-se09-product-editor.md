# REN2-117 · SE-09 Product Editor prototype layout conversion

**Approved source:** 17 Nov 2026 `SCREENS.md` / `js/screens-brand-product.js` / `d1280_SE-09.png` / `m390_SE-09.png`.

## Implemented
- Existing real W2 brand/product API, category-pinned draft edit, SKUs, media, proposals, verified evidence and revision submission remain the authority.
- Adds the prototype's safe distinction between draft edits vs live revision, plus a six-step accessible navigation to Details, Sizes & colours, Photos, Prices, Claims & evidence and Review & submit.
- Reorders submission/readiness controls to the final step. This moves *presentation*, not any review, maker-checker, pricing or inventory server logic.
- Step completion cues derive from *real API-backed* server data: validated draft fields, SKU existence, clean media, approved prices, verified claims. The navigation does not claim that a draft was published.
- Layout responsive across laptop/mobile with visible focus and reduced-motion-friendly static link navigation.

## Critical API constraints retained
- Draft vs published revision, If-Match concurrency, idempotency, price values in paise and approved window, rights-scanned media and independent QC remain unchanged.
- The new design's complete save/review journey can only be accepted with authorized live NestJS E2E and backend G07/G17 checks.
- MFA-related price/media prompts are separately governed under REN2-116 and are not disabled here.
- No literal product descriptions, price amounts, SKU details or claim statuses from fictitious prototype records.

**Still pending:** actual human reference screenshot diff at 1280/390, all backend interactions, remaining 40-screen coverage, legal/finance/API gaps. Draft PR is **not a full REN2-117 completion claim**.
