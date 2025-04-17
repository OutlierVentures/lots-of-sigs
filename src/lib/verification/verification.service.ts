import { NetworkType } from '@/app/types/wallet';
import { SubstrateChain } from '@/lib/substrate/chains';
import { verifyMessage as verifySubstrateMessage } from '@/lib/substrate/verify';
import { verifyMessage as verifyCosmosMessage } from '@/lib/cosmos/verify';
import { verifyMessage as verifyEthereumMessage } from '@/lib/ethereum/verify';
import { getAllChains } from '@/lib/substrate/chains';

export interface VerificationResult {
  isValid: boolean;
  message: string;
  details: {
    checks: Array<{ name: string; passed: boolean; details?: string }>;
    network: string;
    chain?: string;
  };
}

export interface VerificationInput {
  message: string;
  signature: string;
  address: string;
  network: NetworkType;
  chainId?: string;
}

export class VerificationService {
  static async verify(input: VerificationInput): Promise<VerificationResult> {
    const { message, signature, address, network, chainId } = input;
    const checks: Array<{ name: string; passed: boolean; details?: string }> = [];
    let chainDisplayName: string | undefined;
    let networkDisplayName = network;
    
    try {
      // Set network display name
      switch (network) {
        case 'ethereum':
          networkDisplayName = 'Ethereum';
          break;
        case 'cosmos':
          networkDisplayName = 'Cosmos';
          break;
        case 'polkadot':
          networkDisplayName = 'Polkadot';
          break;
        default:
          networkDisplayName = network;
      }
      
      // 1. Message format check
      const messageCheck = {
        name: 'Message format',
        passed: message.trim().length > 0,
        details: message.trim().length > 0 ? 'Valid message format' : 'Message is required'
      };
      checks.push(messageCheck);
      
      // 2. Signature format check
      const signatureCheck = {
        name: 'Signature format',
        passed: signature.trim().length > 0,
        details: signature.trim().length > 0 ? 'Valid hex-encoded signature' : 'Signature is required'
      };
      checks.push(signatureCheck);
      
      // 3. Address format check
      const addressCheck = {
        name: 'Address format',
        passed: address.trim().length > 0,
        details: address.trim().length > 0 ? 'Valid address format' : 'Address is required'
      };
      checks.push(addressCheck);
      
      // If any of the format checks fail, return early
      if (!messageCheck.passed || !signatureCheck.passed || !addressCheck.passed) {
        // Add a placeholder check for signature verification that failed
        checks.push({
          name: 'Signature verification',
          passed: false,
          details: 'Cannot verify signature due to invalid input format'
        });
        
        return {
          isValid: false,
          message: 'Invalid input parameters',
          details: {
            checks,
            network: networkDisplayName,
            chain: chainDisplayName
          }
        };
      }
      
      // 4. Signature verification check
      let isValid = false;
      try {
        switch (network) {
          case 'ethereum':
            isValid = await verifyEthereumMessage(message, signature, address);
            break;
          case 'cosmos':
            isValid = await verifyCosmosMessage(message, signature, address);
            break;
          case 'polkadot':
            // For Polkadot, we need to determine the chain
            const chains = getAllChains();
            const chain = chainId 
              ? chains.find(c => c.name.toLowerCase() === chainId.toLowerCase())
              : chains.find(c => c.name.toLowerCase() === 'polkadot');
            
            if (!chain) {
              throw new Error('Could not determine chain for verification');
            }
            
            chainDisplayName = chain.displayName;
            isValid = await verifySubstrateMessage(message, signature, address);
            break;
          default:
            throw new Error(`Unsupported network: ${network}`);
        }
        
        checks.push({
          name: 'Signature verification',
          passed: isValid,
          details: isValid ? 'Valid signature for address' : 'Invalid signature for address'
        });
        
        return {
          isValid,
          message: isValid ? 'Signature is valid' : 'Signature is invalid',
          details: {
            checks,
            network: networkDisplayName,
            chain: chainDisplayName
          }
        };
        
      } catch (verificationError) {
        // Add the failed verification check
        checks.push({
          name: 'Signature verification',
          passed: false,
          details: verificationError instanceof Error ? verificationError.message : 'Verification failed'
        });
        
        return {
          isValid: false,
          message: verificationError instanceof Error ? verificationError.message : 'Verification failed',
          details: {
            checks,
            network: networkDisplayName,
            chain: chainDisplayName
          }
        };
      }
      
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Verification failed',
        details: {
          checks,
          network: networkDisplayName,
          chain: chainDisplayName
        }
      };
    }
  }
  
  static parseJsonInput(jsonString: string): VerificationInput | null {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate required fields
      if (!data.message || !data.signature || !data.address || !data.network) {
        return null;
      }
      
      return {
        message: data.message,
        signature: data.signature,
        address: data.address,
        network: data.network,
        chainId: data.chainId
      };
    } catch (error) {
      return null;
    }
  }
} 