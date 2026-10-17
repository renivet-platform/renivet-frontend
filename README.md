# Renivet Frontend — Phase 0.4

Next.js / TypeScript / Tailwind foundation for **new** Renivet platform. No legacy migration and no commerce UI is enabled.

## Local development (Windows)

Follow `renivet-engineering-os/dev/README.md`. On the checked-out `phase0/foundation` branch:

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:3000/. Backend connectivity: http://127.0.0.1:3000/api/health.

## Code organization

Read `docs/architecture.md` before adding a route, shared component or feature.
Root home page lives in `src/app/(storefront)/page.tsx`. The other route groups are *reserved*, not functional or secured just by being groups. Shared component and config boundaries are exercised on the bootstrap page.

CI: lint, typecheck, unit tests and Next build. Dependency lockfile/npm ci and GitHub branch enforcement remain open gates. D01–D06 are still in review.
