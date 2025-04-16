export interface SubstrateChain {
  name: string;
  rpcUrl: string;
  ss58Format: number;
}

export const SUBSTRATE_CHAINS: SubstrateChain[] = [
  {
    name: 'Polkadot',
    rpcUrl: 'wss://rpc.polkadot.io',
    ss58Format: 0
  },
  {
    name: 'Kusama',
    rpcUrl: 'wss://kusama-rpc.polkadot.io',
    ss58Format: 2
  },
  {
    name: 'Westend',
    rpcUrl: 'wss://westend-rpc.polkadot.io',
    ss58Format: 42
  }
];

export function getChainByAddress(address: string): SubstrateChain | null {
  // Check the SS58 prefix of the address
  const prefix = parseInt(address.substring(0, 2), 16);
  
  for (const chain of SUBSTRATE_CHAINS) {
    if (chain.ss58Format === prefix) {
      return chain;
    }
  }
  
  return null;
} 