'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import useMeasure from 'react-use-measure';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { FieldDescription, FieldGroup } from '@/components/ui/field';
import { LoginForm } from './login-form';
import { VerifyForm } from './verify-form';
import { LoginStep, useLoginStep } from '@/context/login-step';

const FORM_ID = 'auth-step-form';

const stepMeta: Record<
  LoginStep,
  { submitLabel: string; pendingLabel: string }
> = {
  login: { submitLabel: 'Continue With Email', pendingLabel: 'Sending...' },
  verify: { submitLabel: 'Verify Email', pendingLabel: 'Verifying...' },
};

const formVariants = {
  initial: (direction: number) => ({ x: `${110 * direction}%`, opacity: 0 }),
  animate: { x: '0%', opacity: 1 },
  exit: (direction: number) => ({ x: `${-110 * direction}%`, opacity: 0 }),
};

export type ButtonState = { pending: boolean; disabled: boolean };

function FormStep({
  step,
  formId,
  onStateChange,
}: {
  step: LoginStep;
  formId: string;
  onStateChange: (state: ButtonState) => void;
}) {
  const [frozenStep] = useState<LoginStep>(() => step);

  return frozenStep === 'login' ? (
    <LoginForm formId={formId} onStateChange={onStateChange} />
  ) : (
    <VerifyForm formId={formId} onStateChange={onStateChange} />
  );
}

export function LoginSteps() {
  const { step, direction, animated, shouldMeasure } = useLoginStep();

  const [{ pending, disabled }, setButtonState] = useState<ButtonState>({
    pending: false,
    disabled: false,
  });

  const handleStateChange = useCallback(
    (state: ButtonState) => setButtonState(state),
    []
  );

  const [ref, bounds] = useMeasure();
  const meta = stepMeta[step];

  return (
    <MotionConfig transition={{ duration: 0.5, type: 'spring', bounce: 0 }}>
      <Card className="bg-card dark:bg-background border-2 pb-0">
        <CardContent className="flex px-0 pb-0">
          <motion.div
            initial={{ height: 'auto' }}
            animate={{
              height:
                shouldMeasure && bounds.height > 0 ? bounds.height : 'auto',
            }}
            className="relative w-full"
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          >
            <div ref={ref} className="w-full">
              <AnimatePresence
                mode="popLayout"
                initial={false}
                custom={direction}
              >
                <motion.div
                  key={step}
                  variants={formVariants}
                  initial={animated ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  custom={direction}
                  className="w-full"
                >
                  <FormStep
                    step={step}
                    formId={FORM_ID}
                    onStateChange={handleStateChange}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </CardContent>

        <CardFooter className="bg-muted/50 flex-col border-t p-0! pb-4!">
          <FieldGroup className="gap-2 px-6">
            <Button
              type="submit"
              form={FORM_ID}
              className="mt-4 w-full gap-2"
              disabled={disabled}
            >
              {pending ? (
                <>
                  <Loader />
                  <span>{meta.pendingLabel}</span>
                </>
              ) : (
                meta.submitLabel
              )}
            </Button>

            <FieldDescription className="w-full text-center">
              By clicking continue, you agree to our{' '}
              <span className="hover:text-foreground cursor-pointer p-0 underline underline-offset-4">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="hover:text-foreground cursor-pointer p-0 underline underline-offset-4">
                Privacy Policy
              </span>
              .
            </FieldDescription>
          </FieldGroup>
        </CardFooter>
      </Card>
    </MotionConfig>
  );
}
