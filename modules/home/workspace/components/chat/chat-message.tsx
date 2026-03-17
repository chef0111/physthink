'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type UIMessage } from 'ai';
import { ToolCallCard } from './tool-call-card';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@/components/ai-elements/message';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import TextShimmer from '@/components/ui/text-shimmer';
import { CheckIcon, CopyIcon, ThumbsDownIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  normalizeThoughtDuration,
  readDebugGenerationData,
  toReasoningSteps,
} from './utils';

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

type ReasoningPartWithDuration = {
  type: 'reasoning';
  text?: string;
  durationText?: string;
};

type DurationMarker = {
  index: number;
  duration: string;
};

export const ChatMessage = memo(
  function ChatMessage({ message, isStreaming }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const [measuredDurationSec, setMeasuredDurationSec] = useState<
      number | null
    >(null);
    const [copied, setCopied] = useState(false);
    const streamStartRef = useRef<number | null>(null);

    useEffect(() => {
      if (isUser) return;

      if (isStreaming) {
        if (streamStartRef.current === null) {
          streamStartRef.current = Date.now();
        }
        return;
      }

      if (streamStartRef.current !== null && measuredDurationSec === null) {
        const elapsed = Math.max(
          1,
          Math.round((Date.now() - streamStartRef.current) / 1000)
        );
        setMeasuredDurationSec(elapsed);
        streamStartRef.current = null;
      }
    }, [isStreaming, isUser, measuredDurationSec]);

    const thoughtDurationTextFromParts =
      message.parts
        .filter(
          (p): p is { type: 'text'; text: string } =>
            p.type === 'text' &&
            normalizeThoughtDuration(
              (p as { text: string }).text?.trim() ?? ''
            ) !== null
        )
        .at(0)
        ?.text?.trim() ?? null;

    const thoughtDurationText = useMemo(() => {
      return thoughtDurationTextFromParts
        ? normalizeThoughtDuration(thoughtDurationTextFromParts)
        : null;
    }, [thoughtDurationTextFromParts]);

    const reasoningIndexes = useMemo(
      () =>
        message.parts
          .map((part, index) => ({ index, part }))
          .filter(
            ({ part }) =>
              part.type === 'reasoning' &&
              typeof (part as { text?: string }).text === 'string'
          )
          .map(({ index }) => index),
      [message.parts]
    );

    const activeReasoningIndex =
      isStreaming && reasoningIndexes.length > 0
        ? reasoningIndexes[reasoningIndexes.length - 1]
        : -1;
    const latestReasoningIndex =
      reasoningIndexes.length > 0
        ? reasoningIndexes[reasoningIndexes.length - 1]
        : -1;

    const reasoningDurationsByIndex = useMemo(() => {
      const durations = new Map<number, string | null>();
      const markers: DurationMarker[] = [];
      const explicitDurations = new Map<number, string>();

      message.parts.forEach((part, index) => {
        if (part.type === 'text' && typeof part.text === 'string') {
          const normalized = normalizeThoughtDuration(part.text);
          if (normalized) {
            markers.push({ index, duration: normalized });
          }
          return;
        }

        if (part.type === 'reasoning') {
          const explicitDuration = normalizeThoughtDuration(
            (part as ReasoningPartWithDuration).durationText ?? ''
          );
          if (explicitDuration) {
            explicitDurations.set(index, explicitDuration);
            durations.set(index, explicitDuration);
          }
        }
      });

      const usedMarkerIndexes = new Set<number>();

      for (const reasoningIndex of reasoningIndexes) {
        if (durations.has(reasoningIndex)) continue;

        let bestMarker: DurationMarker | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const marker of markers) {
          if (usedMarkerIndexes.has(marker.index)) continue;
          const distance = Math.abs(marker.index - reasoningIndex);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMarker = marker;
          }
        }

        if (bestMarker) {
          usedMarkerIndexes.add(bestMarker.index);
          durations.set(reasoningIndex, bestMarker.duration);
        } else {
          durations.set(reasoningIndex, null);
        }
      }

      return durations;
    }, [message.parts, reasoningIndexes]);

    const debugGenerationData = useMemo(() => {
      for (const part of message.parts) {
        const debugData = readDebugGenerationData(part);
        if (debugData) return debugData;
      }
      return null;
    }, [message.parts]);

    const persistedPerChainFallbackDurationText = useMemo(() => {
      if (!debugGenerationData || reasoningIndexes.length === 0) return null;
      const perChainSeconds = Math.max(
        1,
        Math.round(debugGenerationData.elapsedSec / reasoningIndexes.length)
      );
      return `Thought for ${perChainSeconds}s`;
    }, [debugGenerationData, reasoningIndexes.length]);

    const hasTextContent = message.parts.some(
      (p) =>
        p.type === 'text' &&
        (p as { text: string }).text &&
        normalizeThoughtDuration((p as { text: string }).text?.trim() ?? '') ===
          null
    );

    const hasReasoning = message.parts.some(
      (p) =>
        p.type === 'reasoning' &&
        typeof (p as { text?: string }).text === 'string'
    );

    const assistantVisibleText = useMemo(() => {
      if (isUser) return '';
      return message.parts
        .filter(
          (part): part is { type: 'text'; text: string } =>
            part.type === 'text' && typeof part.text === 'string'
        )
        .map((part) => part.text.trim())
        .filter((text) => {
          if (!text) return false;
          if (normalizeThoughtDuration(text)) return false;
          if (/FN_CALL\s*=\s*TRUE/i.test(text)) return false;
          if (/"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(text)) {
            return false;
          }
          return true;
        })
        .join('\n\n');
    }, [isUser, message.parts]);

    const handleCopyResponse = useCallback(async () => {
      if (!assistantVisibleText) return;
      try {
        await navigator.clipboard.writeText(assistantVisibleText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
        toast.success('Response copied to clipboard');
      } catch {
        toast.error('Could not copy response');
      }
    }, [assistantVisibleText]);

    const handleDislikeResponse = useCallback(() => {
      toast('Feedback noted. I will improve the next response.');
    }, []);

    const isThinking =
      isStreaming &&
      !isUser &&
      !hasTextContent &&
      !hasReasoning &&
      !thoughtDurationText;

    const thoughtDuration =
      !isUser &&
      !hasReasoning &&
      (thoughtDurationText !== null || measuredDurationSec !== null);

    if (isUser) {
      return (
        <Message from="user">
          <MessageContent>
            {message.parts.map((part, i) =>
              part.type === 'text' && part.text ? (
                <div key={i} className="whitespace-pre-wrap">
                  {part.text}
                </div>
              ) : null
            )}
          </MessageContent>
        </Message>
      );
    }

    return (
      <Message from="assistant">
        <MessageContent>
          {isThinking && (
            <div className="text-muted-foreground py-1 text-sm">
              <TextShimmer duration={1}>Processing...</TextShimmer>
            </div>
          )}
          {thoughtDuration && (
            <div className="text-muted-foreground py-1 text-xs">
              {thoughtDurationText ?? `Thought for ${measuredDurationSec}s`}
            </div>
          )}

          {message.parts.map((part, i) => {
            if (part.type === 'text' && part.text) {
              if (normalizeThoughtDuration(part.text.trim())) return null;
              const isLastPart = i === message.parts.length - 1;
              if (isStreaming && isLastPart) {
                return (
                  <div
                    key={i}
                    className="text-foreground text-sm whitespace-pre-wrap"
                  >
                    {part.text}
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-text-bottom" />
                  </div>
                );
              }
              return (
                <MessageResponse key={i} className="text-sm leading-relaxed">
                  {part.text}
                </MessageResponse>
              );
            }
            if (part.type === 'reasoning') {
              const rawText =
                typeof part.text === 'string'
                  ? part.text
                  : String(part.text ?? '');
              const steps = toReasoningSteps(rawText);
              if (steps.length === 0) return null;

              const chainDurationText =
                reasoningDurationsByIndex.get(i) ?? null;
              const isChainStreaming =
                isStreaming && i === activeReasoningIndex;
              const chainHeaderText = chainDurationText
                ? chainDurationText
                : persistedPerChainFallbackDurationText
                  ? persistedPerChainFallbackDurationText
                  : !isStreaming &&
                      i === latestReasoningIndex &&
                      measuredDurationSec !== null
                    ? `Thought for ${measuredDurationSec}s`
                    : 'Thought for a few seconds';

              return (
                <ChainOfThought
                  key={`reasoning-${message.id}-${i}`}
                  defaultOpen={Boolean(isChainStreaming)}
                >
                  <ChainOfThoughtHeader>
                    {isChainStreaming ? (
                      <TextShimmer duration={1}>Thinking...</TextShimmer>
                    ) : (
                      chainHeaderText
                    )}
                  </ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    {steps.map((step, idx) => (
                      <ChainOfThoughtStep
                        key={`${message.id}-reasoning-step-${idx}`}
                        label={
                          <span className="whitespace-pre-wrap">{step}</span>
                        }
                        status={
                          isChainStreaming && idx === steps.length - 1
                            ? 'active'
                            : 'complete'
                        }
                      />
                    ))}
                  </ChainOfThoughtContent>
                </ChainOfThought>
              );
            }
            if ('toolCallId' in part && 'state' in part) {
              const toolName =
                typeof part.type === 'string' && part.type.startsWith('tool-')
                  ? part.type.slice(5)
                  : 'toolName' in part
                    ? (part as { toolName: string }).toolName
                    : 'unknownTool';
              const output =
                'output' in part
                  ? (part.output as Record<string, unknown>)
                  : undefined;
              const input =
                'input' in part
                  ? (part.input as Record<string, unknown>)
                  : undefined;

              const cardKey =
                'toolCallId' in part
                  ? (part.toolCallId as string)
                  : `tool-${i}`;

              if (part.state === 'output-available') {
                return (
                  <ToolCallCard
                    key={cardKey}
                    toolName={toolName}
                    status="complete"
                    args={input}
                    output={output}
                  />
                );
              }
              // Tool call in progress (streaming/pending)
              if (
                part.state === 'input-streaming' ||
                part.state === 'input-available'
              ) {
                return (
                  <ToolCallCard
                    key={cardKey}
                    toolName={toolName}
                    status={
                      part.state === 'input-streaming' ? 'streaming' : 'pending'
                    }
                    args={input}
                  />
                );
              }
              return null;
            }
            return null;
          })}

          {assistantVisibleText && !isStreaming && (
            <MessageToolbar className="mt-1">
              <MessageActions>
                <MessageAction
                  tooltip="Dislike response"
                  label="Dislike response"
                  onClick={handleDislikeResponse}
                >
                  <ThumbsDownIcon className="size-4" />
                </MessageAction>
                <MessageAction
                  tooltip={copied ? 'Copied' : 'Copy response'}
                  label={copied ? 'Copied response' : 'Copy response'}
                  onClick={handleCopyResponse}
                >
                  {copied ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </MessageAction>
              </MessageActions>
            </MessageToolbar>
          )}
        </MessageContent>
      </Message>
    );
  },

  function areEqual(prev: ChatMessageProps, next: ChatMessageProps) {
    if (prev.message.id !== next.message.id) return false;
    if (prev.isStreaming !== next.isStreaming) return false;
    if (prev.message.parts.length !== next.message.parts.length) return false;
    // If still streaming, always re-render (text is being appended)
    if (next.isStreaming) return false;
    return true;
  }
);
