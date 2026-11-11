# REN2-100 provisional operations surface

## Owner-approved approach

For this implementation pass, show admin review work as unavailable when the UI cannot load the exact review record and evidence. Do not simulate approvals, publish/restrict actions, or widen the BFF allowlist to expose uncontextualized mutations.

## Current UI

The code-first W2 preview includes an Operations section that says the review queue and read-by-id evidence context are unavailable. QC, publication, and restriction routes are not registered. Some taxonomy, price, and claim decision routes exist, but the current backend does not provide the queue/context needed for a safe review screen.

## Acceptance boundary

This implements the provisional gated state only. QC snapshots, maker-checker review, price decision windows, claim evidence/expiry review, and exact-revision publish/restrict actions remain open until the API context and owner-approved permission mapping exist and pass G07/G08/G14/G17 evidence.