'use client';

import { WalletProvider } from './WalletProvider';
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    return null;
  }

  return <WalletProvider>{children}</WalletProvider>;
}
