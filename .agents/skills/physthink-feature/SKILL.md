---
name: physthink-feature
description: 'Implement a new full-stack feature in the PhysThink codebase following established patterns. Use when: adding a new resource (data model, API procedures, UI page); adding CRUD operations; creating server-side data-fetching components; creating oRPC procedures; writing Zod DTOs; writing Prisma DAL classes; adding mutation hooks to queries/; creating client action buttons. Covers the complete chain: Prisma schema → DTO → DAL → server procedure → router → client queries → UI components → page.'
argument-hint: "Feature name or description, e.g. 'add assignment resource with create/delete' or 'add comment listing page'"
---

# PhysThink Feature Implementation

## Overview

PhysThink follows a strict layered architecture:

```
Prisma Schema
  └── app/server/<resource>/dto.ts      (Zod schemas + inferred types)
  └── app/server/<resource>/dal.ts      (Prisma DAL class, server-only)
  └── app/server/<resource>/index.ts    (oRPC procedures using authorized)
  └── app/server/router.ts              (register procedures)
  └── lib/orpc.ts                       (client accesses router via orpc.*)

  ┌── queries/<resource>.ts             (client mutation hooks — 'use client')
  └── modules/<area>/<resource>/        (UI module: components + layout)
      └── components/
          ├── <resource>-list.tsx        async server component + Skeleton export
          ├── <resource>-card.tsx        'use client', owns its delete mutation
          └── create-<resource>-button.tsx  'use client', owns its create mutation
  └── app/dashboard/<resource>/page.tsx  Suspense orchestrator (server)
```

## Use bun to install dependencies

## Step-by-Step Procedure

### 1. Prisma Schema (if new model needed)

Add the model to `prisma/schema.prisma`:

```prisma
model ResourceName {
  id        String   @id @default(cuid())
  title     String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Run `npx prisma migrate dev --name add-resource-name` after changes.

---

### 2. DTO (`app/server/<resource>/dto.ts`)

```ts
import 'server-only';
import z from 'zod';

// Input schemas
export const CreateResourceSchema = z.object({
  title: z.string().max(100).optional(),
});
export const GetResourceSchema = z.object({ id: z.string() });
export const UpdateResourceSchema = z.object({
  id: z.string(),
  title: z.string().max(100).optional(),
});
export const DeleteResourceSchema = z.object({ id: z.string() });

// Output schemas
export const ResourceSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export const ResourceListSchema = z.object({
  items: z.array(ResourceSummarySchema),
  total: z.number(),
});

// Inferred types (exported for use in components)
export type CreateResourceDTO = z.infer<typeof CreateResourceSchema>;
export type UpdateResourceDTO = z.infer<typeof UpdateResourceSchema>;
export type ResourceSummaryDTO = z.infer<typeof ResourceSummarySchema>;
export type ResourceListDTO = z.infer<typeof ResourceListSchema>;
```

**Rules:**

- Always start with `import 'server-only'`
- Use a `*Schema` name for the Zod schema, `*DTO` for the inferred type
- List and Summary schemas should be separate from Detail schemas
- Export both schema and DTO type for every shape

---

### 3. DAL (`app/server/<resource>/dal.ts`)

```ts
import 'server-only';
import { prisma } from '@/lib/prisma';
import { getPagination } from '../utils';
import type { CreateResourceDTO, UpdateResourceDTO } from './dto';

