'use client';

import { useCallback, useEffect, useRef } from 'react';
import { type UIMessage } from '@ai-sdk/react';

const AUTO_SCROLL_THRESHOLD_PX = 64;

/**
 * Manages RAF-debounced auto-scroll that only fires when the user is already
 * near the bottom of the scroll container.
 */
export function useChatAutoScroll(messages: UIMessage[], isLoading: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const rafRef = useRef(0);

  const updatePreference = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current =
      distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
  }, []);

  const handleScroll = useCallback(() => {
    updatePreference();
  }, [updatePreference]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el || !shouldAutoScrollRef.current) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { scrollRef, shouldAutoScrollRef, handleScroll };
}
