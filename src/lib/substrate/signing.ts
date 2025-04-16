import { SubstrateWallet } from './client-wallet';
import { SubstrateChain } from './chains';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { SignedMessage as AppSignedMessage } from '../../app/types/message';

export interface SignedMessage extends AppSignedMessage {
  chain: string;
}

export async function signMessage(
  message: string,
  address: string,
  chain: SubstrateChain
): Promise<SignedMessage> {
  await cryptoWaitReady();
  
  const wallet = new SubstrateWallet();
  await wallet.connect(chain);
  
  const accounts = wallet.getAccounts();
  const account = accounts.find(acc => acc.address === address);
  if (!account) {
    throw new Error('Account not found');
  }

  // Sign the message
  const signature = await wallet.signMessage(message, address, chain);

  return {
    message,
    signature,
    address,
    chain: chain.name,
    network: 'polkadot',
    timestamp: new Date().toISOString()
  };
}

export async function verifyMessage(
  signedMessage: SignedMessage,
  chain: SubstrateChain
): Promise<boolean> {
  await cryptoWaitReady();
  
  try {
    // Create a keyring instance
    const keyring = new Keyring({ type: 'sr25519' });
    
    // Decode the address to get the public key
    const publicKey = keyring.decodeAddress(signedMessage.address);
    
    // Convert the signature from hex to Uint8Array
    const signature = hexToU8a(signedMessage.signature as string);
    
    // Verify the signature
    const { isValid } = signatureVerify(
      signedMessage.message,
      signature,
      publicKey
    );

    return isValid;
  } catch (error) {
    console.error('Error verifying message:', error);
    return false;
  }
} 