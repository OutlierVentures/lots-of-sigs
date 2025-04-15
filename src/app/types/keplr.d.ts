import { OfflineAminoSigner } from '@cosmjs/amino';

interface KeplrKey {
  bech32Address: string;
  algo: string;
  pubKey: Uint8Array;
  address: Uint8Array;
  isNanoLedger: boolean;
}

interface KeplrSignature {
  signature: string;
  pub_key: {
    type: string;
    value: string;
  };
}

declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => OfflineAminoSigner;
      getKey: (chainId: string) => Promise<KeplrKey>;
      signArbitrary: (chainId: string, signer: string, data: string) => Promise<KeplrSignature>;
    };
  }
} 