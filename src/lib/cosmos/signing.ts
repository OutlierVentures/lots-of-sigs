import { Secp256k1, ExtendedSecp256k1Signature } from '@cosmjs/crypto';
import { fromBase64, toBech32, toBase64 } from '@cosmjs/encoding';
import { sha256, ripemd160 } from '@cosmjs/crypto';
import { ChainConfig, getChainConfig } from './chains';

export interface SignDoc {
  chain_id: string;
  account_number: string;
  sequence: string;
  fee: {
    gas: string;
    amount: Array<{ amount: string; denom: string }>;
  };
  msgs: Array<{
    type: string;
    value: {
      signer: string;
      data: string;
    };
  }>;
  memo: string;
}

export interface SignatureData {
  signature: string;
  pub_key: {
    type: string;
    value: string;
  };
  sign_doc: SignDoc;
}

/**
 * Creates an ADR-36 compatible sign document
 * @param message - The message to sign
 * @param signer - The address of the signer
 * @param chainId - The chain ID
 * @returns The sign document
 */
export function createSignDoc(message: string, signer: string, chainId: string = 'cosmoshub-4'): SignDoc {
  const chainConfig = getChainConfig(chainId);
  // Base64 encode the message as required by ADR-36
  const base64Data = Buffer.from(message).toString('base64');
  
  return {
    chain_id: "",  // Empty string for ADR-36
    account_number: "0",
    sequence: "0",
    fee: {
      gas: "0",
      amount: [],  // Empty array for ADR-36
    },
    msgs: [
      {
        type: "sign/MsgSignData",
        value: {
          signer,
          data: base64Data,
        },
      },
    ],
    memo: "",
  };
}

/**
 * Creates a signature for a message using ADR-36 format
 * @param message - The message to sign
 * @param privateKey - The private key to sign with
 * @param publicKey - The public key corresponding to the private key
 * @returns The signature data in the format expected by the app
 */
