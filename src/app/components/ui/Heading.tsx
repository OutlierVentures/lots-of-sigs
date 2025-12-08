import React from 'react';
import { cn } from '@/app/utils/cn';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const headingStyles = {
  1: 'text-4xl font-bold tracking-tight sm:text-5xl',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
  5: 'text-base font-semibold',
  6: 'text-sm font-semibold',
};

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(({ 
  as, 
  level = 2, 
  className, 
  children,
  ...props 
}, ref) => {
  const Component = (as || `h${level}`) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const baseStyles = 'text-gray-900 dark:text-gray-100';
  
  return React.createElement(
    Component,
    {
      ref,
      className: cn(baseStyles, headingStyles[level], className),
      ...props
    },
    children
  );
});

Heading.displayName = 'Heading';

