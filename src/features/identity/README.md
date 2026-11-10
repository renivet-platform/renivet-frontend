# Identity experience

REN2-25 delivers the interim, Codex-authored first-party account screens at `/sign-in`, `/register`, `/recover`, and `/account`. The visual design is in [the implementation design](../../../docs/superpowers/specs/2026-10-30-ren2-25-auth-design.md). It remains subject to the owner-approved Figma revision when REN2-16/17 supply it.

The UI calls only generated OpenAPI-typed client functions in `auth-api.ts`. Browser requests go through the fixed same-origin Next.js route handlers in `src/app/api/auth`; server-side proxying calls the NestJS API configured by `BACKEND_INTERNAL_URL`. The backend owns credentials, OTP attempts, sessions, CSRF validation and authorization. This UI is not an authorization boundary.

Registration uses email/password, then requests an email-verification challenge. Recovery uses email and a one-time code to replace the password. Codes are entered as a single pasteable six-digit input. No phone OTP, SMS vendor, social sign-in, or OTP-based login is implemented. The current backend delivery port returns unavailable until an approved provider is configured, so successful delivery and live verification remain unverified.

The session page fetches the backend-validated minimal identity and keeps the CSRF token only in component memory for logout. It does not read, store or expose the HttpOnly session cookie. The cookie is forwarded by the BFF and remains managed by the browser.

OpenAPI source snapshot: `openapi/renivet-backend.openapi.json` (backend `main` commit `6a85d53`). Regenerate types with `npm run api:types`; CI should reject generated-type drift.

## Provisional W1 design review preview

`/design/onboarding` is a code-based review provision for REN2-10 while the requested Figma artifact is unavailable. It maps CU-08/CU-09, SE-20 and AD-01/AD-06 into ten screen steps, with preview-only navigation and selectable ready, loading, validation, denial, expiry, throttling, service-failure and success-preview states. Fields are read-only. Buttons only change the displayed preview screen; they do not submit data or call authentication APIs.

This prototype is not a production auth or authorization flow and does not replace the versioned editable Figma journeys, clickable Figma prototype, or required Product/Design/Security/Frontend and Accessibility decisions. REN2-10's Figma and formal approval acceptance criteria remain open. Reviewers should check generic account-safe errors, screen/state mapping, keyboard operation, contrast and responsive behavior before any acceptance decision.

The prototype suite checks its specified foreground/background contrast pairs. Manual keyboard-only, screen-reader and narrow-viewport review has not yet been recorded; those checks remain part of the outstanding accessibility and design review.
