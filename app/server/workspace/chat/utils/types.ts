export interface ResponsePart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  args?: unknown;
  output?: unknown;
  result?: unknown;
  state?: string;
  durationText?: string;
}

export interface ResponseMsg {
  role: string;
  content: string | readonly ResponsePart[];
}

export type RetryAdvice = {
  shouldRetry: boolean;
  reason: string;
};

export type RetryAdviceStage = 'preliminary' | 'final';

export type RetryAdviceState = {
  textContent: string;
  reasoningContent: string;
  hasToolCalls: boolean;
  stopReason: string;
};

export type GenerationDebugData = {
  stepCount: number;
  stopReason: string;
  elapsedSec: number;
  toolCallCount: number;
};
