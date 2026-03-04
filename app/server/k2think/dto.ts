import 'server-only';

import z from 'zod';

export const GenerateTextInputSchema = z.object({
  prompt: z.string().min(1),
  modelId: z
    .string()
    .optional()
    .default(process.env.K2THINK_MODEL_ID as string),
  system: z.string().optional(),
});

export const GenerateTextOutputSchema = z.object({
  text: z.string(),
});

export type GenerateTextInput = z.infer<typeof GenerateTextInputSchema>;
export type GenerateTextOutput = z.infer<typeof GenerateTextOutputSchema>;
