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
import { ImageIcon, Trash2, UploadIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Ring } from '@/components/ui/ring';

interface EmptyStateProps {
  isDragActive: boolean;
  maxSize: number;
  onOpen: () => void;
}

export function EmptyState({ isDragActive, maxSize, onOpen }: EmptyStateProps) {
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
          <ImageIcon
            className={cn(
              'size-6',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">
          Upload thumbnail image
        </EmptyTitle>
        <EmptyDescription>
          Drag and drop an image here or click to browse <br />
          PNG, JPG, GIF or WEBP up to {formatBytes(maxSize)}
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
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/15 size-16 rounded-full"
        >
          <ImageIcon className="text-destructive size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-destructive text-lg font-semibold">
          Upload image failed
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
  previewUrl: string | null;
  fileName: string | null;
}

export function UploadingState({
  progress,
  previewUrl,
  fileName,
}: UploadingStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-8 py-4">
      {previewUrl && (
        <div className="relative h-48 w-72 overflow-hidden rounded-md">
          <Image
            src={previewUrl}
            alt="Upload preview"
            fill
            className="object-cover opacity-50"
          />
        </div>
      )}
      <div className="flex w-full max-w-xs flex-col items-center gap-2">
        <Progress
          value={progress}
          className="ring-primary/20 h-2 w-full ring-3"
        />
        <p className="text-muted-foreground text-sm">
          Uploading... {Math.round(progress)}%
        </p>
        {fileName && (
          <p className="text-muted-foreground max-w-xs truncate text-xs">
            {fileName}
          </p>
        )}
      </div>
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
