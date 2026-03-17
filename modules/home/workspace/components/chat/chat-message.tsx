'use client';

import { memo, useMemo } from 'react';
import { type UIMessage } from 'ai';
import { ToolCallCard } from './tool-call-card';
import {
  Message,
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
import { normalizeThoughtDuration, toReasoningSteps } from './utils';
import {
  useCopyResponse,
  useMessageFeedback,
  useReasoningDurations,
  useStreamDuration,
  type MessageFeedback,
} from './hooks';
import {
  CopyAction,
  DislikeAction,
  LikeAction,
  RegenerateAction,
} from './message-actions';

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  initialFeedback?: MessageFeedback | null;
  onRegenerate?: () => void;
}

export const ChatMessage = memo(
  function ChatMessage({
    message,
    isStreaming,
    initialFeedback,
    onRegenerate,
  }: ChatMessageProps) {
    const isUser = message.role === 'user';

    const measuredDurationSec = useStreamDuration(isStreaming, isUser);

    const {
      activeReasoningIndex,
      latestReasoningIndex,
      reasoningDurationsByIndex,
      liveReasoningDurations,
    } = useReasoningDurations(message.parts, isStreaming, isUser);

    const { feedback, handleLike, handleDislike, isFeedbackPending } =
      useMessageFeedback(message.id, initialFeedback);

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
          if (/"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(text))
            return false;
          return true;
        })
        .join('\n\n');
    }, [isUser, message.parts]);

    const { copied, handleCopy } = useCopyResponse(assistantVisibleText);

    const thoughtDurationText = useMemo(() => {
      const raw = message.parts
        .filter(
          (p): p is { type: 'text'; text: string } =>
            p.type === 'text' &&
            normalizeThoughtDuration(
              (p as { text: string }).text?.trim() ?? ''
            ) !== null
        )
        .at(0)
        ?.text?.trim();
      return raw ? normalizeThoughtDuration(raw) : null;
    }, [message.parts]);

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

    const isThinking =
      isStreaming &&
      !isUser &&
      !hasTextContent &&
      !hasReasoning &&
      !thoughtDurationText;

    const showThoughtDuration =
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
          {showThoughtDuration && (
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
              const isChainStreaming = Boolean(
                isStreaming && i === activeReasoningIndex
              );
              const liveChainDurationText =
                liveReasoningDurations.get(i) ?? null;
              const chainHeaderText =
                chainDurationText ??
                liveChainDurationText ??
                (!isStreaming &&
                i === latestReasoningIndex &&
                measuredDurationSec !== null
                  ? `Thought for ${measuredDurationSec}s`
                  : 'Thought for a few seconds');

              return (
                <ChainOfThought
                  key={`reasoning-${message.id}-${i}`}
                  defaultOpen={isChainStreaming}
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
                <RegenerateAction
                  onClick={onRegenerate}
                  disabled={!onRegenerate || isFeedbackPending}
                />
                <LikeAction
                  onClick={handleLike}
                  disabled={isFeedbackPending}
                  variant={feedback === 'like' ? 'secondary' : 'ghost'}
                />
                <DislikeAction
                  onClick={handleDislike}
                  disabled={isFeedbackPending}
                  variant={feedback === 'dislike' ? 'secondary' : 'ghost'}
                />
                <CopyAction copied={copied} onClick={handleCopy} />
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
    if (next.isStreaming) return false;
    return true;
  }
);
