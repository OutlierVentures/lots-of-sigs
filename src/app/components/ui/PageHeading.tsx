import React from 'react';
import { cn } from '@/app/utils/cn';

interface PageHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export const PageHeading: React.FC<PageHeadingProps> = ({ children, className }) => {
  return (
    <h1 className={cn(
      'text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6',
      className
    )}>
      {children}
    </h1>
  );
};


