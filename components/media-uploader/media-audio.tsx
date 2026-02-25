'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AudioPlayerProvider,
  AudioPlayerButton,
  AudioPlayerProgress,
  AudioPlayerTime,
  AudioPlayerDuration,
  useAudioPlayer,
} from '@/components/ui/audio-player';
import { Waveform } from '@/components/ui/waveform';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function VolumeControl() {
  const player = useAudioPlayer();
  const audioRef = player.ref;
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    audioRef.current.muted = next;
    setMuted(next);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground size-7 shrink-0"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted || volume === 0 ? (
          <VolumeX className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </Button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={muted ? 0 : volume}
        onChange={handleVolume}
        aria-label="Volume"
        className={cn(
          'h-1 w-20 cursor-pointer appearance-none rounded-full',
          '[&::-webkit-slider-runnable-track]:bg-muted [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full',
          '[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:-mt-1',
          '[&::-moz-range-track]:bg-muted [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full',
          '[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0'
        )}
      />
    </div>
  );
}

function AudioPlayerInner({ src }: { src: string }) {
  const player = useAudioPlayer();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    player.setActiveItem({ id: src, src });
  }, [src, player]);

  return (
    <div className="flex flex-col gap-0">
      <div className="relative px-4 pt-5 pb-3">
        <Waveform
          barWidth={3}
          barGap={2}
          barRadius={2}
          barColor="hsl(var(--foreground))"
          height={56}
          fadeEdges
          fadeWidth={20}
        />
      </div>

      <div className="border-border/50 flex items-center gap-3 border-t px-3 py-2.5">
        <AudioPlayerButton
          variant="ghost"
          size="icon"
          className="text-foreground size-8 shrink-0"
        />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AudioPlayerTime className="text-muted-foreground w-10 shrink-0 text-right text-xs tabular-nums" />
          <AudioPlayerProgress className="flex-1" />
          <AudioPlayerDuration className="text-muted-foreground w-10 shrink-0 text-xs tabular-nums" />
        </div>

        {/* Volume */}
        <VolumeControl />
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
