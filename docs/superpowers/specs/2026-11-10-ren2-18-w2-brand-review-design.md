# REN2-18 W2 brand application and review preview

## Intent

Provide a temporary, inspectable Next.js design artifact for Product, Security and Admin Operations to discuss the future W2 brand application and evidence review. The approved direction is an in-code design provision while Figma is unavailable; it does not replace the required editable Figma prototype or formal signoff.

## Boundaries

- Design preview only. No form submission, upload, persistence, seller approval, reviewer action, or authorization is implemented.
- Use no real applicant, identity, bank, or application data.
- Treat unapproved application fields, evidence requirements, state transitions, rejection reasons, retention, and review timing as TBD.
- Keep access decisions server-owned. Current membership/scope, privileged MFA when required, and audit remain security boundaries, not UI-only controls.
- Keep REN2-18 marked W2 pre-design; this artifact does not block W1 database work.

## Screen and state coverage

| Audience | Source IDs | Preview states |
| --- | --- | --- |
| Applicant | SE-01..06 | Draft, validation issue, scan failure, expired evidence, neutral duplicate handling, submitted, under review, changes requested, approved, not approved, access paused |
| Reviewer | AD-03..05 | Review queue/empty queue, restricted evidence, potential beneficiary mismatch, reviewer conflict, MFA required, access denied, review unavailable |

The preview includes a permission and decision matrix with source/status labels, an inert action affordance, safe failure messaging, and privacy annotations. It explicitly keeps brand approval separate from bank evidence review as a TBD policy decision. Status and outcome screens are illustrations only.

## Design approach

The owner selected a responsive Next.js preview as a temporary review surface, with Figma to follow. This reuses the current frontend foundation and permits state review without presenting the proposal as an operational workflow. A standalone Figma artifact remains the authoritative final deliverable.

## Verification plan

- Unit checks assert screen coverage, explicit TBD rules, inert actions, and absence of live evidence data.
- Check palette contrast for core text and action colors.
- Run repository lint, typecheck, tests and production build.
- Review the route at desktop and narrow mobile widths for layout overflow.

## Acceptance status

- AC-01: **Not met** — no versioned editable Figma prototype yet.
- AC-02: **Provisionally represented** — the in-code state/permission matrix separates security boundaries from TBD decisions; Product confirmation is pending.
- AC-03: **Partially represented** — privacy/MFA/audit annotations are present; Product, Security and Admin Operations review evidence is pending.
- AC-04: **Met by this artifact** — route and copy identify W2 pre-design and do not change W1 schema or behavior.

Do not mark REN2-18 Done based on this code preview.
