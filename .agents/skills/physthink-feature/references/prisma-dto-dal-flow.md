# Prisma -> DTO -> DAL -> Procedure -> Router -> Query Hook Pattern

## Why this pattern exists

Features in this repository are implemented as a vertical slice with clear boundaries from schema to UI.

## Canonical flow

1. Update `prisma/schema.prisma` models/enums.
2. Define feature schemas/types in `app/server/<feature>/dto.ts`.
3. Implement scoped database methods in `app/server/<feature>/dal.ts`.
4. Expose validated procedures in `app/server/<feature>/index.ts`.
5. Register keys in `app/server/router.ts`.
6. Consume from `queries/<feature>.ts` via TanStack `useMutation`/query options.
7. Wire UI modules/pages.

## Code example: Prisma schema field carried through the slice

Source: `prisma/schema.prisma`

```prisma
model WorkspaceMessage {
  id                 String    @id @default(uuid())
  role               String
  content            String
  parts              Json?
  reasoningDurations Json?
  workspaceId        String
  workspace          Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

Source: `app/server/workspace/dto.ts`

```ts
export const WorkspaceMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  parts: z.any().nullish(),
  reasoningDurations: z.any().nullish(),
  codeBlock: z.string().nullish(),
  feedback: z.string().nullish(),
  feedbackAt: z.date().nullish(),
  createdAt: z.date(),
});
```

Source: `app/server/workspace/dal.ts`

```ts
messages: {
  select: {
    id: true,
    role: true,
    content: true,
    parts: true,
    reasoningDurations: true,
    codeBlock: true,
    feedback: true,
    feedbackAt: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'asc' },
},
```

## Code example: router namespace + query hook consumption

Source: `app/server/router.ts`

```ts
workspace: {
  message: {
    feedback: updateMessageFeedback,
  },
  chat: {
    send: sendChat,
  },
},
```

Source: `queries/course.ts`

```ts
return useMutation(
  orpc.course.update.mutationOptions({
    onSuccess: () => {
      toast.success('Course updated successfully!');
      queryClient.invalidateQueries(
        orpc.course.get.queryOptions({ input: { id: courseId } })
      );
      router.refresh();
    },
  })
);
```

## File-backed examples

- `prisma/schema.prisma`
  - `WorkspaceMessage.reasoningDurations` stored as JSON for chat timing hydration.
- `app/server/workspace/dto.ts`
  - Includes `reasoningDurations` in `WorkspaceMessageSchema`.
- `app/server/workspace/dal.ts`
  - Selects `reasoningDurations` in workspace message retrieval.
- `app/server/router.ts`
  - Registers nested keys such as `workspace.message.feedback` and `workspace.chat.send`.
- `queries/course.ts`
  - Shows mutation hooks using `orpc.course.*.mutationOptions` with toast and cache/router updates.

## Implementation notes

- Keep output payloads intentionally shaped using Prisma `select`.
- Keep router key names stable to avoid breaking existing client hooks.
- Include `import 'server-only'` in DTO/DAL files.
- Prefer extending existing feature DTO/DAL files before introducing ad-hoc server logic in page components.
