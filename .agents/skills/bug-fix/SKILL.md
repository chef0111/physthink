---
name: bug-fix
description: "Meta-orchestrator for debugging and fixing. Analyzes bugs/errors and auto-selects the best combination of skills from .github/skills/ to diagnose and resolve. Use when encountering bugs, errors, test failures, performance issues, broken UI, or any code that isn't working as expected."
argument-hint: "Bug description, e.g. 'login form throws 500 on submit' or 'dashboard chart not rendering'"
---

# Fix — Debug Orchestrator

Analyze the bug/error, select the optimal skill combination, then systematically fix.

## Skill Catalog

### Core Debugging
| Skill | Triggers |
|-------|----------|
| `debugging` | Any bug — systematic root cause analysis, defense-in-depth, verification |
| `problem-solving` | Stuck, no obvious cause, need creative approaches |
| `sequential-thinking` | Complex multi-system issue, unclear reproduction steps |
| `code-review` | Fix review, regression check, pre-merge validation |

### Domain Diagnosis
| Skill | Triggers |
|-------|----------|
| `web-testing` | Test failures, writing regression tests, E2E/unit/integration |
| `web-frameworks` | Next.js routing, RSC hydration, SSR/SSG issues, build errors |
| `backend-development` | API errors, auth failures, DB connection, security vulns |
| `databases` | Query errors, migration failures, index performance |
| `ui-styling` | Layout broken, dark mode issues, component styling bugs |
| `shadcn` | Component rendering issues, missing variants, registry errors |
| `better-auth` | Auth flow failures, session issues, OAuth errors |
| `physthink-feature` | PhysThink-specific architecture issues, oRPC errors, DAL bugs |

### Support
| Skill | Triggers |
|-------|----------|
| `docs-seeker` | Unclear API behavior, need to verify expected behavior |
| `context-engineering` | Agent context issues, token overflow, memory problems |
| `repomix` | Need full codebase view for cross-cutting bugs |

## Procedure

### 1. Classify the Bug
- **What fails?** (error message, unexpected behavior, crash, performance)
- **Where?** (frontend, backend, database, build, deploy, tests)
- **Reproducible?** (always, intermittent, environment-specific)

### 2. Select Skills
Match the bug against the catalog. Select **1–3 skills** — minimum needed.

**Always start with `debugging`** — it provides the systematic framework. Then add domain skills:
- UI broken → + `ui-styling` or `shadcn`
- API error → + `backend-development` or `physthink-feature`
- Test failure → + `web-testing`
- Auth issue → + `better-auth`
- DB error → + `databases`
- Totally stuck → + `problem-solving`
- Complex/unclear → + `sequential-thinking`

### 3. Execute in Order
1. **`debugging`** — Root cause investigation first. NO fixes without diagnosis.
2. **Domain skill** — Apply domain-specific knowledge to the identified root cause.
3. **`web-testing`** — Write regression test if applicable.
4. **`code-review`** — Verify fix doesn't introduce new issues.

### 4. Load & Follow
For each selected skill, read its `SKILL.md` from `.github/skills/<name>/SKILL.md` and follow its procedure. The `debugging` skill has sub-skills — dispatch to the right one:
- Test failure / unexpected behavior → `systematic-debugging/`
- Error in wrong location → `root-cause-tracing/`
- Recurring bug → `defense-in-depth/`
- Claiming fix is done → `verification-before-completion/`

## Example Dispatch

| Bug | Skills Selected |
|-----|----------------|
| "500 on form submit" | debugging → backend-development → web-testing |
| "Chart not rendering" | debugging → ui-styling |
| "Login redirect loop" | debugging → better-auth |
| "Prisma migration fails" | debugging → databases |
| "Hydration mismatch" | debugging → web-frameworks |
| "Tests passing locally, failing in CI" | debugging → web-testing → problem-solving |
| "Can't figure out why X breaks" | debugging → problem-solving → sequential-thinking |
