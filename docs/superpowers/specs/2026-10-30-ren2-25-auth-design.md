# REN2-25 Interim Authentication UI Design

**State:** Codex-authored implementation design, requested by the project owner on 30 October 2026. This is a versioned code handoff, not a Figma file or independent Product/Design/Security sign-off. The missing Figma acceptance remains visible in the final traceability report.

## Intent

Give customers a coherent, accessible first-party authentication journey in the existing Next.js frontend, using only the authentication endpoints already implemented on backend `main` (OpenAPI snapshot source commit `6a85d53`). Keep NestJS authoritative for credentials, OTP, sessions, verification, recovery and revocation.

## Goals

- Provide responsive sign-in, email/password registration, email verification challenge, password recovery, authenticated session and logout screens.
- Use a same-origin Next.js BFF for backend calls. Forward the backend's host-only HttpOnly session cookie; never put session tokens in browser storage or JavaScript.
- Use generated TypeScript API types from the backend's versioned OpenAPI snapshot. Do not add or assume backend operations that are absent from the snapshot.
- Provide visible labels, keyboard access, focus indicators, associated validation errors, OTP paste/autofill, and announced async status/error messages.
- Reuse the current forest brand color (`#031400`) and use neutral surfaces; introduce implementation tokens only for the auth surface and verify text contrast in tests.

## Out of scope

- Phone OTP delivery/login until its provider subtask is completed; no provider is enabled by default.
- OTP-based login: the backend currently exposes challenge verification for email/phone verification and password recovery, but no OTP-to-session operation.
- Seller/brand selection, admin console, third-party login, enrollment policy UI, and any protected commerce data.
- New backend API routes, credentials, production configuration, or Figma publication.

## User flows

1. **Register:** email + 15–128 character passphrase → `POST /auth/register` → request `email_verification` challenge → enter six-digit code → `POST /auth/challenges/{id}/verify` → sign in.
2. **Sign in:** email + passphrase → `POST /auth/sessions` → backend sets `__Host-renivet_session` → same-origin account/session screen verifies `GET /auth/session`.
3. **Recover:** email → request `password_recovery` challenge → enter code and replacement passphrase → same verify operation atomically changes the password and revokes old sessions → sign in.
4. **Session expiry/logout:** session inspection 401 returns the user to sign-in with a safe status; logout calls `DELETE /auth/session` with exact same-origin metadata and the session-bound CSRF token, then returns to sign-in.

Unknown contacts, invalid credentials, invalid/expired/reused codes, limits, and service failures use safe, non-enumerating UI states. The UI never claims an OTP was delivered when the API reports a provider/infrastructure failure.

## Visual and interaction direction

- Use a quiet, single-column auth panel on a pale neutral page, white card, dark forest headings, strong forest primary buttons, readable secondary actions, and explicit textual status. Keep visual density low and prioritize forms.
- Use the existing system font stack and current brand token rather than introducing a font or a new brand palette.
- Desktop: centered panel with a restrained supporting introduction. Mobile: full-width card with comfortable padding, no horizontal overflow, and actions visible when the keyboard is open.
- OTP uses one labeled six-digit field with `inputMode="numeric"` and `autoComplete="one-time-code"`, preserving whole-code paste and screen-reader clarity.
- Password inputs allow managers and paste. Visibility control has a name/state. Passwords and OTPs are never logged, persisted to local/session storage, placed in URLs, or included in analytics.
- No successful/verified/authorized state appears until the relevant backend response succeeds.

## Approaches considered

1. **Browser calls directly to NestJS.** Fewer files, but it exposes cross-origin cookie/CSRF topology to the browser and makes the Secure host-only cookie flow harder to validate consistently.
2. **Next.js same-origin BFF with generated OpenAPI types (selected).** Keeps browser traffic same-origin, allows cookie forwarding and CSRF enforcement in one auditable boundary, and gives the UI compile-time contract types. Adds explicit BFF route handlers and a pinned contract snapshot.
3. **Mock-only UI with simulated success.** Fastest prototype, but it would misrepresent unimplemented provider/API behavior and fail real-flow acceptance; rejected.

## Constraints and risks

- Backend contract source is `renivet-backend/openapi/renivet.openapi.json` from commit `6a85d53`; BFF operations and DTOs must match it.
- The backend does not enable OTP delivery without a configured/approved provider. The UI must report actual unavailability; delivery cannot be end-to-end successful until an approved provider is configured.
- The backend's session cookie is `Secure`; local browser validation must use a loopback host accepted for secure cookies and an origin allowed in backend configuration.
- This repo has no actual Figma artifact. This design and implementation provide a traceable interim visual direction only; the issue's Figma-revision criterion will remain pending external review/artifact creation.
- Existing checkout has user changes in `tsconfig.json` and untracked `next-env.d.ts`; implementation is isolated in a new worktree and must not alter those files.

## Acceptance mapping

| REN2-25 criterion | Planned evidence |
| --- | --- |
| AC-01 approved design maps to mobile/desktop states | This interim design maps the implementation to the auth journeys and state variants. A real approved Figma revision remains pending and will not be fabricated. |
| AC-02 registration/login/verification/recovery/logout use stable typed endpoints | Generated types from the backend OpenAPI snapshot; BFF and browser-flow tests cover only existing route/DTOs. |
| AC-03 keyboard/screen-reader behavior, safe errors, timeout and CSRF negatives | Browser E2E checks for labels, keyboard focus, OTP entry, generic auth denial, expired session and rejected cross-origin/CSRF logout. |
| AC-04 no secrets in telemetry/logs; CI/contract/visual regression evidence | No auth telemetry; BFF error redaction; CI type/unit/E2E and desktop/mobile visual artifacts tied to this branch/PR. |
