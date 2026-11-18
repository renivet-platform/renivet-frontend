# REN2-117 · AD-03/AD-04 Brand Application UI

Source of visual truth: 17 November 2026 approved prototype, `SCREENS.md`, `d1280_AD-03.png`, `m390_AD-03.png`, `d1280_AD-04.png`, `m390_AD-04.png`.

**AD-03** (application list): source-like table (brand / submitted / documents / state / reviewer / action), ordered by persisted submission time, responsive phone cards, real links to each authorized application detail. **No fake W2 evidence:** W1 `brand-application-reviews` API does not provide four-document status or assigned reviewer; both are marked unavailable.

**AD-04** (review): existing live NestJS application status, independent checker, conditional MFA mode, CSRF, maker-checker, W1 decision handler and error states are unchanged. No fabricated KYC, documents, bank status or reviewer notes; evidence gap remains clearly disclosed in detail screen.

**Pending for end-to-end acceptance:** full W2 seller application/evidence/bank review contracts, version-pinned correction/request and reason model; security+permission tests; real reviewer role E2E; 1280/390 screenshot diff; approved MFA deferral; owner acceptance. This PR is UI alignment over existing W1 APIs and does not complete all REN2-117 routes. Do not merge until approved.
