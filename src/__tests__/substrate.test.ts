// Mock the Polkadot.js extension
const mockExtension = {
  enable: jest.fn().mockResolvedValue({
    signer: {
      signRaw: jest.fn().mockResolvedValue({
        signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
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

// Mock web3Enable and cryptoWaitReady
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

// Mock @polkadot/util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  cryptoWaitReady: jest.fn().mockResolvedValue(true),
  signatureVerify: jest.fn().mockReturnValue({ isValid: true }),
  decodeAddress: jest.fn().mockImplementation((address) => {
    if (address === 'invalid-address') {
      throw new Error('Invalid address format');
    }
    return new Uint8Array(32).fill(1);
  })
}));

// Mock @polkadot/keyring
jest.mock('@polkadot/keyring', () => {
  const mockKeyring = {
    decodeAddress: jest.fn().mockImplementation((address) => {
      if (address === 'invalid-address') {
        throw new Error('Invalid address format');
      }
      return new Uint8Array(32).fill(1);
    })
  };
  return {
    Keyring: jest.fn().mockImplementation(() => mockKeyring)
  };
});

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
    jest.clearAllMocks();
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

    it('should throw error when no extension is found', async () => {
      const mockWeb3Enable = require('@polkadot/extension-dapp').web3Enable;
      mockWeb3Enable.mockResolvedValueOnce([]);
      
      await expect(wallet.connect(testChain)).rejects.toThrow('No extension found');
    });
  });

  describe('Message Signing', () => {
    it('should sign a message', async () => {
      await wallet.connect(testChain);
      const signedMessage = await wallet.signMessage(testMessage, testAddress, testChain);
      
      expect(signedMessage).toBeDefined();
      expect(signedMessage).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should throw error when wallet is not connected', async () => {
      await expect(wallet.signMessage(testMessage, testAddress, testChain))
        .rejects.toThrow('Wallet not connected');
    });

    it('should throw error when address is not found', async () => {
      await wallet.connect(testChain);
      await expect(wallet.signMessage(testMessage, 'invalid-address', testChain))
        .rejects.toThrow('Account not found');
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

    it('should verify message with wrapped format', async () => {
      await wallet.connect(testChain);
      const wrappedMessage = `<Bytes>${testMessage}</Bytes>`;
      const signature = await wallet.signMessage(wrappedMessage, testAddress, testChain);
      const signedMessage: SignedMessage = {
        message: wrappedMessage,
        signature,
        address: testAddress,
        chain: testChain.name,
        network: 'substrate',
        timestamp: new Date().toISOString()
      };
      const isValid = await verifyMessage(signedMessage, testChain);
      
      expect(isValid).toBe(true);
    });

    it('should fail verification with invalid signature', async () => {
      const signedMessage: SignedMessage = {
        message: testMessage,
        signature: '0xinvalid',
        address: testAddress,
        chain: testChain.name,
        network: 'substrate',
        timestamp: new Date().toISOString()
      };

      const { signatureVerify } = require('@polkadot/util-crypto');
      signatureVerify.mockReturnValueOnce({ isValid: false });

      const isValid = await verifyMessage(signedMessage, testChain);
      expect(isValid).toBe(false);
    });

    it('should fail verification with invalid address', async () => {
      await wallet.connect(testChain);
      const signature = await wallet.signMessage(testMessage, testAddress, testChain);
      const signedMessage: SignedMessage = {
        message: testMessage,
        signature,
        address: 'invalid-address',
        chain: testChain.name,
        network: 'substrate',
        timestamp: new Date().toISOString()
      };

      const isValid = await verifyMessage(signedMessage, testChain);
      expect(isValid).toBe(false);
    });

    it('should verify message with Bytes wrapper', async () => {
      const message = 'ooo';
      const wrappedMessage = `<Bytes>${message}</Bytes>`;
      const signature = '0x6ee5eea7965cff4907111540cb650aded2b8d11e62a086c29a04a887e47ca948c796c32f8a08a869c626a1b81da34a214eab672695fddc3f1549f22d0c87fa88';
      const address = '147xU4gU4iWMtzmLarCJrhPsR95PEQWtphtXM56EqhjHGC3F';
      
      const signedMessage: SignedMessage = {
        message: wrappedMessage,
        signature,
        address,
        chain: 'polkadot',
        network: 'polkadot',
        timestamp: new Date().toISOString()
      };

      const isValid = await verifyMessage(signedMessage, testChain);
      expect(isValid).toBe(true);
    });
  });
}); 