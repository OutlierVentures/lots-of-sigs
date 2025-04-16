export type NetworkType = 'ethereum' | 'cosmos' | 'polkadot';
export type CosmosChainId = 'cosmoshub-4' | 'fetchhub-4' | 'agoric-3' | 'cheqd-mainnet-1' | 'secret-4';
export type WalletType = 'metamask' | 'walletconnect' | 'keplr';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: NetworkType | null;
  chainId?: number | string;
  error: string | null;
}

export interface WalletActions {
  connect: (network: NetworkType, walletType?: WalletType, chainId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

export interface WalletContextType extends WalletState {
  actions: WalletActions;
} 