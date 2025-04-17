import { determineChain, isValidChainId, getDefaultChain } from '../../lib/substrate/chain-utils';
import { SubstrateChain } from '../../lib/substrate/chains';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

// Helper function to generate a valid SS58 format 5 address
async function generateDefaultFormatAddress(): Promise<string> {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 5 });
  const pair = keyring.addFromUri('//Alice');
  return pair.address;
}

// Helper function to generate a valid Polkadex Mainnet address
async function generatePolkadexMainnetAddress(): Promise<string> {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 88 });
  const pair = keyring.addFromUri('//Alice');
  return pair.address;
}

// Helper function to generate a valid Polkadex Parachain address
async function generatePolkadexParachainAddress(): Promise<string> {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 63 });
  const pair = keyring.addFromUri('//Alice');
  return pair.address;
}

describe('Chain Utils', () => {
  describe('Address Generation', () => {
    it('should generate Kusama and Polkadot addresses from the same key', async () => {
      // Wait for crypto to be ready
      await cryptoWaitReady();

      // Create keyring instances for different networks
      const kusamaKeyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
      const polkadotKeyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
      
      // Add a dummy private key (in hex format)
      const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const kusamaPair = kusamaKeyring.addFromUri(privateKey);
      const polkadotPair = polkadotKeyring.addFromUri(privateKey);
      
      // Get addresses in their respective formats
      const kusamaAddress = kusamaPair.address;
      console.log('Kusama Address:', kusamaAddress);
      
      const polkadotAddress = polkadotPair.address;
      console.log('Polkadot Address:', polkadotAddress);
      
      // Verify the addresses are different but from the same key
      expect(kusamaAddress).toBeDefined();
      expect(polkadotAddress).toBeDefined();
      expect(kusamaAddress).not.toBe(polkadotAddress);
      expect(['C', 'D', 'E', 'F', 'G', 'H', 'J'].includes(kusamaAddress[0])).toBe(true); // Kusama addresses can start with any of these letters
      expect(polkadotAddress.startsWith('1')).toBe(true);
      
      // Verify the public key is the same
      const kusamaPublicKey = kusamaKeyring.decodeAddress(kusamaAddress);
      const polkadotPublicKey = polkadotKeyring.decodeAddress(polkadotAddress);
      expect(u8aToHex(kusamaPublicKey)).toBe(u8aToHex(polkadotPublicKey));
    });
  });

  describe('determineChain', () => {
    it('should determine chain from signature JSON', () => {
      const signature = JSON.stringify({
        signature: '0x123',
        chain: 'polkadot'
      });
      const address = '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';
      const result = determineChain(signature, address);
      expect(result?.name).toBe('polkadot');
    });

    it('should determine chain from signature string', () => {
      const signature = JSON.stringify({
        signature: '0x123',
        chain: 'kusama'
      });
      const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const result = determineChain(signature, address);
      expect(result?.name).toBe('default');
    });

    it('should determine chain from address', () => {
      const signature = '0x123';
      const address = '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';
      const result = determineChain(signature, address);
      expect(result?.name).toBe('polkadot');
    });

    it('should determine chain from selection', () => {
      const signature = '0x123';
      const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const selectedChainId = 'kusama';
      const result = determineChain(signature, address, selectedChainId);
      expect(result?.name).toBe('kusama');
    });

    it('should return default chain for generic format addresses', async () => {
      const signature = '0x123';
      const address = await generateDefaultFormatAddress();
      const result = determineChain(signature, address);
      expect(result?.name).toBe('default');
    });

    it('should return null if no chain can be determined', () => {
      const signature = '0x123';
      const address = 'invalid-address';
      const result = determineChain(signature, address);
      expect(result).toBeNull();
    });

    it('should determine chain from Polkadex Mainnet address', async () => {
      const signature = '0x123';
      const address = await generatePolkadexMainnetAddress();
      console.log('Generated Polkadex Mainnet Address:', address);
      const result = determineChain(signature, address);
      expect(result?.name).toBe('polkadex');
    });

    it('should determine chain from Polkadex Parachain address', async () => {
      const signature = '0x123';
      const address = await generatePolkadexParachainAddress();
      console.log('Generated Polkadex Parachain Address:', address);
      const result = determineChain(signature, address);
      expect(result?.name).toBe('polkadexparachain');
    });

    it('should determine chain from literal Kusama address', () => {
      const signature = '0x123';
      // Example Kusama address starting with 'D'
      const address = 'DSiD3pqrX6x1nDeGM2R9vrTtW5ZJf7mnVERKEQGyPg3RTCV';
      const result = determineChain(signature, address);
      expect(result?.name).toBe('kusama');
    });

    it('should determine chain from literal Polkadex Mainnet address', () => {
      const signature = '0x123';
      const address = 'esqZdrqhgH8zy1wqYh1aLKoRyoRWLFbX9M62eKfaTAoK67pJ5';
      const result = determineChain(signature, address);
      expect(result?.name).toBe('polkadex');
    });

    it('should determine chain from literal Polkadex Parachain address', () => {
      const signature = '0x123';
      const address = '7NPoMQbiA6trJKkjB35uk96MeJD4PGWkLQLH7k7hXEkZpiba';
      const result = determineChain(signature, address);
      expect(result?.name).toBe('polkadexparachain');
    });
  });

  describe('isValidChainId', () => {
    it('should return true for valid chain IDs', () => {
      expect(isValidChainId('polkadot')).toBe(true);
      expect(isValidChainId('kusama')).toBe(true);
      expect(isValidChainId('polkadex')).toBe(true);
      expect(isValidChainId('polkadexparachain')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isValidChainId('POLKADOT')).toBe(true);
      expect(isValidChainId('Kusama')).toBe(true);
      expect(isValidChainId('POLKADEX')).toBe(true);
      expect(isValidChainId('POLKADEXPARACHAIN')).toBe(true);
    });

    it('should return false for invalid chain IDs', () => {
      expect(isValidChainId('invalid')).toBe(false);
      expect(isValidChainId('')).toBe(false);
    });
  });

  describe('getDefaultChain', () => {
    it('should return the first chain from getAllChains', () => {
      const defaultChain = getDefaultChain();
      expect(defaultChain).toBeDefined();
      expect(defaultChain.name).toBe('default');
    });
  });
}); 