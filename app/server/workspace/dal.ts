import 'server-only';

import { prisma } from '@/lib/prisma';
import { getPagination } from '../utils';
import type { CreateWorkspaceDTO, UpdateWorkspaceDTO } from './dto';

class WorkspaceDAL {
  static async create(data: CreateWorkspaceDTO, userId: string) {
    return prisma.workspace.create({
      data: {
        title: data.title ?? 'Untitled Workspace',
        userId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
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

    const [workspaces, totalWorkspaces] = await Promise.all([
      prisma.workspace.findMany({
        where,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.workspace.count({ where }),
    ]);

    return { workspaces, totalWorkspaces };
  }

  static async findById(id: string, userId: string) {
    return prisma.workspace.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        sceneData: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            codeBlock: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  static async update(id: string, userId: string, data: UpdateWorkspaceDTO) {
    return prisma.workspace.updateMany({
      where: { id, userId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.sceneData !== undefined ? { sceneData: data.sceneData } : {}),
      },
    });
  }

  static async delete(id: string, userId: string) {
    return prisma.workspace.deleteMany({
      where: { id, userId },
    });
  }
}

export const createWorkspace = (
  ...args: Parameters<typeof WorkspaceDAL.create>
) => WorkspaceDAL.create(...args);

export const listWorkspaces = (
  ...args: Parameters<typeof WorkspaceDAL.findMany>
) => WorkspaceDAL.findMany(...args);

export const getWorkspaceById = (
  ...args: Parameters<typeof WorkspaceDAL.findById>
) => WorkspaceDAL.findById(...args);

export const updateWorkspace = (
  ...args: Parameters<typeof WorkspaceDAL.update>
) => WorkspaceDAL.update(...args);

export const deleteWorkspace = (
  ...args: Parameters<typeof WorkspaceDAL.delete>
) => WorkspaceDAL.delete(...args);
