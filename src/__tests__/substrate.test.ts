// Mock the Polkadot.js extension
const mockExtension = {
  enable: jest.fn().mockResolvedValue({
    signer: {
      signRaw: jest.fn().mockResolvedValue({
        signature: '0x1234567890abcdef'
      })
    }
  })
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

jest.mock('@polkadot/keyring', () => ({
  Keyring: jest.fn().mockImplementation(() => ({
    decodeAddress: jest.fn().mockReturnValue(new Uint8Array(32)),
    addFromAddress: jest.fn().mockReturnValue({
      verify: jest.fn().mockReturnValue(true)
    })
  }))
}));

import { SubstrateWallet } from '../lib/substrate/client-wallet';
import { SUBSTRATE_CHAINS } from '../lib/substrate/chains';
import { signMessage, verifyMessage, SignedMessage } from '../lib/substrate/signing';

describe('Substrate Integration', () => {
  let wallet: SubstrateWallet;
  const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const testMessage = 'Hello, Substrate!';
  const testChain = SUBSTRATE_CHAINS[0]; // Use Polkadot chain

  beforeEach(() => {
    wallet = new SubstrateWallet();
  });

  describe('Wallet Connection', () => {
    it('should connect to wallet and get accounts', async () => {
      await wallet.connect(testChain);
      const accounts = wallet.getAccounts();
      expect(accounts).toBeDefined();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(1);
      expect(accounts[0].address).toBe(testAddress);
    });

    it('should connect to network and get API', async () => {
      await wallet.connect(testChain);
      const api = wallet.getApi();
      expect(api).toBeDefined();
      expect(api?.isConnected).toBe(true);
    });
  });

  describe('Message Signing', () => {
    it('should sign a message', async () => {
      await wallet.connect(testChain);
      const signedMessage = await wallet.signMessage(testMessage, testAddress, testChain);
      
      expect(signedMessage).toBeDefined();
      expect(signedMessage).toBe('0x1234567890abcdef');
    });
  });

  describe('Message Verification', () => {
    it('should verify a signed message', async () => {
      await wallet.connect(testChain);
      const signature = await wallet.signMessage(testMessage, testAddress, testChain);
      const signedMessage: SignedMessage = {
        message: testMessage,
        signature,
        address: testAddress,
        chain: testChain.name,
        network: 'substrate',
        timestamp: new Date().toISOString()
      };
      const isValid = await verifyMessage(signedMessage, testChain);
      
      expect(isValid).toBe(true);
    });
  });
}); 