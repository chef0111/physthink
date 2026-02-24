import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { ArchiveRestore } from 'lucide-react';

export const EmptyCourseStructure = () => {
  return (
    <Empty>
      <EmptyMedia
        variant="icon"
        className="dark:bg-accent/50 bg-muted size-16 rounded-xl"
      >
        <ArchiveRestore className="text-foreground size-8" />
      </EmptyMedia>
      <EmptyContent className="gap-1">
        <EmptyTitle>No chapters found</EmptyTitle>
        <EmptyDescription>
          Add your first chapter to get started
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  );
};
