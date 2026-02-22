'use client';

import { useContext } from 'react';
import { FilterTransitionContext } from './context';

export const useFilterTransition = () => {
  const context = useContext(FilterTransitionContext);
  if (!context) {
    return { isPending: false, startTransition: (fn: () => void) => fn() };
  }
  return context;
};
