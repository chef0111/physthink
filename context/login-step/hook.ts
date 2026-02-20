'use client';

import { useContext } from 'react';
import { LoginStepContext } from './context';

export function useLoginStep() {
  const ctx = useContext(LoginStepContext);
  if (!ctx)
    throw new Error('useLoginStep must be used within LoginStepProvider');
  return ctx;
}
