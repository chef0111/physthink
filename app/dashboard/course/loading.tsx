import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Navbar } from '@/modules/home/dashboard/navbar';
import {
  CourseOverviewSkeleton,
  CourseSidebarSkeleton,
} from '@/modules/home/dashboard/layout/loading';
import { FloatingSidebarTrigger } from '@/modules/home/dashboard/components/course-sidebar/floating-trigger';

export default async function CourseSlugLoading() {
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
      >
        <CourseSidebarSkeleton />
        <SidebarInset>
          <FloatingSidebarTrigger />
          <div className="flex flex-1 flex-col pt-14">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 p-8 md:gap-6">
                <section className="mx-auto w-full pb-6">
                  <CourseOverviewSkeleton />
                </section>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
