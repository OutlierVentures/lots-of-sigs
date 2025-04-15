import { sha256 } from '@cosmjs/crypto';

export function hash(data: Uint8Array): Uint8Array {
  return sha256(data);
} 