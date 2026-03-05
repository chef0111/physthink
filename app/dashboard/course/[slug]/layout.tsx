import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CourseSidebar } from './course';
import { Navbar } from '@/modules/home/dashboard/navbar';
import { Suspense } from 'react';
import { CourseSidebarSkeleton } from '@/modules/home/dashboard/layout/loading';
import { FloatingSidebarTrigger } from '@/modules/home/dashboard/components/course-sidebar/floating-trigger';

export default async function CourseSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="relative mx-auto">
      <Navbar />
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 90)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
        breakpoint={1024}
      >
        <Suspense fallback={<CourseSidebarSkeleton />}>
          <CourseSidebar slug={slug} />
        </Suspense>
        <SidebarInset>
          <FloatingSidebarTrigger />
          <div className="flex flex-1 flex-col pt-14">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-8 md:gap-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
