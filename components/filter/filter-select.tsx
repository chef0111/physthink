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
import { ListFilter } from 'lucide-react';
import { useFilterTransition } from '@/context/filter-provider';

interface Filter {
  label: string;
  value: string;
}

interface FilterProps {
  filters: Filter[];
  className?: string;
  containerClassName?: string;
}

export const FilterSelect = ({
  filters,
  className,
  containerClassName,
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
    startTransition(() => {
      setFilterValue(value);
      setParams({
        filter: value || null,
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
      >
        <SelectTrigger
          className={cn(
            'border-border! ring-border/50! cursor-pointer border ring-1!',
            className
          )}
          aria-label="Filter Options"
        >
          <div className="line-clamp-1 flex flex-1 items-center gap-2 text-left">
            <ListFilter />
            <SelectValue placeholder="Select a filter" />
          </div>
        </SelectTrigger>

        <SelectContent className="w-full" position="popper">
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
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
