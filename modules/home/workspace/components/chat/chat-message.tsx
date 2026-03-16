'use client';

import { memo, useCallback, useMemo } from 'react';
import { type UIMessage } from 'ai';
import { ToolCallCard } from './tool-call-card';
import { ChatMarkdownPreview } from './chat-markdown-preview';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import TextShimmer from '@/components/ui/text-shimmer';

const THOUGHT_DURATION_RE = /^Thought for [\d.]+s$/;
const THOUGHT_DURATION_SECONDS_RE = /^Thought for ([\d.]+) seconds?$/i;
const URL_RE = /https?:\/\/[^\s)]+/g;
const TOKEN_RE = /\b[A-Za-z0-9+/_-]{32,}\b/g;

function normalizeThoughtDuration(text: string): string | null {
  const normalized = text.trim();
  if (THOUGHT_DURATION_RE.test(normalized)) return normalized;
  const secondsMatch = normalized.match(THOUGHT_DURATION_SECONDS_RE);
  if (!secondsMatch) return null;
  const value = Number(secondsMatch[1]);
  if (!Number.isFinite(value)) return null;
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `Thought for ${rounded}s`;
}

function sanitizeReasoningClient(text: string): string {
  return text
    .replace(URL_RE, '[redacted]')
    .replace(TOKEN_RE, '[redacted]')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !line.toLowerCase().includes('trace:') &&
        !line.toLowerCase().includes('raw payload') &&
        !line.toLowerCase().includes('tool output:')
    )
    .join('\n');
}

function formatReasoningForDisplay(text: string): string {
  const sanitized = sanitizeReasoningClient(text);
  if (!sanitized) return '';

  const lines = sanitized
    .split('\n')
    .flatMap((line) =>
      line
        .split(/(?<=[.;!?])\s+(?=[A-Z0-9(])/g)
        .map((segment) => segment.trim())
        .filter(Boolean)
    )
    .map((line) => (line.length > 260 ? `${line.slice(0, 260)}...` : line))
    .slice(0, 24);

  return lines.join('\n');
}

function toReasoningSteps(text: string): string[] {
  return formatReasoningForDisplay(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function parseThoughtDurationSeconds(text: string | null): number | undefined {
  if (!text) return undefined;
  const normalized = normalizeThoughtDuration(text);
  if (!normalized) return undefined;
  const match = normalized.match(/^Thought for ([\d.]+)s$/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return undefined;
  return Math.max(1, Math.round(value));
}

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export const ChatMessage = memo(
  function ChatMessage({ message, isStreaming }: ChatMessageProps) {
    const isUser = message.role === 'user';

    // "Thought for Xs" marker emitted by extractReasoningMiddleware
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

    const thoughtDurationSeconds = useMemo(
      () => parseThoughtDurationSeconds(thoughtDurationText),
      [thoughtDurationText]
    );

    const reasoningHeaderText = useMemo(() => {
      if (isStreaming) return null;
      if (thoughtDurationSeconds !== undefined) {
        return `Thought for ${thoughtDurationSeconds}s`;
      }
      if (thoughtDurationText) {
        return thoughtDurationText;
      }
      return 'Thought for a few seconds';
    }, [isStreaming, thoughtDurationSeconds, thoughtDurationText]);

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

    const thoughtDuration =
      !isUser && thoughtDurationText !== null && !hasReasoning;

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
              {thoughtDurationText}
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
              return <ChatMarkdownPreview key={i} content={part.text} />;
            }
            if (part.type === 'reasoning') {
              const rawText =
                typeof part.text === 'string'
                  ? part.text
                  : String(part.text ?? '');
              const steps = toReasoningSteps(rawText);
              if (steps.length === 0) return null;

              return (
                <ChainOfThought
                  key={`reasoning-${message.id}-${i}`}
                  defaultOpen={Boolean(isStreaming)}
                >
                  <ChainOfThoughtHeader>
                    {isStreaming ? (
                      <TextShimmer duration={1}>Thinking...</TextShimmer>
                    ) : (
                      reasoningHeaderText
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
                          isStreaming && idx === steps.length - 1
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
