import { authorized } from '@/app/middleware/auth';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { QueryParamsSchema } from '@/lib/validations';
import {
  CreateWorkspaceSchema,
  GetWorkspaceSchema,
  UpdateWorkspaceSchema,
  DeleteWorkspaceSchema,
  WorkspaceSummarySchema,
  WorkspaceDetailSchema,
  WorkspaceListSchema,
} from './dto';
import { WorkspaceDAL } from './dal';
import { revalidatePath } from 'next/cache';

export const create = authorized
  .route({
    method: 'POST',
    path: '/workspace/create',
    tags: ['workspace'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(CreateWorkspaceSchema)
  .output(WorkspaceSummarySchema)
  .handler(async ({ input, context }) => {
    const workspace = await WorkspaceDAL.create(input, context.user.id);
    return workspace;
  });

export const list = authorized
  .route({
    method: 'GET',
    path: '/workspace/list',
    tags: ['workspace'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(WorkspaceListSchema)
  .handler(async ({ input, context }) => {
    const workspaces = await WorkspaceDAL.findMany(context.user.id, input);
    return workspaces;
  });

export const get = authorized
  .route({
    method: 'GET',
    path: '/workspace/get',
    tags: ['workspace'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(GetWorkspaceSchema)
  .output(WorkspaceDetailSchema)
  .handler(async ({ input, context, errors }) => {
    const workspace = await WorkspaceDAL.findById(input.id, context.user.id);
    if (!workspace) {
      throw errors.NOT_FOUND({ message: 'Workspace not found' });
    }
    return workspace;
  });

export const update = authorized
  .route({
    method: 'PUT',
    path: '/workspace/update',
    tags: ['workspace'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateWorkspaceSchema)
  .handler(async ({ input, context, errors }) => {
    const result = await WorkspaceDAL.update(input.id, context.user.id, input);
    if (result.count === 0) {
      throw errors.NOT_FOUND({ message: 'Workspace not found' });
    }
  });

export const remove = authorized
  .route({
    method: 'DELETE',
    path: '/workspace/delete',
    tags: ['workspace'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(DeleteWorkspaceSchema)
  .handler(async ({ input, context, errors }) => {
    const result = await WorkspaceDAL.delete(input.id, context.user.id);
    if (result.count === 0) {
      throw errors.NOT_FOUND({ message: 'Workspace not found' });
    }

    revalidatePath('/dashboard/workspace');
  });
