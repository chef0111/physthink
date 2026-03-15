import 'server-only';

import { tool, generateText } from 'ai';
import { z } from 'zod';
import { k2think } from '@/app/server/k2think/provider';
import {
  getProblemExampleByKey,
  getProblemRagIndexState,
  getProblemRagStats,
  searchProblemExamples,
  type ProblemRagSample,
} from '@/lib/knowledge/problem-rag-provider';

type GraphNode = Record<string, string>;
type GraphHints = {
  topic?: string;
  objects: GraphNode[];
  events: GraphNode[];
  quantities: GraphNode[];
  relations: GraphNode[];
  assumptions: string[];
  questionTargets: GraphNode[];
};

type PipelineStageName =
  | 'query_input'
  | 'indexing'
  | 'retrieval_topk'
  | 'graph_generation'
  | 'svg_generation'
  | 'tool_handoff';

type PipelineStageStatus = 'start' | 'ok' | 'error' | 'fallback';

type PipelineTraceEntry = {
  stage: PipelineStageName;
  status: PipelineStageStatus;
  elapsedMs: number;
  at: string;
  detail: string;
  data?: Record<string, unknown>;
};

const GRAPH_SYSTEM_PROMPT = `You are an information extraction assistant for physics problems.
Extract only structured graph lines from the lesson.
Output plain text lines only, no markdown.
Allowed prefixes: TOPIC, OBJECT, EVENT, QUANTITY, RELATION, ASSUMPTION, QUESTION_TARGET.
Use key=value pairs separated by " | ".
Do not solve the problem.`;

const SVG_SYSTEM_PROMPT = `You are a physics diagram renderer.
Input is extracted graph-style text and a few SVG examples.
Output SVG only, no markdown/code fences/explanations.
Use a 600x600 viewBox and draw a clean 2D educational diagram with labels.`;

