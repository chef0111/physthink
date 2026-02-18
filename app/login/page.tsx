import { LoginStepProvider } from '@/context/login-step';
import { LoginSteps } from '@/modules/auth/login-steps';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginStepProvider>
        <LoginSteps />
      </LoginStepProvider>
    </Suspense>
  );
}
