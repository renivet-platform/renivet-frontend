# REN2-99 provisional inventory surface

## Owner-approved approach

For this implementation pass, show inventory as gated until the approved backend API and security/runtime evidence exist. Do not display sample balances as if they were real, calculate available-to-sell stock in the browser, or activate dormant inventory routes.

## Current UI

The code-first W2 preview includes an Inventory section that says the feature is unavailable and explains that authoritative stock must come from the backend. The registered backend OpenAPI has no inventory endpoints for the required location, balance, observation, adjustment, count, or reconciliation workflows.

## Acceptance boundary

This safely implements the provisional unavailable state. It does **not** implement the live stock table, locations, observations, adjustments, cycle counts, reconciliation, freshness, or maker-checker interactions. Those remain open until route registration and the required G07/G08/G17 security and runtime evidence are approved and tested.