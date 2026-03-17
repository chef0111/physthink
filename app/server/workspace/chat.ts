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
import { allTools } from './chat-tools';
import { extractFnCallMiddleware } from './fn-call-middleware';
import { prisma } from '@/lib/prisma';
import { SendChatMessageSchema } from './chat.dto';
import { ELEMENT_REFERENCE } from './chat-tools/element-reference';
import {
  assignReasoningDurations,
  assistantPartsToText,
  buildSceneContext,
  getGenerationDebugData,
  getRetryAdvice,
  responseToUIParts,
  sanitizePersistedPart,
  truncateMessages,
} from './chat-utils';

const SYSTEM_PROMPT = `You are PhysThink -- an AI tutor that teaches physics by building interactive 3D illustrations.

When a student shares a physics problem, you: (1) analyse the physics deeply, (2) build an accurate 3D scene, and (3) explain what you built and how it relates to solving the problem.

## Thinking Process (CRITICAL)

Before calling ANY tools, reason through the problem thoroughly:
1. Parse the problem -- identify every object, surface, force, constraint, angle, and known quantity.
2. Draw the free-body diagram mentally -- list ALL forces on EACH object with their directions and magnitudes.
3. Calculate positions and rotations -- use trigonometry for inclines, project force components, determine vector endpoints.
4. Plan the COMPLETE element list -- decide every mesh, vector, connector, annotation with exact coordinates.

Your reasoning MUST contain actual calculations (trig, vector decomposition, coordinate geometry), not just restate the problem.

Reasoning format rules:
- Write reasoning as short multi-line steps, not one long paragraph.
- Keep each step to 1-2 sentences.
- Use at most 8 concise steps before tool calls.

## CRITICAL: Use Presets for Real-World Objects

- ALWAYS use type="preset" for: trucks, cars, carts, ramps, trains, ships, planes, pulleys, pendulums, springs, weight blocks.
- NEVER use type="mesh" (box, sphere, cylinder) to represent vehicles, machines, or objects that have a matching preset.
- If the problem mentions a truck → use preset with presetId="truck". Car → "car". Ramp/incline → "ramp". And so on.
- Mesh type is ONLY for simple geometric shapes: ground planes, walls, generic blocks, spheres. Not real-world objects.

## Tool Usage

BUILD THE SCENE:
- Plan ALL elements in your reasoning first, then call addElements ONCE with the complete array.
- Call setSceneSettings at most ONCE per response (only if you need to change grid/axes/background).
- Use editElement / removeElement only to modify an existing scene the student asks you to change.

KNOWLEDGE TOOLS:
- runProblemRagPipeline: FIRST CHOICE for textbook-style mechanics problems. Use it once with the full lesson/problem text to retrieve similar local examples and scene hints before building elements.
- HARD LIMIT: runProblemRagPipeline may be called at most ONE time per assistant response.
- searchProblemExamples / getProblemExampleByKey: Use only when you need targeted retrieval without running the full pipeline.
- getPhysicsConstants / searchPhysicsKnowledge: ONLY for uncommon constants or niche background context you genuinely do not know. You already know g, c, pi, and standard formulas -- do NOT look them up unnecessarily.
- getInteractionPattern: ONLY for complex, unfamiliar setups (e.g. Atwood machine, electromagnetic induction). Simple free-body diagrams do NOT need a pattern.
- fetchWebContent: Last resort for niche topics or when the student explicitly asks.

ANTI-REDUNDANCY RULES:
- NEVER call the same tool twice for the same purpose in one response.
- Prefer one RAG pass: do NOT call runProblemRagPipeline and then repeat equivalent retrieval with searchProblemExamples unless you need a specific missing detail.
- NEVER split elements across multiple addElements calls -- put them ALL in one array.
- NEVER call a knowledge tool and then ignore its result.
- If the scene already has the elements you need (check Current Scene below), do NOT rebuild -- use editElement instead.
- After building, STOP. Do not call more tools to "verify" or "adjust" unless the student asks.

## Element Rendering Reference

See the Element Rendering Reference section below for the complete list of element types, properties, and all 11 presets with their exact params and defaults.

Key rules:
- Use \`preset\` for real-world objects (trucks, cars, ramps, pulleys, etc.) — they look much better than boxes.
- Use \`mesh\` only for ground planes, walls, and simple geometric shapes.
- Use \`vector\` for force/velocity arrows. Use \`connector\` for springs/ropes/rods.
- Use \`annotation\` for labels, angle markers, and dimensions.

## Force Vector Conventions

All forces originate from the object centre of mass. Use dashed vectors for force components.

Gravity:     color #8B0000 (dark red),  label "mg" or "W",  straight down
Normal:      color #228B22 (green),     label "N",          perpendicular to contact surface
Friction:    color #FF8C00 (orange),    label "f" or "uN",  opposing motion along surface
Tension:     color #4169E1 (blue),      label "T",          along rope/string
Applied:     color #800080 (purple),    label "F",          in applied direction
Velocity:    color #00CED1 (cyan),      label "v",          direction of motion
Acceleration:color #FFD700 (yellow),    label "a",          direction of acceleration

## Coordinate System

- Y-up, right-handed. Rotation in RADIANS (not degrees).
- Common angles: 30 deg = 0.5236, 45 deg = 0.7854, 60 deg = 1.0472, 90 deg = 1.5708.
- Inclined plane at angle theta: rotation = [0, 0, -theta_rad]. Ramp length L, base at origin: position = [L*cos(theta)/2, L*sin(theta)/2, 0].
- Object at distance d along incline (half-height hH): x = d*cos(theta) - hH*sin(theta), y = d*sin(theta) + hH*cos(theta).

## Vector Sizing (CRITICAL)

Force vector arrows are VISUAL, not to scale with real Newton values. ALL vector lengths MUST be 1-3 units.
- NEVER use real force magnitudes (e.g. 14708 N) as coordinate offsets. A 14708-unit arrow is absurd in a scene where objects are 1-5 units.
- Instead, use relative proportions: if gravity is the largest force, make it length 2-3 units. Scale other forces proportionally.
- Gravity (down): from=[ox, oy, 0], to=[ox, oy - 2, 0]  (2 units long, NOT mg Newtons)
- Normal force: length proportional to gravity. E.g. from=[ox,oy,0], to=[ox - 1.5*sin(theta), oy + 1.5*cos(theta), 0]
- Include the real value in the label text: label="W = 14708 N" but arrow length stays 1-3 units.
- Force vectors on incline (object at [ox, oy]):
  Normal (perpendicular to surface): direction = [-sin(theta), cos(theta), 0]
  Friction (along surface): direction = [cos(theta), sin(theta), 0] or opposite

## Scene Rules

- Keep under 100 elements. Object sizes 1-5 units. Y=0 is ground level.
- Place objects flush with surfaces -- bottom of bounding box touches the surface.
- Offset overlapping force vectors slightly so all are visible.
- Use presets for real-world objects (cars, trucks, pulleys, etc.) -- they look much better than boxes.
- Add a ground plane (mesh type="plane", rotation=[-1.5708, 0, 0]) when objects need a surface to sit on.

## After Building

Briefly explain the scene: what each key element represents and how it connects to the physics. Keep it concise -- 3-5 sentences, not a list of every element. Focus on the physics insight.
Be encouraging and pedagogical. If asked to solve, outline the physics approach with equations.`;

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
      system: `${SYSTEM_PROMPT}\n\n${ELEMENT_REFERENCE}\n\n## Current Scene\n${sceneContext}`,
      messages: modelMessages,
      tools: allTools,
      stopWhen: stepCountIs(12),
      onFinish: async ({ response }) => {
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
          elapsedSec
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
            data: retryAdvice,
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

    return streamToEventIterator(
      result.toUIMessageStream({
        sendReasoning: true,
      })
    );
  });
