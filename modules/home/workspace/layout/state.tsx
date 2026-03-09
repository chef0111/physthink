import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Box } from 'lucide-react';

export const EmptyWorkspace = () => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-16">
          <Box className="size-10" />
        </EmptyMedia>
        <EmptyTitle>No workspaces yet</EmptyTitle>
        <EmptyDescription>
          Create your first 3D illustration workspace
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

export const ErrorWorkspace = ({ message }: { message?: string }) => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/10 border-destructive/30 text-destructive size-16 border"
        >
          <Box className="size-10" />
        </EmptyMedia>
        <EmptyTitle>Unknown Error Occured</EmptyTitle>
        <EmptyDescription>
          {message || 'Failed to load workspaces, please try again later.'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
