'use client';

import { createContext, TransitionStartFunction } from 'react';

export interface FilterTransitionContextType {
  isPending: boolean;
  startTransition: TransitionStartFunction;
}

export const FilterTransitionContext = createContext<
  FilterTransitionContextType | undefined
>(undefined);
