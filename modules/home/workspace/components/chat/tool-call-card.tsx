'use client';

import { memo } from 'react';
import { Loader } from '@/components/ui/loader';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from '@/components/ai-elements/tool';
import { CheckCircle2 } from 'lucide-react';
import { formatToolName, formatArgValue } from '@/lib/utils';

type ToolCardStatus = 'streaming' | 'pending' | 'complete';

interface ToolCallCardProps {
  toolName: string;
  status: ToolCardStatus;
  args?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

const SAFE_FIELDS_BY_TOOL: Record<string, string[]> = {
  addElement: ['action', 'element'],
  addElements: ['action', 'elements'],
  editElement: ['action', 'id', 'updates'],
  removeElement: ['action', 'id'],
  setSceneSettings: ['action', 'settings'],
  setStatus: ['status'],
  getPhysicsConstants: ['found', 'name', 'symbol', 'value', 'unit', 'source'],
  searchPhysicsKnowledge: ['count'],
  searchThreeJsDocs: ['count'],
  getInteractionPattern: ['found', 'name', 'source'],
  searchProblemExamples: ['count', 'totalSamples'],
  getProblemExampleByKey: ['found', 'source'],
  runProblemRagPipeline: [
    'found',
    'message',
    'warnings',
    'topKUsed',
    'dryRun',
    'retrievalCount',
  ],
  fetchWebContent: ['source', 'error'],
  validateCode: ['valid', 'language', 'errors'],
};

function sanitizeDisplayValue(value: unknown): string {
  const raw = formatArgValue(value);
  return raw
    .replace(/https?:\/\/[^\s)]+/g, '[redacted]')
    .replace(/\b[A-Za-z0-9+/_-]{32,}\b/g, '[redacted]');
}

function sanitizeValueForJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeDisplayValue(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(sanitizeValueForJson);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeValueForJson(v),
      ])
    );
  }
  return sanitizeDisplayValue(String(value));
}

function toToolUiState(
  toolName: string,
  status: ToolCardStatus
): ToolPart['state'] {
  if (toolName === 'fetchWebContent') {
    return status === 'complete' ? 'output-available' : 'approval-requested';
  }

  if (status === 'streaming') return 'input-streaming';
  if (status === 'pending') return 'input-available';
  return 'output-available';
}

export const ToolCallCard = memo(
  function ToolCallCard({ toolName, status, args, output }: ToolCallCardProps) {
    const label = formatToolName(toolName) || 'Tool Call';

    const isActive = status === 'streaming' || status === 'pending';

    if (toolName === 'setStatus') {
      const statusText =
        (output as { status?: string } | undefined)?.status ??
        (args as { status?: string } | undefined)?.status;
      if (statusText) {
        return (
          <div className="text-muted-foreground flex items-center gap-2 py-0.5 text-xs">
            {isActive ? (
              <Loader size={14} />
            ) : (
              <CheckCircle2 className="text-muted-foreground/50 size-3.5 shrink-0" />
            )}
            <span className={isActive ? '' : 'text-muted-foreground/50'}>
              {statusText}
            </span>
          </div>
        );
      }
    }

    const parsed =
      typeof output === 'string'
        ? (() => {
            try {
              return JSON.parse(output) as Record<string, unknown>;
            } catch {
              return undefined;
            }
          })()
        : output;
    const rawData = parsed ?? args;
    const allowKeys = SAFE_FIELDS_BY_TOOL[toolName] ?? [];
    const filteredDetailData =
      rawData && typeof rawData === 'object' && !Array.isArray(rawData)
        ? Object.fromEntries(
            Object.entries(rawData).filter(
              ([k]) => allowKeys.includes(k) && k !== 'action'
            )
          )
        : undefined;
    const detailData =
      filteredDetailData && Object.keys(filteredDetailData).length > 0
        ? filteredDetailData
        : undefined;
    const hasDetails = detailData && Object.keys(detailData).length > 0;

    const toolState = toToolUiState(toolName, status);
    const sanitizedInput = sanitizeValueForJson(args ?? {});
    const sanitizedOutput = sanitizeValueForJson(detailData ?? output ?? {});

    return (
      <Tool defaultOpen={false}>
        <ToolHeader
          type={'dynamic-tool'}
          toolName={toolName}
          state={toolState}
          title={label}
        />
        <ToolContent>
          <ToolInput input={sanitizedInput as ToolPart['input']} />
          {(status === 'complete' || hasDetails) && (
            <ToolOutput
              output={sanitizedOutput as ToolPart['output']}
              errorText={undefined}
            />
          )}
        </ToolContent>
      </Tool>
    );
  },

  function areEqual(prev: ToolCallCardProps, next: ToolCallCardProps) {
    return (
      prev.toolName === next.toolName &&
      prev.status === next.status &&
      prev.output === next.output &&
      prev.args === next.args
    );
  }
);
