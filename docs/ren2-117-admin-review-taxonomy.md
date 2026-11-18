# REN2-117 · Admin review and taxonomy prototype conversion

Reference: approved `w1-w2-ideal-prototype-2026-11-17.zip`, `SCREENS.md`, `d1280_AD-08A/B.png`, `m390_AD-08A/B.png`, `d1280_AD-07.png`, `m390_AD-07.png`, `d1280_AD-04.png`.

- **AD-08A**: converts oversized old hero/card queue to compact queue-specific heading, review-type chips, vertically stacked review rows and real backend item actions.
- **AD-08B**: uses a responsive split panel for the exact persisted item, evidence snapshots and available decision actions; the previous API-backed revision/maker-checker/CSRF/MFA checks remain unchanged.
- **AD-07**: source-like taxonomy panel, category selection, schema proposal and desktop-first mobile guidance; existing category read/save/preview/submit/activate calls remain unchanged.
- **AD-04**: application review scope warning clarifies unavailable W2 business/evidence APIs; W1 decision backend, independent checker and security checks unchanged.

No fictional review counts, product titles, price/claim data or approval receipts are copied from the prototype. The interface cannot approve a new API endpoint or enable MFA bypass by itself.

**Acceptance requirements:** run lint/typecheck/unit/build, browser verification at 1280px/390px, authenticated reviewer E2E positive+negative (own-submission, expiry, version conflicts, MFA enforced/deferred), role/global permission checks, owner signoff. These are not satisfied solely by a green screenshot CI.

Parent: https://linear.app/renivet/issue/REN2-117.
