'use client';

import { useCallback } from 'react';
import { type UIMessage } from '@ai-sdk/react';

type SendMessage = (options: { text: string }) => void;

/**
 * Returns a handler that re-sends the nearest preceding user prompt for a
 * given assistant message index — used for the "Regenerate" action.
 */
export function useRegenerateMessage(
  messages: UIMessage[],
  isLoading: boolean,
  sendMessage: SendMessage,
  shouldAutoScrollRef: React.RefObject<boolean>
) {
  const getPromptBeforeIndex = useCallback(
    (messageIndex: number): string | null => {
      for (let i = messageIndex - 1; i >= 0; i--) {
        const candidate = messages[i];
        if (candidate.role !== 'user') continue;

        const text = candidate.parts
          .filter(
            (part): part is { type: 'text'; text: string } =>
              part.type === 'text' && typeof part.text === 'string'
          )
          .map((part) => part.text)
          .join('\n')
          .trim();

        if (text) return text;
      }
      return null;
    },
    [messages]
  );

  const handleRegenerateAtIndex = useCallback(
    (messageIndex: number) => {
      if (isLoading) return;
      const prompt = getPromptBeforeIndex(messageIndex);
      if (!prompt) return;
      shouldAutoScrollRef.current = true;
      sendMessage({ text: prompt });
    },
    [getPromptBeforeIndex, isLoading, sendMessage, shouldAutoScrollRef]
  );

  return { handleRegenerateAtIndex };
}
