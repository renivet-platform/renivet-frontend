# Admin UI

## Operations review preview

- `/operations` presents the W2 taxonomy, QC, pricing, claims, and publication review areas in a responsive, accessible console.
- The page is a non-sensitive UI preview. It does not load protected data and does not verify admin identity, so it is not an authorization boundary or a live operations tool.
- The current backend registers taxonomy draft/publish and price/claim decision mutations, but the frontend has no verified server-side admin-role guard and the API lacks the reviewer queues and safe read context needed to select a decision target. QC decision/queue and publication/restriction routes are not registered in the runtime OpenAPI.
- Decision controls are therefore unavailable. Do not enable them until a protected reviewer read API, role/MFA/CSRF integration, immutable revision/evidence context, maker-checker enforcement, and permission-denial tests are implemented.
- W2 runtime gates G07, G08, G14, and G17 remain open. This screen does not satisfy the real-API/security-evidence acceptance criteria for REN2-100.
