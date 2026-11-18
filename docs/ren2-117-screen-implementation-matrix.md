# REN2-117 · W1/W2 Prototype implementation matrix

**Status:** First reviewable visual/API slice. **Do not mark the 40-screen programme complete.**

## Design source

The approved `w1-w2-ideal-prototype-2026-11-17.zip` (17 Nov 2026) is the visual reference. Primary files for this slice:

- `HANDOFF.md`, `DESIGN-SYSTEM.md`, `SCREENS.md`
- `js/screens-customer.js` — CU-08, CU-09B presentation and interaction behavior
- `js/experience.js` — Ajrakh motif
- `css/base.css` and `css/experience.css` — tokens, layout and mobile rules
- `screenshots/d1280_CU-08.png` and `screenshots/m390_CU-08.png`
- `screenshots/d1280_CU-09B.png` and `screenshots/m390_CU-09B.png`

The dark review toolbar and simulated seed data **must not** be copied into production code.

## Scope and live integration

| Prototype screen | Existing Next.js route | Actual integration | PR status |
|---|---|---|---|
| CU-08 — shopper sign-in | `/sign-in` | Existing `createPasswordSession`, `requestPhoneLoginChallenge` | New responsive shell, matching pattern and form presentation |
| CU-09B — mobile code entry | `/sign-in` challenge state | Existing `verifyPhoneLogin`, one accessible `OtpInput` | New layout and no sign-in method switch during challenge |
| SE-09 — seller product editor | Existing brand workspace | Actual NestJS catalogue/variant/media APIs | Deferred to next visual/API slice |
| AD-08B — QC review | Existing admin operations | Real NestJS permissions and review APIs | Deferred to next visual/API slice |
| Remaining W1/W2 screens | Screen inventory and wave map required | Classify live/missing/pending contract | Not included in this PR |
| W3 shopper-context screens | Future approved wave | No fake cart, checkout or payment | Design reference only |

**Non-MFA security invariants remain enforced:** session/CSRF/Origin, server-side permissions, brand isolation, real API errors. This PR does not implement or modify MFA policy; follow REN2-116 separately.

## Visual and functional limitations / required follow-ups

1. The prototype uses one phone-number sign-in/sign-up flow. The existing backend `phone_login` contract is retained here. Confirm whether *new-number auto-registration* is actually enabled before claiming exact behavior parity; never fake a successful account.
2. The approved prototype also proposes **email one-time-code login**, but the current `SignInForm` supports email + password. That missing option needs a backend contract audit before implementation. Do not route it through an unrelated email-verification purpose.
3. The current version preserves the real email/password, phone OTP, server-derived role redirect and secure return-target logic instead of copying the prototype's demo behaviors.
4. This PR reproduces the Ajrakh pattern as an inline accessible-decorative SVG and matches the CU-08 desktop art + form layout, responsive phone stack and accent tokens. Independent 1280/390px screenshots and exact pixel-diff validation are **still required** before final visual signoff.
5. The prototype shows legal/help footer links; do not add routes without checking that the target policy content exists. Privacy and back-to-shopping are retained as known links.
6. This is an implementation PR, not a production rollout or a replacement of every auth/seller/admin route. Keep unchanged legacy pages operational until their screens pass their own visual/API acceptance.

## Verification checklist

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass in CI.
- [ ] Capture live Next.js screenshots at **1280px and 390px** alongside both approved CU-08 screenshots (crop off the prototype toolbar).
- [ ] Open the phone sign-in and obtain a real OTP challenge; check the single-input code cells and no fake success state.
- [ ] Verify invalid phone, 429 rate limit, expired/incorrect OTP, and backend unavailable states.
- [ ] Test email/password login, return-target routing, role destination, and no forced development MFA.
- [ ] Verify screen readers, keyboard, focus, mobile overflow and reduced motion.
- [ ] Confirm no changes to AD-01 sign-in or unrelated account/seller screens.
- [ ] Record screenshot diffs and resolved issues before merging; user approval required.

See [REN2-117](https://linear.app/renivet/issue/REN2-117) for the complete cross-wave task.
