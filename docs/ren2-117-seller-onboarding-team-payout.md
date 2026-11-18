# REN2-117 · Seller onboarding and access implementation

Visual reference: `w1-w2-ideal-prototype-2026-11-17.zip`, including `SCREENS.md`, `DESIGN-SYSTEM.md` and desktop/mobile screenshots for SE-01/02/06/18/20A/20C.

| ID | Existing route | Result | API authority |
| --- | --- | --- | --- |
| SE-20A | `/brands` | Authorized brands retained; Invitations section makes missing invite API explicit | W1 current session + approved brand grants |
| SE-01 | `/brands/join` | Curated-seller eligibility and application entry; clearly marked preview | Seller application API **missing** |
| SE-02 | `/brands/join/application` | Five-stage business/brand/doc/bank/review form, no false save/submit, explicit privacy warning | Seller draft/document submission API **missing** |
| SE-06 | `/brands/:id/onboarding` | Live W1 brand status with document/correction placeholders and setup checklist; unknown is never approved | W1 brand access; W2 evidence API **missing** |
| SE-20C | `/brands/:id/team` | Real backend team rows + role panel; invitation button disabled until signed API | W1 grants/roles read, invite/revoke/change **missing** |
| SE-18 | `/brands/:id/payouts` | Replaced generic gate with secure two-column payout account design, finance rules and unverified/unavailable details | Payout bank read/change/approval **missing** |

## No simulated financial, permission or identity decisions

The prototype ZIP is fictional. Actual GST/PAN/brand identity, document acceptance, bank verification, member invitations and reviewer corrections cannot be invented from design seed data. This PR makes the screens useful for a design review but **does not claim end-to-end API completion** on these missing contracts.

Backend implementation requires approved security/finance/legal contract covering onboarding draft/create/submit, private evidence, independent review, bank change/payout pause, role invitation & revocation, event auditing and permission checks. No new backend endpoints or database migrations were created in this frontend-only slice.

**QA pending:** CI build+tests, source screenshot comparison (1280px/390px), real backend brand A/B negative authorization, accessibility, legal review, staged rollout and owner approval. Do not merge/deploy without review.

Parent: [REN2-117](https://linear.app/renivet/issue/REN2-117).
