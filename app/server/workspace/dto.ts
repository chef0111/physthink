import 'server-only';

import z from 'zod';

export const CreateWorkspaceSchema = z.object({
  title: z.string().max(100).optional(),
});

export const GetWorkspaceSchema = z.object({
  id: z.string(),
});

export const UpdateWorkspaceSchema = z.object({
  id: z.string(),
  title: z.string().max(100).optional(),
  sceneData: z.any().optional(),
});

export const DeleteWorkspaceSchema = z.object({
  id: z.string(),
});

export const WorkspaceMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  parts: z.any().nullish(),
  codeBlock: z.string().nullish(),
  createdAt: z.date(),
});

export const WorkspaceSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WorkspaceDetailSchema = WorkspaceSummarySchema.extend({
  sceneData: z.any().nullish(),
  messages: z.array(WorkspaceMessageSchema),
});

export const WorkspaceListSchema = z.object({
  workspaces: z.array(WorkspaceSummarySchema),
  totalWorkspaces: z.number(),
});

export type CreateWorkspaceDTO = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceDTO = z.infer<typeof UpdateWorkspaceSchema>;
export type WorkspaceSummaryDTO = z.infer<typeof WorkspaceSummarySchema>;
export type WorkspaceDetailDTO = z.infer<typeof WorkspaceDetailSchema>;
export type WorkspaceListDTO = z.infer<typeof WorkspaceListSchema>;
