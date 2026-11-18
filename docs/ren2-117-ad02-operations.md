# REN2-117 · AD-02 Operations Home Visual Implementation

Source: approved 17 Nov `SCREENS.md`, `js/screens-admin-platform.js`, `d1280_AD-02.png` / `m390_AD-02.png`.

## Implemented
- Eight-card operations dashboard in the approved order: applications, bank, quality, claims, pricing, publishing, inventory exceptions, taxonomy.
- Six queue counts use existing `GET /admin/brand-application-reviews` / `GET /admin/reviews/:queue` APIs, role checking and protected BFF.
- Bank and inventory counts appear as **unavailable** (dash) because their API/activation contracts are not approved.
- Recent activity panel does not display the prototype's fictional staff names, dates or audit events. It directs authorized users to the audit-information route.
- Responsive 4-column desktop/2-column phone summaries, accessible links and honest error/loading/403 messages.

## Missing contracts and acceptance
Bank review, stock exception queue, authenticated audited recent event feed, staff access and privacy reviews remain backend-owned and pending separate review. No bank/stock/audit data or decisions can be fabricated to complete visual acceptance.

Pending real authenticated browser E2E, permission/brand isolation negatives, screenshot diff at 1280/390, and owner go/no-go. CI build and browser tests are not proof of owner signoff. Nothing is merged or deployed.