const MAX_LESSON_CHARS = 3500;
const MAX_GRAPH_CHARS = 3200;
const MAX_GRAPH_EXAMPLE_LESSON_CHARS = 1800;
const MAX_GRAPH_EXAMPLE_GRAPH_CHARS = 1800;
const MAX_SVG_EXAMPLE_GRAPH_CHARS = 1000;
const MAX_SVG_EXAMPLE_SVG_CHARS = 2200;
const MAX_RESULT_GRAPH_CHARS = 3200;
const MAX_RESULT_SVG_CHARS = 4500;
const MAX_LOG_TEXT_CHARS = 420;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n... (truncated)`;
}

function clampTopK(topK: number): number {
  return Math.min(Math.max(topK, 1), 2);
}

function makeRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatMs(startAt: number): string {
  return `${Date.now() - startAt}ms`;
}

function truncateForLog(text: string): string {
  if (text.length <= MAX_LOG_TEXT_CHARS) return text;
  return `${text.slice(0, MAX_LOG_TEXT_CHARS)}... (truncated)`;
}

function toLogMessage(data?: Record<string, unknown>): string {
  if (!data) return '';
  try {
    const raw = JSON.stringify(data);
    return truncateForLog(raw);
  } catch {
    return '[unserializable-log-data]';
  }
}

function summarizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function formatTraceText(trace: PipelineTraceEntry[]): string {
  return trace
    .map(
      (entry) =>
        `${entry.elapsedMs}ms | ${entry.stage} | ${entry.status} | ${entry.detail}`
    )
    .join('\n');
}

function buildGraphPrompt(lesson: string, examples: ProblemRagSample[]): string {
  const parts: string[] = [
    'Few-shot examples (lesson -> graph):',
  ];

  examples.forEach((example, index) => {
    parts.push(
      [
        `Example ${index + 1}`,
        'Lesson:',
        truncate(example.lesson, MAX_GRAPH_EXAMPLE_LESSON_CHARS),
        'Output:',
        truncate(example.graph, MAX_GRAPH_EXAMPLE_GRAPH_CHARS),
      ].join('\n')
    );
  });

  parts.push(
    [
      'Now process the new lesson.',
      'Lesson:',
      truncate(lesson, MAX_LESSON_CHARS),
      'Output:',
    ].join('\n')
  );

  return parts.join('\n\n');
}

function buildSvgPrompt(graph: string, examples: ProblemRagSample[]): string {
  const parts: string[] = [
    'Few-shot examples (graph -> svg):',
  ];

  examples.forEach((example, index) => {
    parts.push(
      [
        `Example ${index + 1}`,
        'Extracted graph:',
        truncate(example.graph, MAX_SVG_EXAMPLE_GRAPH_CHARS),
        'Output SVG:',
        truncate(example.svg, MAX_SVG_EXAMPLE_SVG_CHARS),
      ].join('\n')
    );
  });

  parts.push(
    [
      'Now render SVG for the new graph.',
      'Extracted graph:',
      truncate(graph, MAX_GRAPH_CHARS),
      'Output SVG:',
    ].join('\n')
  );

  return parts.join('\n\n');
}

function extractSvg(raw: string): string {
  const match = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) return truncate(raw.trim(), MAX_RESULT_SVG_CHARS);
  return truncate(match[0].trim(), MAX_RESULT_SVG_CHARS);
}

function parseKeyValues(raw: string): Record<string, string> {
  const output: Record<string, string> = {};
  const pieces = raw.split('|').map((part) => part.trim());
  for (const piece of pieces) {
    const index = piece.indexOf('=');
    if (index <= 0) continue;
    const key = piece.slice(0, index).trim();
    const value = piece.slice(index + 1).trim();
    if (!key || !value) continue;
    output[key] = value;
  }
  return output;
}

function parseGraphHints(graphText: string): GraphHints {
  const hints: GraphHints = {
    objects: [],
    events: [],
    quantities: [],
    relations: [],
    assumptions: [],
    questionTargets: [],
  };

  const lines = graphText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator <= 0) continue;

    const prefix = line.slice(0, separator).trim().toUpperCase();
    const payload = line.slice(separator + 1).trim();

    if (prefix === 'TOPIC') {
      const topic = parseKeyValues(payload).label;
      if (topic) hints.topic = topic;
      continue;
    }
    if (prefix === 'OBJECT') {
      hints.objects.push(parseKeyValues(payload));
      continue;
    }
    if (prefix === 'EVENT') {
      hints.events.push(parseKeyValues(payload));
      continue;
    }
    if (prefix === 'QUANTITY') {
      hints.quantities.push(parseKeyValues(payload));
      continue;
    }
    if (prefix === 'RELATION') {
      hints.relations.push(parseKeyValues(payload));
      continue;
    }
    if (prefix === 'ASSUMPTION') {
      const assumption = parseKeyValues(payload).text ?? payload;
      if (assumption) hints.assumptions.push(assumption);
      continue;
    }
    if (prefix === 'QUESTION_TARGET') {
      hints.questionTargets.push(parseKeyValues(payload));
    }
  }

  return hints;
}

async function generateGraphText(lesson: string, examples: ProblemRagSample[]) {
  const prompt = buildGraphPrompt(lesson, examples);
  const result = await generateText({
    model: k2think(process.env.K2THINK_MODEL_ID!),
    system: GRAPH_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 700,
  });
  return {
    graphText: truncate(result.text.trim(), MAX_RESULT_GRAPH_CHARS),
    graphPromptPreview: truncate(prompt, 1200),
  };
}

async function generateSvgText(graph: string, examples: ProblemRagSample[]) {
  const prompt = buildSvgPrompt(graph, examples);
  const result = await generateText({
    model: k2think(process.env.K2THINK_MODEL_ID!),
    system: SVG_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 1800,
  });
  return {
    svgText: extractSvg(result.text),
    svgPromptPreview: truncate(prompt, 1200),
  };
}

export const ragPipelineTools = {
  runProblemRagPipeline: tool({
    description:
      'Run the full RAG pipeline for a physics lesson: retrieve top-k similar lesson/graph/svg examples, generate graph text, generate SVG, and return scene hints plus detailed stage-by-stage trace logs so you can call scene tools to build the final 3D illustration.',
    inputSchema: z.object({
      lesson: z.string().describe('The target physics lesson/problem text'),
      topK: z.number().int().min(1).max(5).optional().default(2),
      category: z
        .string()
        .optional()
        .describe(
          'Optional category: stack_objects, slide_objects, collision_objects'
        ),
      dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true, skip LLM generation and use retrieved top example graph+svg for debugging the pipeline steps.'
        ),
    }),
    execute: async ({ lesson, topK, category, dryRun }) => {
      const requestId = makeRequestId();
      const startedAt = Date.now();
      const warnings: string[] = [];
      const trace: PipelineTraceEntry[] = [];
      const safeTopK = clampTopK(topK);
      const logStage = (
        stage: PipelineStageName,
        status: PipelineStageStatus,
        detail: string,
        data?: Record<string, unknown>
      ) => {
        const entry: PipelineTraceEntry = {
          stage,
          status,
          elapsedMs: Date.now() - startedAt,
          at: new Date().toISOString(),
          detail,
          ...(data ? { data } : {}),
        };
        trace.push(entry);
        const dataMessage = toLogMessage(data);
        const suffix = dataMessage ? ` | data=${dataMessage}` : '';
        console.info(
          `[RAG_PIPELINE][${requestId}] ${stage}/${status} at ${entry.elapsedMs}ms: ${detail}${suffix}`
        );
      };

      logStage('query_input', 'start', 'Received runProblemRagPipeline call', {
        lessonChars: lesson.length,
        lessonPreview: truncateForLog(lesson),
        requestedTopK: topK,
        topKUsed: safeTopK,
        category: category ?? 'all',
        dryRun,
      });

      logStage('indexing', 'start', 'Preparing local RAG index cache');
      const indexStateBefore = getProblemRagIndexState();
      const ragStats = getProblemRagStats();
      const indexStateAfter = getProblemRagIndexState();
      logStage('indexing', 'ok', 'RAG index is ready', {
        cacheBefore: indexStateBefore.cached,
        cacheAfter: indexStateAfter.cached,
        dataRoot: indexStateAfter.dataRoot,
        totalSamples: ragStats.totalSamples,
        categories: ragStats.categories,
      });

      logStage('retrieval_topk', 'start', 'Searching similar examples');
      const candidates = searchProblemExamples(lesson, {
        topK: safeTopK,
        category,
        includeSvg: false,
        lessonChars: 4000,
        graphChars: 6000,
      });

      const examples = candidates
        .map((item) => getProblemExampleByKey(item.key))
        .filter((sample): sample is ProblemRagSample => sample !== null)
        .slice(0, safeTopK);

      if (examples.length === 0) {
        logStage(
          'retrieval_topk',
          'error',
          'No example matched the query after retrieval'
        );
        return {
          requestId,
          found: false,
          trace,
          traceText: formatTraceText(trace),
          timings: {
            total: formatMs(startedAt),
          },
          indexStats: ragStats,
          message:
            'No relevant local lesson/graph/svg examples found in problem corpus.',
        };
      }

      const retrieval = candidates
        .slice(0, examples.length)
        .map((item) => ({
          key: item.key,
          category: item.category,
          score: item.score,
          paths: item.paths,
        }));

      logStage('retrieval_topk', 'ok', 'Top-k examples selected', {
        candidateCount: candidates.length,
        selectedCount: retrieval.length,
        selected: retrieval.map((item) => ({
          key: item.key,
          score: item.score,
          category: item.category,
        })),
      });

      let graphText = '';
      let graphPromptPreview = '';
      logStage('graph_generation', 'start', 'Generating graph from lesson');
      if (dryRun) {
        graphText = examples[0].graph;
        graphPromptPreview = 'dryRun=true, skipped graph generation prompt';
        logStage(
          'graph_generation',
          'fallback',
          'Dry run enabled, reused top retrieved example graph.',
          {
            fallbackKey: examples[0].key,
          }
        );
      } else {
        try {
          const graphResult = await generateGraphText(lesson, examples);
          graphText = graphResult.graphText;
          graphPromptPreview = graphResult.graphPromptPreview;
          logStage('graph_generation', 'ok', 'Graph generated', {
            graphChars: graphText.length,
            graphLines: graphText.split('\n').filter(Boolean).length,
          });
        } catch (error) {
          graphText = examples[0].graph;
          const fallbackMessage =
            'Graph generation failed, fallback to top retrieved example graph.';
          warnings.push(fallbackMessage);
          logStage('graph_generation', 'fallback', fallbackMessage, {
            error: summarizeError(error),
            fallbackKey: examples[0].key,
          });
        }
      }

      let svgText = '';
      let svgPromptPreview = '';
      logStage('svg_generation', 'start', 'Generating SVG from graph');
      if (dryRun) {
        svgText = examples[0].svg;
        svgPromptPreview = 'dryRun=true, skipped svg generation prompt';
        logStage(
          'svg_generation',
          'fallback',
          'Dry run enabled, reused top retrieved example SVG.',
          {
            fallbackKey: examples[0].key,
          }
        );
      } else {
        try {
          const svgResult = await generateSvgText(graphText, examples);
          svgText = svgResult.svgText;
          svgPromptPreview = svgResult.svgPromptPreview;
          logStage('svg_generation', 'ok', 'SVG generated', {
            svgChars: svgText.length,
            hasSvgTag: svgText.includes('<svg'),
          });
        } catch (error) {
          svgText = examples[0].svg;
          const fallbackMessage =
            'SVG generation failed, fallback to top retrieved example SVG.';
          warnings.push(fallbackMessage);
          logStage('svg_generation', 'fallback', fallbackMessage, {
            error: summarizeError(error),
            fallbackKey: examples[0].key,
          });
        }
      }

      const sceneHints = parseGraphHints(graphText);
      logStage(
        'tool_handoff',
        'ok',
        'Scene hints ready. Continue with scene tools.',
        {
          topic: sceneHints.topic ?? null,
          objectCount: sceneHints.objects.length,
          eventCount: sceneHints.events.length,
          quantityCount: sceneHints.quantities.length,
          relationCount: sceneHints.relations.length,
          assumptionCount: sceneHints.assumptions.length,
          questionTargetCount: sceneHints.questionTargets.length,
          dryRun,
        }
      );

      return {
        requestId,
        found: true,
        trace,
        traceText: formatTraceText(trace),
        timings: {
          total: formatMs(startedAt),
        },
        indexStats: ragStats,
        retrieval,
        graphText,
        svgText,
        sceneHints,
        graphPromptPreview,
        svgPromptPreview,
        warnings,
        topKUsed: safeTopK,
        dryRun,
        guidance:
          'Now call scene tools (addElement/editElement/removeElement/setSceneSettings) to build the 3D scene from sceneHints, graphText, and svg layout.',
      };
    },
  }),
};
