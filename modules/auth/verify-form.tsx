'use client';

import z from 'zod';
import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Route } from 'next';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth-client';
import { OTPSchema } from '@/lib/validations';
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { FormInputOTP } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon, RefreshCcw } from 'lucide-react';
import { useLoginStep } from '@/context/login-step';
import { ButtonState } from './login-steps';

type FormValue = z.infer<typeof OTPSchema>;

type VerifyFormProps = {
  formId: string;
  onStateChange: (state: ButtonState) => void;
};

export const VerifyForm = ({ formId, onStateChange }: VerifyFormProps) => {
  const router = useRouter();
  const { email, callbackUrl, goToLogin } = useLoginStep();
  const [verifyPending, startVerifyTransition] = useTransition();
  const [resendPending, startResendTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValue>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { otp: '' },
  });

  const pending = verifyPending;
  const disabled = verifyPending || resendPending || !form.formState.isDirty;

  useEffect(() => {
    onStateChange({ pending, disabled });
  }, [pending, disabled, onStateChange]);

  const handleVerify = (data: FormValue) => {
    setError(null);

    startVerifyTransition(async () => {
      await authClient.signIn.emailOtp({
        email,
        otp: data.otp,
        fetchOptions: {
          onSuccess: () => {
            toast.success('Success', {
              description: 'You have been successfully signed in!',
            });
            form.reset();
            router.push(callbackUrl as Route);
          },
          onError: (err) => {
            setError(err.error?.message || 'Login failed. Please try again.');
          },
        },
      });
    });
  };

  const handleResend = () => {
    setError(null);

    startResendTransition(async () => {
      if (!email) {
        toast.error('Error', {
          description: 'Email address not found. Please try again.',
        });
        return;
      }

      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
        fetchOptions: {
          onSuccess: () => {
            toast.success('Success', {
              description: 'Sign in code sent! Please check your email.',
            });
          },
          onError: () => {
            toast.error('Failed to send code');
          },
        },
      });
    });
  };

  return (
    <FieldGroup className="gap-4">
      <FieldSet className="px-6 max-lg:text-center">
        <FieldLegend>Verify your login</FieldLegend>
        <FieldDescription className="max-lg:text-center">
          Enter the verification code we sent to{' '}
          <span className="text-foreground">{email}</span>
        </FieldDescription>
      </FieldSet>

      <form id={formId} onSubmit={form.handleSubmit(handleVerify)}>
        <FieldGroup className="items-center px-6 pt-2">
          <FormInputOTP
            name="otp"
            control={form.control}
            label="Verification Code"
            fieldClassName="items-center"
            labelAction={
              <Button
                variant="outline"
                size="xs"
                type="button"
                disabled={resendPending || verifyPending}
                onClick={handleResend}
              >
                {resendPending ? (
                  <>
                    <Loader />
                    <span>Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCcw />
                    <span>Resend code</span>
                  </>
                )}
              </Button>
            }
          >
            <FieldDescription className="-ml-2.5 flex w-full items-center justify-start">
              <Button
                variant="link"
                type="button"
                className="text-muted-foreground"
                onClick={goToLogin}
              >
                Use a different email address
              </Button>
            </FieldDescription>
          </FormInputOTP>

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
      </form>
    </FieldGroup>
  );
};
