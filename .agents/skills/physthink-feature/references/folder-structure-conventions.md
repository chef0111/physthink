# Folder Structure Conventions

## Goal

Keep feature work discoverable and maintainable by preserving the repository's layer boundaries.

## Canonical feature slice layout

Based on existing patterns in `course` and `workspace`:

```text
prisma/
  schema.prisma

app/server/<feature>/
  dto.ts
  dal.ts
  index.ts

app/server/router.ts

queries/
  <feature>.ts

modules/<domain>/<feature>/
  components/
  layout/

app/.../
  page.tsx, layout.tsx
```

## Real codebase examples

- Server feature slice:
  - `app/server/course/dto.ts`
  - `app/server/course/dal.ts`
  - `app/server/course/index.ts`
- Route registration:
  - `app/server/router.ts`
- Query hooks layer:
  - `queries/course.ts`
- UI module split:
  - `modules/home/courses/components/`
  - `modules/home/courses/layout/`
  - `modules/home/workspace/components/`
  - `modules/home/workspace/layout/`

## Placement rules

1. Never place database access directly in module UI components.
2. Never define API contracts in page files; keep schemas in `dto.ts`.
3. Keep route orchestration in `index.ts`; push data operations into `dal.ts`.
4. Keep page files thin: compose module components and server containers.
5. Put shared cross-feature helpers in `lib/` or `components/`; put feature-specific logic under `modules/<domain>/<feature>/`.

## Anti-patterns to avoid

- Monolithic `index.tsx` files containing data fetch, mutation, rendering, and utility parsing logic.
- Feature logic scattered across `app/**/page.tsx` with no module encapsulation.
- Repeating route keys in multiple places instead of central `app/server/router.ts` mapping.