export async function createSignature(
  message: string,
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<SignatureData> {
  // Create the sign document
  const signer = toBech32('cosmos', ripemd160(sha256(publicKey)));
  const signDoc = createSignDoc(message, signer);

  // Create the message hash using the sorted sign document format
  const sortedSignDoc = {
    account_number: signDoc.account_number,
    chain_id: signDoc.chain_id,
    fee: {
      amount: signDoc.fee.amount,
      gas: signDoc.fee.gas
    },
    memo: signDoc.memo,
    msgs: signDoc.msgs.map(msg => ({
      type: msg.type,
      value: {
        data: msg.value.data,
        signer: msg.value.signer
      }
    })),
    sequence: signDoc.sequence
  };
  const signDocString = JSON.stringify(sortedSignDoc, null, 0);
  const messageHash = sha256(new TextEncoder().encode(signDocString));

  // Sign the message
  const signature = await Secp256k1.createSignature(messageHash, privateKey);
  const sigBytes = new Uint8Array(64);
  sigBytes.set(signature.r(32));
  sigBytes.set(signature.s(32), 32);

  // Return the signature data
  return {
    signature: toBase64(sigBytes),
    pub_key: {
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(publicKey),
    },
    sign_doc: signDoc,
  };
}

/**
 * Verifies a signature using ADR-36 format
 * @param signatureData - The signature data to verify
 * @param expectedAddress - The expected signer address
 * @returns True if the signature is valid and matches the expected address
 */
export async function verifySignature(
  signatureData: SignatureData,
  expectedAddress: string
): Promise<boolean> {
  try {
    console.log('Verifying signature with data:', {
      signature: signatureData.signature,
      pub_key: signatureData.pub_key,
      sign_doc: signatureData.sign_doc,
      expectedAddress,
    });

    // Parse the signature and public key
    const sigBytes = fromBase64(signatureData.signature);
    const compressedPubKeyBytes = fromBase64(signatureData.pub_key.value);
    console.log('Parsed bytes:', {
      sigBytesLength: sigBytes.length,
      pubKeyBytesLength: compressedPubKeyBytes.length,
      pubKeyFirstByte: compressedPubKeyBytes[0].toString(16),
    });

    // Convert compressed public key to uncompressed if needed
    let pubKeyBytes;
    if (compressedPubKeyBytes.length === 33) {
      console.log('Detected compressed public key, attempting to uncompress...');
      try {
        pubKeyBytes = await Secp256k1.uncompressPubkey(compressedPubKeyBytes);
        console.log('Successfully uncompressed public key:', {
          compressed: Buffer.from(compressedPubKeyBytes).toString('hex'),
          uncompressed: Buffer.from(pubKeyBytes).toString('hex'),
          lengths: {
            compressed: compressedPubKeyBytes.length,
            uncompressed: pubKeyBytes.length
          },
          firstBytes: {
            compressed: compressedPubKeyBytes[0].toString(16),
            uncompressed: pubKeyBytes[0].toString(16)
          }
        });
      } catch (error) {
        console.error('Failed to uncompress public key:', error);
        return false;
      }
    } else if (compressedPubKeyBytes.length === 65) {
      console.log('Using uncompressed public key directly');
      pubKeyBytes = compressedPubKeyBytes;
    } else {
      console.error('Invalid public key length:', compressedPubKeyBytes.length);
      return false;
    }

    console.log('Public key bytes:', {
      compressed: Buffer.from(compressedPubKeyBytes).toString('hex'),
      uncompressed: Buffer.from(pubKeyBytes).toString('hex'),
      lengths: {
        compressed: compressedPubKeyBytes.length,
        uncompressed: pubKeyBytes.length
      }
    });

    // Create the message hash using the sorted sign document format
    const sortedSignDoc = {
      account_number: signatureData.sign_doc.account_number,
      chain_id: signatureData.sign_doc.chain_id,
      fee: {
        amount: signatureData.sign_doc.fee.amount,
        gas: signatureData.sign_doc.fee.gas
      },
      memo: signatureData.sign_doc.memo,
      msgs: signatureData.sign_doc.msgs.map(msg => ({
        type: msg.type,
        value: {
          data: msg.value.data,
          signer: msg.value.signer
        }
      })),
      sequence: signatureData.sign_doc.sequence
    };
    const signDocString = JSON.stringify(sortedSignDoc, null, 0);
    console.log('Sign doc string:', signDocString);
    console.log('Sign doc string bytes:', Buffer.from(signDocString).toString('hex'));
    
    const messageHash = sha256(new TextEncoder().encode(signDocString));
    console.log('Message hash:', Buffer.from(messageHash).toString('hex'));

    // Create the signature object
    const r = sigBytes.slice(0, 32);
    const s = sigBytes.slice(32, 64);
    
    // Ensure r and s are properly padded to 32 bytes
    const paddedR = new Uint8Array(32);
    const paddedS = new Uint8Array(32);
    paddedR.set(r, 32 - r.length);
    paddedS.set(s, 32 - s.length);
    
    // Try both possible recovery parameters (0 and 1)
    let isValid = false;
    for (let v = 0; v <= 1; v++) {
        const sig = new ExtendedSecp256k1Signature(paddedR, paddedS, v);
        console.log('Trying signature with recovery param:', v, {
            r: Buffer.from(sig.r(32)).toString('hex'),
            s: Buffer.from(sig.s(32)).toString('hex'),
            recovery: v,
        });
        
        try {
            isValid = await Secp256k1.verifySignature(sig, messageHash, pubKeyBytes);
            if (isValid) {
                console.log('Signature verified with recovery param:', v);
                break;
            }
        } catch (error) {
            console.log('Verification failed with recovery param:', v, error);
            continue;
        }
    }
    
    console.log('Final signature verification result:', isValid);

    if (!isValid) {
        return false;
    }

    // For address verification, use the original compressed public key
    // as Cosmos addresses are always derived from compressed keys
    const pubKeyHash = ripemd160(sha256(compressedPubKeyBytes));
    // Extract the prefix from the expected address (e.g., 'fetch' from 'fetch1...')
    const prefix = expectedAddress.split('1')[0];
    const derivedAddress = toBech32(prefix, pubKeyHash);
    console.log('Address verification:', {
      derivedAddress,
      expectedAddress,
      matches: derivedAddress === expectedAddress,
    });
    return derivedAddress === expectedAddress;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Extracts the original message from a sign document
 * @param signDoc - The sign document containing the message
 * @returns The original message
 */
export function extractMessage(signDoc: SignDoc): string {
  const messageData = signDoc.msgs[0]?.value?.data;
  if (!messageData) {
    throw new Error('Invalid sign document: missing message data');
  }

  // Check if the data is base64 encoded
  try {
    // Try to decode as base64 first
    const decoded = Buffer.from(messageData, 'base64').toString('utf-8');
    // If the decoded string contains only printable characters, return it
    if (/^[\x20-\x7E]*$/.test(decoded)) {
      return decoded;
    }
    // If not, return the original data
    return messageData;
  } catch (e) {
    // If base64 decoding fails, return the original data
    return messageData;
  }
} 