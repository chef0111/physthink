'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
  useAudioPlayer,
} from '@/components/ui/audio-player';
import { Waveform } from '@/components/ui/waveform';
import {
  AudioWaveform,
  MusicIcon,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { LogoIcon } from '@/components/ui/logo';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const VolumeSlider = memo(
  ({
    volume,
    setVolume,
  }: {
    volume: number;
    setVolume: (value: number | ((prev: number) => number)) => void;
  }) => {
    const [isDragging, setIsDragging] = useState(false);

    const getVolumeIcon = () => {
      if (volume === 0) return VolumeX;
      if (volume <= 0.33) return Volume;
      if (volume <= 0.66) return Volume1;
      return Volume2;
    };

    const VolumeIcon = getVolumeIcon();

    return (
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setVolume((prev: number) => (prev > 0 ? 0 : 0.7))}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <VolumeIcon
            className={cn(
              'h-4 w-4 transition-all',
              volume === 0 && 'text-muted-foreground/50'
            )}
          />
        </button>
        <div
          className="bg-foreground/10 group relative h-1 w-32 cursor-pointer rounded-full"
          onClick={(e) => {
            if (isDragging) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(
              0,
              Math.min(1, (e.clientX - rect.left) / rect.width)
            );
            setVolume(x);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
            const sliderRect = e.currentTarget.getBoundingClientRect();

            const initialX = Math.max(
              0,
              Math.min(1, (e.clientX - sliderRect.left) / sliderRect.width)
            );
            setVolume(initialX);

            const handleMove = (e: MouseEvent) => {
              const x = Math.max(
                0,
                Math.min(1, (e.clientX - sliderRect.left) / sliderRect.width)
              );
              setVolume(x);
            };
            const handleUp = () => {
              setIsDragging(false);
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            };
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
          }}
        >
          <div
            className={cn(
              'bg-primary absolute top-0 left-0 h-full rounded-full',
              !isDragging && 'transition-all duration-150'
            )}
            style={{ width: `${volume * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground w-6 text-right font-mono text-xs">
          {Math.round(volume * 100)}
        </span>
      </div>
    );
  }
);

VolumeSlider.displayName = 'VolumeSlider';

const TimeDisplay = memo(() => {
  return (
    <div className="flex w-full items-center gap-2">
      <AudioPlayerTime className="text-xs" />
      <AudioPlayerProgress className="flex-1" />
      <AudioPlayerDuration className="text-xs" />
    </div>
  );
});

TimeDisplay.displayName = 'TimeDisplay';

function AudioPlayerInner({ src }: { src: string }) {
  const playerApiRef = useRef<ReturnType<typeof useAudioPlayer>>(
    null as unknown as ReturnType<typeof useAudioPlayer>
  );
  const player = useAudioPlayer();
  // keep playerApiRef in sync without re-renders
  playerApiRef.current = player;

  const isPlayingRef = useRef(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // volume
  const [volume, setVolume] = useState(0.7);

  // waveform scrubbing
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isMomentumActive, setIsMomentumActive] = useState(false);
  const [precomputedWaveform, setPrecomputedWaveform] = useState<number[]>([]);
  const waveformOffset = useRef(0);
  const waveformElementRef = useRef<HTMLDivElement>(null);
  const containerWidthRef = useRef(300);
  const totalBarsRef = useRef(600);

  // audio context refs for scratch sound
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const scratchBufferRef = useRef<AudioBufferSourceNode | null>(null);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    player.setActiveItem({ id: src, src });
  }, [src, player]);

  useEffect(() => {
    if (playerApiRef.current.ref.current) {
      playerApiRef.current.ref.current.volume = volume;
    }
  }, [volume]);

  // Track isPlaying via native events
  useEffect(() => {
    const handlePlay = () => {
      isPlayingRef.current = true;
    };
    const handlePause = () => {
      isPlayingRef.current = false;
    };

    const checkInterval = setInterval(() => {
      const audioEl = playerApiRef.current.ref.current;
      if (audioEl) {
        clearInterval(checkInterval);
        audioEl.addEventListener('play', handlePlay);
        audioEl.addEventListener('pause', handlePause);
        audioEl.addEventListener('ended', handlePause);
        if (!audioEl.paused) handlePlay();
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      const audioEl = playerApiRef.current.ref.current;
      if (audioEl) {
        audioEl.removeEventListener('play', handlePlay);
        audioEl.removeEventListener('pause', handlePause);
        audioEl.removeEventListener('ended', handlePause);
      }
    };
  }, []);

  // Pre-compute waveform from audio URL
  const precomputeWaveform = useCallback(async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();

      const offlineContext = new OfflineAudioContext(1, 44100 * 5, 44100);
      const audioBuffer = await offlineContext.decodeAudioData(
        arrayBuffer.slice(0)
      );

      if (!audioContextRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      audioBufferRef.current =
        await audioContextRef.current.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      const samplesPerBar = Math.floor(
        channelData.length / totalBarsRef.current
      );
      const waveformData: number[] = [];

      for (let i = 0; i < totalBarsRef.current; i++) {
        const start = i * samplesPerBar;
        const end = start + samplesPerBar;
        let sum = 0;
        let count = 0;
        for (let j = start; j < end && j < channelData.length; j += 100) {
          sum += Math.abs(channelData[j]);
          count++;
        }
        const average = count > 0 ? sum / count : 0;
        waveformData.push(Math.min(1, average * 3));
      }

      setPrecomputedWaveform(waveformData);
    } catch (err) {
      console.error('Error precomputing waveform:', err);
    }
  }, []);

  useEffect(() => {
    precomputeWaveform(src);
  }, [src, precomputeWaveform]);

  // Reset waveform offset when waveform data becomes available
  useEffect(() => {
    if (precomputedWaveform.length > 0 && containerWidthRef.current > 0) {
      waveformOffset.current = containerWidthRef.current;
      if (waveformElementRef.current) {
        waveformElementRef.current.style.transform = `translateX(${containerWidthRef.current}px)`;
      }
      if (playerApiRef.current.ref.current) {
        playerApiRef.current.ref.current.currentTime = 0;
      }
    }
  }, [precomputedWaveform]);

  // Measure container width on mount
  useEffect(() => {
    const container = document.querySelector('.media-audio-waveform-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      containerWidthRef.current = rect.width;
      waveformOffset.current = rect.width;
      if (waveformElementRef.current) {
        waveformElementRef.current.style.transform = `translateX(${rect.width}px)`;
      }
    }
  }, []);

  // Animate waveform position during normal playback
  useEffect(() => {
    if (!isScrubbing && !isMomentumActive) {
      let animationId: number;

      const updatePosition = () => {
        const audioEl = playerApiRef.current.ref.current;
        if (
          audioEl &&
          !isScrubbing &&
          !isMomentumActive &&
          waveformElementRef.current
        ) {
          const duration = audioEl.duration;
          const currentTime = audioEl.currentTime;
          if (!isNaN(duration) && duration > 0) {
            const position = currentTime / duration;
            const containerWidth = containerWidthRef.current;
            const totalWidth = totalBarsRef.current * 5;
            const newOffset = containerWidth - position * totalWidth;
            waveformOffset.current = newOffset;
            waveformElementRef.current.style.transform = `translateX(${newOffset}px)`;
          }
        }
        animationId = requestAnimationFrame(updatePosition);
      };

      animationId = requestAnimationFrame(updatePosition);
      return () => cancelAnimationFrame(animationId);
    }
  }, [isScrubbing, isMomentumActive]);

  const stopScratchSound = () => {
    if (scratchBufferRef.current) {
      try {
        scratchBufferRef.current.stop();
      } catch {}
      scratchBufferRef.current = null;
    }
  };

  const playScratchSound = (position: number, speed: number = 1) => {
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (!audioBufferRef.current) return;
    stopScratchSound();

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      const startTime = Math.max(
        0,
        Math.min(
          audioBufferRef.current.duration - 0.1,
          position * audioBufferRef.current.duration
        )
      );
      const filter = audioContextRef.current.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = Math.max(800, 2500 - speed * 1500);
      filter.Q.value = 3;
      source.playbackRate.value = Math.max(0.4, Math.min(2.5, 1 + speed * 0.5));
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 1.0;
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      source.start(0, startTime, 0.06);
      scratchBufferRef.current = source;
    } catch (err) {
      console.error('Error playing scratch sound:', err);
    }
  };

  const handleScrubStart = (
    startX: number,
    containerWidth: number,
    currentOffset: number,
    wasPlaying: boolean,
    getClientX: (e: MouseEvent | TouchEvent) => number
  ) => {
    const totalWidth = totalBarsRef.current * 5;
    let lastClientX = startX;
    let lastScratchTime = 0;
    const scratchThrottle = 10;
    let velocity = 0;
    let lastTime = Date.now();
    let lastVelX = startX;

    const onMove = (clientX: number) => {
      const deltaX = clientX - startX;
      const newOffset = currentOffset + deltaX;
      const minOffset = containerWidth - totalWidth;
      const maxOffset = containerWidth;
      const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
      waveformOffset.current = clampedOffset;
      if (waveformElementRef.current) {
        waveformElementRef.current.style.transform = `translateX(${clampedOffset}px)`;
      }
      const position = Math.max(
        0,
        Math.min(1, (containerWidth - clampedOffset) / totalWidth)
      );
      const audioEl = playerApiRef.current.ref.current;
      if (audioEl && !isNaN(audioEl.duration)) {
        audioEl.currentTime = position * audioEl.duration;
      }

      const now = Date.now();
      const mouseDelta = clientX - lastClientX;
      const timeDelta = now - lastTime;
      if (timeDelta > 0) {
        const instantVelocity = (clientX - lastVelX) / timeDelta;
        velocity = velocity * 0.6 + instantVelocity * 0.4;
      }
      lastTime = now;
      lastVelX = clientX;

      if (Math.abs(mouseDelta) > 0) {
        if (now - lastScratchTime >= scratchThrottle) {
          const speed = Math.min(3, Math.abs(mouseDelta) / 3);
          playScratchSound(position, speed);
          lastScratchTime = now;
        }
      }
      lastClientX = clientX;
    };

    const onEnd = () => {
      setIsScrubbing(false);
      stopScratchSound();

      if (Math.abs(velocity) > 0.1) {
        setIsMomentumActive(true);
        let momentumOffset = waveformOffset.current;
        let currentVelocity = velocity * 15;
        const friction = 0.92;
        const minVelocity = 0.5;
        let lastScratchFrame = 0;
        const scratchFrameInterval = 50;

        const animateMomentum = () => {
          if (Math.abs(currentVelocity) > minVelocity) {
            momentumOffset += currentVelocity;
            currentVelocity *= friction;
            const minOffset = containerWidth - totalWidth;
            const maxOffset = containerWidth;
            const clampedOffset = Math.max(
              minOffset,
              Math.min(maxOffset, momentumOffset)
            );
            if (clampedOffset !== momentumOffset) currentVelocity = 0;
            momentumOffset = clampedOffset;
            waveformOffset.current = clampedOffset;
            if (waveformElementRef.current) {
              waveformElementRef.current.style.transform = `translateX(${clampedOffset}px)`;
            }
            const position = Math.max(
              0,
              Math.min(1, (containerWidth - clampedOffset) / totalWidth)
            );
            const audioEl = playerApiRef.current.ref.current;
            if (audioEl && !isNaN(audioEl.duration)) {
              audioEl.currentTime = position * audioEl.duration;
            }
            const now = Date.now();
            if (now - lastScratchFrame >= scratchFrameInterval) {
              const speed = Math.min(2.5, Math.abs(currentVelocity) / 10);
              if (speed > 0.1) playScratchSound(position, speed);
              lastScratchFrame = now;
            }
            requestAnimationFrame(animateMomentum);
          } else {
            stopScratchSound();
            setIsMomentumActive(false);
            if (wasPlaying) {
              setTimeout(() => {
                playerApiRef.current.play();
              }, 10);
            }
          }
        };

        requestAnimationFrame(animateMomentum);
      } else {
        if (wasPlaying) playerApiRef.current.play();
      }
    };

    return { onMove, onEnd };
  };

  return (
    <div className="border-border m-4 w-full max-w-3xl rounded-lg border bg-black/5 p-4 backdrop-blur-sm dark:bg-black/50">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="ml-1 size-4 transition-all duration-200 group-data-[collapsible=icon]:ml-0" />
            <span className="text-lg font-semibold">
              Phys<span className="text-muted-foreground">Think</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-1">
            <AudioWaveform className="text-muted-foreground size-4.5" />
            <MusicIcon className="text-muted-foreground size-4.5" />
          </div>
        </div>
        <div
          className="media-audio-waveform-container bg-foreground/10 relative h-12 cursor-grab overflow-hidden rounded-lg p-2 active:cursor-grabbing dark:bg-black/80"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsScrubbing(true);

            const wasPlaying = isPlayingRef.current;
            if (wasPlaying) playerApiRef.current.pause();

            const rect = e.currentTarget.getBoundingClientRect();
            containerWidthRef.current = rect.width;

            const { onMove, onEnd } = handleScrubStart(
              e.clientX,
              rect.width,
              waveformOffset.current,
              wasPlaying,
              (ev) => (ev as MouseEvent).clientX
            );

            const handleMove = (ev: MouseEvent) => onMove(ev.clientX);
            const handleUp = () => {
              onEnd();
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            };
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            setIsScrubbing(true);

            const wasPlaying = isPlayingRef.current;
            if (wasPlaying) playerApiRef.current.pause();

            const rect = e.currentTarget.getBoundingClientRect();
            containerWidthRef.current = rect.width;

            const { onMove, onEnd } = handleScrubStart(
              e.touches[0].clientX,
              rect.width,
              waveformOffset.current,
              wasPlaying,
              (ev) => (ev as TouchEvent).touches[0].clientX
            );

            const handleMove = (ev: TouchEvent) =>
              onMove(ev.touches[0].clientX);
            const handleEnd = () => {
              onEnd();
              document.removeEventListener('touchmove', handleMove);
              document.removeEventListener('touchend', handleEnd);
            };
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('touchend', handleEnd);
          }}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div
              ref={waveformElementRef}
              style={{
                transform: `translateX(${waveformOffset.current}px)`,
                transition:
                  isScrubbing || isMomentumActive
                    ? 'none'
                    : 'transform 0.016s linear',
                width: `${totalBarsRef.current * 5}px`,
                position: 'absolute',
                left: 0,
              }}
            >
              <Waveform
                key={isDark ? 'dark' : 'light'}
                data={
                  precomputedWaveform.length > 0
                    ? precomputedWaveform
                    : undefined
                }
                height={32}
                barWidth={3}
                barGap={2}
                fadeEdges={true}
                fadeWidth={24}
                barRadius={1}
                barColor={isDark ? '#a1a1aa' : '#71717a'}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex w-full items-center gap-2.5">
            <AudioPlayerButton
              variant="outline"
              size="icon"
              item={{ id: src, src }}
              className={cn(
                'border-border h-9 w-9 rounded-full transition-all duration-300',
                player.isPlaying
                  ? 'bg-foreground/10 hover:bg-foreground/15 border-foreground/30 dark:bg-primary/20 dark:hover:bg-primary/30 dark:border-primary/50'
                  : 'bg-background hover:bg-muted'
              )}
            />
            <TimeDisplay />
          </div>

          <VolumeSlider volume={volume} setVolume={setVolume} />
        </div>
      </div>
    </div>
  );
}

export function MediaAudio({ src }: { src: string }) {
  return (
    <AudioPlayerProvider>
      <AudioPlayerInner src={src} />
    </AudioPlayerProvider>
  );
}
