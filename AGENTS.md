# Renivet frontend — Codex / engineering agent rules

**Repository:** Next.js 16, React 19, TypeScript storefront, brand and admin UI. Read `README.md`, `docs/architecture.md`, existing route groups, approved UX flows and generated API types before editing.

**W2 client discipline:** Do not replace backend authorization with UI-only checks. Use the approved backend/API contracts; no invented checkout, sustainability, seller permissions or inventory logic. Test loading, empty, validation, denied, retry and accessible responsive states. W2 v1.5 requirements and execution protocol are controlled by Renivet Engineering OS.

## Non-negotiable task-to-PR workflow

**The project owner alone reviews, approves and merges PRs. Codex NEVER merges, self-approves, enables auto-merge or pushes directly to `main`.** This is a permanent repo policy, not just a chat preference.

For **every explicitly authorized task**, including docs:
1. Read the live Linear issue, dependencies, acceptance tests and the approved project rules. **One issue at a time; do not start another issue automatically.**
2. Inspect `git status`; do not discard uncommitted changes. Run `git fetch origin`. Create a **fresh issue-named branch from updated `origin/main`**, never from a previous feature branch. If the branch already exists, inspect and choose a unique task branch rather than overwriting it.
3. Implement only the approved scope. Test, conduct adversarial code QA, fix issues and run the required repository checks. Report `PASS`, `FAIL` or `NOT EXECUTED` with evidence; green lint alone is not acceptance.
4. Stage only reviewed files; commit with the Linear ID, push the task branch, and **open a PR against `main`**. Include user story, scope, data/API impact, abuse and failure tests, actual results, CI status, known gaps and relevant release gates.
5. **STOP and share the PR URL and review summary with the owner. Do not merge or begin the next task.** On owner-requested corrections, update the same branch/PR, rerun tests, and stop again.
6. For the **next explicitly authorized** task, verify all required predecessor PRs are actually merged, fetch again, and branch from the newly updated `origin/main`. Independent parallel work requires explicit owner approval; multiple affected repos each need separate branches and PRs.

Never bypass CI, security gates or branch protection. Do not deploy, change secrets, mutate existing shared/local Docker data or apply migrations to data-bearing databases without separate explicit approval. A PR is a review handoff, not authorization to merge or release.

Full cross-repo protocol: [Renivet Engineering OS — W2 Codex task execution](https://github.com/renivet-platform/renivet-engineering-os/blob/main/docs/05-delivery/W2-codex-task-execution-protocol.md) (pending Engineering OS PR merger until published on `main`). Always follow this repo's stricter local policy if applicable.

## Repository-specific verification

Use the current `package.json` scripts; typical baseline:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Add route/component/integration checks relevant to the issue. Verify generated API compatibility with the backend contract. Do not treat a mock API or static screen as evidence that a backend feature is implemented.
