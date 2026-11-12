# REN2-25 Accessible Auth Experience Implementation Plan

> **For agentic workers:** Execute this plan natively, one task at a time. No Figma file is available or required for this code-based provision.

**Goal:** Make the existing Next.js sign-in, registration, OTP, recovery, and session journeys usable and accessible with the existing typed backend API.

**Architecture:** Retain the current same-origin BFF and backend-owned authorization. Improve the shared auth form components with field-level accessible feedback, focus movement at flow transitions, resend/recovery controls, and responsive visual states.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Node test runner with `tsx`.

**Spec:** Linear REN2-25 acceptance criteria and Engineering OS W1 auth journey requirements, with the owner's direction to use the code-based design provision while Figma is unavailable.

## Global Constraints

- Never make UI state an authorization boundary or expose session/CSRF secrets to browser storage.
- Use only generated typed auth API functions and same-origin BFF routes.
- Keep account-enumeration-safe messaging and avoid logging PII or one-time codes.
- Test loading, success, invalid, denied, expired, and unavailable states at narrow widths.

## Review Focus

- Keyboard users move to the next step and hear status/errors after forms change.
- Invalid OTP/password errors are attached to their fields and announced.
- Mobile widths do not overflow and focus indicators remain visible.
- Session timeout and API failure keep a safe recovery path.
- Reduced-motion preference disables decorative transitions.

---

### Task 1: Accessible form-flow behavior

**Files:** `src/features/identity/auth-forms.tsx`, `auth.module.css`, focused tests under `tests/`.

- [ ] Add failing tests for challenge/status copy, focus behavior, error announcements, and form policy.
- [ ] Implement accessible labels, descriptions, invalid state, and focus handoffs across OTP/recovery/session transitions.
- [ ] Add usable resend/retry and change-email paths that preserve generic eligibility messaging.

### Task 2: Responsive and journey verification

**Files:** `tests/auth-design.test.ts`, new route/proxy journey tests, `src/features/identity/README.md`.

- [ ] Cover accessible theme contrast and route integration states.
- [ ] Run lint, typecheck, test, and production build.
- [ ] Record that code implementation is a provisional Figma substitute; open design review remains a separate human decision.
