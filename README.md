# Renivet Frontend

**Phase 0 · fresh platform · proposed / In Review**

Next.js 15 / React 19 / TypeScript / Tailwind CSS foundation for the new Renivet platform.
This repository contains **no migrated legacy code** and **no live commerce functionality**.

## Run locally

Requirements: Node.js 22 or newer and npm.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. Backend API base defaults to http://localhost:4000/api/v1.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Important gates

GitHub Actions is a bootstrap workflow; a committed, reviewed `package-lock.json`
and `npm ci` are required before release acceptance. No infrastructure is deployed.
Business-dependent functionality stays gated by REN-GOV-001 and D01–D06 decisions.
See `docs/phase0.md` for security boundaries.
