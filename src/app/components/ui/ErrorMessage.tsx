import React from 'react';
import { cn } from '@/app/utils/cn';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => {
  return (
    <div className={cn(
      'mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md',
      className
    )}>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
};

