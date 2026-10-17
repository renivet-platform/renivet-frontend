# Renivet Frontend — local Phase 0.3

Fresh Next.js 15 / React 19 / TypeScript / Tailwind foundation. No old Renivet code imported.

**Windows start:** Use `renivet-engineering-os/dev/scripts/setup-windows.ps1` to clone/install the three apps, then `start-deps.ps1` and `start-apps.ps1` from the Engineering OS repository.

For manual startup after dependencies are installed:

```powershell
npm run dev
```

- UI: http://127.0.0.1:3000/
- Live server-side API bridge: http://127.0.0.1:3000/api/health (HTTP 503 when backend is down)
- Backend: http://127.0.0.1:4000/api/v1/health

The bridge uses ignored local `.env.local` and the server-only `BACKEND_INTERNAL_URL` variable. It is an **API connectivity test only**, not customer authentication, domain authorization or a production readiness probe.

CI runs lint/typecheck/tests/build. A reviewed package lockfile and deterministic `npm ci` remain an open release hardening gate. No production deployments or unapproved checkout/payment features are provided.
