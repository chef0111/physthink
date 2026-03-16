'use client';

import { useCallback, useState, memo } from 'react';
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-elements/attachments';
import {
  PromptInput as AiPromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input';
import type { FileUIPart } from 'ai';
import { GlobeIcon } from 'lucide-react';

interface PromptInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
}

interface AttachmentItemProps {
  attachment: FileUIPart & { id: string };
  onRemove: (id: string) => void;
}

const AttachmentItem = memo(function AttachmentItem({
  attachment,
  onRemove,
}: AttachmentItemProps) {
  const handleRemove = useCallback(
    () => onRemove(attachment.id),
    [onRemove, attachment.id]
  );

  return (
    <Attachment data={attachment} key={attachment.id} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  );
});

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  const handleRemove = useCallback(
    (id: string) => attachments.remove(id),
    [attachments]
  );

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline" className="mb-2">
      {attachments.files.map((attachment) => (
        <AttachmentItem
          attachment={attachment}
          key={attachment.id}
          onRemove={handleRemove}
        />
      ))}
    </Attachments>
  );
};

export function PromptInput({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
}: PromptInputProps) {
  const [searchEnabled, setSearchEnabled] = useState(false);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      onInputChange(message.text);
      if (!message.text.trim() || isLoading) return;
      onSubmit();
    },
    [onInputChange, onSubmit, isLoading]
  );

  return (
    <AiPromptInput
      className="w-full"
      globalDrop
      multiple
      onSubmit={handleSubmit}
    >
      <PromptInputAttachmentsDisplay />
      <PromptInputBody>
        <PromptInputTextarea
          value={input}
          disabled={isLoading}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Describe the 3D illustration you want..."
          rows={3}
          className="resize-none"
        />
      </PromptInputBody>

      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent className="min-w-48">
              <PromptInputActionAddAttachments />
              <PromptInputActionAddScreenshot />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <PromptInputButton
            variant={searchEnabled ? 'default' : 'ghost'}
            onClick={() => setSearchEnabled((value) => !value)}
          >
            <GlobeIcon className="size-4" />
            <span>Search</span>
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit
          status={isLoading ? 'streaming' : 'ready'}
          onStop={onStop}
          disabled={!isLoading && !input.trim()}
        />
      </PromptInputFooter>
    </AiPromptInput>
  );
}
