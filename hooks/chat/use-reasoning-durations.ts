'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type UIMessage } from 'ai';
import { normalizeThoughtDuration } from '@/modules/home/workspace/components/chat/utils';

type ReasoningPartWithDuration = {
  type: 'reasoning';
  text?: string;
  durationText?: string;
};

type DurationMarker = {
  index: number;
  duration: string;
};

export type ReasoningDurationsResult = {
  reasoningIndexes: number[];
  activeReasoningIndex: number;
  latestReasoningIndex: number;
  /** Durations resolved from persisted durationText or nearest text marker. */
  reasoningDurationsByIndex: Map<number, string | null>;
  /** Live elapsed durations updated each tick while streaming. */
  liveReasoningDurations: Map<number, string>;
};

/**
 * Tracks per-chain reasoning durations — both live (while streaming) and
 * resolved from persisted durationText annotations (after load).
 */
export function useReasoningDurations(
  parts: UIMessage['parts'],
  isStreaming: boolean | undefined,
  isUser: boolean
): ReasoningDurationsResult {
  const [liveReasoningDurations, setLiveReasoningDurations] = useState<
    Map<number, string>
  >(new Map());
  const reasoningStartRef = useRef(new Map<number, number>());
  const reasoningDurationRef = useRef(new Map<number, number>());

  const reasoningIndexes = useMemo(
    () =>
      parts
        .map((part, index) => ({ index, part }))
        .filter(
          ({ part }) =>
            part.type === 'reasoning' &&
            typeof (part as { text?: string }).text === 'string'
        )
        .map(({ index }) => index),
    [parts]
  );

  // Tick timer: update live duration labels every 800 ms while streaming.
  useEffect(() => {
    if (!isStreaming || isUser) return;
    const id = window.setInterval(() => {
      setLiveReasoningDurations((prev) => {
        const nextMap = new Map(prev);
        let changed = false;
        for (const [index, startedAt] of reasoningStartRef.current.entries()) {
          if (reasoningDurationRef.current.has(index)) continue;
          const elapsedSec = Math.max(
            1,
            Math.round((Date.now() - startedAt) / 1000)
          );
          const text = `Thought for ${elapsedSec}s`;
          if (nextMap.get(index) !== text) {
            nextMap.set(index, text);
            changed = true;
          }
        }
        return changed ? nextMap : prev;
      });
    }, 800);
    return () => window.clearInterval(id);
  }, [isStreaming, isUser]);

  // Track start times and finalize durations when chains complete.
  useEffect(() => {
    if (isUser || reasoningIndexes.length === 0) return;

    if (!isStreaming) {
      if (reasoningStartRef.current.size === 0) return;

      for (const index of reasoningIndexes) {
        if (reasoningDurationRef.current.has(index)) continue;
        const startedAt = reasoningStartRef.current.get(index);
        if (!startedAt) continue;
        const elapsedSec = Math.max(
          1,
          Math.round((Date.now() - startedAt) / 1000)
        );
        reasoningDurationRef.current.set(index, elapsedSec);
      }

      setLiveReasoningDurations(() => {
        const nextMap = new Map<number, string>();
        for (const index of reasoningIndexes) {
          const stableDuration = reasoningDurationRef.current.get(index);
          if (typeof stableDuration === 'number') {
            nextMap.set(index, `Thought for ${stableDuration}s`);
          }
        }
        return nextMap;
      });
      return;
    }

    const activeIndex = reasoningIndexes[reasoningIndexes.length - 1];

    const now = Date.now();

    for (const index of reasoningIndexes) {
      if (reasoningDurationRef.current.has(index)) continue;

      if (!reasoningStartRef.current.has(index)) {
        reasoningStartRef.current.set(index, now);
      }

      // Chain is no longer the active one — finalize its duration.
      if (index !== activeIndex && reasoningStartRef.current.has(index)) {
        const startedAt = reasoningStartRef.current.get(index)!;
        const elapsedSec = Math.max(1, Math.round((now - startedAt) / 1000));
        reasoningDurationRef.current.set(index, elapsedSec);
      }
    }

    setLiveReasoningDurations(() => {
      const nextMap = new Map<number, string>();
      for (const index of reasoningIndexes) {
        const stableDuration = reasoningDurationRef.current.get(index);
        if (typeof stableDuration === 'number') {
          nextMap.set(index, `Thought for ${stableDuration}s`);
          continue;
        }
        const startedAt = reasoningStartRef.current.get(index);
        if (!startedAt) continue;
        const elapsedSec = Math.max(
          1,
          Math.round((Date.now() - startedAt) / 1000)
        );
        nextMap.set(index, `Thought for ${elapsedSec}s`);
      }
      return nextMap;
    });
  }, [isStreaming, isUser, reasoningIndexes]);

  // Resolve durations from persisted durationText annotations and text markers.
  const reasoningDurationsByIndex = useMemo(() => {
    const durations = new Map<number, string | null>();
    const markers: DurationMarker[] = [];

    parts.forEach((part, index) => {
      if (part.type === 'text' && typeof part.text === 'string') {
        const normalized = normalizeThoughtDuration(part.text);
        if (normalized) markers.push({ index, duration: normalized });
        return;
      }

      if (part.type === 'reasoning') {
        const explicitDuration = normalizeThoughtDuration(
          (part as ReasoningPartWithDuration).durationText ?? ''
        );
        if (explicitDuration) {
          durations.set(index, explicitDuration);
        }
      }
    });

    const usedMarkerIndexes = new Set<number>();

    for (const reasoningIndex of reasoningIndexes) {
      if (durations.has(reasoningIndex)) continue;

      let bestMarker: DurationMarker | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const marker of markers) {
        if (usedMarkerIndexes.has(marker.index)) continue;
        const distance = Math.abs(marker.index - reasoningIndex);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMarker = marker;
        }
      }

      if (bestMarker) {
        usedMarkerIndexes.add(bestMarker.index);
        durations.set(reasoningIndex, bestMarker.duration);
      } else {
        durations.set(reasoningIndex, null);
      }
    }

    return durations;
  }, [parts, reasoningIndexes]);

  const activeReasoningIndex =
    isStreaming && reasoningIndexes.length > 0
      ? reasoningIndexes[reasoningIndexes.length - 1]
      : -1;

  const latestReasoningIndex =
    reasoningIndexes.length > 0
      ? reasoningIndexes[reasoningIndexes.length - 1]
      : -1;

  return {
    reasoningIndexes,
    activeReasoningIndex,
    latestReasoningIndex,
    reasoningDurationsByIndex,
    liveReasoningDurations,
  };
}
