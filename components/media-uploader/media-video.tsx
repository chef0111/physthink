'use client';

import dynamic from 'next/dynamic';
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeRange,
  VideoPlayerTimeDisplay,
  VideoPlayerMuteButton,
  VideoPlayerVolumeRange,
} from '@/components/ui/video-player';
import { Skeleton } from '@/components/ui/skeleton';

const MediaVideoRaw = ({ src, poster }: { src: string; poster?: string }) => {
  return (
    <VideoPlayer className="h-full w-full shrink-0 overflow-hidden rounded-lg border">
      <VideoPlayerContent
        crossOrigin=""
        preload="auto"
        slot="media"
        src={src}
        poster={poster}
        className="aspect-video"
        tabIndex={0}
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton />
        <VideoPlayerSeekForwardButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
};

export const MediaVideo = dynamic(() => Promise.resolve(MediaVideoRaw), {
  ssr: false,
  loading: () => (
    <Skeleton className="aspect-video min-w-full shrink-0 rounded-lg border" />
  ),
});
