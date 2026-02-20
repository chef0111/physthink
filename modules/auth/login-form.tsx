'use client';

import z from 'zod';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { LoginSchema } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { ButtonState } from './login-steps';
import { OAuthForm } from './oauth-form';
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { FormInputGroup } from '@/components/form';
import { AlertCircleIcon, AtSignIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useLoginStep } from '@/context/login-step';

type FormValue = z.infer<typeof LoginSchema>;

type LoginFormProps = {
  formId: string;
  onStateChange: (state: ButtonState) => void;
};

export const LoginForm = ({ formId, onStateChange }: LoginFormProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackURL') ?? '/';
  const [googlePending, startGoogleTransition] = useTransition();
  const [githubPending, startGithubTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { goToVerify } = useLoginStep();

  const form = useForm<FormValue>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '' },
  });

  const pending = emailPending;
  const disabled =
    pending || githubPending || googlePending || !form.formState.isDirty;

  useEffect(() => {
    onStateChange({ pending, disabled });
  }, [pending, disabled, onStateChange]);

  const handleSocialLogin = (provider: 'google' | 'github') =>
    authClient.signIn.social({
      provider,
      callbackURL: callbackUrl,
      errorCallbackURL: '/banned',
      fetchOptions: {
        onError: (ctx) => {
          toast.error(
            ctx.error?.message?.toLowerCase().includes('banned')
              ? 'Your account has been suspended'
              : 'Authentication failed. Please try again.'
          );
        },
      },
    });

  const handleGoogleLogin = async () => {
    startGoogleTransition(async () => {
      await handleSocialLogin('google');
    });
  };

  const handleGithubLogin = async () => {
    startGithubTransition(async () => {
      await handleSocialLogin('github');
    });
  };

  const handleLogin = (data: FormValue) => {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: data.email,
        type: 'sign-in',
        fetchOptions: {
          onSuccess: () => {
            toast.success('Success', {
              description: 'Sign-in code sent! Please check your email.',
            });
            form.reset();
            goToVerify(data.email);
          },
          onError: (err) => {
            setError(
              err.error?.message ||
                'Failed to send sign-in code. Please try again.'
            );
          },
        },
      });
    });
  };

  return (
    <FieldGroup className="gap-4">
      <FieldSet className="w-full space-y-1 px-6 max-lg:items-center max-lg:text-center">
        <FieldLegend className="text-2xl! font-bold tracking-wide">
          Welcome back
        </FieldLegend>
        <FieldDescription className="text-muted-foreground text-base">
          Sign in to your account to continue
        </FieldDescription>
      </FieldSet>

      <OAuthForm
        googlePending={googlePending}
        githubPending={githubPending}
        googleLogin={handleGoogleLogin}
        githubLogin={handleGithubLogin}
      />

      <div className="flex w-full items-center justify-center px-6">
        <div className="bg-border h-px w-full" />
        <span className="text-muted-foreground px-2 text-xs">OR</span>
        <div className="bg-border h-px w-full" />
      </div>

      <form
        id={formId}
        onSubmit={form.handleSubmit(handleLogin)}
        className="px-6"
      >
        <FormInputGroup
          name="email"
          control={form.control}
          placeholder="your.email@example.com"
          description="Enter your email to receive a sign-in code"
          leftAddon={<AtSignIcon />}
        />
      </form>

      {!!error && (
        <Alert
          variant="destructive"
          className="bg-destructive/10 border-destructive/20 border"
        >
          <AlertCircleIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </FieldGroup>
  );
};
