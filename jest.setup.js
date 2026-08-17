// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock TextEncoder/TextDecoder for tests
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(str) {
      return Buffer.from(str, 'utf-8');
    }
  };
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class {
    decode(bytes) {
      return Buffer.from(bytes).toString('utf-8');
    }
  };
}

// Keep the platform Web Crypto API when it exists (CosmJS 0.39 uses @noble/curves).
if (typeof global.crypto?.getRandomValues !== 'function') {
  global.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: async (_algorithm, data) => {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);
        return encoded;
      },
    },
  };
} 