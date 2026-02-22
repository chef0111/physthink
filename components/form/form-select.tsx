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
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical' | 'responsive' | null;
  position?: 'popper' | 'item-aligned';
}> = ({
  children,
  fieldClassName,
  className,
  orientation,
  placeholder,
  position,
  onValueChange,
  ...props
}) => {
  return (
    <FormBase {...props} className={fieldClassName} orientation={orientation}>
      {({ onChange, onBlur, ...field }) => (
        <Select
          {...field}
          onValueChange={(val) => {
            onChange(val);
            onValueChange?.(val);
          }}
        >
          <SelectTrigger
            aria-invalid={field['aria-invalid']}
            id={field.id}
            onBlur={onBlur}
            className={className}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="w-full" position={position}>
            {children}
          </SelectContent>
        </Select>
      )}
    </FormBase>
  );
};
