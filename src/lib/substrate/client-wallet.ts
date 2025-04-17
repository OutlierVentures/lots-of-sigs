import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { SubstrateChain } from './chains';
import { ApiPromise, WsProvider } from '@polkadot/api';

interface InjectedAccountWithSigner extends InjectedAccountWithMeta {
  signer: {
    signRaw: (data: { address: string; data: string; type: string }) => Promise<{ signature: string }>;
  };
}

export class SubstrateWallet {
  private api: ApiPromise | null = null;
  private accounts: InjectedAccountWithSigner[] = [];
  private selectedAccount: InjectedAccountWithSigner | null = null;
  private chain: SubstrateChain | null = null;

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error('SubstrateWallet can only be used in the browser');
    }
  }

  private async init() {
    const { web3Enable } = await import('@polkadot/extension-dapp');
    const extensions = await web3Enable('Blockchain Signed Messages');
    if (extensions.length === 0) {
      throw new Error('No extension found');
    }
  }

  async connect(chain: SubstrateChain): Promise<void> {
    try {
      // Initialize the extension
      await this.init();

      // Get accounts with the correct SS58 format
      const { web3Accounts } = await import('@polkadot/extension-dapp');
      const accounts = await web3Accounts({ ss58Format: chain.ss58Format });
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Cast accounts to InjectedAccountWithSigner
      this.accounts = accounts as InjectedAccountWithSigner[];
      this.chain = chain;
      this.selectedAccount = this.accounts[0]; // Select first account by default

      // Initialize the API
      const provider = new WsProvider(chain.rpcEndpoint);
      this.api = await ApiPromise.create({ provider });
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }

  disconnect(): void {
    if (this.api) {
      this.api.disconnect();
      this.api = null;
    }
    this.accounts = [];
    this.selectedAccount = null;
    this.chain = null;
  }

  isConnected(): boolean {
    return this.api !== null && this.selectedAccount !== null;
  }

  getAccounts(): InjectedAccountWithSigner[] {
    return this.accounts;
  }

  getSelectedAccount(): InjectedAccountWithSigner | null {
    return this.selectedAccount;
  }

  setSelectedAccount(account: InjectedAccountWithSigner): void {
    this.selectedAccount = account;
  }

  getChain(): SubstrateChain | null {
    return this.chain;
  }

  getApi(): ApiPromise | null {
    return this.api;
  }

  async signMessage(message: string, address: string, chain: SubstrateChain): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }

    const account = this.accounts.find(acc => acc.address === address);
    if (!account) {
      throw new Error('Account not found');
    }

    // Get the extension
    const extension = (window as any).injectedWeb3?.[account.meta.source];
    if (!extension) {
      throw new Error('Extension not found');
    }

    // Initialize the extension
    const injected = await extension.enable('Blockchain Signed Messages');
    if (!injected) {
      throw new Error('Failed to enable extension');
    }

    // Get the signer
    const signer = injected.signer;
    if (!signer || !signer.signRaw) {
      throw new Error('Signer not available');
    }

    // Sign the message
    const { signature } = await signer.signRaw({
      address,
      data: message,
      type: 'bytes'
    });

    return signature;
  }
} 