'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn, formatBytes } from '@/lib/utils';
import {
  Clapperboard,
  ImageIcon,
  MusicIcon,
  Trash2,
  UploadIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Ring } from '@/components/ui/ring';

type MediaType = 'image' | 'video' | 'audio';

const EMPTY_STATE_CONFIG: Record<
  MediaType,
  { icon: React.ElementType; title: string; description: React.ReactNode }
> = {
  image: {
    icon: ImageIcon,
    title: 'Upload an image',
    description: (
      <>
        Drag and drop an image here or click to browse
        <br />
        PNG, JPG, GIF or WEBP
      </>
    ),
  },
  video: {
    icon: Clapperboard,
    title: 'Upload a video',
    description: (
      <>
        Drag and drop a video here or click to browse
        <br />
        MP4, MOV or WEBM
      </>
    ),
  },
  audio: {
    icon: MusicIcon,
    title: 'Upload an audio file',
    description: (
      <>
        Drag and drop an audio file here or click to browse
        <br />
        MP3, WAV or OGG
      </>
    ),
  },
};

const ERROR_STATE_CONFIG: Record<
  MediaType,
  { icon: React.ElementType; title: string }
> = {
  image: {
    icon: ImageIcon,
    title: 'Upload image failed',
  },
  video: {
    icon: Clapperboard,
    title: 'Upload video failed',
  },
  audio: {
    icon: MusicIcon,
    title: 'Upload audio failed',
  },
};

interface EmptyStateProps {
  isDragActive: boolean;
  maxSize: number;
  type: MediaType;
  onOpen: () => void;
}

export function EmptyState({
  isDragActive,
  maxSize,
  type,
  onOpen,
}: EmptyStateProps) {
  const { icon: Icon, title, description } = EMPTY_STATE_CONFIG[type];

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(
            'size-16 rounded-full',
            isDragActive ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          <Icon
            className={cn(
              'size-6',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">{title}</EmptyTitle>
        <EmptyDescription>
          {description} up to {formatBytes(maxSize)}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Button
          type="button"
          variant="secondary"
          className="border-border border"
          onClick={onOpen}
        >
          <UploadIcon /> Select File
        </Button>
      </EmptyContent>
    </Empty>
  );
}

interface ErrorStateProps {
  type: MediaType;
  onRetry: () => void;
}

export function ErrorState({ type, onRetry }: ErrorStateProps) {
  const { icon: Icon, title } = ERROR_STATE_CONFIG[type];

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/15 size-16 rounded-full"
        >
          <Icon className="text-destructive size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-destructive text-lg font-semibold">
          {title}
        </EmptyTitle>
        <EmptyDescription>
          Something went wrong! Please try again.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Button
          type="button"
          variant="secondary"
          className="border-border border"
          onClick={onRetry}
        >
          <UploadIcon />
          Retry upload
        </Button>
      </EmptyContent>
    </Empty>
  );
}

interface UploadingStateProps {
  progress: number;
  fileName: string | null;
}

export function UploadingState({ progress, fileName }: UploadingStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-8 py-12">
      <CircularProgress
        value={progress}
        gaugePrimaryColor="rgb(0 145 255)"
        gaugeSecondaryColor="hsl(var(--muted))"
        className="size-36 text-base"
      />
      {fileName && (
        <p className="text-muted-foreground max-w-xs truncate">{fileName}</p>
      )}
    </div>
  );
}

interface UploadedStateProps {
  url: string;
  onRemove: () => void;
}

export function UploadedState({ url, onRemove }: UploadedStateProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div className="relative flex min-h-80 items-center justify-center p-4 py-4">
      {isImageLoading && <Skeleton className="absolute inset-4 rounded-md" />}
      <div className="relative aspect-auto overflow-hidden rounded-md">
        <Image
          src={url}
          alt="Uploaded file"
          height={240}
          width={400}
          onLoad={() => setIsImageLoading(false)}
          className={cn(
            'max-h-72 w-auto object-contain transition-opacity duration-300',
            isImageLoading ? 'opacity-0' : 'opacity-100'
          )}
        />
        <Ring className="ring-3" />
      </div>
      {!isImageLoading && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 size-8"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
