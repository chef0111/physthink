import { Brand } from '@/components/ui/brand';

interface LoadingProps {
  title?: string;
  description?: string;
}

export default function Loading({
  title = 'Configuring your app...',
  description = 'Please wait while we prepare everything for you',
}: LoadingProps) {
  return (
    <section className="flex h-dvh w-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <Brand
          href={null}
          size={112}
          className="rounded-2xl p-4"
          textClassName="text-8xl"
        />
        <div className="flex flex-col items-center justify-center gap-2 pt-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
      </div>
    </section>
  );
}
