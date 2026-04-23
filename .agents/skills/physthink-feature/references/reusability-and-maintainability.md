# Reusability and Maintainability Conventions

## Goal

Optimize for small, composable units: custom hooks for UI behavior, utility functions for data shaping, and focused components.

## Conventions

1. Extract reusable UI behavior into hooks.
2. Centralize parsing/sanitization/data mapping in utility modules.
3. Keep components focused on rendering + event wiring.
4. Use hook barrels (`hooks/index.ts`) for stable imports.
5. Split large features into subcomponents (`message-actions`, `tool-status`, `retry`, etc.).

## Code example: custom hook extraction

Source: `modules/home/workspace/components/chat/hooks/use-chat-auto-scroll.ts`

```ts
export function useChatAutoScroll(messages: UIMessage[], isLoading: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const rafRef = useRef(0);

  const updatePreference = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current =
      distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
  }, []);

  const handleScroll = useCallback(() => {
    updatePreference();
  }, [updatePreference]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el || !shouldAutoScrollRef.current) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, isLoading]);

  return { scrollRef, shouldAutoScrollRef, handleScroll };
}
```

## Code example: side-effect hook for tool outputs

Source: `modules/home/workspace/components/chat/hooks/use-scene-tool-effects.ts`

```ts
export function useSceneToolEffects(
  messages: UIMessage[],
  appliedToolCalls: React.RefObject<Set<string>>,
  { addElements, updateElement, removeElement, setSceneSettings }: SceneActions
) {
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return;

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
        // apply action to scene store
      }
    }
  }, [
    messages,
    appliedToolCalls,
    addElements,
    updateElement,
    removeElement,
    setSceneSettings,
  ]);
}
```

## Code example: utility extraction for fetch-state normalization

Source: `lib/query/helper.ts`

```ts
export async function queryFetch<T>(
  promise: Promise<T>,
  fallbackMessage: string
): Promise<Result<T, FetchError>> {
  try {
    const data = await promise;
    return { ok: true, value: data };
  } catch (e) {
    return {
      ok: false,
      error: {
        message: getErrorMessage(e, fallbackMessage),
        cause: e,
      },
    };
  }
}

export function resolveData<T, U, E>(
  result: Result<T, E>,
  select: (data: T) => U,
  empty: U
) {
  return result.ok
    ? { data: select(result.value), success: true, error: undefined }
    : { data: empty, success: false, error: result.error };
}
```

## Code example: hook barrel for stable imports

Source: `modules/home/workspace/components/chat/hooks/index.ts`

```ts
export { useRegenerateMessage } from './use-regenerate-message';
export { useChatAutoScroll } from './use-chat-auto-scroll';
export { useSceneToolEffects } from './use-scene-tool-effects';
```

## Component size and responsibility guidelines

- If a component mixes transport setup, parsing, rendering, and side effects, split behavior into hooks/utils.
- Keep reusable display primitives (state cards, tool status, actions) in separate components.
- Prefer composing smaller components over adding conditional branches in a single large render tree.

## Anti-patterns to avoid

- Copy/pasted sanitization or parsing logic across components.
- Duplicated optimistic/error handling in every mutation hook.
- One file owning every part of a feature UI without hook/util extraction.
