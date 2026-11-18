# REN2-117 · Privacy and data-request UI implementation (CU-21A, CU-21B)

Approved visual source: `w1-w2-ideal-prototype-2026-11-17.zip`, `SCREENS.md` and screenshots `d1280_CU-21A.png`, `d1280_CU-21B.png`, `m390_CU-21A.png`, `m390_CU-21B.png`.

Both routes are now source-structured customer account screens rather than generic full-screen gates. Account sidebar, familiar header, essential/optional updates, consent receipt section, and request-history table are present.

| Screen | App route | Status | Backend dependency |
| --- | --- | --- | --- |
| CU-21A | `/privacy` | Designed layout with no fake consent | **Missing approved consent/preferences API + legally reviewed notice** |
| CU-21B | `/privacy/requests` | Designed layout with no fake request history | **Missing identity re-verification, request creation/list/status, retention/legal hold contracts** |

**Hard safety rule:** No marketing preference is preselected, no checkbox can save before real backend availability, no consent date/version is fabricated, no request history claims to be empty, no export/deletion request is claimed submitted.

**Acceptance still pending:** Implement/approve legal contracts + API endpoints in NestJS; generated SDK; role/ID scope; audits; DPDP/retention validation; test with real data and browser visual diff. Those are separate backend work and not delivered by this UI-only PR. `REN2-117` stays open.

Browser CI adds 1280px and 390px screenshots, screen ID/title assertions, overflow checks and verification that unsupported preferences remain disabled.

No production rollout or merge is implied.
