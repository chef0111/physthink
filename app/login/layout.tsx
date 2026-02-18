'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { FloatingPaths } from '@/components/ui/floating-paths';
import { ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Brand } from '@/components/ui/brand';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="bg-secondary dark:bg-secondary/20 relative hidden h-full flex-col items-start border-r p-10 lg:flex">
        <div className="to-background absolute inset-0 bg-linear-to-b from-transparent via-transparent" />
        <Brand href={null} className="mr-auto" />

        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl italic">
              &ldquo;This Platform has helped me to save time and serve my
              clients faster than ever before.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold">
              ~ John Doe, CEO of Acme Inc.
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </Suspense>
        </div>
      </div>
      <div className="relative flex min-h-screen flex-col justify-start px-8">
        {/* Top Shades */}
        <div
          aria-hidden
          className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
        >
          <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
        </div>

        <Button className="absolute top-7 left-5" variant="ghost" asChild>
          <Link href="/">
            <ChevronLeftIcon data-icon="inline-start" />
            Home
          </Link>
        </Button>

        <div className="mx-auto w-full pt-[25vh] sm:w-md">
          <Brand
            href={null}
            size={24}
            containerClassName="mx-auto h-4.5 pb-12 lg:hidden"
            textClassName="text-3xl sm:text-4xl flex!"
          />
          {children}
        </div>
      </div>
    </main>
  );
}
