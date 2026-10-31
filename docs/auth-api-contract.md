# Frontend authentication API contract snapshot

The NestJS backend is authoritative for authentication routes and behavior. `openapi/renivet-backend.openapi.json` is a consumer snapshot copied from `renivet-backend` `main` at commit `6a85d53` (2026-10-30). It is version-controlled here so frontend type generation and pull request checks are reproducible; changes to it must be taken from a reviewed backend OpenAPI update, never edited to make frontend code compile.

Run `npm run api:types` to regenerate `src/generated/renivet-api.d.ts` with pinned `openapi-typescript` 7.13.0. CI regenerates and checks for drift.

The snapshot includes the implemented registration, password session, session inspection/logout, email/phone verification challenge, password-recovery challenge and MFA operations. This frontend slice uses only registration, password sessions, session inspection/logout and email verification/password recovery. It does not assume an OTP-to-session operation, phone delivery provider, or any future membership route.

`BACKEND_INTERNAL_URL` is server-only and should point to the NestJS `/api/v1` base. `NEXT_PUBLIC_API_BASE_URL` is an existing browser-safe fallback; authentication requests are still routed through same-origin Next.js handlers. Neither setting carries credentials.
