# Account route group

- `/sign-in`: email/password session creation.
- `/register`: email/password registration followed by email verification.
- `/recover`: email password-recovery challenge and password reset.
- `/account`: backend session inspection and CSRF-protected logout.

These routes share the accessible responsive shell in `src/features/identity`. A route group and client-side state do not authorize access to protected business data; each protected backend operation must enforce its own session and permission checks. `/account` is a session-flow demonstration only.
