import { LogoCloud } from './logo-cloud';

export function LogosSection() {
  return (
    <section className="mx-auto h-full max-w-5xl space-y-4 px-4 py-10 md:px-8">
      <h2 className="text-muted-foreground text-center text-lg font-medium tracking-tight md:text-xl">
        Trusted by <span className="text-foreground">experts</span>
      </h2>
      <LogoCloud />
    </section>
  );
}
