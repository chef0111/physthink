import { authorized } from '@/app/middleware/auth';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { streamToEventIterator } from '@orpc/server';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { k2think } from '@/app/server/k2think/provider';
import { createChatTools } from './agent/tools';
import { prisma } from '@/lib/prisma';
import { SendChatMessageSchema } from './chat.dto';
import { readCoreMemory } from './agent/memory';
import {
  DEFAULT_SKILL_DIRECTORIES,
  buildSkillsPrompt,
  discoverSkills,
} from './agent/skills';
import { buildChatSystemPrompt } from './prompt/builder';
import {
  getCapabilityAllowedTools,
  getCapabilitySystemContext,
  resolveCapabilityIntent,
} from './stream/capabilities';
import {
  buildSceneContext,
  normalizeFinishReason,
  truncateMessages,
} from './utils';
import { handleChatFinish } from './stream/finish';
import { createChatUiStream } from './stream/ui-stream';
import {
  computeToolExecutionPolicyFromSteps,
  flushOpenReasoningDurations,
} from './stream/stream-utils';
import { ChatStreamLogger } from './stream/logging';

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
    const userId = context.user.id;
    const uiMessages = messages as UIMessage[];
    const capabilityResolution = resolveCapabilityIntent(capabilityIntent);
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
        where: { id: workspaceId, userId },
        select: { id: true },
      });
      if (!workspace) {
        throw errors.NOT_FOUND({ message: 'Workspace not found' });
      }

      logger.logSetup({ step: 'workspace_verified' });

      let modelMessages;
      try {
        modelMessages = await convertToModelMessages(
          truncateMessages(uiMessages)
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

      const discoveredSkills = await discoverSkills(DEFAULT_SKILL_DIRECTORIES);
      const skillsPrompt = buildSkillsPrompt(discoveredSkills);
      const tools = createChatTools({
        skills: discoveredSkills,
        context: {
          workspaceId,
          userId,
        },
      });
      const capabilityAllowedTools = getCapabilityAllowedTools(
        capabilityResolution.capability,
        Object.keys(tools)
      );

      logger.logSetup({
        step: 'skills_discovered',
        count: discoveredSkills.length,
      });

      const coreMemoryRaw = await readCoreMemory({ workspaceId, userId });
      const coreMemory = coreMemoryRaw.trim();
      logger.logSetup({
        step: 'memory_core_loaded',
        chars: coreMemory.length,
      });

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
        system: buildChatSystemPrompt({
          capabilitySystemContext,
          skillsPrompt,
          coreMemory,
          sceneContext,
        }),
        messages: modelMessages,
        tools,
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
            activeTools: policy.activeTools.filter(
              (toolName): toolName is keyof typeof tools =>
                Object.prototype.hasOwnProperty.call(tools, toolName)
            ),
          };
        },
        onFinish: async ({ response }) => {
          await handleChatFinish({
            response,
            generationStartedAt,
            workspaceId,
            userId,
            messages: uiMessages,
            logger,
            reasoningStartById,
            streamedReasoningDurationsSec,
            flushOpenReasoningDurations,
          });
        },
      });

      const uiStream = createChatUiStream({
        logger,
        result,
        reasoningStartById,
        streamedReasoningDurationsSec,
        latestToolPolicyStats,
        flushOpenReasoningDurations,
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
