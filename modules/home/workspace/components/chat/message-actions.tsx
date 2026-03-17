import { MessageAction } from '@/components/ai-elements/message';
import {
  CheckIcon,
  CopyIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react';

export const RegenerateAction = ({
  onClick,
  disabled,
}: {
  onClick?: () => void;
  disabled: boolean;
}) => {
  return (
    <MessageAction
      tooltip="Regenerate response"
      label="Regenerate response"
      onClick={onClick}
      disabled={!onClick || disabled}
    >
      <RefreshCwIcon className="size-4" />
    </MessageAction>
  );
};

interface FeedbackActionProps {
  onClick: () => void;
  disabled: boolean;
  variant: 'secondary' | 'ghost';
}

export const LikeAction = ({
  onClick,
  disabled,
  variant,
}: FeedbackActionProps) => {
  return (
    <MessageAction
      tooltip="Like response"
      label="Like response"
      onClick={onClick}
      disabled={disabled}
      variant={variant}
    >
      <ThumbsUpIcon className="size-4" />
    </MessageAction>
  );
};

export const DislikeAction = ({
  onClick,
  disabled,
  variant,
}: FeedbackActionProps) => {
  return (
    <MessageAction
      tooltip="Dislike response"
      label="Dislike response"
      onClick={onClick}
      disabled={disabled}
      variant={variant}
    >
      <ThumbsDownIcon className="size-4" />
    </MessageAction>
  );
};

export const CopyAction = ({
  copied,
  onClick,
}: {
  copied: boolean;
  onClick: () => void;
}) => {
  return (
    <MessageAction
      tooltip={copied ? 'Copied' : 'Copy response'}
      label={copied ? 'Copied response' : 'Copy response'}
      onClick={onClick}
    >
      {copied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </MessageAction>
  );
};
