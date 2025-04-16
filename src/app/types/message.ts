export interface SignatureData {
  signature: string;
  pub_key: {
    type: string;
    value: string;
  };
  sign_doc: {
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
}

export interface SignedMessage {
  message: string;
  signature: string | SignatureData;  // Allow both string and object signatures
  address: string;
  network: 'ethereum' | 'cosmos' | 'polkadot' | '';
  timestamp: string;
} 