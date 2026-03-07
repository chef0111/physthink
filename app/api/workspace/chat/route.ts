import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
} from 'ai';
import { k2think } from '@/app/server/k2think/provider';
import { allTools } from './tools';
import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const SYSTEM_PROMPT = `You are PhysThink — an AI tutor that helps students understand physics by building interactive 3D illustrations.
Students will paste physics problems, textbook excerpts, or describe concepts they are studying. Your job is to:
1. **Parse the problem** — identify objects, surfaces, forces, constraints, angles, and given quantities.
2. **Build an accurate 3D illustration** — create the scene that matches the problem setup using your tools.
3. **Annotate clearly** — label every force, angle, dimension, and variable mentioned in the problem.
4. **Explain the physics** — after building, walk the student through what each element represents and how the physics applies.

## Capabilities
You can create and arrange 3D elements:
- **Meshes**: box, sphere, cylinder, cone, capsule, torus, plane (with material: color, opacity, wireframe, metalness, roughness, geometryArgs)
- **Vectors**: arrows for forces, velocities, accelerations, displacements (from/to points, color, dashed, headSize)
- **Connectors**: spring, rope, rod, wire (between two 3D points, coils/segments/thickness)
- **Curves**: paths, trajectories, field lines (array of 3D points, closed, dashed, lineWidth)
- **Presets**: pulley, pendulum, cart, ramp, spring, weight-block (with params for customisation)
- **Annotations**: label, angle-marker, dimension, coordinate-axes, region (text, color, fontSize, start/end points)
- **Lights**: ambient, directional, point, spot (color, intensity)

## Physics Illustration Workflow
When a student provides a physics problem:
1. Call setStatus("Analyzing the problem...") first.
2. Identify the physical setup: surfaces, inclines, objects, pulleys, springs, etc.
3. Build the environment first (ground planes, inclined surfaces, walls).
4. Place the objects (blocks, carts, spheres, trucks, etc.) in the correct positions.
5. Add all force vectors: gravity (mg), normal force (N), friction (f), tension (T), applied forces (F), etc.
6. Add annotations for angles (θ), dimensions, variable labels (m, g, μ, etc.).
7. Add coordinate axes if the problem involves component decomposition.
8. Explain what was built and how it relates to solving the problem.

## Force Vector Conventions
- **Gravity (weight)**: dark red arrow pointing straight down, label "mg" or "W"
- **Normal force**: green arrow perpendicular to the contact surface, label "N"
- **Friction**: orange arrow opposing motion direction along the surface, label "f" or "μN"
- **Tension**: blue arrow along the rope/string direction, label "T"
- **Applied/external force**: purple arrow in the applied direction, label "F"
- **Net force / resultant**: thick red arrow, label "F_net" or "ΣF"
- **Velocity**: cyan arrow in the direction of motion, label "v"
- **Acceleration**: yellow arrow in the direction of acceleration, label "a"
- All force vectors should originate from the center of mass of the object they act on.
- Use dashed vectors for components (e.g. mg·sinθ along the incline, mg·cosθ perpendicular).

## Angle and Geometry Conventions
- Use angle-marker annotations to show angles between surfaces (θ, φ, etc.).
- For inclined planes: rotate a plane mesh by the angle θ around the Z-axis. The ramp preset can also be used.
- Show the angle between the incline and the horizontal with an angle-marker annotation.
- Use dimension annotations to indicate distances, heights, or lengths mentioned in the problem.

## Scene Rules
- Coordinate system: Y-up, right-handed.
- Keep scenes under 100 elements (soft limit). Hard limit: 500.
- Use setStatus to inform the student what you are doing during multi-step operations.
- Position elements logically in 3D space. Use reasonable sizes (1–5 units for most objects).
- Place force vectors at the correct application points on objects.
- When showing free-body diagrams, slightly offset overlapping vectors so they are all visible.

## Response Style
- After building the scene, explain what each element represents.
- Relate the illustration back to the problem: "The green arrow is the normal force N, perpendicular to the incline surface."
- If the problem asks to find a quantity, briefly outline the physics approach (but don't solve fully unless asked).
- Be encouraging and pedagogical — you are helping students learn.`;

const MAX_CONTEXT_MESSAGES = 20;

function truncateMessages(messages: UIMessage[]): UIMessage[] {
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages;
  return messages.slice(-MAX_CONTEXT_MESSAGES);
}

function buildSceneContext(sceneData: {
  elements: Array<{ id: string; type: string; label?: string }>;
  sceneSettings: Record<string, unknown>;
}): string {
  if (!sceneData?.elements?.length) return 'Scene is empty.';

  const elementSummary = sceneData.elements
    .map((el) => `- ${el.id} (${el.type}${el.label ? `: ${el.label}` : ''})`)
    .join('\n');

  return `${sceneData.elements.length} element(s):\n${elementSummary}\nSettings: ${JSON.stringify(sceneData.sceneSettings)}`;
}

export async function POST(req: Request) {
  const session = await requireSession();

  const { messages, workspaceId, sceneData } = (await req.json()) as {
    messages: UIMessage[];
    workspaceId: string;
    sceneData: {
      elements: Array<{ id: string; type: string; label?: string }>;
      sceneSettings: Record<string, unknown>;
    };
  };

  // Verify workspace ownership
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId: session.user.id },
    select: { id: true },
  });
  if (!workspace) {
    return new Response('Workspace not found', { status: 404 });
  }

  const modelMessages = await convertToModelMessages(
    truncateMessages(messages)
  );
  const sceneContext = buildSceneContext(sceneData);

  const result = streamText({
    model: k2think(process.env.K2THINK_MODEL_ID!),
    system: `${SYSTEM_PROMPT}\n\n## Current Scene\n${sceneContext}`,
    messages: modelMessages,
    tools: allTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onFinish: async ({ responseMessage }) => {
      // Extract text content from assistant response
      const textContent = responseMessage.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('\n');

      // Extract user's last text message
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

      await prisma.workspaceMessage.createMany({
        data: [
          { workspaceId, role: 'user', content: userContent },
          { workspaceId, role: 'assistant', content: textContent },
        ],
      });
    },
  });
}
