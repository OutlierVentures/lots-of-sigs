export interface ChainConfig {
  chainId: string;
  chainName: string;
  bech32Prefix: string;
  rpcEndpoint: string;
  restEndpoint: string;
  coinType: number;
  gasPrice: {
    amount: string;
    denom: string;
  };
}

export const CHAINS: Record<string, ChainConfig> = {
  'cosmoshub-4': {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    bech32Prefix: 'cosmos',
    rpcEndpoint: 'https://rpc.cosmos.network',
    restEndpoint: 'https://lcd.cosmos.network',
    coinType: 118,
    gasPrice: {
      amount: '0.0025',
      denom: 'uatom'
    }
  },
  'fetchhub-4': {
    chainId: 'fetchhub-4',
    chainName: 'Fetch.ai',
    bech32Prefix: 'fetch',
    rpcEndpoint: 'https://rpc-fetchhub.fetch.ai',
    restEndpoint: 'https://rest-fetchhub.fetch.ai',
    coinType: 118,
    gasPrice: {
      amount: '0.0025',
      denom: 'afet'
    }
  },
  'agoric-3': {
    chainId: 'agoric-3',
    chainName: 'Agoric',
    bech32Prefix: 'agoric',
    rpcEndpoint: 'https://main.rpc.agoric.net',
    restEndpoint: 'https://main.api.agoric.net',
    coinType: 564,
    gasPrice: {
      amount: '0.0025',
      denom: 'ubld'
    }
  },
  'cheqd-mainnet-1': {
    chainId: 'cheqd-mainnet-1',
    chainName: 'Cheqd',
    bech32Prefix: 'cheqd',
    rpcEndpoint: 'https://rpc.cheqd.net',
    restEndpoint: 'https://api.cheqd.net',
    coinType: 118,
    gasPrice: {
      amount: '25',
      denom: 'ncheq'
    }
  },
  'secret-4': {
    chainId: 'secret-4',
    chainName: 'Secret Network',
    bech32Prefix: 'secret',
    rpcEndpoint: 'https://rpc.secret.express',
    restEndpoint: 'https://lcd.secret.express',
    coinType: 529,
    gasPrice: {
      amount: '0.25',
      denom: 'uscrt'
    }
  }
};

export function getChainConfig(chainId: string): ChainConfig {
  const config = CHAINS[chainId];
  if (!config) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }
  return config;
}

export function getChainIds(): string[] {
  return Object.keys(CHAINS);
} 