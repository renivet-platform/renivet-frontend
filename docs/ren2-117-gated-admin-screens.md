# REN2-117 · Backend-gated administrative screen visual coverage

Approved 17 Nov prototype source: `SCREENS.md` + `d1280/m390_AD-05/06/09/19/20.png`.

| Screen | Existing route | Visual implementation | Required missing backend |
| --- | --- | --- | --- |
| AD-05 Bank verification | `/operations/bank` | Awaiting-bank queue, filters, evidence warning, decision form **disabled** | scoped masked bank record read; secure evidence; independent verify/reject/changes; payout hold; audit |
| AD-06 Staff & access | `/operations/staff` | Staff access queue, role-grant filters and explicit unavailability | global staff grants, invite, revoke, maker-checker, permission catalog |
| AD-09 Inventory exceptions | `/operations/exceptions` | Exception queue and source-of-truth investigation guidance | inventory exception read/resolve contract; owner-approved inventory release gates |
| AD-19 Privacy requests | `/operations/privacy` | privacy request table, filters and verification/retention steps | legal-approved list/verify/hold/complete and audited actions |
| AD-20 Audit log | `/operations/audit` | read-only audit history table, filter UI **disabled** | scoped immutable event read/pagination, permission filtering and export policy |

These are **design and truthful unavailable states**. The prototype archive contains made-up bank identifiers, reviewer names, privacy requests, stock exceptions and event timelines. No such values were copied into the application, and the UI does not call fabricated endpoints.

Security prerequisites: W1 global role guard, W2 brand isolation, two-person review, privacy/finance approvals, audited versioned API and negative-case tests. No production data or sensitive write can become enabled by merely clearing a frontend disabled attribute.

Screenshots and real server test evidence still required. Green frontend CI is not acceptance of backend service readiness.

Parent https://linear.app/renivet/issue/REN2-117.
