import { Secp256k1 } from '@cosmjs/crypto';
import { toBech32 } from '@cosmjs/encoding';
import { sha256, ripemd160 } from '@cosmjs/crypto';
import {
  createSignature,
  verifySignature,
  extractMessage,
  SignatureData,
} from '../../lib/cosmos/signing';

describe('Cosmos Signing and Verification', () => {
  it('should create and verify an ADR-36 signature', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Create a test message
    const message = 'test message';

    // Create the signature
    const signatureData = await createSignature(message, privateKey, pubKeyBytes);

    // Get the signer's address
    const pubKeyHash = ripemd160(sha256(pubKeyBytes));
    const address = toBech32('cosmos', pubKeyHash);

    // Verify the signature
    const isValid = await verifySignature(signatureData, address);
    expect(isValid).toBe(true);

    // Verify we can extract the original message
    const extractedMessage = extractMessage(signatureData.sign_doc);
    expect(extractedMessage).toBe(message);
  });

  it('should fail to verify a tampered message', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Create and sign a message
    const message = 'original message';
    const signatureData = await createSignature(message, privateKey, pubKeyBytes);

    // Tamper with the message
    const tamperedSignatureData: SignatureData = {
      ...signatureData,
      sign_doc: {
        ...signatureData.sign_doc,
        msgs: [
          {
            ...signatureData.sign_doc.msgs[0],
            value: {
              ...signatureData.sign_doc.msgs[0].value,
              data: Buffer.from('tampered message').toString('base64'),
            },
          },
        ],
      },
    };

    // Get the signer's address
    const pubKeyHash = ripemd160(sha256(pubKeyBytes));
    const address = toBech32('cosmos', pubKeyHash);

    // Verify the tampered signature
    const isValid = await verifySignature(tamperedSignatureData, address);
    expect(isValid).toBe(false);
  });

  it('should fail to verify with wrong address', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Create a test message
    const message = 'test message';

    // Create the signature
    const signatureData = await createSignature(message, privateKey, pubKeyBytes);

    // Use a different address
    const wrongAddress = 'cosmos1wrong';

    // Verify the signature with wrong address
    const isValid = await verifySignature(signatureData, wrongAddress);
    expect(isValid).toBe(false);
  });

  it('should create a signature in the exact format used by the frontend', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Create a test message
    const message = 'test message';

    // Create the signature
    const signatureData = await createSignature(message, privateKey, pubKeyBytes);

    // Get the signer's address
    const pubKeyHash = ripemd160(sha256(pubKeyBytes));
    const address = toBech32('cosmos', pubKeyHash);

    // Create the frontend-compatible JSON structure
    const frontendJson = {
      message,
      signature: JSON.stringify(signatureData),
      address,
      network: 'cosmos' as const,
      timestamp: new Date().toISOString(),
    };

    // Log the JSON string that can be used in the frontend
    console.log('Frontend-compatible JSON string:');
    console.log(JSON.stringify(frontendJson, null, 2));

    // Verify that the signature is valid
    const isValid = await verifySignature(signatureData, address);
    expect(isValid).toBe(true);
  });
}); 