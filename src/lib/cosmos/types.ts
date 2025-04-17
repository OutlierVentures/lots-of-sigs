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
      amount: Array<{
        denom: string;
        amount: string;
      }>;
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