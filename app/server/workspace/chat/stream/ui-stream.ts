import { createUIMessageStream, type UIMessage, type UIMessageChunk } from 'ai';
import type { ChatStreamLogger } from './logging';
import {
  getRetryAdviceFromStreamState,
  getVisibleTextStats,
  normalizeFinishReason,
} from '../utils';

type ToolPolicyStats = {
  totalToolAttempts: number;
  attemptCountByTool: Record<string, number>;
  reason?: 'per-tool-cap' | 'total-cap';
  forceTextOnly: boolean;
};

type CreateChatUiStreamParams = {
  logger: ChatStreamLogger;
  result: {
    toUIMessageStream: (options: {
      sendReasoning: boolean;
    }) => AsyncIterable<UIMessageChunk>;
  };
  reasoningStartById: Map<string, number>;
  streamedReasoningDurationsSec: number[];
  latestToolPolicyStats: ToolPolicyStats;
  flushOpenReasoningDurations: (
    reasoningStartById: Map<string, number>,
    streamedReasoningDurationsSec: number[]
  ) => void;
};

export function createChatUiStream({
  logger,
  result,
  reasoningStartById,
  streamedReasoningDurationsSec,
  latestToolPolicyStats,
  flushOpenReasoningDurations,
}: CreateChatUiStreamParams) {
  return createUIMessageStream<UIMessage>({
    execute: async ({ writer }) => {
      try {
        logger.logStreamStart();
        const baseStream = result.toUIMessageStream({
          sendReasoning: true,
        });

        let textContent = '';
        let reasoningContent = '';
        let hasToolCalls = false;
        let stopReason = 'unknown';

        for await (const chunk of baseStream as AsyncIterable<UIMessageChunk>) {
          const chunkDelta =
            chunk.type === 'text-delta' || chunk.type === 'reasoning-delta'
              ? chunk.delta
              : undefined;

          try {
            writer.write(chunk);
            logger.logStreamChunk(chunk.type, chunkDelta);
          } catch (writeErr) {
            logger.logWriterError(
              writeErr instanceof Error
                ? writeErr
                : new Error(String(writeErr)),
              chunk.type
            );
            throw writeErr;
          }

          if (chunk.type === 'text-delta') {
            textContent += chunk.delta;
          } else if (chunk.type === 'reasoning-delta') {
            reasoningContent += chunk.delta;
          } else if (chunk.type === 'reasoning-start') {
            reasoningStartById.set(chunk.id, Date.now());
          } else if (chunk.type === 'reasoning-end') {
            const startedAt = reasoningStartById.get(chunk.id);
            if (startedAt) {
              const durationSec = Math.max(
                1,
                Math.round((Date.now() - startedAt) / 1000)
              );
              streamedReasoningDurationsSec.push(durationSec);
              logger.logReasoningDuration(chunk.id, durationSec);
              reasoningStartById.delete(chunk.id);
            }
          } else if (chunk.type.startsWith('tool-')) {
            hasToolCalls = true;
          } else if (chunk.type === 'finish') {
            stopReason = normalizeFinishReason(chunk.finishReason);
            flushOpenReasoningDurations(
              reasoningStartById,
              streamedReasoningDurationsSec
            );
          }

          if (chunk.type === 'finish') {
            const trimmedText = textContent.trim();
            const trimmedReasoning = reasoningContent.trim();
            const { visibleTextLineCount, visibleTextChars } =
              getVisibleTextStats(textContent);
            const finalAdvice = getRetryAdviceFromStreamState(
              {
                textContent,
                reasoningContent,
                hasToolCalls,
                stopReason,
              },
              'final'
            );

            const detectedIssue = finalAdvice.shouldRetry
              ? finalAdvice.reason
              : !hasToolCalls &&
                  trimmedReasoning.length >= 2000 &&
                  trimmedText.length < 240
                ? 'reasoning-dominant-no-tool'
                : 'none';

            logger.logSetup({
              step: 'stream_output_profile',
              stopReason,
              textChars: trimmedText.length,
              visibleTextChars,
              visibleTextLineCount,
              reasoningChars: trimmedReasoning.length,
              hasToolCalls,
              shouldRetry: finalAdvice.shouldRetry,
              retryReason: finalAdvice.reason,
              detectedIssue,
            });

            writer.write({
              type: 'data-retry-advice',
              data: finalAdvice,
            });

            writer.write({
              type: 'data-generation-metadata',
              data: {
                finishReason: stopReason,
                totalToolAttempts: latestToolPolicyStats.totalToolAttempts,
                attemptCountByTool: latestToolPolicyStats.attemptCountByTool,
                forceTextOnly: latestToolPolicyStats.forceTextOnly,
                fallbackReason: latestToolPolicyStats.reason ?? null,
                textChars: trimmedText.length,
                visibleTextChars,
                visibleTextLineCount,
                reasoningChars: trimmedReasoning.length,
                detectedIssue,
              },
            });
          }
        }
      } catch (streamErr) {
        logger.logUiStreamError(
          streamErr instanceof Error ? streamErr : new Error(String(streamErr))
        );

        writer.write({
          type: 'data-stream-error',
          data: {
            recoverable: true,
            stage: 'stream',
            reason: 'stream-error',
          },
        });

        writer.write({
          type: 'data-retry-advice',
          data: {
            shouldRetry: true,
            reason: 'stream-error',
            stage: 'final',
          },
        });
      }
    },
  });
}
