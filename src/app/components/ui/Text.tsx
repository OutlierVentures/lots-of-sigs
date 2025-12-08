import React from 'react';
import { cn } from '@/app/utils/cn';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'muted' | 'description';
  as?: 'p' | 'span' | 'div';
}

const textVariants = {
  default: 'text-gray-900 dark:text-gray-100',
  muted: 'text-gray-600 dark:text-gray-400',
  description: 'text-gray-600 dark:text-gray-400',
};

export const Text: React.FC<TextProps> = ({ 
  variant = 'default',
  as: Component = 'p',
  className,
  children,
  ...props 
}) => {
  return (
    <Component
      className={cn(textVariants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

