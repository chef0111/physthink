'use client';

import { useTransition, ReactNode } from 'react';
import { FilterTransitionContext } from './context';

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider = ({ children }: FilterProviderProps) => {
  const [isPending, startTransition] = useTransition();

  return (
    <FilterTransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </FilterTransitionContext.Provider>
  );
};
