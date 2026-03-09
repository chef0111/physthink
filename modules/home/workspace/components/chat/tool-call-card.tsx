'use client';

import { memo } from 'react';
import { Loader } from '@/components/ui/loader';
import TextShimmer from '@/components/ui/text-shimmer';
import {
  CheckCircle2,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  Settings,
  MessageSquare,
  Search,
  BookOpen,
  Globe,
  Code,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { formatToolName, formatArgValue } from '@/lib/utils';

type ToolCardStatus = 'streaming' | 'pending' | 'complete';

interface ToolCallCardProps {
  toolName: string;
  status: ToolCardStatus;
  args?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

const TOOL_ICON: Record<string, LucideIcon> = {
  addElement: Plus,
  addElements: Plus,
  editElement: Pencil,
  removeElement: Trash2,
  setSceneSettings: Settings,
  setStatus: MessageSquare,
  lookupPhysics: Search,
  getPhysicsConstants: Search,
  searchPhysicsKnowledge: BookOpen,
  searchThreeJsDocs: Search,
  getInteractionPattern: BookOpen,
  fetchWebContent: Globe,
  validateCode: Code,
};

export const ToolCallCard = memo(
  function ToolCallCard({ toolName, status, args, output }: ToolCallCardProps) {
    const Icon = (TOOL_ICON[toolName] ?? Wrench) as LucideIcon;
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
    const detailData = rawData
      ? Object.fromEntries(
          Object.entries(rawData).filter(([k]) => k !== 'action')
        )
      : undefined;
    const hasDetails = detailData && Object.keys(detailData).length > 0;

    return (
      <details className="border-border/60 bg-muted/30 group my-1 rounded-lg border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs select-none [&::-webkit-details-marker]:hidden">
          <ChevronRight className="text-muted-foreground/60 size-3 shrink-0 transition-transform group-open:rotate-90" />
          <Icon className="text-muted-foreground size-3.5 shrink-0" />
          <span className="text-muted-foreground min-w-0 flex-1 truncate font-medium">
            {isActive ? (
              <TextShimmer duration={1} className="text-xs">
                {label}
              </TextShimmer>
            ) : (
              label
            )}
          </span>
          {isActive ? (
            <Loader size={14} className="shrink-0" />
          ) : (
            <span className="flex shrink-0 items-center gap-1 text-emerald-500">
              <CheckCircle2 className="size-3.5" />
              <span className="text-[10px] font-medium">Completed</span>
            </span>
          )}
        </summary>
        {hasDetails && (
          <div className="border-border/40 text-muted-foreground mx-3 mb-2 border-t pt-2 font-mono text-[11px] leading-relaxed">
            {Object.entries(detailData).map(([key, value]) => (
              <div key={key} className="flex gap-1.5">
                <span className="text-muted-foreground/70 shrink-0">
                  {key}:
                </span>
                <span className="min-w-0 break-all">
                  {formatArgValue(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </details>
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
