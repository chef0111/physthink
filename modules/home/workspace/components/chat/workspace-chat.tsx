'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { eventIteratorToUnproxiedDataStream } from '@orpc/client';
import { client } from '@/lib/orpc';
import { useShallow } from 'zustand/react/shallow';
import { useSceneStore, type SceneElement } from '@/stores/scene-store';
import { ChatMessage } from './chat-message';
import { PromptInput } from './prompt-input';
import { nanoid } from 'nanoid';
import TextShimmer from '@/components/ui/text-shimmer';

interface WorkspaceChatProps {
  workspaceId: string;
  initialMessages: UIMessage[];
}

function dbMessagesToAiMessages(
  dbMessages: Array<{
    id: string;
    role: string;
    content: string;
    parts?: unknown;
    createdAt: Date;
  }>
): UIMessage[] {
  return dbMessages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage['role'],
    parts: Array.isArray(m.parts)
      ? (m.parts as UIMessage['parts'])
      : [{ type: 'text' as const, text: m.content }],
  }));
}

export { dbMessagesToAiMessages };

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

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 80,
    overscan: 3,
  });

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
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const message = messages[virtualItem.index];
              return (
                <div
                  key={message.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: '16px',
                  }}
                >
                  <ChatMessage
                    message={message}
                    isStreaming={
                      isLoading && virtualItem.index === messages.length - 1
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="text-muted-foreground py-1 text-sm">
            <TextShimmer duration={1}>Thinking...</TextShimmer>
          </div>
        )}
      </div>
      <div className="border-t p-3">
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
