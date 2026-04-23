/**
 * Comprehensive logging utilities for chat stream debugging
 * Instruments all critical failure points to diagnose why/when chat stops
 */

export interface ChatStreamEvent {
  timestamp: number;
  stage: string;
  event: string;
  duration?: number;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ChatStreamMetrics {
  generationStartMs: number;
  streamPhaseStartMs?: number;
  finishPhaseStartMs?: number;
  events: ChatStreamEvent[];
  chunkCount: number;
  reasoningChainCount: number;
  textDeltaCount: number;
  toolCallCount: number;
  lastEventType?: string;
}

export class ChatStreamLogger {
  private metrics: ChatStreamMetrics;
  private stageStartTimes: Map<string, number>;
  private streamStarted = false;
  private finishStarted = false;

  constructor(generationStartMs: number) {
    this.metrics = {
      generationStartMs,
      events: [],
      chunkCount: 0,
      reasoningChainCount: 0,
      textDeltaCount: 0,
      toolCallCount: 0,
    };
    this.stageStartTimes = new Map();
  }

  logSetup(data: Record<string, unknown>) {
    this.recordEvent('setup', 'initialization', data);
  }

  logStreamStart() {
    if (this.streamStarted) return;
    this.streamStarted = true;
    this.metrics.streamPhaseStartMs = Date.now();
    this.recordEvent('stream', 'stream_started');
  }

  logStreamChunk(type: string, delta?: string) {
    this.metrics.chunkCount += 1;
    this.metrics.lastEventType = type;

    if (type === 'text-delta') {
      this.metrics.textDeltaCount += 1;
    } else if (type === 'reasoning-start') {
      this.metrics.reasoningChainCount += 1;
    } else if (type.startsWith('tool-')) {
      if (type === 'tool-call-start' || type === 'tool-input-start') {
        this.metrics.toolCallCount += 1;
      }
    }

    // Log every 10th chunk to avoid spam, always log tool calls
    const shouldLog =
      this.metrics.chunkCount % 10 === 0 || type.startsWith('tool-');
    if (shouldLog) {
      this.recordEvent('stream', `chunk_received_${type}`, {
        chunkCount: this.metrics.chunkCount,
        deltaLength: delta?.length ?? 0,
      });
    }
  }

  logReasoningDuration(id: string, durationSec: number) {
    this.recordEvent('stream', 'reasoning_completed', {
      id: id.substring(0, 8),
      durationSec,
    });
  }

  logFinishPhaseStart(finishReason: string) {
    if (this.finishStarted) return;
    this.finishStarted = true;
    this.metrics.finishPhaseStartMs = Date.now();
    this.recordEvent('finish', 'finish_started', {
      finishReason,
      streamPhaseDurationMs:
        this.metrics.finishPhaseStartMs -
        (this.metrics.streamPhaseStartMs || 0),
      totalChunks: this.metrics.chunkCount,
    });
  }

  logDbPersistStart() {
    this.recordEvent('finish', 'db_persist_started', {
      chunks: this.metrics.chunkCount,
    });
    this.stageStartTimes.set('dbPersist', Date.now());
  }

  logDbPersistEnd() {
    const startMs = this.stageStartTimes.get('dbPersist') || Date.now();
    const durationMs = Date.now() - startMs;
    this.recordEvent('finish', 'db_persist_completed', {
      durationMs,
    });
    this.stageStartTimes.delete('dbPersist');
  }

  logSceneProcessingStart(elementCount: number, hasSceneSettings: boolean) {
    this.recordEvent('finish', 'scene_processing_started', {
      elementCount,
      hasSceneSettings,
    });
    this.stageStartTimes.set('sceneProcessing', Date.now());
  }

  logSceneDeduplication(
    newCount: number,
    dedupedCount: number,
    existingCount: number
  ) {
    this.recordEvent('finish', 'scene_deduplication_complete', {
      newElements: newCount,
      dedupedElements: dedupedCount,
      existingElements: existingCount,
    });
  }

