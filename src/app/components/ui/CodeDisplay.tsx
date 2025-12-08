import React from 'react';
import { cn } from '@/app/utils/cn';

interface CodeDisplayProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'pre';
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ 
  children, 
  className,
  as: Component = 'p'
}) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
      <Component className={cn(
        'text-sm font-mono break-all text-gray-900 dark:text-gray-100',
        Component === 'pre' && 'whitespace-pre-wrap overflow-x-auto',
        className
      )}>
        {children}
      </Component>
    </div>
  );
};


