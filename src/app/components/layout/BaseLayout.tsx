'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PenLine, CheckCircle2 } from 'lucide-react';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Image src="/signature.svg" alt="Signature" width={24} height={24} className="dark:invert" />
                  Lots Of Sigs
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/sign"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center gap-1 px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <PenLine className="w-4 h-4" />
                  Sign Message
                </Link>
                <Link
                  href="/verify"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center gap-1 px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify Message
                </Link>
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