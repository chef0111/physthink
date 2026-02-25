import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Ring } from '@/components/ui/ring';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaImageProps {
  url: string;
  onRemove: () => void;
}

export function MediaImage({ url, onRemove }: MediaImageProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div className="relative flex min-h-80 flex-col items-center justify-center gap-3 p-4">
      {isImageLoading && (
        <Skeleton className="absolute inset-4 mx-auto h-80 w-133 rounded-md" />
      )}
      <div className="relative aspect-auto overflow-hidden rounded-md">
        <Image
          src={url}
          alt="Uploaded image"
          height={240}
          width={400}
          onLoad={() => setIsImageLoading(false)}
          className={cn(
            'h-80 w-auto object-contain transition-opacity duration-300',
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
