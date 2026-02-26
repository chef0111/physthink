import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, EditIcon, EyeIcon, Trash2 } from 'lucide-react';
import { Route } from 'next';
import Link from 'next/link';

interface CourseDropdownMenuProps {
  id: string;
  slug: string;
  onDelete?: () => void;
}

export const CourseDropdownMenu = ({
  id,
  slug,
  onDelete,
}: CourseDropdownMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border-2">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/admin/courses/${id}/edit` as Route}>
              <EditIcon className="mr-1 opacity-60" />
              Edit Course
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/courses/${slug}` as Route}>
              <EyeIcon className="mr-1 opacity-60" />
              Preview Course
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-1" />
          Delete Course
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
