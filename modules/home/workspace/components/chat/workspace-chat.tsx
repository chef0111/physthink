'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { eventIteratorToUnproxiedDataStream } from '@orpc/client';
import { client } from '@/lib/orpc';
import { isDev } from '@/lib/utils';
import { useShallow } from 'zustand/react/shallow';
import { useSceneStore } from '@/stores/scene-store';
import {
  readGenerationMetadataData,
  normalizeThoughtDuration,
  readDebugGenerationData,
  readRetryAdviceData,
  readStreamErrorData,
  sanitizeAssistantTextForDisplay,
} from './utils';
import TextShimmer from '@/components/ui/text-shimmer';
import { ChatMessage } from './chat-message';
import { PromptInput } from './prompt-input';
import { Retry } from './retry';
import {
  useChatAutoScroll,
  useRegenerateMessage,
  useSceneToolEffects,
  type MessageFeedback,
} from './hooks';

interface WorkspaceChatProps {
  workspaceId: string;
  initialMessages: UIMessage[];
  /** Pre-built messageId → feedback map for hydrating initial like/dislike UI. */
  initialFeedbackMap?: Map<string, MessageFeedback>;
}

export function WorkspaceChat({
  workspaceId,
  initialMessages,
  initialFeedbackMap,
}: WorkspaceChatProps) {
  const capabilityIntentRef = useRef<string | undefined>(undefined);
  const appliedToolCalls = useRef(
    new Set<string>(
      initialMessages.flatMap((m) =>
        m.parts
          .filter((p) => 'toolCallId' in p)
          .map((p) => (p as { toolCallId: string }).toolCallId)
      )
    )
  );
  const [input, setInput] = useState('');

  useEffect(() => {
    appliedToolCalls.current = new Set<string>(
      initialMessages.flatMap((m) =>
        m.parts
          .filter((p) => 'toolCallId' in p)
          .map((p) => (p as { toolCallId: string }).toolCallId)
      )
    );
  }, [workspaceId, initialMessages]);

  const {
    addElements,
    updateElement,
    removeElement,
    setSceneSettings,
    setSceneLoading,
  } = useSceneStore(
    useShallow((s) => ({
      addElements: s.addElements,
      updateElement: s.updateElement,
      removeElement: s.removeElement,
      setSceneSettings: s.setSceneSettings,
      setSceneLoading: s.setSceneLoading,
    }))
  );

  const transport = useMemo(
    () => ({
      async sendMessages({
        messages: msgs,
        abortSignal,
      }: {
        messages: UIMessage[];
        abortSignal: AbortSignal | undefined;
        [key: string]: unknown;
      }) {
        const sceneState = useSceneStore.getState();
        const result = await client.workspace.chat.send(
          {
            workspaceId,
            capabilityIntent: capabilityIntentRef.current,
            messages: msgs.map((m) => ({
              id: m.id,
              role: m.role,
              parts: m.parts,
            })),
            sceneData: {
              elements: sceneState.elements.map((el) => ({
                id: el.id,
                type: el.type,
                ...(el.label ? { label: el.label } : {}),
              })),
              sceneSettings: sceneState.sceneSettings as unknown as Record<
                string,
                unknown
              >,
            },
          },
          { signal: abortSignal }
        );
        capabilityIntentRef.current = undefined;
        return eventIteratorToUnproxiedDataStream(result);
      },
      reconnectToStream() {
        throw new Error('Reconnect not supported');
      },
    }),
    [workspaceId]
  );

  const { messages, sendMessage, regenerate, stop, status, clearError } =
    useChat({
      id: workspaceId,
      transport,
      messages: initialMessages,
    });

  const isLoading = status === 'streaming' || status === 'submitted';

  useSceneToolEffects(messages, appliedToolCalls, {
    addElements,
    updateElement,
    removeElement,
    setSceneSettings,
  });

  // Show 3D loading skeleton while scene-modifying tool calls are in progress.
  useEffect(() => {
    if (!isLoading) {
      setSceneLoading(false);
      return;
    }
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return;
    const hasActiveToolCall = lastMsg.parts.some(
      (p) =>
        'toolCallId' in p &&
        'state' in p &&
        (p.state === 'input-streaming' || p.state === 'input-available')
    );
    setSceneLoading(hasActiveToolCall);
  }, [messages, isLoading, setSceneLoading]);

  const { scrollRef, shouldAutoScrollRef, handleScroll } = useChatAutoScroll(
    messages,
    isLoading
  );

  const handleSubmit = () => {
    const raw = input.trim();
    const slashMatch = raw.match(/^\/([a-z0-9_-]+)\s*(.*)$/i);

    let text = raw;
    capabilityIntentRef.current = undefined;

    if (slashMatch) {
      const capability = slashMatch[1].toLowerCase();
      const rest = slashMatch[2]?.trim() ?? '';
      capabilityIntentRef.current = capability;
      text = rest || `Use ${capability} capability for this task.`;
    }

    if (!text || isLoading) return;
    shouldAutoScrollRef.current = true;
    setInput('');
    sendMessage({ text });
  };

  const handleStop = () => {
    stop();
  };

  const lastUserPrompt = useMemo(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (!lastUserMessage) return null;

    const text = lastUserMessage.parts
      .filter(
        (part): part is { type: 'text'; text: string } =>
          part.type === 'text' && typeof part.text === 'string'
      )
      .map((part) => part.text)
      .join('\n')
      .trim();

    return text || null;
  }, [messages]);

  const latestGenerationDebug = useMemo(() => {
    if (!isDev) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role !== 'assistant') continue;
      for (const part of message.parts) {
        const debugData = readDebugGenerationData(part);
        if (debugData) return debugData;
      }
    }
    return null;
  }, [messages]);

  const latestGenerationMetadata = useMemo(() => {
    if (!isDev) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role !== 'assistant') continue;
      for (const part of message.parts) {
        const metadata = readGenerationMetadataData(part);
        if (metadata) return metadata;
      }
    }
    return null;
  }, [messages]);

  const shouldShowRetry = useMemo(() => {
    if (status === 'streaming' || status === 'submitted') return false;
    if (messages.length === 0) return false;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return false;

    const hasMeaningfulAssistantText = lastMessage.parts.some(
      (part) =>
        part.type === 'text' &&
        typeof part.text === 'string' &&
        (() => {
          const cleaned = sanitizeAssistantTextForDisplay(part.text);
          return Boolean(cleaned && !normalizeThoughtDuration(cleaned));
        })()
    );

    let finalAdvice: ReturnType<typeof readRetryAdviceData> = null;
    let streamError = false;

    for (const part of lastMessage.parts) {
      if (readStreamErrorData(part)) {
        streamError = true;
      }

      const retryAdvice = readRetryAdviceData(part);
      if (retryAdvice) {
        if (retryAdvice.stage === 'final') {
          finalAdvice = retryAdvice;
          break;
        }
      }
    }

    if (finalAdvice) return finalAdvice.shouldRetry;

    if (streamError) return true;

    if (status === 'error') {
      return !hasMeaningfulAssistantText;
    }

    return false;
  }, [status, messages]);

  const handleRetry = useCallback(() => {
    if (isLoading) return;
    clearError();
    shouldAutoScrollRef.current = true;
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant');
    if (lastAssistant) {
      void regenerate({ messageId: lastAssistant.id });
      return;
    }
    if (lastUserPrompt) {
      sendMessage({ text: lastUserPrompt });
    }
  }, [
    clearError,
    isLoading,
    lastUserPrompt,
    messages,
    regenerate,
    sendMessage,
    shouldAutoScrollRef,
  ]);

  const { handleRegenerateAtIndex } = useRegenerateMessage(
    messages,
    isLoading,
    sendMessage,
    regenerate,
    shouldAutoScrollRef
  );

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
            <p>
              Describe the 3D physics illustration you want to create.
              <br />
              <span className="text-xs">
                e.g. &ldquo;Create a projectile motion scene&rdquo;
              </span>
            </p>
          </div>
        )}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id}>
                <ChatMessage
                  message={message}
                  isStreaming={isLoading && index === messages.length - 1}
                  initialFeedback={initialFeedbackMap?.get(message.id)}
                  onRegenerate={
                    message.role === 'assistant'
                      ? () => handleRegenerateAtIndex(index)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        )}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="text-muted-foreground py-4 text-sm">
            <TextShimmer duration={1}>Working...</TextShimmer>
          </div>
        )}
        {shouldShowRetry && <Retry className="my-2" onClick={handleRetry} />}
      </div>
      <div className="border-t p-3">
        {isDev && latestGenerationDebug && (
          <div className="text-muted-foreground mb-2 text-[11px] leading-relaxed">
            debug: steps={latestGenerationDebug.stepCount} ; stop=
            {latestGenerationDebug.stopReason} ; tools=
            {latestGenerationDebug.toolCallCount} ; elapsed=
            {latestGenerationDebug.elapsedSec}s
            {latestGenerationMetadata
              ? ` ; finish=${latestGenerationMetadata.finishReason} ; attempts=${latestGenerationMetadata.totalToolAttempts} ; forced=${latestGenerationMetadata.forceTextOnly ? 'yes' : 'no'}`
              : ''}
          </div>
        )}
        <PromptInput
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onStop={handleStop}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
