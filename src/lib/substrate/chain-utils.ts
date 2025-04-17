import { SubstrateChain } from './chains';
import { getAllChains, getChainByName, getChainByAddress } from './chains';

/**
 * Determines the appropriate chain for a given signature and address
 * @param signatureOrChainId - The signature string or chain ID
 * @param address - The signer's address
 * @param selectedChainId - The manually selected chain ID
 * @returns The determined chain or null if no chain could be determined
 */
export function determineChain(
  signatureOrChainId: string,
  address?: string,
  selectedChainId?: string
): SubstrateChain | null {
  // If we have a selected chain ID, it takes precedence
  if (selectedChainId && isValidChainId(selectedChainId)) {
    return getChainByName(selectedChainId.toLowerCase());
  }

  // If signatureOrChainId is a valid chain ID, use that
  if (isValidChainId(signatureOrChainId)) {
    return getChainByName(signatureOrChainId.toLowerCase());
  }

  // If we have an address, try to determine the chain from it
  if (address) {
    return getChainByAddress(address);
  }

  // Try to parse the signature as JSON
  try {
    const signatureJson = JSON.parse(signatureOrChainId);
    if (signatureJson.chain && isValidChainId(signatureJson.chain)) {
      return getChainByName(signatureJson.chain.toLowerCase());
    }
  } catch (e) {
    // If we can't parse as JSON and we don't have an address, return default chain
    return getDefaultChain();
  }

  return getDefaultChain();
}

/**
 * Checks if a given chain ID is valid
 * @param chainId - The chain ID to check
 * @returns True if the chain ID is valid, false otherwise
 */
export function isValidChainId(chainId: any): boolean {
  if (typeof chainId !== 'string') return false;
  return getAllChains().some(chain => chain.name.toLowerCase() === chainId.toLowerCase());
}

/**
 * Gets the default chain for a network
 * @returns The default chain
 */
export function getDefaultChain(): SubstrateChain {
  return getAllChains()[0];
} 