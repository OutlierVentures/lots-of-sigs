import { Secp256k1, ExtendedSecp256k1Signature } from '@cosmjs/crypto';
import { fromBase64, toBech32, toBase64 } from '@cosmjs/encoding';
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

  it('should verify a signature with base64 encoded message data', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Create a test message
    const message = 'test message';
    const base64Message = Buffer.from(message).toString('base64');

    // Create the signature data with base64 encoded message
    const signer = toBech32('cosmos', ripemd160(sha256(pubKeyBytes)));
    const signDoc = {
      chain_id: "",
      account_number: "0",
      sequence: "0",
      fee: {
        gas: "0",
        amount: [],
      },
      msgs: [
        {
          type: "sign/MsgSignData",
          value: {
            signer,
            data: base64Message,
          },
        },
      ],
      memo: "",
    };

    // Create the message hash using sorted fields
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

    // Create the signature data
    const signatureData = {
      signature: toBase64(sigBytes),
      pub_key: {
        type: 'tendermint/PubKeySecp256k1',
        value: toBase64(pubKeyBytes),
      },
      sign_doc: signDoc,
    };

    // Get the signer's address
    const address = toBech32('cosmos', ripemd160(sha256(pubKeyBytes)));

    // Verify that the signature is valid
    const isValid = await verifySignature(signatureData, address);
    expect(isValid).toBe(true);

    // Verify that the message can be extracted correctly
    const extractedMessage = extractMessage(signatureData.sign_doc);
    expect(extractedMessage).toBe(message);
  });

  it('should verify a signature with compressed public key', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Compress the public key
    const compressedPubKey = await Secp256k1.compressPubkey(pubKeyBytes);

    // Create a test message
    const message = 'test message';

    // Create the signature
    const signatureData = await createSignature(message, privateKey, pubKeyBytes);

    // Get the signer's address using compressed key
    const pubKeyHash = ripemd160(sha256(compressedPubKey));
    const address = toBech32('cosmos', pubKeyHash);

    // Create a new signature data with compressed public key
    const compressedSignatureData: SignatureData = {
      ...signatureData,
      pub_key: {
        type: 'tendermint/PubKeySecp256k1',
        value: toBase64(compressedPubKey),
      },
    };

    // Verify the signature
    const isValid = await verifySignature(compressedSignatureData, address);
    expect(isValid).toBe(true);

    // Verify we can extract the original message
    const extractedMessage = extractMessage(compressedSignatureData.sign_doc);
    expect(extractedMessage).toBe(message);
  });

  it('should verify a signature with uncompressed public key', async () => {
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

  it('should fail to verify with wrong public key format', async () => {
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

    // Create a new signature data with invalid public key format
    const invalidSignatureData: SignatureData = {
      ...signatureData,
      pub_key: {
        type: 'tendermint/PubKeySecp256k1',
        value: toBase64(new Uint8Array(30)), // Invalid length
      },
    };

    // Mock console.error to prevent it from failing the test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Verify the signature should fail
    const isValid = await verifySignature(invalidSignatureData, address);
    expect(isValid).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Invalid public key length:', 30);

    // Restore console.error
    console.error = originalConsoleError;
  });
}); 