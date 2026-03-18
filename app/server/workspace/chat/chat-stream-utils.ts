import { allTools } from '../chat-tools';

const MAX_ATTEMPTS_PER_TOOL = 3;
const MAX_TOTAL_TOOL_ATTEMPTS = 7;

const KNOWLEDGE_TOOL_NAMES = new Set([
  'runProblemRagPipeline',
  'searchProblemExamples',
  'getProblemExampleByKey',
  'getPhysicsConstants',
  'searchPhysicsKnowledge',
  'getInteractionPattern',
  'fetchWebContent',
]);

type StepLike = {
  toolCalls?: Array<{ toolName?: string }>;
  toolResults?: Array<{
    toolName?: string;
    isError?: boolean;
    state?: string;
  }>;
};

export type ToolExecutionPolicy = {
  activeTools: Array<keyof typeof allTools>;
  forceTextOnly: boolean;
  reason?: 'per-tool-cap' | 'total-cap';
  totalToolAttempts: number;
  attemptCountByTool: Record<string, number>;
};

export function computeToolExecutionPolicyFromSteps(
  steps: unknown[]
): ToolExecutionPolicy {
  const allToolNames = Object.keys(allTools) as Array<keyof typeof allTools>;
  const usedToolNames = new Set<string>();
  const errorCountByTool = new Map<string, number>();
  const attemptCountByTool = new Map<string, number>();
  let totalToolAttempts = 0;

  for (const step of steps as StepLike[]) {
    for (const call of step.toolCalls ?? []) {
      if (typeof call.toolName !== 'string') continue;
      usedToolNames.add(call.toolName);
      totalToolAttempts += 1;
      attemptCountByTool.set(
        call.toolName,
        (attemptCountByTool.get(call.toolName) ?? 0) + 1
      );
    }

    for (const result of step.toolResults ?? []) {
      if (typeof result.toolName !== 'string') continue;
      const isError =
        result.isError === true || result.state === 'output-error';
      if (!isError) continue;
      errorCountByTool.set(
        result.toolName,
        (errorCountByTool.get(result.toolName) ?? 0) + 1
      );
    }
  }

  const overPerToolCap = [...attemptCountByTool.values()].some(
    (count) => count >= MAX_ATTEMPTS_PER_TOOL
  );
  const overTotalCap = totalToolAttempts >= MAX_TOTAL_TOOL_ATTEMPTS;

  if (overPerToolCap || overTotalCap) {
    return {
      activeTools: [],
      forceTextOnly: true,
      reason: overPerToolCap ? 'per-tool-cap' : 'total-cap',
      totalToolAttempts,
      attemptCountByTool: Object.fromEntries(attemptCountByTool.entries()),
    };
  }

  const active = new Set<string>(allToolNames);

  if (usedToolNames.has('runProblemRagPipeline')) {
    active.delete('runProblemRagPipeline');
    active.delete('searchProblemExamples');
    active.delete('getProblemExampleByKey');
  }
  if (usedToolNames.has('addElements')) {
    active.delete('addElements');
    active.delete('addElement');
  }
  if (usedToolNames.has('setSceneSettings')) {
    active.delete('setSceneSettings');
  }

  // If a tool repeatedly errors, disable it for subsequent steps so the
  // model can complete with text or alternate tools instead of thrashing.
  for (const [toolName, errorCount] of errorCountByTool.entries()) {
    if (errorCount < 2) continue;
    active.delete(toolName);
  }

  // Strong guard against scene-tool retry storms.
  const sceneToolErrorCount =
    (errorCountByTool.get('addElements') ?? 0) +
    (errorCountByTool.get('addElement') ?? 0) +
    (errorCountByTool.get('setSceneSettings') ?? 0);
  if (sceneToolErrorCount >= 4) {
    active.delete('addElements');
    active.delete('addElement');
    active.delete('setSceneSettings');
  }

  if (
    usedToolNames.has('addElements') ||
    usedToolNames.has('editElement') ||
    usedToolNames.has('removeElement')
  ) {
    for (const toolName of KNOWLEDGE_TOOL_NAMES) {
      active.delete(toolName);
    }
  }

  return {
    activeTools: allToolNames.filter((name) => active.has(name)),
    forceTextOnly: false,
    totalToolAttempts,
    attemptCountByTool: Object.fromEntries(attemptCountByTool.entries()),
  };
}

export function computeActiveToolsFromSteps(
  steps: unknown[]
): Array<keyof typeof allTools> {
  return computeToolExecutionPolicyFromSteps(steps).activeTools;
}

export function flushOpenReasoningDurations(
  reasoningStartById: Map<string, number>,
  durationsSinkSec: number[]
): void {
  if (reasoningStartById.size === 0) return;

  const now = Date.now();
  for (const startedAt of reasoningStartById.values()) {
    const durationSec = Math.max(1, Math.round((now - startedAt) / 1000));
    durationsSinkSec.push(durationSec);
  }
  reasoningStartById.clear();
}
