'use client';

import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';
import { useOptimistic } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useFilterTransition } from '@/context/filter-provider';
import { ListFilter, XIcon } from 'lucide-react';

interface Filter {
  label: string;
  value: string;
}

interface FilterProps {
  filters: Filter[];
  className?: string;
  containerClassName?: string;
  width?: string;
  disabled?: boolean;
}

export const FilterSelect = ({
  filters,
  className,
  containerClassName,
  width,
  disabled,
}: FilterProps) => {
  const { startTransition } = useFilterTransition();

  const [{ filter }, setParams] = useQueryStates(
    {
      filter: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
    },
    {
      shallow: false,
      scroll: false,
      throttleMs: 100,
    }
  );

  const [filterValue, setFilterValue] = useOptimistic(filter);

  const handleUpdateFilter = (value: string) => {
    const resolved = value === 'clear' ? '' : value;

    startTransition(() => {
      setFilterValue(resolved);
      setParams({
        filter: resolved || null,
        page: 1,
      });
    });
  };

  return (
    <div className={cn('relative', containerClassName)}>
      <Select
        onValueChange={handleUpdateFilter}
        defaultValue=""
        value={filterValue}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'border-border! ring-border/50! cursor-pointer border ring-1!',
            !filterValue ? 'min-w-24' : width,
            className
          )}
          aria-label="Filter Options"
        >
          <div className="line-clamp-1 flex flex-1 items-center gap-2 text-left">
            <ListFilter />
            <SelectValue placeholder="Filter" />
          </div>
        </SelectTrigger>

        <SelectContent className="w-full min-w-24" position="popper">
          <SelectGroup>
            {filters.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                className="focus:text-primary cursor-pointer"
                aria-label={item.label}
              >
                {item.label}
              </SelectItem>
            ))}
            {filterValue && (
              <>
                <Separator className="my-1" />
                <SelectItem value="clear" showCheck={false}>
                  <span className="text-muted-foreground">Clear Filter</span>
                  <span className="pointer-events-none absolute right-2 flex size-4 items-center">
                    <XIcon className="text-muted-foreground" />
                  </span>
                </SelectItem>
              </>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
