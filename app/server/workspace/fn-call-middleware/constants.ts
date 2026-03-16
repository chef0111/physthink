export const TOOL_TAG_NAMES = 'tool_call|think_faster|function_call';
export const TOOL_TAG_OPEN_RE = new RegExp(`<(${TOOL_TAG_NAMES})>`, 'i');
export const TOOL_TAG_PAIR_RE = new RegExp(
  `<(${TOOL_TAG_NAMES})>\\s*([\\s\\S]*?)\\s*<\\/\\1>`,
  'gi'
);

/**
 * Tools where only the last call per generation matters.
 * Earlier calls with the same name are dropped.
 */
export const LAST_WINS_TOOLS = new Set(['setSceneSettings']);
export const SINGLE_PASS_RETRIEVAL_TOOLS = new Set(['runProblemRagPipeline']);

for (const toolName of SINGLE_PASS_RETRIEVAL_TOOLS) {
  LAST_WINS_TOOLS.add(toolName);
}

/**
 * Tools whose element arrays should be merged into a single call.
 */
export const MERGE_TOOLS = new Set(['addElements']);
