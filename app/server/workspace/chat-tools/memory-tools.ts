import { tool } from 'ai';
import { z } from 'zod';
import type { MemoryCommand } from '../chat/agent/memory';
import { runMemoryCommand } from '../chat/agent/memory';

type MemoryToolContext = {
  workspaceId: string;
  userId: string;
};

const MemoryCommandSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('view'),
    path: z.string().optional(),
  }),
  z.object({
    action: z.literal('create'),
    path: z.string(),
    content: z.string(),
  }),
  z.object({
    action: z.literal('update'),
    path: z.string(),
    content: z.string(),
    mode: z.enum(['append', 'overwrite']).optional(),
  }),
  z.object({
    action: z.literal('search'),
    query: z.string(),
    path: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }),
]);

export function createMemoryTools(context?: MemoryToolContext) {
  return {
    memory: tool({
      description:
        'Manage long-term assistant memory using structured commands: view, create, update, search.',
      strict: true,
      inputSchema: MemoryCommandSchema,
      execute: async (input) => {
        if (!context) {
          return {
            ok: false,
            action: input.action,
            error: 'Memory context unavailable for this request.',
          };
        }

        return runMemoryCommand(context, input as MemoryCommand);
      },
    }),
  };
}
