'use client';

import { useEffect } from 'react';
import { type UIMessage } from '@ai-sdk/react';
import { nanoid } from 'nanoid';
import { type SceneElement } from '@/stores/scene-store';

type SceneActions = {
  addElements: (elements: SceneElement[]) => void;
  updateElement: (id: string, updates: Partial<SceneElement>) => void;
  removeElement: (id: string) => void;
  setSceneSettings: (
    settings: Partial<{
      gridVisible: boolean;
      axesVisible: boolean;
      backgroundColor: string;
    }>
  ) => void;
};

/**
 * Applies completed tool-call outputs as mutations to the 3D scene.
 * Deduplicates by tool call ID so each action fires exactly once.
 */
export function useSceneToolEffects(
  messages: UIMessage[],
  appliedToolCalls: React.RefObject<Set<string>>,
  { addElements, updateElement, removeElement, setSceneSettings }: SceneActions
) {
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
          const element = output.element as Omit<SceneElement, 'id'>;
          newElements.push({ ...element, id: nanoid() } as SceneElement);
        } else if (action === 'addElements') {
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

    if (newElements.length > 0) addElements(newElements);
  }, [
    messages,
    appliedToolCalls,
    addElements,
    updateElement,
    removeElement,
    setSceneSettings,
  ]);
}
