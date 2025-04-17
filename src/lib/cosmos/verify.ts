import { verifySignature } from './signing';
import { parseSignature } from '../signature/format';
import { SignatureData } from './types';

export async function verifyMessage(message: string, signature: string, address: string): Promise<boolean> {
  try {
    const parsedSignature = parseSignature(signature);
    if (!parsedSignature.pub_key || !parsedSignature.signature || !parsedSignature.sign_doc) {
      throw new Error('Invalid signature format: missing required fields');
    }
    
    const signatureData: SignatureData = {
      signature: parsedSignature.signature,
      pub_key: parsedSignature.pub_key,
      sign_doc: parsedSignature.sign_doc
    };
    
    return verifySignature(signatureData, address);
  } catch (error) {
    console.error('Error verifying Cosmos message:', error);
    return false;
  }
} 