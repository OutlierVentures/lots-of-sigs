import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { SubstrateChain } from './chains';

export class SubstrateWallet {
  private api: any = null;
  private accounts: InjectedAccountWithMeta[] = [];
  private selectedAccount: InjectedAccountWithMeta | null = null;
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
      // Initialize the extension first
      await this.init();

      // Initialize API
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const provider = new WsProvider(chain.rpcUrl);
      this.api = await ApiPromise.create({ provider });
      
      // Get accounts
      const { web3Accounts } = await import('@polkadot/extension-dapp');
      this.accounts = await web3Accounts();
      if (this.accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.chain = chain;
      this.selectedAccount = this.accounts[0]; // Select first account by default
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

  getAccounts(): InjectedAccountWithMeta[] {
    return this.accounts;
  }

  getSelectedAccount(): InjectedAccountWithMeta | null {
    return this.selectedAccount;
  }

  setSelectedAccount(account: InjectedAccountWithMeta): void {
    this.selectedAccount = account;
  }

  getChain(): SubstrateChain | null {
    return this.chain;
  }

  getApi(): any {
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