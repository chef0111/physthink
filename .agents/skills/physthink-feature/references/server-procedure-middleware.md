# Server Procedure and Middleware Pattern

## Why this pattern exists

Server procedures follow a strict middleware chain for auth + abuse protection + operation type (read/write/heavy-write).

## Canonical flow

1. Choose route wrapper by auth requirement:
   - `admin` for admin-only operations.
   - `authorized` for signed-in users.
2. Always apply `standardSecurityMiddleware`.
3. Apply operation-specific middleware:
   - `readSecurityMiddleware` for reads.
   - `writeSecurityMiddleware` for writes.
   - `heavyWriteSecurityMiddleware` for expensive writes.
4. Validate with DTO/input schema.
5. Execute DAL call.
6. Revalidate cache tags/paths when mutating data.
7. Throw typed oRPC errors for expected failure cases.

## Code example: write procedure with full chain

Source: `app/server/course/index.ts`

```ts
export const createCourse = admin
  .route({
    method: 'POST',
    path: '/course/create',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .input(CourseSchema)
  .handler(async ({ input, context, errors }) => {
    const existing = await prisma.course.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });

    if (existing) {
      throw errors.CONFLICT({
        data: { field: 'slug', value: input.slug },
        cause: 'SLUG_ALREADY_EXISTS',
        message: 'Slug already exists',
      });
    }

    const course = await CourseDAL.create(input, context.user.id);
    revalidateTag('courses', 'max');
    revalidatePath('/admin/courses');
    return course;
  });
```

## Code example: read procedure with output schema

Source: `app/server/course/index.ts`

```ts
export const listCourses = admin
  .route({
    method: 'GET',
    path: '/course/list',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(CoursesListSchema)
  .handler(async ({ input }) => {
    const courses = await CourseDAL.findMany(input);
    return courses;
  });
```

## File-backed examples

- `app/server/course/index.ts`
  - Full set of read/write procedures with middleware chaining and revalidation.
- `app/server/workspace/chat/index.ts`
  - Uses `authorized` + `standardSecurityMiddleware` + `writeSecurityMiddleware` for chat send endpoint.

## Implementation notes

- Keep paths/tags stable because client hooks depend on router keys.
- Do not skip `standardSecurityMiddleware` on new procedures.
- Prefer explicit `errors.CONFLICT`, `errors.NOT_FOUND`, etc. for predictable client behavior.
- Keep business/data logic in DAL classes; procedure handlers should orchestrate auth, validation, DAL call, and cache revalidation.
