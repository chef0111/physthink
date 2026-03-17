import { allTools } from '../chat-tools';

const KNOWLEDGE_TOOL_NAMES = new Set([
  'runProblemRagPipeline',
  'searchProblemExamples',
  'getProblemExampleByKey',
  'getPhysicsConstants',
  'searchPhysicsKnowledge',
  'getInteractionPattern',
  'fetchWebContent',
]);

export function computeActiveToolsFromSteps(
  steps: unknown[]
): Array<keyof typeof allTools> {
  const allToolNames = Object.keys(allTools) as Array<keyof typeof allTools>;
  const usedToolNames = new Set<string>();

  for (const step of steps as Array<{
    toolCalls?: Array<{ toolName?: string }>;
  }>) {
    for (const call of step.toolCalls ?? []) {
      if (typeof call.toolName === 'string') {
        usedToolNames.add(call.toolName);
      }
    }
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

  if (
    usedToolNames.has('addElements') ||
    usedToolNames.has('editElement') ||
    usedToolNames.has('removeElement')
  ) {
    for (const toolName of KNOWLEDGE_TOOL_NAMES) {
      active.delete(toolName);
    }
  }

  return allToolNames.filter((name) => active.has(name));
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
