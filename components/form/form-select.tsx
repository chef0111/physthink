import { ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormBase, FormControlFn } from './form-base';

export const FormSelect: FormControlFn<{
  children: ReactNode;
  fieldClassName?: string;
  className?: string;
  placeholder?: string;
  orientation?: 'horizontal' | 'vertical' | 'responsive' | null;
}> = ({
  children,
  fieldClassName,
  className,
  orientation,
  placeholder,
  ...props
}) => {
  return (
    <FormBase {...props} className={fieldClassName} orientation={orientation}>
      {({ onChange, onBlur, ...field }) => (
        <Select {...field} onValueChange={onChange}>
          <SelectTrigger
            aria-invalid={field['aria-invalid']}
            id={field.id}
            onBlur={onBlur}
            className={className}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="w-full">{children}</SelectContent>
        </Select>
      )}
    </FormBase>
  );
};
