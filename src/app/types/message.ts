export interface SignedMessage {
  message: string;
  signature: string;
  address: string;
  network: 'ethereum' | 'cosmos' | 'polkadot' | '';
  timestamp: string;
} 