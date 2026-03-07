'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useSceneStore, type SceneElement } from '@/lib/stores/scene-store';
import { ChatMessage } from './chat-message';
import { PromptInput } from './prompt-input';
import { ToolStatus } from './tool-status';
import { nanoid } from 'nanoid';

interface WorkspaceChatProps {
  workspaceId: string;
  initialMessages: UIMessage[];
}

function dbMessagesToAiMessages(
  dbMessages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }>
): UIMessage[] {
  return dbMessages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage['role'],
    parts: [{ type: 'text' as const, text: m.content }],
  }));
}

export { dbMessagesToAiMessages };

export function WorkspaceChat({
  workspaceId,
  initialMessages,
}: WorkspaceChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const appliedToolCalls = useRef(new Set<string>());
  const [input, setInput] = useState('');
  const { addElement, updateElement, removeElement, setSceneSettings } =
    useSceneStore();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/workspace/chat',
        body: () => ({
          workspaceId,
          sceneData: {
            elements: useSceneStore.getState().elements,
            sceneSettings: useSceneStore.getState().sceneSettings,
          },
        }),
      }),
    [workspaceId]
  );

  const { messages, sendMessage, status } = useChat({
    id: workspaceId,
    transport,
    messages: initialMessages,
  });

  // Apply tool results from streamed messages to Zustand store
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const part of message.parts) {
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
            const element = output.element as Omit<SceneElement, 'id'>;
            const id = nanoid();
            addElement({ ...element, id } as SceneElement);
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
    }
  }, [messages, addElement, updateElement, removeElement, setSceneSettings]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage({ text });
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
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
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <ToolStatus status="Thinking..." />
        )}
      </div>
      <div className="border-t p-3">
        <PromptInput
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
