import { WorkspaceSummaryDTO } from '@/app/server/workspace/dto';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Box, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';

interface WorkspaceCardProps {
  workspace: WorkspaceSummaryDTO;
  onDelete: (id: string) => void;
}

export function WorkspaceCard({ workspace, onDelete }: WorkspaceCardProps) {
  return (
    <Card className="group cursor-pointer gap-2 p-4 transition-all hover:shadow-md">
      <Link href={`/dashboard/workspace/${workspace.id}`}>
        <CardHeader className="p-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Box className="text-primary size-4" />
            {workspace.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CardDescription>
            Last edited {formatDate(workspace.updatedAt)}
          </CardDescription>
        </CardContent>
      </Link>
      <CardFooter className="justify-end p-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{workspace.title}&rdquo; and
                all its messages. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => onDelete(workspace.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
