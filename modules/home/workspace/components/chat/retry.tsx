import { Button } from '@/components/ui/button';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemActions,
} from '@/components/ui/item';
import { XIcon } from 'lucide-react';

export const Retry = ({
  className,
  onClick,
}: {
  className?: string;
  onClick: () => void;
}) => {
  return (
    <Item size="xs" variant="outline" className={className}>
      <ItemMedia variant="icon">
        <XIcon className="text-destructive" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-destructive">Error</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline" onClick={onClick}>
          Retry
        </Button>
      </ItemActions>
    </Item>
  );
};
