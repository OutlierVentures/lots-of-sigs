'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PenLine, CircleCheck } from 'lucide-react';
import { NavLink } from '../ui/NavLink';
import { Text } from '../ui/Text';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <Image src="/signature.svg" alt="Signature" width={24} height={24} className="dark:brightness-0 dark:invert" />
                  <Text as="span" className="text-xl font-bold">
                    Lots Of Sigs
                  </Text>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/sign">
                  <PenLine className="w-4 h-4" />
                  Sign Message
                </NavLink>
                <NavLink href="/verify">
                  <CircleCheck className="w-4 h-4" />
                  Verify Message
                </NavLink>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

    </div>
  );
}; 