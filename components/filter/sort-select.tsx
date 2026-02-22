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
import { ArrowUpDown } from 'lucide-react';
import { useFilterTransition } from '@/context/filter-provider';

interface SortOption {
  label: string;
  value: string;
}

interface SortSelectProps {
  options: SortOption[];
  className?: string;
  containerClassName?: string;
}

export const SortSelect = ({
  options,
  className,
  containerClassName,
}: SortSelectProps) => {
  const { startTransition } = useFilterTransition();

  const [{ sort }, setParams] = useQueryStates(
    {
      sort: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
    },
    {
      shallow: false,
      scroll: false,
      throttleMs: 100,
    }
  );

  const [sortValue, setSortValue] = useOptimistic(sort);

  const handleUpdateSort = (value: string) => {
    startTransition(() => {
      setSortValue(value);
      setParams({
        sort: value || null,
        page: 1,
      });
    });
  };

  return (
    <div className={cn('relative', containerClassName)}>
      <Select
        onValueChange={handleUpdateSort}
        defaultValue=""
        value={sortValue}
      >
        <SelectTrigger
          className={cn(
            'border-border! ring-border/50! min-h-10 cursor-pointer border ring-1!',
            !sortValue ? 'min-w-24' : 'min-w-30',
            className
          )}
          aria-label="Sort Options"
        >
          <div className="line-clamp-1 flex flex-1 items-center gap-2 text-left">
            <ArrowUpDown className="size-4 shrink-0" />
            <SelectValue placeholder="Sort" />
          </div>
        </SelectTrigger>

        <SelectContent className="w-full min-w-24" position="popper">
          <SelectGroup>
            {options.map((item) => (
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
