import { GithubIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/ui/theme-toggle';

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 my-auto data-[orientation=vertical]:h-5"
        />
        <h1 className="text-foreground mx-2 text-base font-semibold">
          Phys<span className="text-muted-foreground">Think</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" aria-label="GitHub Repository" asChild>
            <a
              href="https://github.com/chef0111/k2think-lms"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
