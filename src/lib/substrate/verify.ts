import { signatureVerify, decodeAddress } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

export async function verifyMessage(message: string, signature: string, address: string): Promise<boolean> {
  try {
    await cryptoWaitReady();
    
    // Create a keyring instance with the appropriate SS58 format
    const keyring = new Keyring({ type: 'sr25519' });
    
    // Decode the address to get the public key
    const publicKey = decodeAddress(address);
    
    // Ensure signature has 0x prefix
    const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
    
    // Convert the signature from hex to Uint8Array
    const sigBytes = hexToU8a(formattedSignature);
    
    // Verify with raw message since that's how it was signed
    const { isValid } = signatureVerify(
      message,
      sigBytes,
      publicKey
    );

    return isValid;
  } catch (error) {
    console.error('Error verifying Substrate message:', error);
    return false;
  }
} 