import React from 'react';
import Link from 'next/link';
import { cn } from '@/app/utils/cn';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const NavLink: React.FC<NavLinkProps> = ({ href, children, className }) => {
  return (
    <Link
      href={href}
      className={cn(
        'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1 px-1 pt-1 border-b-2 text-sm font-medium',
        className
      )}
    >
      {children}
    </Link>
  );
};

