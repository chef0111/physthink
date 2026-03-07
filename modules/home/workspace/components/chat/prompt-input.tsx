'use client';

import { useRef, type KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

interface PromptInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function PromptInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the 3D illustration you want..."
        rows={3}
        disabled={isLoading}
        className="resize-none pr-12"
      />
      <Button
        size="icon"
        className="absolute right-2 bottom-2 size-7"
        onClick={onSubmit}
        disabled={!input.trim() || isLoading}
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
}
