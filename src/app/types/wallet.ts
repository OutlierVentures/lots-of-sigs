export type NetworkType = 'ethereum' | 'cosmos' | 'polkadot';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: NetworkType | null;
  chainId?: number;
}

export interface WalletActions {
  connect: (network: NetworkType) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

export interface WalletContextType extends WalletState {
  error: string | null;
  actions: WalletActions;
} 