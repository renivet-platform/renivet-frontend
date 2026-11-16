# REN2-119 — Prototype missing UI

## Goal

Add the missing, navigable W2 brand-workspace surfaces represented by the supplied UX prototype while preserving the existing live product, import, inventory, taxonomy, operations, and brand-approval flows.

## Scope

- Add an authenticated brand workspace landing screen for a selected brand.
- Add a brand onboarding/status screen that explains the persisted access state and links to the live workflows.
- Add a dedicated team and permissions screen backed by the existing redacted team API.
- Link the new screens from the existing product workspace without granting permissions in the browser.
- Keep empty, denied, loading, and service-unavailable states explicit; do not invent records.
- Keep all mutations and authorization in the backend.

## Non-goals

- No new backend authorization or inventory authority.
- No fake seed records or simulated success.
- No replacement of existing imported product/import/admin screens.
