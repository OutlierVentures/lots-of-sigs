import { VerificationService } from '@/lib/verification/verification.service';
import { NetworkType } from '@/app/types/wallet';

// Mock the verification functions
jest.mock('@/lib/ethereum/verify', () => ({
  verifyMessage: jest.fn().mockResolvedValue(true)
}));

jest.mock('@/lib/cosmos/verify', () => ({
  verifyMessage: jest.fn().mockResolvedValue(true)
}));

jest.mock('@/lib/substrate/verify', () => ({
  verifyMessage: jest.fn().mockResolvedValue(true)
}));

describe('VerificationService', () => {
  const mockInput = {
    message: 'test message',
    signature: '0x123',
    address: '0x1234567890123456789012345678901234567890',
    network: 'ethereum' as NetworkType
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verify', () => {
    it('should verify Ethereum signatures', async () => {
      const result = await VerificationService.verify(mockInput);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Signature is valid');
      expect(result.details.checks).toHaveLength(4);
      expect(result.details.network).toBe('ethereum');
    });

    it('should verify Cosmos signatures', async () => {
      const result = await VerificationService.verify({
        ...mockInput,
        network: 'cosmos' as NetworkType
      });
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Signature is valid');
      expect(result.details.checks).toHaveLength(4);
      expect(result.details.network).toBe('cosmos');
    });

    it('should verify Substrate signatures', async () => {
      const result = await VerificationService.verify({
        ...mockInput,
        network: 'polkadot' as NetworkType
      });
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Signature is valid');
      expect(result.details.checks).toHaveLength(4);
      expect(result.details.network).toBe('polkadot');
    });

    it('should handle invalid inputs', async () => {
      const result = await VerificationService.verify({
        message: '',
        signature: '',
        address: '',
        network: 'ethereum' as NetworkType
      });
      
      expect(result.isValid).toBe(false);
      expect(result.details.checks).toHaveLength(4);
      expect(result.details.checks[0].passed).toBe(false);
      expect(result.details.checks[1].passed).toBe(false);
      expect(result.details.checks[2].passed).toBe(false);
    });

    it('should handle verification errors', async () => {
      const mockError = new Error('Verification failed');
      const { verifyMessage } = await import('@/lib/ethereum/verify');
      (verifyMessage as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await VerificationService.verify(mockInput);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Verification failed');
      expect(result.details.checks).toHaveLength(4);
      expect(result.details.checks[3].passed).toBe(false);
      expect(result.details.checks[3].details).toBe('Verification failed');
    });
  });

  describe('parseJsonInput', () => {
    it('should parse valid JSON input', () => {
      const jsonInput = JSON.stringify(mockInput);
      const result = VerificationService.parseJsonInput(jsonInput);
      
      expect(result).toEqual(mockInput);
    });

    it('should return null for invalid JSON', () => {
      const result = VerificationService.parseJsonInput('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const invalidInput = {
        message: 'test',
        // Missing signature, address, and network
      };
      const result = VerificationService.parseJsonInput(JSON.stringify(invalidInput));
      expect(result).toBeNull();
    });
  });
}); 