class ResourceDAL {
  static async create(data: CreateResourceDTO, userId: string) {
    return prisma.resource.create({
      data: { title: data.title ?? 'Untitled', userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  static async findMany(userId: string, params: QueryParams) {
    const { page, pageSize, query } = params;
    const { offset, limit } = getPagination({ page, pageSize });
    const where = {
      userId,
      ...(query
        ? { title: { contains: query, mode: 'insensitive' as const } }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        select: { id: true, title: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);
    return { items, total };
  }

  static async findById(id: string, userId: string) {
    return prisma.resource.findFirst({
      where: { id, userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  static async update(id: string, userId: string, data: UpdateResourceDTO) {
    return prisma.resource.updateMany({ where: { id, userId }, data });
  }

  static async delete(id: string, userId: string) {
    return prisma.resource.deleteMany({ where: { id, userId } });
  }
}

// Export as flat functions, not the class itself
export const createResource = (
  ...args: Parameters<typeof ResourceDAL.create>
) => ResourceDAL.create(...args);
export const listResources = (
  ...args: Parameters<typeof ResourceDAL.findMany>
) => ResourceDAL.findMany(...args);
export const getResourceById = (
  ...args: Parameters<typeof ResourceDAL.findById>
) => ResourceDAL.findById(...args);
export const updateResource = (
  ...args: Parameters<typeof ResourceDAL.update>
) => ResourceDAL.update(...args);
export const deleteResource = (
  ...args: Parameters<typeof ResourceDAL.delete>
) => ResourceDAL.delete(...args);
```

**Rules:**

- `import 'server-only'` at top
- Always filter by `userId` in every query — never fetch without the user scope
- Use `findFirst({ where: { id, userId } })` for single-item reads (not `findUnique`)
- Use `updateMany`/`deleteMany` with `{ id, userId }` for mutations — prevents cross-user writes
- Export individual named functions wrapping the class, not the class itself

---

### 4. Server Procedures (`app/server/<resource>/index.ts`)

```ts
import { authorized } from '@/app/middleware/auth';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { QueryParamsSchema } from '@/lib/validations';
import {
  CreateResourceSchema,
  DeleteResourceSchema,
  ResourceSummarySchema,
  ResourceListSchema,
} from './dto';
import { createResource, listResources, deleteResource } from './dal';

export const create = authorized
  .route({ method: 'POST', path: '/resource/create', tags: ['resource'] })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(CreateResourceSchema)
  .output(ResourceSummarySchema)
  .handler(async ({ input, context }) => {
    return createResource(input, context.user.id);
  });

export const list = authorized
  .route({ method: 'GET', path: '/resource/list', tags: ['resource'] })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(ResourceListSchema)
  .handler(async ({ input, context }) => {
    return listResources(context.user.id, input);
  });

export const remove = authorized
  .route({ method: 'DELETE', path: '/resource/delete', tags: ['resource'] })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(DeleteResourceSchema)
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, context, errors }) => {
    const resource = await getResourceById(input.id, context.user.id);
    if (!resource) throw errors.NOT_FOUND({ message: 'Resource not found' });
    await deleteResource(input.id, context.user.id);
    return { success: true };
  });
```

**Rules:**

- Always start from `authorized` (not `base`) — this enforces authentication
- Chain `.use(standardSecurityMiddleware)` on every procedure
- Use `.use(readSecurityMiddleware)` for GET, `.use(writeSecurityMiddleware)` for mutations
- Access user identity only via `context.user.id` — never accept `userId` in input
- Export procedure as `remove` not `delete` (reserved keyword) when registering delete

---

### 5. Register in Router (`app/server/router.ts`)

```ts
import {
  create as createResource,
  list as listResources,
  remove as removeResource,
} from './resource';

export const router = {
  // ... existing entries ...
  resource: {
    create: createResource,
    list: listResources,
    delete: removeResource, // Use 'delete' as the router key (not 'remove')
  },
};
```

**Note:** The module export uses `remove` (avoids reserved keyword), but the router key uses `delete` — so clients call `orpc.resource.delete`.

---

### 6. Client Mutation Hooks (`queries/<resource>.ts`)

```ts
'use client';

import { orpc } from '@/lib/orpc';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useCreateResource() {
  const router = useRouter();

  return useMutation(
    orpc.resource.create.mutationOptions({
      onSuccess: (resource) => {
        toast.success('Resource created successfully');
        router.push(`/dashboard/resource/${resource.id}`);
      },
      onError: (error) => {
        toast.error('Failed to create resource', {
          description: error.message,
        });
      },
    })
  );
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.resource.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Resource deleted');
        await queryClient.invalidateQueries(
          orpc.resource.list.queryOptions({ input: { page: 1, pageSize: 50 } })
        );
      },
      onError: (error) => {
        toast.error('Failed to delete resource', {
          description: error.message,
        });
      },
    })
  );
}
```

**Rules:**

- Mark file with `'use client'` at top
- Use `orpc.<resource>.<action>.mutationOptions(...)` pattern
- `onSuccess` for create: redirect to detail page via `router.push`
- `onSuccess` for delete: invalidate the list query, show toast
- Always show `toast.error` on `onError` with `description: error.message`

---

### 7. Server List Component (`modules/<area>/<resource>/components/<resource>-list.tsx`)

```tsx
import { orpc } from '@/lib/orpc';
import { getQueryClient } from '@/lib/query/hydration';
import { ResourceListDTO } from '@/app/server/resource/dto';
import { DataRenderer } from '@/components/data-renderer';
import { resolveData, queryFetch } from '@/lib/query/helper';
import { ResourceCard } from './resource-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { SomeIcon } from 'lucide-react';

export async function ResourceList() {
  const queryClient = getQueryClient();

  const result = await queryFetch<ResourceListDTO>(
    queryClient.fetchQuery(
      orpc.resource.list.queryOptions({ input: { page: 1, pageSize: 50 } })
    ),
    'Failed to get resources'
  );

  const {
    data: items,
    success,
    error,
  } = resolveData(result, (data) => data.items, []);

  return (
    <DataRenderer
      data={items}
      success={success}
      error={error}
      renderEmpty={() => (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-16">
              <SomeIcon className="size-10" />
            </EmptyMedia>
            <EmptyTitle>No resources yet</EmptyTitle>
            <EmptyDescription>Create your first resource</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      render={(items) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ResourceCard key={item.id} resource={item} />
          ))}
        </div>
      )}
    />
  );
}

export function ResourceListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-1/3 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Rules:**

- No `'use client'` — this is an async server component
- Use `getQueryClient()` (from `lib/query/hydration`) — it's cache-wrapped via React's `cache()`
- Wrap `queryClient.fetchQuery(...)` inside `queryFetch<DTO>(promise, fallbackMessage)`
- Use `resolveData(result, selector, emptyFallback)` to extract data + success/error
- Pass all three to `<DataRenderer data success error renderEmpty render />`
- Always export both the async component and a `*Skeleton` component (used as Suspense fallback)

---

### 8. Client Card Component (`modules/<area>/<resource>/components/<resource>-card.tsx`)

```tsx
'use client';

import { ResourceSummaryDTO } from '@/app/server/resource/dto';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useDeleteResource } from '@/queries/resource';

interface ResourceCardProps {
  resource: ResourceSummaryDTO;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const { mutate: deleteResource, isPending } = useDeleteResource();

  return (
    <Card className="group cursor-pointer gap-2 p-4 transition-all hover:shadow-md">
      <Link href={`/dashboard/resource/${resource.id}`}>
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-base">{resource.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">{/* preview content */}</CardContent>
      </Link>
      <CardFooter className="justify-end p-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              disabled={isPending}
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete resource?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{resource.title}&rdquo;.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => deleteResource({ id: resource.id })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
```

**Rules:**

- Mark `'use client'` at top — card owns its mutation
- Import DTO type from `@/app/server/<resource>/dto`
- No `onDelete` prop — the card imports and calls its own hook
- Delete button must: disable during `isPending`, call `e.stopPropagation()`, use `<AlertDialog>` confirmation
- Use `&ldquo;` / `&rdquo;` for smart quotes in JSX (not raw `"`)

---

### 9. Create Button (`modules/<area>/<resource>/components/create-<resource>-button.tsx`)

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { useCreateResource } from '@/queries/resource';

export function CreateResourceButton() {
  const { mutate, isPending } = useCreateResource();

  return (
    <Button onClick={() => mutate({})} disabled={isPending}>
      {isPending ? <Loader /> : <Plus className="size-4" />}
      New Resource
    </Button>
  );
}
```

**Rules:**

- Mark `'use client'` — this is a leaf client component
- Show `<Loader />` icon while `isPending` (not text "Loading...")
- Disable button while `isPending`

---

### 10. Page Orchestrator (`app/dashboard/<resource>/page.tsx`)

```tsx
import { Suspense } from 'react';
import {
  ResourceList,
  ResourceListSkeleton,
} from '@/modules/<area>/<resource>/components/<resource>-list';
import { CreateResourceButton } from '@/modules/<area>/<resource>/components/create-<resource>-button';

export default function ResourcePage() {
  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-muted-foreground text-sm">Manage your resources</p>
        </div>
        <CreateResourceButton />
      </div>
      <Suspense fallback={<ResourceListSkeleton />}>
        <ResourceList />
      </Suspense>
    </div>
  );
}
```

**Rules:**

- Page is a server component (no `'use client'`)
- Wrap async list component in `<Suspense fallback={<ResourceListSkeleton />}>`
- `CreateResourceButton` is a client component, can be placed directly in the server page
- Heading/description belong in the page, not in the list component

---

### 11. Use useShallow for zustand selectors — `lib/stores/scene-store.ts`

- Import `useShallow` from `zustand/react/shallow`
- Use in `useSceneStore` selector to prevent unnecessary re-renders when unrelated state changes
- _No dependencies_

```tsx
const {
  addElements,
  updateElement,
  removeElement,
  setSceneSettings,
  setSceneLoading,
} = useSceneStore(
  useShallow((s) => ({
    addElements: s.addElements,
    updateElement: s.updateElement,
    removeElement: s.removeElement,
    setSceneSettings: s.setSceneSettings,
    setSceneLoading: s.setSceneLoading,
  }))
);
```

---

## Key Invariants

| Concern                   | Rule                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| User scoping              | Every DAL query includes `userId` — no exceptions                                                         |
| Auth                      | Always use `authorized` base, not `base` directly                                                         |
| Router key vs export name | Export `remove`, register as `delete` in router                                                           |
| Server component          | No `'use client'`, no `useQuery` — use `getQueryClient + fetchQuery + queryFetch`                         |
| Mutations                 | Live in `queries/<resource>.ts` (client), imported by leaf client components                              |
| Card mutation ownership   | Card owns its delete mutation, no prop drilling                                                           |
| Suspense fallback         | Always export `*Skeleton` alongside the async list component                                              |
| Security middleware       | Read → `readSecurityMiddleware`, write → `writeSecurityMiddleware`, always + `standardSecurityMiddleware` |

## File Placement Checklist

- [ ] `prisma/schema.prisma` — model added
- [ ] `app/server/<resource>/dto.ts` — Zod schemas + DTO types
- [ ] `app/server/<resource>/dal.ts` — DAL class with userId filtering
- [ ] `app/server/<resource>/index.ts` — oRPC procedures
- [ ] `app/server/router.ts` — procedures registered
- [ ] `queries/<resource>.ts` — client mutation hooks
- [ ] `modules/<area>/<resource>/components/<resource>-list.tsx` — async server list + skeleton
- [ ] `modules/<area>/<resource>/components/<resource>-card.tsx` — client card + delete
- [ ] `modules/<area>/<resource>/components/create-<resource>-button.tsx` — client create button
- [ ] `app/dashboard/<resource>/page.tsx` — page with Suspense

## Common Pitfalls

- **Don't use `findUnique`** for user-scoped queries — use `findFirst({ where: { id, userId } })` to prevent cross-user access
- **Don't use `delete`** as a TypeScript export name — use `remove` and map to `delete` in router
- **Don't use `useQuery` in server components** — use `queryClient.fetchQuery` + `queryFetch` instead
- **Don't forget `'use client'`** on files that use hooks (queries, card, button)
- **Don't add `position` to R3F element renderers** — positioning is handled by `SelectableWrapper`
- **Don't manually wrap components in `React.memo` or add `useMemo`/`useCallback` for memoization** — this project has React Compiler enabled (`babel-plugin-react-compiler`), which auto-memoizes components and hooks. Manual memoization is redundant and adds noise. Only use `useMemo`/`useCallback` when there is a genuine semantic need (e.g., referential identity for a context value or an expensive computation), not for preventing re-renders.
