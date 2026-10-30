# Identity experience

REN2-25 delivers the interim, Codex-authored first-party account screens at `/sign-in`, `/register`, `/recover`, and `/account`. The visual design is in [the implementation design](../../../docs/superpowers/specs/2026-10-30-ren2-25-auth-design.md). It remains subject to the owner-approved Figma revision when REN2-16/17 supply it.

The UI calls only generated OpenAPI-typed client functions in `auth-api.ts`. Browser requests go through the fixed same-origin Next.js route handlers in `src/app/api/auth`; server-side proxying calls the NestJS API configured by `BACKEND_INTERNAL_URL`. The backend owns credentials, OTP attempts, sessions, CSRF validation and authorization. This UI is not an authorization boundary.

Registration uses email/password, then requests an email-verification challenge. Recovery uses email and a one-time code to replace the password. Codes are entered as a single pasteable six-digit input. No phone OTP, SMS vendor, social sign-in, or OTP-based login is implemented. The current backend delivery port returns unavailable until an approved provider is configured, so successful delivery and live verification remain unverified.

The session page fetches the backend-validated minimal identity and keeps the CSRF token only in component memory for logout. It does not read, store or expose the HttpOnly session cookie. The cookie is forwarded by the BFF and remains managed by the browser.

OpenAPI source snapshot: `openapi/renivet-backend.openapi.json` (backend `main` commit `6a85d53`). Regenerate types with `npm run api:types`; CI should reject generated-type drift.
