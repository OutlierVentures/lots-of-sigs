import { CHAINS, getChainConfig, getChainIds } from '../../lib/cosmos/chains';

describe('Cosmos Chain Configurations', () => {
  it('should have correct configurations for Cosmos Hub', () => {
    const config = CHAINS['cosmoshub-4'];
    expect(config.chainId).toBe('cosmoshub-4');
    expect(config.chainName).toBe('Cosmos Hub');
    expect(config.bech32Prefix).toBe('cosmos');
    expect(config.coinType).toBe(118);
    expect(config.gasPrice.denom).toBe('uatom');
  });

  it('should have correct configurations for Fetch.ai', () => {
    const config = CHAINS['fetchhub-4'];
    expect(config.chainId).toBe('fetchhub-4');
    expect(config.chainName).toBe('Fetch.ai');
    expect(config.bech32Prefix).toBe('fetch');
    expect(config.coinType).toBe(118);
    expect(config.gasPrice.denom).toBe('afet');
  });

  it('should have correct configurations for Agoric', () => {
    const config = CHAINS['agoric-3'];
    expect(config.chainId).toBe('agoric-3');
    expect(config.chainName).toBe('Agoric');
    expect(config.bech32Prefix).toBe('agoric');
    expect(config.coinType).toBe(564);
    expect(config.gasPrice.denom).toBe('ubld');
  });

  it('should have correct configurations for Cheqd', () => {
    const config = CHAINS['cheqd-mainnet-1'];
    expect(config.chainId).toBe('cheqd-mainnet-1');
    expect(config.chainName).toBe('Cheqd');
    expect(config.bech32Prefix).toBe('cheqd');
    expect(config.coinType).toBe(118);
    expect(config.gasPrice.denom).toBe('ncheq');
    expect(config.gasPrice.amount).toBe('25');
  });

  it('should have correct configurations for Secret Network', () => {
    const config = CHAINS['secret-4'];
    expect(config.chainId).toBe('secret-4');
    expect(config.chainName).toBe('Secret Network');
    expect(config.bech32Prefix).toBe('secret');
    expect(config.coinType).toBe(529);
    expect(config.gasPrice.denom).toBe('uscrt');
    expect(config.gasPrice.amount).toBe('0.25');
  });

  it('should get chain config by chainId', () => {
    const config = getChainConfig('cosmoshub-4');
    expect(config.chainId).toBe('cosmoshub-4');
  });

  it('should throw error for unknown chainId', () => {
    expect(() => getChainConfig('unknown-chain')).toThrow();
  });

  it('should get all chain IDs', () => {
    const chainIds = getChainIds();
    expect(chainIds).toContain('cosmoshub-4');
    expect(chainIds).toContain('fetchhub-4');
    expect(chainIds).toContain('agoric-3');
    expect(chainIds).toContain('cheqd-mainnet-1');
    expect(chainIds).toContain('secret-4');
  });
}); 