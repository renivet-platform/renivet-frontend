# Phase 0 — frontend entry criteria

Status: PROPOSED / IN REVIEW. This repo is a new, standalone Next.js frontend.
It does not import code from Renivet's legacy repositories.

## Boundaries
- UI only: brand/catalogue presentation, future customer/seller/admin experiences.
- Financial, stock, identity and permission authority belongs to the NestJS backend.
- No direct browser connection to PostgreSQL, Redis, Razorpay secrets or AI models.
- NEXT_PUBLIC_* values are public; secrets are prohibited.

## Gate
1. Install dependencies and commit a reviewed package-lock.json.
2. Complete a clean lint/typecheck/test/build GitHub Actions run.
3. Obtain UI API contract review before implementing checkout or auth.
4. Configure branch rules and review ownership (not applied by this PR).
