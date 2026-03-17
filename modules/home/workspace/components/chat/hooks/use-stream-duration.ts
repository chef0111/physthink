'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Measures the wall-clock duration of an active stream for a single message.
 * Returns the elapsed seconds once the stream ends; null while streaming or
 * before it has started.
 */
export function useStreamDuration(
  isStreaming: boolean | undefined,
  isUser: boolean
): number | null {
  const [measuredDurationSec, setMeasuredDurationSec] = useState<number | null>(
    null
  );
  const streamStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isUser) return;

    if (isStreaming) {
      if (streamStartRef.current === null) {
        streamStartRef.current = Date.now();
      }
      return;
    }

    if (streamStartRef.current !== null && measuredDurationSec === null) {
      const elapsed = Math.max(
        1,
        Math.round((Date.now() - streamStartRef.current) / 1000)
      );
      setMeasuredDurationSec(elapsed);
      streamStartRef.current = null;
    }
  }, [isStreaming, isUser, measuredDurationSec]);

  return measuredDurationSec;
}
