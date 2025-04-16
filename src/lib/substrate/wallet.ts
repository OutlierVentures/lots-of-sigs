import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface InjectedAccountWithSigner extends InjectedAccountWithMeta {
  signer: {
    signRaw: (data: { address: string; data: string; type: string }) => Promise<{ signature: string }>;
  };
}

export class SubstrateWallet {
  private accounts: InjectedAccountWithSigner[] = [];

  async connect(): Promise<void> {
    try {
      // Enable the extension
      const extensions = await web3Enable('Lots of Sigs');
      if (extensions.length === 0) {
        throw new Error('No Polkadot.js extension found');
      }

      // Get accounts
      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found in Polkadot.js extension');
      }

      this.accounts = accounts as InjectedAccountWithSigner[];
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.accounts = [];
  }

  async isConnected(): Promise<boolean> {
    return this.accounts.length > 0;
  }

  getAccounts(): InjectedAccountWithSigner[] {
    return this.accounts;
  }

  async signMessage(message: string, account: InjectedAccountWithSigner): Promise<string> {
    if (!this.accounts.length) {
      throw new Error('Wallet not connected');
    }

    try {
      const { signature } = await account.signer.signRaw({
        address: account.address,
        data: message,
        type: 'bytes'
      });

      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }
} 