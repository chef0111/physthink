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
import { ArrowUpDown, XIcon } from 'lucide-react';

interface SortOption {
  label: string;
  value: string;
}

interface SortSelectProps {
  options: SortOption[];
  className?: string;
  containerClassName?: string;
  width?: string;
}

export const SortSelect = ({
  options,
  className,
  containerClassName,
  width,
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
    const resolved = value === 'clear' ? '' : value;

    startTransition(() => {
      setSortValue(resolved);
      setParams({
        sort: resolved || null,
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
            !sortValue ? 'min-w-24' : width,
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
            {sortValue && (
              <>
                <Separator className="my-1" />
                <SelectItem value="clear" showCheck={false}>
                  <span className="text-muted-foreground">Clear Sort</span>
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
