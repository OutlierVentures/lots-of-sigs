import { Keyring } from '@polkadot/keyring';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

export interface SubstrateChain {
  name: string;
  ss58Format: number;
  displayName: string;
  rpcEndpoint: string;
  description: string;
}

export const DEFAULT_CHAIN: SubstrateChain = {
  name: 'default',
  displayName: 'Default Format (All Chains)',
  ss58Format: 5,
  rpcEndpoint: 'wss://rpc.polkadot.io',
  description: 'Usable on all chains'
};

export const SUBSTRATE_CHAINS: SubstrateChain[] = [
  {
    name: 'polkadot',
    displayName: 'Polkadot Relay Chain',
    ss58Format: 0,
    rpcEndpoint: 'wss://rpc.polkadot.io',
    description: 'Polkadot mainnet'
  },
  {
    name: 'kusama',
    displayName: 'Kusama Relay Chain',
    ss58Format: 2,
    rpcEndpoint: 'wss://kusama-rpc.polkadot.io',
    description: 'Kusama mainnet'
  },
  {
    name: 'polkadex',
    displayName: 'Polkadex Mainnet',
    ss58Format: 88,
    rpcEndpoint: 'wss://mainnet.polkadex.trade',
    description: 'Polkadex mainnet'
  },
  {
    name: 'polkadexparachain',
    displayName: 'Polkadex Parachain',
    ss58Format: 63,
    rpcEndpoint: 'wss://polkadex-parachain.polkadex.trade',
    description: 'Polkadex parachain'
  }
];

export function getChainByAddress(address: string): SubstrateChain | null {
  try {
    // First try to decode the address to get its format
    const decoded = decodeAddress(address);
    
    // Check if it's a Polkadex Mainnet address (SS58 format 88)
    if (decoded[0] === 88) {
      return getChainByName('polkadex');
    }

    // Check if it's a Polkadex Parachain address (SS58 format 63)
    if (decoded[0] === 63) {
      return getChainByName('polkadexparachain');
    }

    // Check if it's a Kusama address (SS58 format 2)
    if (decoded[0] === 2) {
      return getChainByName('kusama');
    }

    // Check if it's a Polkadot address (SS58 format 0)
    if (decoded[0] === 0) {
      return getChainByName('polkadot');
    }

    // If we can't determine the chain from the format, try to encode it in each chain's format
    // to see if it's valid in any of them
    const chains = getAllChains();
    for (const chain of chains) {
      try {
        const encoded = encodeAddress(decoded, chain.ss58Format);
        if (encoded === address) {
          return chain;
        }
      } catch (e) {
        // Ignore encoding errors and continue to next chain
      }
    }

    // If we get here, it's a valid address but not in any known chain's format
    // Return the default chain
    return getDefaultChain();
  } catch (error) {
    console.error('Error detecting chain from address:', error);
    return null;
  }
}

export function getChainByName(name: string): SubstrateChain | null {
  if (name.toLowerCase() === 'default') {
    return DEFAULT_CHAIN;
  }
  return SUBSTRATE_CHAINS.find(chain => chain.name.toLowerCase() === name.toLowerCase()) || null;
}

export function getAllChains(): SubstrateChain[] {
  return [DEFAULT_CHAIN, ...SUBSTRATE_CHAINS];
}

export function getDefaultChain(): SubstrateChain {
  return DEFAULT_CHAIN;
} 