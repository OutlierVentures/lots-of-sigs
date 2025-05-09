import React from 'react';
import { cn } from '@/app/utils/cn';

// This type extends HTMLLabelElement attributes without adding new properties
type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label'; 