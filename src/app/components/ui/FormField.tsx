import React from 'react';
import { Label } from '@/components/ui/Label';
import { cn } from '@/app/utils/cn';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  children, 
  className,
  labelClassName,
  required 
}) => {
  return (
    <div className={cn('mb-6', className)}>
      <Label className={cn('mb-2', labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
};

