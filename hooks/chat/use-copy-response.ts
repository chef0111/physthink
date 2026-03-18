'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Provides a clipboard copy action with a transient "copied" indicator.
 */
export function useCopyResponse(text: string) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
      toast.success('Response copied to clipboard');
    } catch {
      toast.error('Could not copy response');
    }
  }, [text]);

  return { copied, handleCopy };
}
