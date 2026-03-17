'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { eventIteratorToUnproxiedDataStream } from '@orpc/client';
import { client } from '@/lib/orpc';
import { isDev } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { useShallow } from 'zustand/react/shallow';
import { useSceneStore, type SceneElement } from '@/stores/scene-store';
import { readDebugGenerationData, readRetryAdviceData } from './utils';
import TextShimmer from '@/components/ui/text-shimmer';
import { ChatMessage } from './chat-message';
import { PromptInput } from './prompt-input';
import { Retry } from './retry';

interface WorkspaceChatProps {
  workspaceId: string;
  initialMessages: UIMessage[];
}

export function WorkspaceChat({
  workspaceId,
  initialMessages,
}: WorkspaceChatProps) {
  const AUTO_SCROLL_THRESHOLD_PX = 64;
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const appliedToolCalls = useRef(
    new Set<string>(
      initialMessages.flatMap((m) =>
        m.parts
          .filter((p) => 'toolCallId' in p)
          .map((p) => (p as { toolCallId: string }).toolCallId)
      )
    )
  );
  const batchAddAppliedForMsg = useRef<string | null>(null);
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
        return eventIteratorToUnproxiedDataStream(result);
      },
      reconnectToStream() {
        throw new Error('Reconnect not supported');
      },
    }),
    [workspaceId]
  );

  const { messages, sendMessage, stop, status } = useChat({
    id: workspaceId,
    transport,
    messages: initialMessages,
  });

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return;

    const newElements: SceneElement[] = [];

    for (const part of lastMsg.parts) {
      if (
        'toolCallId' in part &&
        'state' in part &&
        part.state === 'output-available' &&
        'output' in part
      ) {
        const toolCallId = (part as { toolCallId: string }).toolCallId;
        if (appliedToolCalls.current.has(toolCallId)) continue;
        appliedToolCalls.current.add(toolCallId);

        const output = part.output as Record<string, unknown>;
        const action = output?.action;

        if (action === 'addElement') {
          // Skip if addElements was already applied for this assistant message
          if (batchAddAppliedForMsg.current === lastMsg.id) continue;
          const element = output.element as Omit<SceneElement, 'id'>;
          const id = nanoid();
          newElements.push({ ...element, id } as SceneElement);
        } else if (action === 'addElements') {
          // Only apply the first addElements per assistant message (cross-step dedup)
          if (batchAddAppliedForMsg.current === lastMsg.id) continue;
          batchAddAppliedForMsg.current = lastMsg.id;
          const elements = output.elements as Array<Omit<SceneElement, 'id'>>;
          for (const el of elements) {
            newElements.push({ ...el, id: nanoid() } as SceneElement);
          }
        } else if (action === 'editElement') {
          updateElement(
            output.id as string,
            output.updates as Partial<SceneElement>
          );
        } else if (action === 'removeElement') {
          removeElement(output.id as string);
        } else if (action === 'setSceneSettings') {
          setSceneSettings(
            output.settings as Partial<{
              gridVisible: boolean;
              axesVisible: boolean;
              backgroundColor: string;
            }>
          );
        }
      }
    }

    if (newElements.length > 0) {
      addElements(newElements);
    }
  }, [messages, addElements, updateElement, removeElement, setSceneSettings]);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Show 3D loading skeleton while scene-modifying tool calls are in progress
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

  const updateAutoScrollPreference = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const distanceFromBottom =
      scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    shouldAutoScrollRef.current =
      distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
  }, [AUTO_SCROLL_THRESHOLD_PX]);

  const handleScroll = useCallback(() => {
    updateAutoScrollPreference();
  }, [updateAutoScrollPreference]);

  // Auto-scroll only when user is near bottom (RAF-debounced)
  const rafRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      if (!shouldAutoScrollRef.current) return;
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleSubmit = () => {
    const text = input.trim();
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
        if (debugData) {
          return debugData;
        }
      }
    }

    return null;
  }, [messages]);

  const shouldShowRetry = useMemo(() => {
    if (status === 'error') return true;
    if (isLoading || messages.length === 0) return false;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return false;

    for (const part of lastMessage.parts) {
      const retryAdvice = readRetryAdviceData(part);
      if (retryAdvice) {
        return retryAdvice.shouldRetry;
      }
    }

    const hasToolCalls = lastMessage.parts.some(
      (part) => 'toolCallId' in part && 'state' in part
    );

    const textParts = lastMessage.parts.filter(
      (part): part is { type: 'text'; text: string } =>
        part.type === 'text' && typeof part.text === 'string'
    );

    const hasMalformedToolCallText = textParts.some((part) => {
      const text = part.text.trim();
      if (/FN_CALL\s*=\s*TRUE/i.test(text)) return true;
      if (/"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(text)) {
        return true;
      }
      return false;
    });

    const hasVisibleText = textParts.some((part) => {
      const text = part.text.trim();
      if (!text) return false;
      if (/^Thought for [\d.]+s$/i.test(text)) return false;
      if (/FN_CALL\s*=\s*TRUE/i.test(text)) return false;
      if (/"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(text)) {
        return false;
      }
      return true;
    });

    const hasReasoning = lastMessage.parts.some(
      (part) =>
        part.type === 'reasoning' &&
        typeof (part as { text?: string }).text === 'string'
    );

    const stopReasonUnknown = latestGenerationDebug?.stopReason === 'unknown';

    // Retry when generation ended without a usable assistant answer,
    // including cases where the model leaked raw tool-call JSON into text.
    return (
      hasMalformedToolCallText ||
      (!hasVisibleText && (stopReasonUnknown || !hasToolCalls || hasReasoning))
    );
  }, [status, isLoading, messages, latestGenerationDebug]);

  const handleRetry = useCallback(() => {
    if (!lastUserPrompt || isLoading) return;
    shouldAutoScrollRef.current = true;
    sendMessage({ text: lastUserPrompt });
  }, [lastUserPrompt, isLoading, sendMessage]);

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
