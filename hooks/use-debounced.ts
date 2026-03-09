/**
 * @see https://github.com/mantinedev/mantine/blob/master/packages/@mantine/hooks/src/use-debounced-callback/use-debounced-callback.ts
 */

import * as React from 'react';

import { useCallbackRef } from '@/hooks/use-callback-ref';

export function useDebounced<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
) {
  const handleCallback = useCallbackRef(callback);
  const debounceTimerRef = React.useRef(0);
  const pendingArgsRef = React.useRef<Parameters<T> | null>(null);
  React.useEffect(
    () => () => {
      window.clearTimeout(debounceTimerRef.current);
      // Flush pending call on unmount so data is not lost
      if (pendingArgsRef.current) {
        handleCallback(...pendingArgsRef.current);
        pendingArgsRef.current = null;
      }
    },
    []
  );

  const setValue = React.useCallback(
    (...args: Parameters<T>) => {
      window.clearTimeout(debounceTimerRef.current);
      pendingArgsRef.current = args;
      debounceTimerRef.current = window.setTimeout(() => {
        pendingArgsRef.current = null;
        handleCallback(...args);
      }, delay);
    },
    [handleCallback, delay]
  );

  const cancel = React.useCallback(() => {
    window.clearTimeout(debounceTimerRef.current);
    pendingArgsRef.current = null;
  }, []);

  return Object.assign(setValue, { cancel });
}
