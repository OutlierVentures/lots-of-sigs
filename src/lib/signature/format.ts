/**
 * Represents a parsed signature object
 */
export interface ParsedSignature {
  signature: string;
  pub_key?: {
    type: string;
    value: string;
  };
  sign_doc?: {
    chain_id: string;
    account_number: string;
    sequence: string;
    fee: {
      gas: string;
      amount: unknown[];
    };
    msgs: unknown[];
    memo: string;
  };
  [key: string]: unknown; // Allow for additional fields that might be present
}

/**
 * Parses a signature string into a structured object
 * @param signature The signature string to parse
 * @returns A ParsedSignature object
 */
export function parseSignature(signature: string): ParsedSignature {
  try {
    const parsed = JSON.parse(signature);
    // If the parsed object has a signature field, use it
    if (typeof parsed === 'object' && parsed !== null && 'signature' in parsed) {
      return parsed;
    }
    // If the parsed object doesn't have a signature field, wrap it
    return { signature: signature };
  } catch (_e) {
    // If parsing fails, treat the input as a raw signature
    return { signature: signature };
  }
}

/**
 * Formats a signature object into a string
 * @param signature The signature object to format
 * @returns A formatted signature string
 */
export function formatSignature(signature: ParsedSignature): string {
  return JSON.stringify(signature);
} 