import { parseSignature, formatSignature, ParsedSignature } from '../../../lib/signature/format';

describe('parseSignature', () => {
  it('should parse a JSON string with signature field', () => {
    const input = '{"signature": "0x1234", "otherField": "value"}';
    const result = parseSignature(input);
    expect(result).toEqual({
      signature: '0x1234',
      otherField: 'value'
    });
  });

  it('should parse a JSON string without signature field', () => {
    const input = '{"data": "0x1234"}';
    const result = parseSignature(input);
    expect(result).toEqual({
      signature: input
    });
  });

  it('should handle non-JSON string input', () => {
    const input = '0x1234';
    const result = parseSignature(input);
    expect(result).toEqual({
      signature: input
    });
  });

  it('should handle empty string input', () => {
    const input = '';
    const result = parseSignature(input);
    expect(result).toEqual({
      signature: input
    });
  });
});

describe('formatSignature', () => {
  it('should format a signature object to JSON string', () => {
    const input: ParsedSignature = {
      signature: '0x1234',
      otherField: 'value'
    };
    const result = formatSignature(input);
    expect(result).toBe('{"signature":"0x1234","otherField":"value"}');
  });

  it('should handle minimal signature object', () => {
    const input: ParsedSignature = {
      signature: '0x1234'
    };
    const result = formatSignature(input);
    expect(result).toBe('{"signature":"0x1234"}');
  });
}); 