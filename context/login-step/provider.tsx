'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoginStep, LoginStepContext } from './context';

export const LOGIN_STEPS: LoginStep[] = ['login', 'verify'];
const DEFAULT_CALLBACK = '/';

function buildParams(entries: Record<string, string | null>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== null) params.set(key, value);
  }
  return params;
}

export function LoginStepProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlStep: LoginStep =
    searchParams.get('step') === 'verify' ? 'verify' : 'login';

  const [step, setStep] = useState<LoginStep>(urlStep);
  const [direction, setDirection] = useState<number>(1);
  const [animated, setAnimated] = useState(false);
  const [shouldMeasure, setShouldMeasure] = useState(false);

  useEffect(() => {
    if (urlStep === 'login' && step !== 'login') {
      setStep('login');
      setAnimated(false);
      setDirection(1);
      setShouldMeasure(false);
    }
  }, [urlStep]);

  const email = decodeURIComponent(searchParams.get('email') ?? '');
  const callbackUrl = decodeURIComponent(
    searchParams.get('callbackURL') ?? DEFAULT_CALLBACK
  );
  const callbackParam =
    callbackUrl !== DEFAULT_CALLBACK ? encodeURIComponent(callbackUrl) : null;

  const goToVerify = (emailValue: string) => {
    setAnimated(true);
    setShouldMeasure(true);
    setDirection(1);
    setStep('verify');
    const params = buildParams({
      step: 'verify',
      email: encodeURIComponent(emailValue),
      callbackURL: callbackParam,
    });
    router.push(`/login?${params.toString()}`);
  };

  const goToLogin = () => {
    setAnimated(true);
    setShouldMeasure(true);
    setDirection(-1);
    setStep('login');
    const params = buildParams({ callbackURL: callbackParam });
    const query = params.toString();
    router.push(query ? `/login?${query}` : '/login');
  };

  return (
    <LoginStepContext.Provider
      value={{
        step,
        stepIndex: LOGIN_STEPS.indexOf(step),
        email,
        callbackUrl,
        direction,
        animated,
        shouldMeasure,
        goToVerify,
        goToLogin,
      }}
    >
      {children}
    </LoginStepContext.Provider>
  );
}
