# Renivet Frontend — Phase 0.4

Next.js / TypeScript / Tailwind foundation for **new** Renivet platform. No legacy migration and no commerce UI is enabled.

## Local development (Windows)

Follow `renivet-engineering-os/dev/README.md`. On the checked-out `phase0/foundation` branch:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3000/. Backend connectivity: http://127.0.0.1:3000/api/health.

## Code organization

Read `docs/architecture.md` before adding a route, shared component or feature.
Root home page lives in `src/app/(storefront)/page.tsx`. The other route groups are *reserved*, not functional or secured just by being groups. Shared component and config boundaries are exercised on the bootstrap page.

CI: locked dependency installation with `npm ci`, lint, typecheck, unit tests and Next build. GitHub branch enforcement remains an open gate. D01–D06 are still in review.

## GitHub repository security (Phase 0.5)

This branch contains a read-only GitHub Actions repository-security verifier and a staged weekly Dependabot configuration. The verifier checks immutable Action references, workflow token permissions, dangerous triggers and suspicious tracked credential filenames. Dependabot is not active until the configuration reaches the default `main` branch through a separately approved merge. Org 2FA, backup owner, team access, private-repository branch rules and security-feature toggles still require GitHub-owner verification. This does not change runtime functionality or authorize a `main` merge.
