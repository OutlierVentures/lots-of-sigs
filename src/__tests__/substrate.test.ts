// Mock the Polkadot.js extension
const mockExtension = {
  signer: {
    signRaw: jest.fn().mockResolvedValue({
      signature: '0x1234567890abcdef'
    })
  }
};

// Mock window.injectedWeb3
Object.defineProperty(window, 'injectedWeb3', {
  value: {
    'polkadot-js': mockExtension
  },
  writable: true
});

// Mock ApiPromise
const mockApi = {
  isConnected: true,
  disconnect: jest.fn()
};

// Mock web3Enable and ApiPromise
jest.mock('@polkadot/extension-dapp', () => ({
  web3Enable: jest.fn().mockResolvedValue([mockExtension]),
  web3Accounts: jest.fn().mockResolvedValue([
    {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: {
        name: 'Test Account',
        source: 'polkadot-js'
      }
    }
  ])
}));

jest.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: jest.fn().mockResolvedValue(mockApi)
  },
  WsProvider: jest.fn()
}));

jest.mock('@polkadot/util-crypto', () => ({
  cryptoWaitReady: jest.fn().mockResolvedValue(true),
  signatureVerify: jest.fn().mockReturnValue({ isValid: true })
}));

import { SubstrateWallet } from '../lib/substrate/wallet';
import { SUBSTRATE_CHAINS } from '../lib/substrate/chains';
import { signMessage, verifyMessage } from '../lib/substrate/signing';

describe('Substrate Integration', () => {
  let wallet: SubstrateWallet;
  const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const testMessage = 'Hello, Substrate!';
  const testChain = SUBSTRATE_CHAINS.polkadot;

  beforeEach(async () => {
    wallet = await SubstrateWallet.getInstance();
  });

  describe('Wallet Connection', () => {
    it('should connect to wallet and get accounts', async () => {
      const accounts = await wallet.connect();
      expect(accounts).toBeDefined();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(1);
      expect(accounts[0].address).toBe(testAddress);
    });

    it('should connect to network', async () => {
      await wallet.connectToNetwork(testChain.rpcEndpoint);
      const api = wallet.getApi();
      expect(api).toBeDefined();
      expect(api?.isConnected).toBe(true);
    });
  });

  describe('Message Signing', () => {
    it('should sign a message', async () => {
      await wallet.connect();
      const signedMessage = await signMessage(testMessage, testAddress, testChain);
      
      expect(signedMessage).toBeDefined();
      expect(signedMessage.message).toBe(testMessage);
      expect(signedMessage.signature).toBe('0x1234567890abcdef');
      expect(signedMessage.address).toBe(testAddress);
      expect(signedMessage.chain).toBe(testChain.name);
    });
  });

  describe('Message Verification', () => {
    it('should verify a signed message', async () => {
      await wallet.connect();
      const signedMessage = await signMessage(testMessage, testAddress, testChain);
      const isValid = await verifyMessage(signedMessage, testChain);
      
      expect(isValid).toBe(true);
    });
  });
}); 