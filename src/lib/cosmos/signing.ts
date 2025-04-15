import { Secp256k1, ExtendedSecp256k1Signature } from '@cosmjs/crypto';
import { fromBase64, toBech32, toBase64 } from '@cosmjs/encoding';
import { sha256, ripemd160 } from '@cosmjs/crypto';

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
 * @returns The sign document
 */
export function createSignDoc(message: string, signer: string): SignDoc {
  return {
    chain_id: '',
    account_number: '0',
    sequence: '0',
    fee: {
      gas: '0',
      amount: [],
    },
    msgs: [
      {
        type: 'sign/MsgSignData',
        value: {
          signer,
          data: Buffer.from(message).toString('base64'),
        },
      },
    ],
    memo: '',
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

  // Create the message hash
  const messageHash = sha256(new TextEncoder().encode(JSON.stringify(signDoc)));

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
    // Parse the signature and public key
    const sigBytes = fromBase64(signatureData.signature);
    const pubKeyBytes = fromBase64(signatureData.pub_key.value);

    // Create the message hash
    const messageHash = sha256(
      new TextEncoder().encode(JSON.stringify(signatureData.sign_doc))
    );

    // Create the signature object
    const sig = new ExtendedSecp256k1Signature(
      sigBytes.slice(0, 32),
      sigBytes.slice(32, 64),
      0
    );

    // Verify the signature
    const isValid = await Secp256k1.verifySignature(sig, messageHash, pubKeyBytes);
    if (!isValid) {
      return false;
    }

    // Verify the address matches
    const pubKeyHash = ripemd160(sha256(pubKeyBytes));
    const derivedAddress = toBech32('cosmos', pubKeyHash);
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
  const base64Data = signDoc.msgs[0]?.value?.data;
  if (!base64Data) {
    throw new Error('Invalid sign document: missing message data');
  }
  return Buffer.from(base64Data, 'base64').toString('utf-8');
} 