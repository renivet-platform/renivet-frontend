# Identity experience

REN2-25 delivers the code-based first-party account screens at `/sign-in`, `/register`, `/recover`, and `/account`. The visual and interaction design is documented in [the implementation design](../../../docs/superpowers/specs/2026-10-30-ren2-25-auth-design.md). Per the project owner's direction, this Next.js implementation is the temporary design handoff while Figma is unavailable; it is not a Figma artifact or a substitute for recording required human review decisions.

The UI calls only generated OpenAPI-typed client functions in `auth-api.ts`. Browser requests go through the fixed same-origin Next.js route handlers in `src/app/api/auth`; server-side proxying calls the NestJS API configured by `BACKEND_INTERNAL_URL`. The backend owns credentials, OTP attempts, sessions, CSRF validation and authorization. This UI is not an authorization boundary.

Registration uses email/password, then requests an email-verification challenge. Recovery uses email and a one-time code to replace the password. Codes are entered as a single pasteable six-digit input; the next step receives keyboard focus, and field errors are announced and associated with their controls. Resend is supported within backend rate limits. Email delivery requires complete backend SMTP configuration; phone verification uses the backend Fast2SMS DLT adapter. Social sign-in and OTP-based login are not implemented. Live email/SMS delivery remains unverified until the respective provider credentials and an authorized test destination are configured.

The session page fetches the backend-validated minimal identity and keeps the CSRF token only in component memory for logout. It does not read, store or expose the HttpOnly session cookie. The cookie is forwarded by the BFF and remains managed by the browser.

OpenAPI source snapshot: `openapi/renivet-backend.openapi.json` (backend `main` commit `963f90a`). Regenerate types with `npm run api:types`; CI should reject generated-type drift.

## Provisional W1 design review preview

`/design/onboarding` is a code-based review provision for REN2-10 while the requested Figma artifact is unavailable. It maps CU-08/CU-09, SE-20 and AD-01/AD-06 into ten screen steps, with preview-only navigation and selectable ready, loading, validation, denial, expiry, throttling, service-failure and success-preview states. Fields are read-only. Buttons only change the displayed preview screen; they do not submit data or call authentication APIs.

This prototype is not a production auth or authorization flow and does not replace the versioned editable Figma journeys, clickable Figma prototype, or required Product/Design/Security/Frontend and Accessibility decisions. REN2-10's Figma and formal approval acceptance criteria remain open. Reviewers should check generic account-safe errors, screen/state mapping, keyboard operation, contrast and responsive behavior before any acceptance decision.

The prototype suite checks its specified foreground/background contrast pairs. Manual keyboard-only, screen-reader and narrow-viewport review has not yet been recorded; those checks remain part of the outstanding accessibility and design review.
# Phone contact verification (REN2-39)

Signed-in users can add an Indian mobile number from the account page. The browser sends the contact only to the same-origin `/api/auth/phone` BFF, which enforces same-origin request metadata and forwards the HttpOnly session cookie plus session-bound CSRF proof to NestJS. The backend attaches the number as unverified; the browser then requests a `phone_verification` challenge and submits the six-digit code to the existing verification endpoint.

The phone and OTP remain in page memory only. Do not place either in URLs, browser storage, logs, Postman examples, or frontend configuration. Verification confirms contact ownership only and does not sign the user in using a phone number. Fast2SMS credentials and delivery stay in the backend.
