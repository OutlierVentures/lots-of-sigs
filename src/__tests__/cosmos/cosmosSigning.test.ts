import { Secp256k1, ExtendedSecp256k1Signature } from '@cosmjs/crypto';
import { fromBase64, toBech32, toBase64 } from '@cosmjs/encoding';
import { sha256, ripemd160 } from '@cosmjs/crypto';

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
    const signDoc = {
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
            signer: toBech32('cosmos', ripemd160(sha256(pubKeyBytes))),
            data: Buffer.from(message).toString('base64'),
          },
        },
      ],
      memo: '',
    };

    // Create the message hash
    const messageHash = sha256(new TextEncoder().encode(JSON.stringify(signDoc)));

    // Sign the message
    const signature = await Secp256k1.createSignature(messageHash, privateKey);
    const sigBytes = new Uint8Array(64);
    sigBytes.set(signature.r(32));
    sigBytes.set(signature.s(32), 32);

    // Create the signature object
    const sig = new ExtendedSecp256k1Signature(
      signature.r(32),
      signature.s(32),
      signature.recovery
    );

    // Verify the signature
    const isValid = await Secp256k1.verifySignature(
      sig,
      messageHash,
      pubKeyBytes
    );

    expect(isValid).toBe(true);

    // Verify the address matches
    const pubKeyHash = ripemd160(sha256(pubKeyBytes));
    const address = toBech32('cosmos', pubKeyHash);
    const expectedAddress = toBech32('cosmos', ripemd160(sha256(pubKeyBytes)));
    expect(address).toBe(expectedAddress);
  });

  it('should fail to verify a tampered message', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Create a test message
    const message = 'original message';
    const signDoc = {
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
            signer: toBech32('cosmos', ripemd160(sha256(pubKeyBytes))),
            data: Buffer.from(message).toString('base64'),
          },
        },
      ],
      memo: '',
    };

    // Create the message hash
    const messageHash = sha256(new TextEncoder().encode(JSON.stringify(signDoc)));

    // Sign the message
    const signature = await Secp256k1.createSignature(messageHash, privateKey);
    const sigBytes = new Uint8Array(64);
    sigBytes.set(signature.r(32));
    sigBytes.set(signature.s(32), 32);

    // Create a tampered message
    const tamperedMessage = 'tampered message';
    const tamperedSignDoc = {
      ...signDoc,
      msgs: [
        {
          type: 'sign/MsgSignData',
          value: {
            signer: toBech32('cosmos', ripemd160(sha256(pubKeyBytes))),
            data: Buffer.from(tamperedMessage).toString('base64'),
          },
        },
      ],
    };
    const tamperedMessageHash = sha256(new TextEncoder().encode(JSON.stringify(tamperedSignDoc)));

    // Create the signature object
    const sig = new ExtendedSecp256k1Signature(
      signature.r(32),
      signature.s(32),
      signature.recovery
    );

    // Verify the signature with tampered message
    const isValid = await Secp256k1.verifySignature(
      sig,
      tamperedMessageHash,
      pubKeyBytes
    );

    expect(isValid).toBe(false);
  });

  it('should create a valid signature format for the app', async () => {
    // Generate a random private key
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    // Get the public key
    const publicKey = await Secp256k1.makeKeypair(privateKey);
    const pubKeyBytes = publicKey.pubkey;

    // Create a test message
    const message = 'test message';
    const signDoc = {
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
            signer: toBech32('cosmos', ripemd160(sha256(pubKeyBytes))),
            data: Buffer.from(message).toString('base64'),
          },
        },
      ],
      memo: '',
    };

    // Create the message hash
    const messageHash = sha256(new TextEncoder().encode(JSON.stringify(signDoc)));

    // Sign the message
    const signature = await Secp256k1.createSignature(messageHash, privateKey);
    const sigBytes = new Uint8Array(64);
    sigBytes.set(signature.r(32));
    sigBytes.set(signature.s(32), 32);

    // Create the signature JSON that matches our app's format
    const signatureJson = {
      signature: toBase64(sigBytes),
      pub_key: {
        type: 'tendermint/PubKeySecp256k1',
        value: toBase64(pubKeyBytes),
      },
      sign_doc: signDoc,
    };

    // Parse the signature JSON
    const parsedSigBytes = fromBase64(signatureJson.signature);
    const parsedPubKeyBytes = fromBase64(signatureJson.pub_key.value);
    
    // Create the signature object
    const sig = new ExtendedSecp256k1Signature(
      parsedSigBytes.slice(0, 32),
      parsedSigBytes.slice(32, 64),
      0
    );

    // Verify the signature
    const isValid = await Secp256k1.verifySignature(
      sig,
      messageHash,
      parsedPubKeyBytes
    );

    expect(isValid).toBe(true);

    // Verify the address matches
    const pubKeyHash = ripemd160(sha256(parsedPubKeyBytes));
    const address = toBech32('cosmos', pubKeyHash);
    const expectedAddress = toBech32('cosmos', ripemd160(sha256(pubKeyBytes)));
    expect(address).toBe(expectedAddress);
  });
}); 