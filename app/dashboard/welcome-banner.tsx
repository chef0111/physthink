import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { requireSession } from '@/lib/session';

export const WelcomeBanner = async () => {
  const session = await requireSession();
  const username = session.user.name;

  return (
    <div className="order-1 self-start lg:sticky lg:top-20 lg:col-span-1 lg:mx-auto">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">WELCOME BACK!</h1>
      <h2 className="text-primary mb-8 text-xl font-bold tracking-wide uppercase">
        {username}
      </h2>
      <div className="mx-auto flex w-full flex-col space-y-3 max-lg:hidden">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          Calendar
        </h2>
        <Calendar
          mode="single"
          className="ring-border/20 rounded-lg border ring-3"
        />
      </div>
    </div>
  );
};

export const WelcomeBannerFallback = () => {
  return (
    <div className="order-1 self-start lg:sticky lg:top-20 lg:col-span-1 lg:mx-auto">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">WELCOME BACK!</h1>
      <Skeleton className="mb-9 h-6 w-2/3" />
      <div className="mx-auto flex w-full flex-col space-y-3 max-lg:hidden">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          Calendar
        </h2>
        <Calendar
          mode="single"
          className="ring-border/20 rounded-lg border ring-3"
        />
      </div>
    </div>
  );
};
