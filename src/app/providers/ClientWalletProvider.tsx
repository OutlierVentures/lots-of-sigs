'use client';

import { WalletProvider } from './WalletProvider';
import { useEffect, useState } from 'react';

export function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <WalletProvider>{children}</WalletProvider>;
} 