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

interface AminoSignResponse {
  signed: {
    chain_id: string;
    account_number: string;
    sequence: string;
    fee: {
      gas: string;
      amount: Array<{ amount: string; denom: string }>;
    };
    msgs: Array<{
      type: string;
      value: {
        signer: string;
        data: string;
      };
    }>;
    memo: string;
  };
  signature: {
    signature: string;
    pub_key: {
      type: string;
      value: string;
    };
  };
}

declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => OfflineAminoSigner;
      getKey: (chainId: string) => Promise<KeplrKey>;
      signArbitrary: (chainId: string, signer: string, data: string) => Promise<KeplrSignature>;
      signAmino: (chainId: string, signer: string, signDoc: any) => Promise<AminoSignResponse>;
    };
  }
} 