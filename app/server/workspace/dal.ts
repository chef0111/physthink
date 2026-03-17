import 'server-only';

import { prisma } from '@/lib/prisma';
import { getPagination } from '../utils';
import type {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
  UpdateWorkspaceMessageFeedbackDTO,
} from './dto';
import { Prisma } from '@/generated/prisma/client';

type WorkspaceSort = 'newest' | 'oldest' | 'recent';

export class WorkspaceDAL {
  private static getSortCriteria(
    sort?: WorkspaceSort
  ): Prisma.WorkspaceOrderByWithRelationInput {
    switch (sort) {
      case 'newest':
        return { createdAt: 'desc' };
      case 'oldest':
        return { createdAt: 'asc' };
      case 'recent':
        return { updatedAt: 'desc' };
      default:
        return { updatedAt: 'desc' };
    }
  }

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
    const { page, pageSize, query, sort } = params;
    const { offset, limit } = getPagination({ page, pageSize });

    const where: Prisma.WorkspaceWhereInput = {
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
        orderBy: this.getSortCriteria(sort as WorkspaceSort),
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
            parts: true,
            codeBlock: true,
            feedback: true,
            feedbackAt: true,
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

  static async updateMessageFeedback(
    data: UpdateWorkspaceMessageFeedbackDTO,
    userId: string
  ) {
    return prisma.workspaceMessage.updateMany({
      where: {
        id: data.messageId,
        role: 'assistant',
        workspace: {
          userId,
        },
      },
      data: {
        feedback: data.feedback,
        feedbackAt: data.feedback ? new Date() : null,
      },
    });
  }
}
