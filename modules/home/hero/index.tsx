import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, PhoneCallIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="mx-auto mb-10 w-full max-w-7xl overflow-hidden pt-16">
      {/* Shades */}
      <div
        aria-hidden="true"
        className="absolute inset-0 size-full overflow-hidden"
      >
        <div
          className={cn(
            'absolute inset-0 isolate -z-10',
            'bg-[radial-gradient(20%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]'
          )}
        />
      </div>
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5">
        <Link
          className={cn(
            'group bg-card flex w-fit items-center gap-3 rounded-sm border p-1 shadow-xs',
            'fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out'
          )}
          href="/courses"
        >
          <div className="bg-card rounded-xs border px-1.5 py-0.5 shadow-sm">
            <p className="font-mono text-xs">NOW</p>
          </div>

          <span className="text-xs">discounting new courses</span>
          <span className="block h-5 border-l" />

          <div className="pr-1">
            <ArrowRightIcon className="size-3 -translate-x-0.5 duration-150 ease-out group-hover:translate-x-0.5" />
          </div>
        </Link>

        <h1
          className={cn(
            'text-foreground text-center text-4xl leading-tight font-semibold text-balance md:text-5xl',
            'fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out'
          )}
        >
          Build Education Experiences <br /> That Drive Growth
        </h1>

        <p
          className={cn(
            'text-muted-foreground text-center text-sm tracking-wider sm:text-lg md:text-xl',
            'fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out'
          )}
        >
          Discover a new way to learn with our modern, interactive <br />
          learning management system.
        </p>

        <div className="fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards flex w-fit items-center justify-center gap-3 pt-2 delay-300 duration-500 ease-out">
          <Button variant="outline">
            <PhoneCallIcon data-icon="inline-start" /> Book a Call
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              Get started <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="relative">
        <div
          className={cn(
            'absolute -inset-x-20 inset-y-0 -translate-y-1/3 scale-120 rounded-full',
            'bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.1),transparent,transparent)]',
            'blur-[50px]'
          )}
        />
        <div
          className={cn(
            'relative mt-8 -mr-56 overflow-hidden mask-b-from-60% sm:mt-12 sm:mr-0 md:mt-20',
            'fade-in slide-in-from-bottom-5 animate-in fill-mode-backwards delay-100 duration-1000 ease-out'
          )}
        >
          <div className="inset-shadow-foreground/10 bg-background ring-card dark:inset-shadow-foreground/20 relative mx-auto max-w-7xl overflow-hidden rounded-lg border p-2 shadow-xl ring-1 inset-shadow-2xs dark:inset-shadow-xs">
            <Image
              alt="app screen"
              className="z-2 aspect-video rounded-lg border dark:hidden"
              height="1080"
              src="https://storage.efferd.com/screen/dashboard-light.webp"
              width="1920"
            />
            <Image
              alt="app screen"
              className="bg-background hidden aspect-video rounded-lg dark:block"
              height="1080"
              src="https://storage.efferd.com/screen/dashboard-dark.webp"
              width="1920"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
