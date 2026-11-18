# REN2-117 · W1 account/recovery design conversion (slice 2)

**Design source:** uploaded `w1-w2-ideal-prototype-2026-11-17.zip`, particularly `SCREENS.md`, `HANDOFF.md`, `js/screens-customer.js`, `css/experience.css`, `css/components.css`, `screenshots/d1280_CU-09*.png`, `screenshots/m390_CU-09*.png`, `d1280_AD-01.png` and `m390_AD-01.png`.

This is a **visual conversion and reuse of already integrated W1 authentication flows**, not the complete 40-route redesign. The prototype is a no-backend demo; its simulated consent, session lists, account-creation messages and privacy responses are **not** used.

| Screen ID | Existing Next.js route | In this slice | Real backend/API authority |
| --- | --- | --- | --- |
| CU-09A | `/register` | Email-first compact account form; phone remains selectable | Existing email registration + OTP / phone registration adapters |
| CU-09B | Registration OTP substate | Compact six-cell visual shell | Existing purpose-bound OTP verification APIs |
| CU-09C | `/recover` | Compact recovery presentation | Existing email recovery request and verification APIs |
| CU-09D | `/reset-password` | Compact reset/recovery presentation | Existing recovery workflow; screen split remains pending API/state review |
| CU-09W | `/welcome` | Compact continuation shell | Existing account navigation only; consent contract **not built** |
| CU-09E | `/account` | Desktop/mobile account sidebar and cards | Existing `GET /auth/session`, phone verification, `DELETE /auth/session` |
| AD-01 | `/operations/sign-in` → `/sign-in?next=/operations` | Staff-specific compact presentation, email/password first, no public registration CTA | Existing real `POST /auth/sessions` and server-resolved role destination |

## Behavioral security constraints

- W1 backend session remains the source of truth. No local fake user, admin, consent receipt, session activity, or invented API.
- Existing OTP, recovery, password login, CSRF, secure HttpOnly cookies, safe redirects and role authorization must continue to pass their E2E tests.
- Staff's default sign-in method is email/password; a brand account does **not** become a platform admin simply by visiting the staff screen.
- Keep `REN2-116` development-only MFA deferral separate from this visual PR. Do not remove MFA services or disable production checks.
- Keep privacy/legal content explicitly dependent on owner approval, and record false promises as defects.

## Known deviations / future work

1. Prototype registration proposes a 15-character passphrase and explicit consent; existing backend auth policy and consent contract take precedence. Do not implement a fake consent checkbox or silently alter auth rules.
2. Prototype proposes session/device list + revoke-other-device APIs and a consent record; those contracts are pending, so CU-09E shows only real data/actions.
3. `/welcome` is a real continuation route, not an implemented phone-account-creation or consent-record API; do not claim new functionality.
4. `/reset-password` currently shares the existing recovery workflow. A separate code-verified reset-screen contract/transition still needs backend and flow QA.
5. Component layout and screenshot candidates follow the approved source. Pixel-by-pixel comparison, usability testing, legal signoff and live provider tests are separate acceptance gates.
6. The remaining W2 brand onboarding/catalogue/import/inventory/admin screens must be converted in reviewable API-backed batches, with missing contracts tracked rather than mocked.

## Verification

- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Run `node tests/auth-screen.e2e.mjs` in the CI visual job to exercise real frontend logic against controlled API responses.
- The visual job captures **five additional W1 screens at both desktop 1280px and mobile 390px**, with an assertion for the screen identifier, expected heading, no overflow and successful screenshot.
- Review the artifacts and compare against the supplied d1280/m390 references after excluding the prototype review toolbar.
- Do not merge without owner approval or treat these visual adaptations as proof of backend service readiness.

[REN2-117](https://linear.app/renivet/issue/REN2-117) · [Slice 1 PR #64](https://github.com/renivet-platform/renivet-frontend/pull/64).
