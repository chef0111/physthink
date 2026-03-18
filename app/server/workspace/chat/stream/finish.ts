import { prisma } from '@/lib/prisma';
import { isDev } from '@/lib/utils';
import type { UIMessage } from 'ai';
import { formatChatMetricsForClient, type ChatStreamLogger } from './logging';
import { appendConversationMemory } from '../agent/memory';
import {
  assistantPartsToText,
  getGenerationDebugData,
  getRetryAdvice,
  normalizeFinishReason,
  responseToUIParts,
  sanitizePersistedPart,
  type ResponseMsg,
} from '../utils';
import { extractScenePersistenceData } from './scene-persistence';

type FinishResponse = {
  finishReason?: unknown;
  messages: readonly ResponseMsg[];
  steps?: unknown[];
};

type HandleChatFinishParams = {
  response: FinishResponse;
  finishReason?: unknown;
  rawFinishReason?: unknown;
  generationStartedAt: number;
  workspaceId: string;
  userId: string;
  messages: Array<UIMessage>;
  logger: ChatStreamLogger;
  reasoningStartById: Map<string, number>;
  streamedReasoningDurationsSec: number[];
  flushOpenReasoningDurations: (
    reasoningStartById: Map<string, number>,
    streamedReasoningDurationsSec: number[]
  ) => void;
};

export async function handleChatFinish(params: HandleChatFinishParams) {
  const {
    response,
    finishReason,
    rawFinishReason,
    generationStartedAt,
    workspaceId,
    userId,
    messages,
    logger,
    reasoningStartById,
    streamedReasoningDurationsSec,
    flushOpenReasoningDurations,
  } = params;

  const normalizedFinishReason = normalizeFinishReason(
    finishReason ?? response.finishReason ?? rawFinishReason
  );
  logger.logFinishPhaseStart(normalizedFinishReason);

  flushOpenReasoningDurations(
    reasoningStartById,
    streamedReasoningDurationsSec
  );

  const elapsedSec = Math.max(
    1,
    Math.round((Date.now() - generationStartedAt) / 1000)
  );
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userContent =
    lastUserMsg?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('\n') ?? '';

  const assistantPartsRaw = responseToUIParts(response.messages);
  const generationDebug = getGenerationDebugData(
    response,
    assistantPartsRaw,
    elapsedSec,
    normalizedFinishReason
  );
  const retryAdvice = getRetryAdvice(
    assistantPartsRaw,
    generationDebug.stopReason
  );

  const partsWithRetryAdvice = [
    ...assistantPartsRaw,
    {
      type: 'data-retry-advice',
      data: {
        ...retryAdvice,
        stage: 'final',
      },
    },
  ];

  const failureSafeParts = retryAdvice.shouldRetry
    ? partsWithRetryAdvice.filter((part) => part.type !== 'text')
    : partsWithRetryAdvice;

  const partsForPersistence =
    process.env.NODE_ENV !== 'production'
      ? [
          ...failureSafeParts,
          {
            type: 'data-debug-generation',
            data: {
              stepCount: generationDebug.stepCount,
              stopReason: generationDebug.stopReason,
              toolCallCount: generationDebug.toolCallCount,
              elapsedSec: generationDebug.elapsedSec,
            },
          },
        ]
      : failureSafeParts;

  const assistantParts = partsForPersistence.map(sanitizePersistedPart);
  const assistantText = assistantPartsToText(assistantParts);

  const persistedSceneData = await extractScenePersistenceData({
    assistantPartsRaw,
    workspaceId,
    logger,
  });

  logger.logDbPersistStart();
  try {
    const assistantPartsJson = JSON.parse(JSON.stringify(assistantParts));

    await prisma.$transaction(async (tx) => {
      const primaryWriteRows = [
        {
          workspaceId,
          role: 'user',
          content: userContent,
        },
        {
          workspaceId,
          role: 'assistant',
          content: assistantText,
          parts: assistantPartsJson,
        },
      ];

      try {
        await tx.workspaceMessage.createMany({
          data: primaryWriteRows,
        });
      } catch (writeErr) {
        const writeErrMsg =
          writeErr instanceof Error ? writeErr.message : String(writeErr);
        if (/reasoningDurations/i.test(writeErrMsg)) {
          await tx.workspaceMessage.createMany({
            data: [
              { workspaceId, role: 'user', content: userContent },
              {
                workspaceId,
                role: 'assistant',
                content: assistantText,
                parts: assistantPartsJson,
              },
            ],
          });
        } else {
          throw writeErr;
        }
      }

      if (persistedSceneData) {
        logger.logSceneUpdateStart();
        await tx.workspace.updateMany({
          where: { id: workspaceId, userId },
          data: {
            sceneData: persistedSceneData as never,
          },
        });
        logger.logSceneUpdateEnd();
      }
    });

    logger.logDbPersistEnd();
  } catch (dbError) {
    logger.logFinishError(
      dbError instanceof Error ? dbError : new Error(String(dbError)),
      'prisma_transaction_persist'
    );
    throw dbError;
  }

  if (isDev) {
    const finalMetrics = logger.getFinishMetrics();
    console.log(
      '[CHAT:METRICS]',
      JSON.stringify(formatChatMetricsForClient(finalMetrics), null, 2)
    );
  }

  try {
    await appendConversationMemory(
      { workspaceId, userId },
      { role: 'user', content: userContent }
    );
    await appendConversationMemory(
      { workspaceId, userId },
      { role: 'assistant', content: assistantText }
    );
  } catch (memoryErr) {
    logger.logFinishError(
      memoryErr instanceof Error ? memoryErr : new Error(String(memoryErr)),
      'memory_append_conversations'
    );
  }
}
