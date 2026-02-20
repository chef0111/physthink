import { ReactNode, ComponentPropsWithoutRef } from 'react';

import { Textarea } from '@/components/ui/textarea';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { FormBase, FormControlFn } from './form-base';
import { cn } from '@/lib/utils';

export const FormTextarea: FormControlFn<
  Omit<ComponentPropsWithoutRef<typeof Textarea>, 'children'> & {
    children?: ReactNode;
    itemClassName?: string;
  }
> = ({
  children,
  control,
  name,
  label,
  description,
  labelAction,
  fieldClassName,
  itemClassName,
  orientation,
  descPosition,
  ...textareaProps
}) => {
  return (
    <FormBase
      control={control}
      name={name}
      label={label}
      description={description}
      labelAction={labelAction}
      className={fieldClassName}
      orientation={orientation}
      descPosition={descPosition}
    >
      {(field) => (
        <div className={cn('flex', itemClassName)}>
          <Textarea {...field} {...textareaProps} />
          {children}
        </div>
      )}
    </FormBase>
  );
};

export const FormTextareaGroup: FormControlFn<
  Omit<ComponentPropsWithoutRef<typeof Textarea>, 'children'> & {
    children?: ReactNode;
    leftAddon?: ReactNode;
    rightAddon?: ReactNode;
    itemClassName?: string;
  }
> = ({
  children,
  control,
  name,
  label,
  description,
  labelAction,
  fieldClassName,
  itemClassName,
  descPosition,
  orientation,
  leftAddon,
  rightAddon,
  ...textareaProps
}) => {
  return (
    <FormBase
      control={control}
      name={name}
      label={label}
      description={description}
      labelAction={labelAction}
      className={fieldClassName}
      orientation={orientation}
      descPosition={descPosition}
    >
      {(field) => (
        <div className={cn('flex', itemClassName)}>
          <InputGroup>
            {leftAddon && <InputGroupAddon>{leftAddon}</InputGroupAddon>}
            <InputGroupTextarea {...field} {...textareaProps} />
            {rightAddon && (
              <InputGroupAddon align="block-end">{rightAddon}</InputGroupAddon>
            )}
          </InputGroup>
          {children}
        </div>
      )}
    </FormBase>
  );
};
