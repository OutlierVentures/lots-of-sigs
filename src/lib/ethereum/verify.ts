import { verifyMessage as ethersVerifyMessage } from 'ethers';

export async function verifyMessage(message: string, signature: string, address: string): Promise<boolean> {
  try {
    const recoveredAddress = await ethersVerifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying Ethereum message:', error);
    return false;
  }
} 