  logSceneUpdateStart() {
    this.recordEvent('finish', 'scene_update_started');
    this.stageStartTimes.set('sceneUpdate', Date.now());
  }

  logSceneUpdateEnd() {
    const startMs = this.stageStartTimes.get('sceneUpdate') || Date.now();
    const durationMs = Date.now() - startMs;
    this.recordEvent('finish', 'scene_update_completed', {
      durationMs,
    });
    this.stageStartTimes.delete('sceneUpdate');
  }

  logSceneProcessingEnd() {
    const startMs = this.stageStartTimes.get('sceneProcessing') || Date.now();
    const durationMs = Date.now() - startMs;
    this.recordEvent('finish', 'scene_processing_completed', {
      durationMs,
    });
    this.stageStartTimes.delete('sceneProcessing');
  }

  logStreamError(error: Error, context: string) {
    this.recordEvent('stream', 'stream_error', {
      context,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
    });
  }

  logFinishError(error: Error, context: string) {
    this.recordEvent('finish', 'finish_error', {
      context,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
    });
  }

  logUiStreamError(error: Error) {
    this.recordEvent('uiStream', 'ui_stream_error', {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
    });
  }

  logWriterError(error: Error, chunkType?: string) {
    this.recordEvent('stream', 'writer_error', {
      chunkType,
      error: error.message,
    });
  }

  getMetrics(): ChatStreamMetrics {
    return this.metrics;
  }

  getFinishMetrics() {
    const currentTime = Date.now();
    const finishStart = this.metrics.finishPhaseStartMs ?? currentTime;
    const streamStart =
      this.metrics.streamPhaseStartMs ?? this.metrics.generationStartMs;

    const totalDuration = currentTime - this.metrics.generationStartMs;
    const streamDuration = Math.max(0, finishStart - streamStart);
    const finishDuration = Math.max(0, currentTime - finishStart);

    return {
      totalDurationSec: Math.round(totalDuration / 100) / 10,
      streamPhaseDurationSec: Math.round(streamDuration / 100) / 10,
      finishPhaseDurationSec: Math.round(finishDuration / 100) / 10,
      chunkCount: this.metrics.chunkCount,
      reasoningChains: this.metrics.reasoningChainCount,
      textDeltas: this.metrics.textDeltaCount,
      toolCalls: this.metrics.toolCallCount,
      eventLog: this.metrics.events,
    };
  }

  private recordEvent(
    stage: string,
    event: string,
    data?: Record<string, unknown>
  ) {
    this.metrics.events.push({
      timestamp: Date.now(),
      stage,
      event,
      data,
    });

    // Console output for real-time monitoring
    const prefix = `[CHAT:${stage.toUpperCase()}]`;
    if (data) {
      console.log(`${prefix} ${event}:`, data);
    } else {
      console.log(`${prefix} ${event}`);
    }
  }
}

/**
 * Format chat metrics for client debugging display
 */
export function formatChatMetricsForClient(
  metrics: ReturnType<ChatStreamLogger['getFinishMetrics']>
) {
  return {
    summary: {
      totalTime: `${metrics.totalDurationSec}s`,
      streamPhase: `${metrics.streamPhaseDurationSec}s`,
      finishPhase: `${metrics.finishPhaseDurationSec}s`,
    },
    activity: {
      chunks: metrics.chunkCount,
      reasoning: metrics.reasoningChains,
      text: metrics.textDeltas,
      tools: metrics.toolCalls,
    },
    events: metrics.eventLog
      .slice(-20) // Last 20 events
      .map((e) => ({
        t: new Date(e.timestamp).toISOString().split('T')[1],
        stage: e.stage,
        event: e.event,
        data: e.data ? JSON.stringify(e.data).substring(0, 100) : undefined,
      })),
  };
}
