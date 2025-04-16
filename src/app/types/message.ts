import { SignatureData } from '../../lib/cosmos/signing';

export interface SignedMessage {
  message: string;
  signature: string | SignatureData;
  address: string;
  network: string;
  chain?: string;
  timestamp: string;
} 