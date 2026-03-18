import { authorized } from '@/app/middleware/auth';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { streamToEventIterator } from '@orpc/server';
import {
  createUIMessageStream,
  streamText,
  convertToModelMessages,
  type UIMessage,
  type UIMessageChunk,
  stepCountIs,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { k2think } from '@/app/server/k2think/provider';
import { allTools } from '../chat-tools';
import { prisma } from '@/lib/prisma';
import { SendChatMessageSchema } from './chat.dto';
import { ELEMENT_REFERENCE } from '../chat-tools/element-reference';
import {
  getCapabilityAllowedTools,
  getCapabilitySystemContext,
  resolveCapabilityIntent,
} from './chat-capabilities';
import {
  assignReasoningDurations,
  assistantPartsToText,
  buildSceneContext,
  getGenerationDebugData,
  normalizeFinishReason,
  getRetryAdvice,
  getRetryAdviceFromStreamState,
  responseToUIParts,
  sanitizePersistedPart,
  truncateMessages,
} from './chat-utils';
import { WORKSPACE_CHAT_SYSTEM_PROMPT } from './chat-system-prompt';
import {
  computeToolExecutionPolicyFromSteps,
  flushOpenReasoningDurations,
} from './chat-stream-utils';
import { ChatStreamLogger, formatChatMetricsForClient } from './chat-logging';
import { isDev } from '@/lib/utils';

export const sendChat = authorized
  .route({
    method: 'POST',
    path: '/workspace/chat/send',
    tags: ['workspace', 'chat'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(SendChatMessageSchema)
  .handler(async ({ input, context, errors }) => {
    const { workspaceId, messages, sceneData, capabilityIntent } = input;
    const capabilityResolution = resolveCapabilityIntent(capabilityIntent);
    const capabilityAllowedTools = getCapabilityAllowedTools(
      capabilityResolution.capability
    );
    const capabilitySystemContext = getCapabilitySystemContext(
      capabilityResolution.capability,
      capabilityResolution.unknownRequested,
      capabilityResolution.requestedRaw
    );
    const generationStartedAt = Date.now();
    const logger = new ChatStreamLogger(generationStartedAt);
    const reasoningStartById = new Map<string, number>();
    const streamedReasoningDurationsSec: number[] = [];
    let forcedTextOnlyLogged = false;
    let latestToolPolicyStats = {
      totalToolAttempts: 0,
      attemptCountByTool: {} as Record<string, number>,
      reason: undefined as 'per-tool-cap' | 'total-cap' | undefined,
      forceTextOnly: false,
    };

    try {
      logger.logSetup({
        workspaceId,
        messageCount: messages.length,
        hasSceneData: !!sceneData,
        pipelineVersion: 'v2',
        capability: capabilityResolution.capability,
        unknownCapabilityRequested: capabilityResolution.unknownRequested,
        capabilityRequestedRaw: capabilityResolution.requestedRaw,
      });

      // Verify workspace ownership
      const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: context.user.id },
        select: { id: true },
      });
      if (!workspace) {
        throw errors.NOT_FOUND({ message: 'Workspace not found' });
      }

      logger.logSetup({ step: 'workspace_verified' });

      let modelMessages;
      try {
        modelMessages = await convertToModelMessages(
          truncateMessages(messages as UIMessage[])
        );
        logger.logSetup({
          step: 'messages_converted',
          count: modelMessages.length,
        });
      } catch (e) {
        logger.logFinishError(
          e instanceof Error ? e : new Error(String(e)),
          'convertToModelMessages'
        );
        throw e;
      }

      const sceneContext = buildSceneContext(sceneData);
      logger.logSetup({ step: 'scene_context_built' });

      const wrappedModel = wrapLanguageModel({
        model: k2think(process.env.K2THINK_MODEL_ID!),
        middleware: [
          extractReasoningMiddleware({
            tagName: 'think',
            startWithReasoning: true,
          }),
        ],
      });

      const result = streamText({
        model: wrappedModel,
        system: `${WORKSPACE_CHAT_SYSTEM_PROMPT}\n\n${ELEMENT_REFERENCE}${capabilitySystemContext ? `\n\n${capabilitySystemContext}` : ''}\n\n## Current Scene\n${sceneContext}`,
        messages: modelMessages,
        tools: allTools,
        temperature: 0.2,
        stopWhen: stepCountIs(8),
        toolChoice: capabilityResolution.unknownRequested ? 'none' : 'auto',
        onStepFinish: ({
          stepNumber,
          finishReason,
          usage,
          toolCalls,
          toolResults,
        }) => {
          logger.logSetup({
            step: 'step_finished',
            stepNumber,
            finishReason: normalizeFinishReason(finishReason),
            toolCalls: toolCalls.length,
            toolResults: toolResults.length,
            totalTokens:
              typeof usage.totalTokens === 'number'
                ? usage.totalTokens
                : undefined,
          });
        },
        experimental_onToolCallStart: ({ toolCall }) => {
          logger.logSetup({
            step: 'tool_call_start',
            toolName: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
          });
        },
        experimental_onToolCallFinish: ({
          toolCall,
          durationMs,
          success,
          error,
        }) => {
          logger.logSetup({
            step: 'tool_call_finish',
            toolName: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            durationMs,
            success,
            error: error instanceof Error ? error.message : undefined,
          });
        },
        prepareStep: async ({ steps }) => {
          const policy = computeToolExecutionPolicyFromSteps(
            steps as unknown[],
            capabilityResolution.unknownRequested ? [] : capabilityAllowedTools
          );

          latestToolPolicyStats = {
            totalToolAttempts: policy.totalToolAttempts,
            attemptCountByTool: policy.attemptCountByTool,
            reason: policy.reason,
            forceTextOnly: policy.forceTextOnly,
          };

          if (policy.forceTextOnly && !forcedTextOnlyLogged) {
            logger.logSetup({
              step: 'forced_text_only_fallback',
              reason: policy.reason ?? 'unknown',
              totalToolAttempts: policy.totalToolAttempts,
              attemptCountByTool: policy.attemptCountByTool,
            });
            forcedTextOnlyLogged = true;
          }

          return {
            activeTools: policy.activeTools,
          };
        },
        onFinish: async ({ response }) => {
          const finishReason = normalizeFinishReason(
            (response as { finishReason?: unknown })?.finishReason
          );
          logger.logFinishPhaseStart(finishReason);

          flushOpenReasoningDurations(
            reasoningStartById,
            streamedReasoningDurationsSec
          );

          const elapsedSec = Math.max(
            1,
            Math.round((Date.now() - generationStartedAt) / 1000)
          );
          const lastUserMsg = [...messages]
            .reverse()
            .find((m) => m.role === 'user');
          const userContent =
            lastUserMsg?.parts
              ?.filter(
                (p): p is { type: 'text'; text: string } => p.type === 'text'
              )
              .map((p) => p.text)
              .join('\n') ?? '';

          // Convert response messages → UI parts (reasoning + tool calls + text)
          const assistantPartsRaw = responseToUIParts(response.messages);
          const { assistantPartsWithDurations } = assignReasoningDurations(
            assistantPartsRaw,
            elapsedSec,
            [...streamedReasoningDurationsSec]
          );
          const generationDebug = getGenerationDebugData(
            response,
            assistantPartsWithDurations,
            elapsedSec
          );
          const retryAdvice = getRetryAdvice(
            assistantPartsWithDurations,
            generationDebug.stopReason
          );

          const reasoningDurationsSecForStorage = assistantPartsWithDurations
            .filter(
              (part): part is { type: 'reasoning'; durationText?: string } =>
                part.type === 'reasoning'
            )
            .map((part) => {
              if (typeof part.durationText !== 'string') return null;
              const m = part.durationText.match(/^Thought for ([\d.]+)s$/i);
              if (!m) return null;
              const value = Number(m[1]);
              return Number.isFinite(value)
                ? Math.max(1, Math.round(value))
                : null;
            })
            .filter((value): value is number => typeof value === 'number');

          const partsWithRetryAdvice = [
            ...assistantPartsWithDurations,
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

          let persistedSceneData: unknown = null;

          try {
            const newElements: unknown[] = [];
            let newSceneSettings: Record<string, unknown> | null = null;

            for (const p of assistantPartsRaw) {
              if (p.toolName === 'addElements' || p.toolName === 'addElement') {
                const output = p.output as Record<string, unknown> | undefined;
                if (Array.isArray(output?.elements)) {
                  newElements.push(...(output.elements as unknown[]));
                } else if (output?.element) {
                  newElements.push(output.element);
                }
              } else if (p.toolName === 'setSceneSettings') {
                const output = p.output as Record<string, unknown> | undefined;
                if (output?.settings) {
                  newSceneSettings = output.settings as Record<string, unknown>;
                }
              }
            }

            logger.logSceneProcessingStart(
              newElements.length,
              !!newSceneSettings
            );

            if (newElements.length > 0 || newSceneSettings) {
              const current = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { sceneData: true },
              });
              const scene = (current?.sceneData ?? {}) as {
                elements?: unknown[];
                sceneSettings?: Record<string, unknown>;
              };
              const existingElements = Array.isArray(scene.elements)
                ? scene.elements
                : [];
              const existingSettings = scene.sceneSettings ?? {};

              const fingerprint = (e: Record<string, unknown>) => {
                const pos = (e.position as number[]) ?? [0, 0, 0];
                const rp = pos.map(
                  (v) => Math.round((v as number) * 100) / 100
                );
                let fp = `${e.type}|${rp.join(',')}`;
                if (e.type === 'preset') fp += `|${e.presetId ?? ''}`;
                else if (e.type === 'mesh') fp += `|${e.geometry ?? ''}`;
                else if (e.type === 'vector') {
                  const to = (e.to as number[]) ?? [0, 0, 0];
                  fp += `|${to.map((v) => Math.round(v * 100) / 100).join(',')}`;
                }
                return fp;
              };

              const existingFPs = new Set(
                existingElements.map((el) =>
                  fingerprint(el as Record<string, unknown>)
                )
              );

              const deduped = newElements.filter((el) => {
                const fp = fingerprint(el as Record<string, unknown>);
                if (existingFPs.has(fp)) return false;
                existingFPs.add(fp);
                return true;
              });

              logger.logSceneDeduplication(
                newElements.length,
                deduped.length,
                existingElements.length
              );

              if (deduped.length > 0 || newSceneSettings) {
                const updatedElements = [
                  ...existingElements,
                  ...deduped.map((el) => ({
                    ...(el as Record<string, unknown>),
                    id: crypto.randomUUID(),
                  })),
                ];

                persistedSceneData = JSON.parse(
                  JSON.stringify({
                    elements: updatedElements,
                    sceneSettings: newSceneSettings
                      ? { ...existingSettings, ...newSceneSettings }
                      : existingSettings,
                  })
                );
              }
            }

            logger.logSceneProcessingEnd();
          } catch (sceneErr) {
            logger.logFinishError(
              sceneErr instanceof Error
                ? sceneErr
                : new Error(String(sceneErr)),
              'scene_processing_prepare'
            );
          }

          logger.logDbPersistStart();
          try {
            const assistantPartsJson = JSON.parse(
              JSON.stringify(assistantParts)
            );

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
                  reasoningDurations:
                    reasoningDurationsSecForStorage.length > 0
                      ? reasoningDurationsSecForStorage
                      : undefined,
                },
              ];

              try {
                await tx.workspaceMessage.createMany({
                  data: primaryWriteRows,
                });
              } catch (writeErr) {
                const writeErrMsg =
                  writeErr instanceof Error
                    ? writeErr.message
                    : String(writeErr);
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
                  where: { id: workspaceId, userId: context.user.id },
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
        },
      });

      const uiStream = createUIMessageStream<UIMessage>({
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
              try {
                writer.write(chunk);
                logger.logStreamChunk(chunk.type);
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
                const finalAdvice = getRetryAdviceFromStreamState(
                  {
                    textContent,
                    reasoningContent,
                    hasToolCalls,
                    stopReason,
                  },
                  'final'
                );

                writer.write({
                  type: 'data-retry-advice',
                  data: finalAdvice,
                });

                writer.write({
                  type: 'data-generation-metadata',
                  data: {
                    finishReason: stopReason,
                    totalToolAttempts: latestToolPolicyStats.totalToolAttempts,
                    attemptCountByTool:
                      latestToolPolicyStats.attemptCountByTool,
                    forceTextOnly: latestToolPolicyStats.forceTextOnly,
                    fallbackReason: latestToolPolicyStats.reason ?? null,
                  },
                });
              }
            }
          } catch (streamErr) {
            logger.logUiStreamError(
              streamErr instanceof Error
                ? streamErr
                : new Error(String(streamErr))
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

      return streamToEventIterator(uiStream);
    } catch (handlerErr) {
      logger.logFinishError(
        handlerErr instanceof Error
          ? handlerErr
          : new Error(String(handlerErr)),
        'handler_top_level'
      );
      throw handlerErr;
    }
  });
