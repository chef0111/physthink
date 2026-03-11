import { cn } from '@/lib/utils';
import { ArrowUpDown, ListFilter, SearchIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Select, SelectTrigger, SelectValue } from '../ui/select';

export const FilterInputFallback = ({
  className,
  placeholder,
}: {
  className?: string;
  placeholder?: string;
}) => {
  return (
    <InputGroup
      className={cn(
        'border-border! ring-border/50! h-full ring-1! focus:outline-none',
        className
      )}
    >
      <InputGroupAddon className="bg-accent dark:bg-background/50 h-full rounded-l-md border-r p-3">
        <SearchIcon className="text-foreground size-5" />
      </InputGroupAddon>
      <InputGroupInput placeholder={placeholder} />
    </InputGroup>
  );
};

export const FilterSelectFallback = ({
  className,
  containerClassName,
}: {
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div className={cn('relative', containerClassName)}>
      <Select defaultValue="">
        <SelectTrigger
          className={cn(
            'border-border! ring-border/50! min-w-24 cursor-pointer border ring-1!',
            className
          )}
          aria-label="Filter Options"
        >
          <div className="line-clamp-1 flex flex-1 items-center gap-2 text-left">
            <ListFilter />
            <SelectValue placeholder="Filter" />
          </div>
        </SelectTrigger>
      </Select>
    </div>
  );
};

export const SortSelectFallback = ({
  className,
  containerClassName,
}: {
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div className={cn('relative', containerClassName)}>
      <Select defaultValue="">
        <SelectTrigger
          className={cn(
            'border-border! ring-border/50! min-w-24 cursor-pointer border ring-1!',
            className
          )}
          aria-label="Filter Options"
        >
          <div className="line-clamp-1 flex flex-1 items-center gap-2 text-left">
            <ArrowUpDown className="size-4 shrink-0" />
            <SelectValue placeholder="Sort" />
          </div>
        </SelectTrigger>
      </Select>
    </div>
  );
};
