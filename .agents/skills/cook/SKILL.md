---
name: cook
description: 'Meta-orchestrator for feature implementation. Analyzes feature requests and auto-selects the best combination of skills from .github/skills/ to execute. Use when building new features, adding functionality, creating UI components, implementing APIs, or any constructive development task.'
argument-hint: "Feature description, e.g. 'add comment system with real-time updates' or 'build admin analytics dashboard'"
---

# Cook — Feature Orchestrator

Analyze user's feature request, select the optimal skill combination, then execute.

## Skill Catalog

### Core Implementation

| Skill                 | Triggers                                                             |
| --------------------- | -------------------------------------------------------------------- |
| `physthink-feature`   | New resource, CRUD, full-stack feature, Prisma model, oRPC procedure |
| `backend-development` | API design, auth, DB queries, microservices, security, CI/CD         |
| `databases`           | Schema design, queries, migrations, indexes, aggregation             |
| `better-auth`         | Login, signup, OAuth, 2FA, sessions, RBAC                            |
| `ai-elements`         | AI elements components built on top of shadcn                        |

### Frontend & UI

| Skill             | Triggers                                                       |
| ----------------- | -------------------------------------------------------------- |
| `frontend-design` | Page layout, component design, responsive UI                   |
| `ui-styling`      | Tailwind, shadcn/ui, dark mode, theming, accessible components |
| `shadcn`          | Adding/composing shadcn components, component search, registry |
| `web-frameworks`  | Next.js App Router, RSC, SSR, SSG, Turborepo, monorepo         |
| `aesthetic`       | Design principles, visual hierarchy, micro-interactions        |

### Specialized Domains

| Skill                 | Triggers                                       |
| --------------------- | ---------------------------------------------- |
| `threejs`             | 3D scenes, WebGL, animations, shaders          |
| `payment-integration` | Checkout, subscriptions, webhooks, QR payments |
| `shopify`             | Shopify apps, extensions, Liquid, Polaris      |
| `ai-multimodal`       | Audio/video/image processing, Gemini API       |
| `mcp-builder`         | Building MCP servers, tool integrations        |

### Support

| Skill                 | Triggers                                            |
| --------------------- | --------------------------------------------------- |
| `docs-seeker`         | Need latest docs, unfamiliar library/API            |
| `sequential-thinking` | Complex planning, unclear scope, multi-stage design |
| `code-review`         | Pre-merge review, quality validation                |

## Procedure

### 1. Analyze Request

- What is being built? (resource, page, API, component, integration)
- What layers are involved? (DB, backend, frontend, styling, 3rd-party)
- Any domain-specific needs? (3D, payments, auth, AI)

### 2. Select Skills

Match request against the catalog above. Select **1–4 skills** — minimum needed. Always check:

- New data model → `physthink-feature`
- New UI → `ui-styling` + `shadcn` + `ai-elements` (if AI components) + `threejs` (if 3D)
- Unfamiliar API → `docs-seeker` first
- Complex scope → `sequential-thinking` first

### 3. Execute in Order

1. **Planning skills** first (sequential-thinking, docs-seeker)
2. **Backend skills** next (physthink-feature, databases, backend-development, better-auth)
3. **Frontend skills** last (web-frameworks, frontend-design, ui-styling, shadcn, aesthetic)
4. **Validation** at end (code-review)

### 4. Load & Follow

For each selected skill, read its `SKILL.md` from `.github/skills/<name>/SKILL.md` and follow its procedure. Skills may reference sub-files — load those as needed.

## Example Dispatch

| Request                     | Skills Selected                                                    |
| --------------------------- | ------------------------------------------------------------------ |
| "Add comment system"        | physthink-feature → ui-styling + shadcn                            |
| "Build analytics dashboard" | sequential-thinking → physthink-feature → frontend-design + shadcn |
| "Add Google OAuth"          | better-auth                                                        |
| "Create 3D physics sim"     | threejs                                                            |
| "Add Stripe subscriptions"  | payment-integration → physthink-feature                            |
| "Build admin course editor" | physthink-feature → ui-styling + shadcn + web-frameworks           |
