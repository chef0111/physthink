---
name: plan
description: Plan orchestrator that classifies coding tasks and dispatches the best skills in .agents/skills for features, refactors, bug fixes, tests, docs, and delivery.
argument-hint: "Task goal + constraints, e.g. 'add workspace sharing with tests' or 'refactor DAL and keep API stable'"
---

# Plan - Skill Router

Classify request, choose minimal skill set, and execute in phases.

## Route Categories

| Category            | Trigger patterns                                          | Primary skills                                                              |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| New feature         | add/create/build/implement/new flow/resource              | `cook`, `physthink-feature`, `frontend-development`, `backend-development`  |
| Refactor            | refactor/restructure/cleanup/tech debt/no behavior change | `frontend-development`, `backend-development`, `code-review`, `web-testing` |
| Bug fixing          | bug/error/failing/flaky/broken/regression                 | `bug-fix`, `debugging`, `web-testing`                                       |
| Testing             | add tests/coverage/e2e/unit/integration/perf              | `web-testing`, `code-review`                                                |
| UI/UX polish        | redesign/layout/style/accessibility/motion                | `frontend-design`, `ui-styling`, `aesthetic`, `shadcn`                      |
| Data/API work       | prisma/schema/migration/query/router/auth                 | `physthink-feature`, `databases`, `backend-development`, `better-auth`      |
| Research/docs first | unfamiliar lib/api/standard/architecture                  | `docs-seeker`, `sequential-thinking`                                        |

## Dispatch Rules

1. Detect intent from verbs and constraints.
2. Select `1-4` skills only; avoid over-selection.
3. Prefer existing orchestrators first:
   - Feature-heavy request -> start with `cook`.
   - Defect-focused request -> start with `bug-fix`.
4. Add specialist skills only for explicit scope (auth, db, UI, perf, 3D, payments).
5. If request is ambiguous, run `sequential-thinking` before implementation.
6. Before coding, present the short plan and wait for approval.

## Execution Phases

1. **Scope**
   - Extract outcome, constraints, non-goals, acceptance checks.
   - If missing success criteria, define measurable checks before coding.
2. **Plan**
   - Build a short step plan across layers (data -> API -> UI -> tests).
   - Identify risks and required migrations/config updates.
   - Request approval before starting implementation.
3. **Implement**
   - Execute selected skills in dependency order.
   - Keep edits minimal and consistent with local patterns.
4. **Verify**
   - Run targeted tests/lint/typecheck for changed areas.
   - If no tests exist, add at least one regression or happy-path test.
5. **Review**
   - Apply `code-review` mindset before claiming completion:
   - List defects/risks first, then summary.

## Skill Selection Matrix

| Need                                     | Add skill                                |
| ---------------------------------------- | ---------------------------------------- |
| Next.js App Router/RSC                   | `web-frameworks`                         |
| New Prisma model or oRPC chain           | `physthink-feature`                      |
| Auth/session/OAuth/RBAC                  | `better-auth`                            |
| Query/index/perf/migrations              | `databases`                              |
| Component composition/theming            | `shadcn`, `ui-styling`                   |
| Design direction and interaction quality | `frontend-design`, `aesthetic`           |
| CI/CD, deploy, containers                | `devops`                                 |
| Stuck or high uncertainty                | `problem-solving`, `sequential-thinking` |

## Completion Gate

Do not mark complete until all are true:

- Requested behavior works end-to-end.
- Relevant tests pass or explicit gap is documented.
- Potential regressions and risks are stated.
- Files changed and why are summarized concisely.

## Example Routes

| Request                               | Route                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------ |
| "Create course draft publishing flow" | `cook` -> `physthink-feature` -> `frontend-development` -> `web-testing` |
| "Refactor DAL without API break"      | `backend-development` -> `code-review` -> `web-testing`                  |
| "Fix login redirect loop"             | `bug-fix` -> `better-auth` -> `web-testing`                              |
| "Improve dashboard visual hierarchy"  | `frontend-design` -> `ui-styling` -> `aesthetic`                         |
| "Prisma query is slow"                | `bug-fix` -> `databases` -> `web-testing`                                |

## Load Rule

Read selected skill instructions using this path order:

- `.agents/skills/<skill>/SKILL.md`
- `~/.copilot/skills/<skill>/SKILL.md`
- `~/.claude/skills/<skill>/SKILL.md`

If the skill exists in multiple places, prefer workspace-local (`.agents`) version.
Load only additional references/scripts that are needed for the current step.
