'use client';

import { createContext } from 'react';

export type LoginStep = 'login' | 'verify';

type LoginStepContextValue = {
  step: LoginStep;
  stepIndex: number;
  email: string;
  callbackUrl: string;
  direction: number;
  animated: boolean;
  shouldMeasure: boolean;
  goToVerify: (email: string) => void;
  goToLogin: () => void;
};

export const LoginStepContext = createContext<LoginStepContextValue | null>(
  null
);
