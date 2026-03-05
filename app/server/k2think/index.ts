import { generateText } from 'ai';
import { authorized } from '@/app/middleware/auth';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';
import { GenerateTextInputSchema, GenerateTextOutputSchema } from './dto';
import type { K2ThinkChatModel } from './chat-settings';
import { k2think } from './provider';

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
    const { prompt, model, system } = input;

    const result = await generateText({
      model: k2think(model as K2ThinkChatModel),
      prompt,
      system,
    });

    return { text: result.text };
  });
