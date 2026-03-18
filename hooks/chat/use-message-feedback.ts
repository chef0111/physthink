'use client';

import { useCallback, useState } from 'react';
import { useUpdateWorkspaceMessageFeedback } from '@/queries/workspace';

export type MessageFeedback = 'like' | 'dislike';

export type MessageFeedbackResult = {
  feedback: MessageFeedback | null;
  handleLike: () => void;
  handleDislike: () => void;
  isFeedbackPending: boolean;
};

/**
 * Manages like/dislike feedback for a single assistant message.
 * Accepts `initialFeedback` to hydrate persisted state on first render.
 */
export function useMessageFeedback(
  messageId: string,
  initialFeedback?: MessageFeedback | null
): MessageFeedbackResult {
  const [feedback, setFeedback] = useState<MessageFeedback | null>(
    initialFeedback ?? null
  );
  const { mutate: updateMessageFeedback, isPending: isFeedbackPending } =
    useUpdateWorkspaceMessageFeedback();

  const handleLike = useCallback(() => {
    if (isFeedbackPending) return;
    updateMessageFeedback({ messageId, feedback: 'like' });
    setFeedback('like');
  }, [isFeedbackPending, messageId, updateMessageFeedback]);

  const handleDislike = useCallback(() => {
    if (isFeedbackPending) return;
    updateMessageFeedback({ messageId, feedback: 'dislike' });
    setFeedback('dislike');
  }, [isFeedbackPending, messageId, updateMessageFeedback]);

  return { feedback, handleLike, handleDislike, isFeedbackPending };
}
