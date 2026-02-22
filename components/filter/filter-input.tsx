'use client';

import { useState } from 'react';
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { SearchIcon } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useFilterTransition } from '@/context/filter-provider';
import { cn } from '@/lib/utils';

interface FilterInputProps {
  placeholder?: string;
  className?: string;
}

export const FilterInput = ({
  placeholder = 'Search...',
  className,
}: FilterInputProps) => {
  const { startTransition } = useFilterTransition();

  const [{ query }, setParams] = useQueryStates(
    {
      query: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, scroll: false }
  );

  const [inputValue, setInputValue] = useState(query);

  const debouncedSetParams = useDebouncedCallback((value: string) => {
    startTransition(() => {
      setParams({ query: value || null, page: 1 });
    });
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetParams(value.trim());
  };

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
      <InputGroupInput
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </InputGroup>
  );
};
