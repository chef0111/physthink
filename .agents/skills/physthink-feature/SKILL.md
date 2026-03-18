---
name: physthink-feature
description: 'Implement full-stack PhysThink features using the current architecture: Prisma -> DTO -> DAL -> oRPC procedures -> router -> query hooks -> module/page UI. Includes workspace chat-specific persistence and reliability rules.'
argument-hint: "Feature description, e.g. 'add assignment resource with create/list/delete'"
---

# PhysThink Feature Implementation (Current Codebase)

## Scope

Use this skill when implementing or modifying:

- Data model or schema in Prisma
- Server contracts (DTO zod schemas)
- DAL methods and server procedures
- Router registration
- Client query hooks (TanStack + oRPC)
- Module/page UI wiring
- Workspace chat behavior (tool state persistence, reasoning duration persistence, reliability controls)

Before implementing, read the pattern references in `references/` and follow those exact conventions.

## Architecture

```
prisma/schema.prisma
  -> app/server/<feature>/dto.ts
  -> app/server/<feature>/dal.ts
  -> app/server/<feature>/index.ts
  -> app/server/router.ts
  -> queries/<feature>.ts
  -> modules/**/<feature>/**
  -> app/** pages/layouts mounting module components
```

## Pattern References (Read First)

- `references/data-fetch-and-rendering.md`
  - Includes the concrete DataRenderer pattern used by server components (`queryFetch` + `resolveData` + `DataRenderer`).
- `references/server-procedure-middleware.md`
  - Defines required middleware/auth sequencing for procedures.
- `references/prisma-dto-dal-flow.md`
  - Defines the vertical feature slice from Prisma to UI hooks.
- `references/folder-structure-conventions.md`
  - Defines where files belong in a feature slice and what not to place in page components.
- `references/reusability-and-maintainability.md`
  - Defines hook/util extraction, component sizing, and anti-patterns to avoid monolithic files.

## Current Conventions

### 1) Prisma

- Make schema changes in prisma/schema.prisma.
- Use bunx prisma db push for local sync.
- Run bunx prisma generate after schema updates.
- Prefer explicit relation fields and onDelete strategy.

### 2) DTO files (app/server/<feature>/dto.ts)

- Include import 'server-only'.
- Define zod input/output schemas.
- Export inferred types from schemas.
- Keep detail/list/summary schemas separate where needed.
- For workspace messages, include metadata fields explicitly (parts, feedback, reasoningDurations).

### 3) DAL files (app/server/<feature>/dal.ts)

- Include import 'server-only'.
- Use static class methods (CourseDAL, WorkspaceDAL pattern).
- Use select objects to control payload size.
- Use getPagination for list endpoints receiving QueryParams.
- Apply user scoping for user-owned entities.

### 4) Server procedures (app/server/<feature>/index.ts)

- Use admin or authorized wrapper depending on privilege.
- Always chain standardSecurityMiddleware.
- Reads use readSecurityMiddleware.
- Writes use writeSecurityMiddleware; heavier routes may use heavyWriteSecurityMiddleware.
- Throw typed oRPC errors with helpful cause/data.
- Revalidate relevant tags/paths after mutations where UI relies on cached server rendering.

### 5) Router (app/server/router.ts)

- Register procedures under stable namespaces.
- Nested route groups are supported and used (for example workspace.message.feedback, workspace.chat.send).
- Keep external API key names stable even if internal export names differ.

### 6) Query hooks (queries/<feature>.ts)

- Use useMutation(orpc.<feature>.<action>.mutationOptions(...)).
- Keep toast success/error handling in hook callbacks.
- Use invalidateQueries and/or router.refresh/push as needed by UX.

### 7) UI integration

- Server components for data-fetching containers.
- Client components for user interactions and mutations.
- Keep initial server-loaded chat/workspace data hydration stable.
- For list-like server-rendered data states, use the DataRenderer pattern from `references/data-fetch-and-rendering.md` instead of hand-rolled success/error/empty branching.
- Extract reusable behavior into custom hooks and utilities instead of keeping all logic in one component file.

## Implementation Procedure

1. Define the contract

- Update Prisma if required.
- Run bunx prisma db push.
- Run bunx prisma generate.

2. Implement server layer

- Update/create dto.ts schemas.
- Update/create DAL class methods.
- Update/create procedure exports in index.ts with correct middleware chain.

3. Register routes

- Wire into app/server/router.ts.

4. Implement client data actions

- Add or update queries/<feature>.ts hooks.

5. Wire UI

- Connect server/client module components and page entry points.

6. Validate

- Run type checks.
- Run targeted tests when possible.
- Manually verify auth scope, error handling, and cache revalidation behavior.
- For chat changes, verify refresh/hydration behavior and tool card state fidelity.

## Checklist

- [ ] Prisma updated and generated if schema changed
- [ ] DTO schemas/types updated
- [ ] DAL methods updated with correct scoping
- [ ] Procedures updated with proper middleware
- [ ] Router registration updated
- [ ] Query hooks updated
- [ ] UI integration updated
- [ ] Type checks pass

## Common Mistakes

- Missing standardSecurityMiddleware on new procedures
- Returning large unbounded payloads without select shaping
- Breaking router namespace used by existing client hooks
- Persisting transient chat artifacts as durable state
- Exposing internal reasoning as assistant text
- Skipping Prisma generate after schema changes
