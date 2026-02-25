'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileRejection, useDropzone, type Accept } from 'react-dropzone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { useUploadThing } from '@/lib/uploadthing';
import { useDeleteFile } from '@/queries/uploadthing';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import {
  EmptyState,
  ErrorState,
  UploadingState,
  UploadedState,
} from './render-state';

const ERROR_MAP: Record<string, string> = {
  'too-many-files': 'Too many files, only 1 file is allowed',
  'file-too-large': 'File too large',
  'file-invalid-type': 'Invalid file type',
};

interface MediaUploaderProps {
  maxSize: number;
  type?: 'image' | 'video' | 'audio';
  accept?: Accept;
  endpoint: keyof OurFileRouter;
  value?: string;
  /** Increment this counter to trigger a reset of internal upload state. */
  resetKey?: number;
  onChange?: (url: string) => void;
}

export function MediaUploader({
  maxSize,
  type = 'image',
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
  endpoint,
  value,
  resetKey = 0,
  onChange,
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (resetKey === 0) return;
    setError(false);
    setProgress(0);
    setIsUploading(false);
    setUploadedKey(null);
    setFileName(null);
  }, [resetKey]);

  const deleteFile = useDeleteFile();

  const { startUpload } = useUploadThing(endpoint, {
    onUploadProgress: (p) => setProgress(p),
    onUploadError: (err) => {
      setIsUploading(false);
      setError(true);
      toast.error('Upload failed', {
        description: err.message || 'Something went wrong',
      });
    },
  });

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      setIsUploading(true);
      setProgress(0);
      setError(false);
      setFileName(file.name);

      try {
        const result = await startUpload(files);
        if (result && result[0]) {
          const { ufsUrl, key } = result[0];
          onChange?.(ufsUrl);
          setUploadedKey(key);
        }
      } catch {
        setError(true);
      } finally {
        setIsUploading(false);
      }
    },
    [startUpload, onChange]
  );

  const handleRemove = useCallback(() => {
    onChange?.('');
    setError(false);

    if (uploadedKey) {
      deleteFile.mutate({ key: uploadedKey });
      setUploadedKey(null);
    }
  }, [uploadedKey, deleteFile, onChange]);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length) {
      const shownErrors = new Set<string>();
      fileRejections.forEach(({ errors }) => {
        const code = errors[0]?.code ?? 'unknown-error';
        if (code && ERROR_MAP[code] && !shownErrors.has(code)) {
          toast.error('Error', {
            description: ERROR_MAP[code] ?? 'Unknown error occurred',
          });
          shownErrors.add(code);
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleUpload,
    accept,
    maxFiles: 1,
    multiple: false,
    maxSize,
    onDropRejected,
    disabled: isUploading,
    noClick: true,
  });

  const displayUrl = value;

  const renderContent = () => {
    if (error && !isUploading) {
      return <ErrorState type={type} onRetry={() => setError(false)} />;
    }
    if (isUploading) {
      return <UploadingState progress={progress} fileName={fileName} />;
    }
    if (displayUrl) {
      return (
        <UploadedState type={type} url={displayUrl} onRemove={handleRemove} />
      );
    }
    return (
      <EmptyState
        isDragActive={isDragActive}
        maxSize={maxSize}
        type={type}
        onOpen={open}
      />
    );
  };

  if (displayUrl && !error) {
    return (
      <Card className="relative w-full overflow-hidden rounded-lg border-2 border-dashed p-0 ring-0">
        {renderContent()}
      </Card>
    );
  }

  return (
    <Card
      {...getRootProps()}
      className={cn(
        'hover:bg-muted/50 relative w-full rounded-lg border-2 border-dashed bg-transparent p-0 text-center ring-0 transition-colors duration-200 focus:outline-none',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        isUploading && 'pointer-events-none opacity-80'
      )}
    >
      <input {...getInputProps()} className="sr-only" />
      {renderContent()}
    </Card>
  );
}
