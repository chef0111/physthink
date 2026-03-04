import { generateText } from 'ai';
import { authorized } from '@/app/middleware/auth';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';
import { GenerateTextInputSchema, GenerateTextOutputSchema } from './dto';
import { k2think } from './provider';
import type { K2ThinkChatModelId } from './chat-settings';

export const generate = authorized
  .route({
    method: 'POST',
    path: '/k2think/generate',
    tags: ['k2think'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(GenerateTextInputSchema)
  .output(GenerateTextOutputSchema)
  .handler(async ({ input }) => {
    const { prompt, modelId, system } = input;

    const result = await generateText({
      model: k2think(modelId as K2ThinkChatModelId),
      prompt,
      system,
    });

    return { text: result.text };
  });
