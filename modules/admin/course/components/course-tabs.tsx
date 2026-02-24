import { UrlTabs } from '@/components/url-tabs';
import { TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const COURSE_TABS = [
  { value: 'basic', label: 'Basic Information' },
  { value: 'structure', label: 'Course Structure' },
];

interface CourseTabsProps {
  basic: React.ReactNode;
  structure: React.ReactNode;
}

export function CourseTabs({ basic, structure }: CourseTabsProps) {
  return (
    <UrlTabs
      tabs={COURSE_TABS}
      defaultTab="basic"
      className="space-y-2"
      listClassName="h-10! w-full"
    >
      <TabsContent value="basic">
        <Card>
          <CardContent className="space-y-8 px-8">
            <CardHeader className="px-0">
              <CardTitle className="text-xl">Basic Information</CardTitle>
              <CardDescription className="text-base">
                Provide basic information about the course
              </CardDescription>
            </CardHeader>
            {basic}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="structure">
        <Card>
          <CardContent className="px-8 pb-4">
            <CardHeader className="px-0 pb-8">
              <CardTitle className="text-xl">Course Structure</CardTitle>
              <CardDescription className="text-base">
                Manage course structure, modules, and lessons
              </CardDescription>
            </CardHeader>
            {structure}
          </CardContent>
        </Card>
      </TabsContent>
    </UrlTabs>
  );
}
