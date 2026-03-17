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
import { extractFnCallMiddleware } from '../fn-call-middleware';
import { prisma } from '@/lib/prisma';
import { SendChatMessageSchema } from './chat.dto';
import { ELEMENT_REFERENCE } from '../chat-tools/element-reference';
import {
  assignReasoningDurations,
  assistantPartsToText,
  buildSceneContext,
  getGenerationDebugData,
  getRetryAdvice,
  getRetryAdviceFromStreamState,
  responseToUIParts,
  sanitizePersistedPart,
  truncateMessages,
} from './chat-utils';
import { WORKSPACE_CHAT_SYSTEM_PROMPT } from './chat-system-prompt';
import {
  computeActiveToolsFromSteps,
  flushOpenReasoningDurations,
} from './chat-stream-utils';

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
    const { workspaceId, messages, sceneData } = input;
    const generationStartedAt = Date.now();
    const reasoningStartById = new Map<string, number>();
    const streamedReasoningDurationsSec: number[] = [];

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: context.user.id },
      select: { id: true },
    });
    if (!workspace) {
      throw errors.NOT_FOUND({ message: 'Workspace not found' });
    }

    const modelMessages = await convertToModelMessages(
      truncateMessages(messages as UIMessage[])
    );
    const sceneContext = buildSceneContext(sceneData);

    const wrappedModel = wrapLanguageModel({
      model: k2think(process.env.K2THINK_MODEL_ID!),
      middleware: [
        extractReasoningMiddleware({
          tagName: 'think',
          startWithReasoning: true,
        }),
        extractFnCallMiddleware(),
      ],
    });

    const result = streamText({
      model: wrappedModel,
      system: `${WORKSPACE_CHAT_SYSTEM_PROMPT}\n\n${ELEMENT_REFERENCE}\n\n## Current Scene\n${sceneContext}`,
      messages: modelMessages,
      tools: allTools,
      temperature: 0.2,
      stopWhen: stepCountIs(8),
      prepareStep: async ({ steps }) => {
        return {
          activeTools: computeActiveToolsFromSteps(steps as unknown[]),
        };
      },
      onFinish: async ({ response }) => {
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

        const partsForPersistence =
          process.env.NODE_ENV !== 'production'
            ? [
                ...partsWithRetryAdvice,
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
            : partsWithRetryAdvice;

        const assistantParts = partsForPersistence.map(sanitizePersistedPart);
        const assistantText = assistantPartsToText(assistantParts);

        await prisma.workspaceMessage.createMany({
          data: [
            { workspaceId, role: 'user', content: userContent },
            {
              workspaceId,
              role: 'assistant',
              content: assistantText,
              parts: JSON.parse(JSON.stringify(assistantParts)),
            },
          ],
        });

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

            // Deduplicate: only add elements that don't already exist (by type+position fingerprint)
            const fingerprint = (e: Record<string, unknown>) => {
              const pos = (e.position as number[]) ?? [0, 0, 0];
              const rp = pos.map((v) => Math.round((v as number) * 100) / 100);
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

            if (deduped.length > 0 || newSceneSettings) {
              const updatedElements = [
                ...existingElements,
                ...deduped.map((el) => ({
                  ...(el as Record<string, unknown>),
                  id: crypto.randomUUID(),
                })),
              ];

              const persistedSceneData = JSON.parse(
                JSON.stringify({
                  elements: updatedElements,
                  sceneSettings: newSceneSettings
                    ? { ...existingSettings, ...newSceneSettings }
                    : existingSettings,
                })
              );

              await prisma.workspace.updateMany({
                where: { id: workspaceId, userId: context.user.id },
                data: {
                  sceneData: persistedSceneData,
                },
              });
            }
          }
        } catch (e) {
          console.error('Failed to persist scene data server-side:', e);
        }
      },
    });

    const uiStream = createUIMessageStream<UIMessage>({
      execute: async ({ writer }) => {
        const baseStream = result.toUIMessageStream({
          sendReasoning: true,
        });

        let textContent = '';
        let reasoningContent = '';
        let hasToolCalls = false;
        let stopReason = 'unknown';
        let eventCounter = 0;
        let lastAdviceKey = '';

        for await (const chunk of baseStream as AsyncIterable<UIMessageChunk>) {
          writer.write(chunk);

          if (chunk.type === 'text-delta') {
            textContent += chunk.delta;
            eventCounter += 1;
          } else if (chunk.type === 'reasoning-delta') {
            reasoningContent += chunk.delta;
            eventCounter += 1;
          } else if (chunk.type === 'reasoning-start') {
            reasoningStartById.set(chunk.id, Date.now());
            eventCounter += 1;
          } else if (chunk.type === 'reasoning-end') {
            const startedAt = reasoningStartById.get(chunk.id);
            if (startedAt) {
              const durationSec = Math.max(
                1,
                Math.round((Date.now() - startedAt) / 1000)
              );
              streamedReasoningDurationsSec.push(durationSec);
              reasoningStartById.delete(chunk.id);
            }
            eventCounter += 1;
          } else if (chunk.type.startsWith('tool-')) {
            hasToolCalls = true;
            eventCounter += 1;
          } else if (chunk.type === 'finish') {
            stopReason = chunk.finishReason ?? 'unknown';
            flushOpenReasoningDurations(
              reasoningStartById,
              streamedReasoningDurationsSec
            );
          }

          const shouldEmitPreliminary =
            chunk.type !== 'finish' &&
            eventCounter > 0 &&
            eventCounter % 3 === 0;

          if (shouldEmitPreliminary) {
            const preliminaryAdvice = getRetryAdviceFromStreamState(
              {
                textContent,
                reasoningContent,
                hasToolCalls,
                stopReason: 'unknown',
              },
              'preliminary'
            );
            const preliminaryKey = `${preliminaryAdvice.shouldRetry}:${preliminaryAdvice.reason}:${preliminaryAdvice.stage}`;
            if (preliminaryKey !== lastAdviceKey) {
              writer.write({
                type: 'data-retry-advice',
                data: preliminaryAdvice,
                transient: true,
              });
              lastAdviceKey = preliminaryKey;
            }
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
          }
        }
      },
    });

    return streamToEventIterator(uiStream);
  });
