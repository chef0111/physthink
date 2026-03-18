import 'server-only';

import z from 'zod';

const UIMessagePartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.string(),
    toolCallId: z.string(),
    state: z.string(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    args: z.unknown().optional(),
  }),
  z.object({ type: z.literal('reasoning'), text: z.string() }),
  z.record(z.string(), z.unknown()),
]);

export const SendChatMessageSchema = z.object({
  workspaceId: z.string(),
  capabilityIntent: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      parts: z.array(UIMessagePartSchema),
    })
  ),
  sceneData: z.object({
    elements: z.array(
      z
        .object({
          id: z.string(),
          type: z.string(),
          label: z.string().optional(),
        })
        .loose()
    ),
    sceneSettings: z.record(z.string(), z.unknown()),
  }),
});

export type SendChatMessageDTO = z.infer<typeof SendChatMessageSchema>;
