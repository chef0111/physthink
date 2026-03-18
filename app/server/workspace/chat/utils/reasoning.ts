import { normalizeFinishReason, normalizeThoughtDuration } from './base';
import type { GenerationDebugData } from './types';

export function assignReasoningDurations(
  assistantPartsRaw: Array<Record<string, unknown>>,
  _elapsedSec: number,
  streamedReasoningDurationsSec: number[] = []
) {
  const durationMarkers = assistantPartsRaw
    .map((part, index) => {
      if (part.type !== 'text' || typeof part.text !== 'string') return null;
      const duration = normalizeThoughtDuration(part.text);
      return duration ? { index, duration } : null;
    })
    .filter(
      (item): item is { index: number; duration: string } => item !== null
    );

  const reasoningIndexes = assistantPartsRaw
    .map((part, index) => ({ part, index }))
    .filter(
      ({ part }) => part.type === 'reasoning' && typeof part.text === 'string'
    )
    .map(({ index }) => index);
  const reasoningCount = reasoningIndexes.length;

  const assignedDurations = new Map<number, string>();
  const usedMarkerIndexes = new Set<number>();

  for (const reasoningIndex of reasoningIndexes) {
    const part = assistantPartsRaw[reasoningIndex];
    const explicitDuration =
      typeof part?.durationText === 'string'
        ? normalizeThoughtDuration(part.durationText)
        : null;
    if (explicitDuration) {
      assignedDurations.set(reasoningIndex, explicitDuration);
      continue;
    }

    const streamedDuration = streamedReasoningDurationsSec.shift();
    if (
      typeof streamedDuration === 'number' &&
      Number.isFinite(streamedDuration)
    ) {
      assignedDurations.set(
        reasoningIndex,
        `Thought for ${Math.max(1, Math.round(streamedDuration))}s`
      );
      continue;
    }

    let bestMarker: { index: number; duration: string } | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const marker of durationMarkers) {
      if (usedMarkerIndexes.has(marker.index)) continue;
      const distance = Math.abs(marker.index - reasoningIndex);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMarker = marker;
      }
    }

    if (bestMarker) {
      usedMarkerIndexes.add(bestMarker.index);
      assignedDurations.set(reasoningIndex, bestMarker.duration);
    }
  }

  const assistantPartsWithDurations = assistantPartsRaw.map((part, index) => {
    if (part.type !== 'reasoning') return part;

    const durationText = assignedDurations.get(index);
    if (!durationText) {
      return part;
    }

    return {
      ...part,
      durationText,
    };
  });

  return {
    assistantPartsWithDurations,
    reasoningCount,
  };
}

export function getGenerationDebugData(
  response: unknown,
  assistantPartsWithDurations: Array<Record<string, unknown>>,
  elapsedSec: number
): GenerationDebugData {
  const responseWithDebug = response as {
    finishReason?: { unified?: string; raw?: string } | string;
    steps?: unknown[];
  };

  const stopReason = normalizeFinishReason(responseWithDebug.finishReason);

  const toolCallCount = assistantPartsWithDurations.filter(
    (part) => typeof part.toolCallId === 'string'
  ).length;

  const stepCount = Array.isArray(responseWithDebug.steps)
    ? responseWithDebug.steps.length
    : Math.max(1, toolCallCount);

  return {
    stepCount,
    stopReason,
    toolCallCount,
    elapsedSec,
  };
}
