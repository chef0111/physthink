import 'server-only';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { K2ThinkChatModel } from './chat-settings';

const k2think = createOpenAICompatible<K2ThinkChatModel, never, never, never>({
  name: 'k2think',
  baseURL: process.env.K2THINK_BASE_URL as string,
  apiKey: process.env.K2THINK_API_KEY as string,
});

export { k2think };
