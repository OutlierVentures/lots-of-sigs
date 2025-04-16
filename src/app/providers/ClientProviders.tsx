'use client';

import { ClientWalletProvider } from "./ClientWalletProvider";
import { Suspense } from 'react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientWalletProvider>
        {children}
      </ClientWalletProvider>
    </Suspense>
  );
} 