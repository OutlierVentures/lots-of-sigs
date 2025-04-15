'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { verifyMessage } from 'ethers';
import { SignedMessage } from '../types/message';
import { verifySignature, extractMessage } from '../../lib/cosmos/signing';

export default function VerifyPage() {
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'cosmos' | 'polkadot' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [jsonInput, setJsonInput] = useState('');

  const handleImportFromJSON = (jsonString: string) => {
    try {
      const signedMessage: SignedMessage = JSON.parse(jsonString);
      setMessage(signedMessage.message);
      setSignature(signedMessage.signature);
      setAddress(signedMessage.address);
      setSelectedNetwork(signedMessage.network);
      setError(null);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    try {
      const signedMessage: SignedMessage = JSON.parse(e.target.value);
      setMessage(signedMessage.message);
      setSignature(signedMessage.signature);
      setAddress(signedMessage.address);
      setSelectedNetwork(signedMessage.network);
      setError(null);
    } catch (err) {
      // Don't show error while typing
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleImportFromJSON(text);
      setJsonInput(text);
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };

  const handleVerify = async () => {
    setError('');
    setVerificationResult(null);
    setIsLoading(true);

    try {
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonInput);
        console.log('Parsed JSON:', parsedJson);
      } catch (e) {
        throw new Error('Invalid JSON format');
      }

      const { message, signature, address } = parsedJson;
      if (!message || !signature || !address) {
        throw new Error('JSON must contain message, signature, and address fields');
      }

      if (selectedNetwork === 'cosmos') {
        try {
          // Parse the signature JSON
          const sigJson = JSON.parse(signature);
          console.log('Parsed signature JSON:', sigJson);
          
          if (!sigJson.signature || !sigJson.pub_key || !sigJson.sign_doc) {
            throw new Error('Invalid signature format: missing required fields');
          }

          // Verify the signature using our utility module
          const isValid = await verifySignature(sigJson, address);
          setVerificationResult(isValid);

          if (isValid) {
            // Extract and verify the original message
            const extractedMessage = extractMessage(sigJson.sign_doc);
            if (extractedMessage !== message) {
              setError('Message mismatch: The signed message does not match the provided message');
              setVerificationResult(false);
            }
          }
        } catch (e) {
          console.error('Verification error:', e);
          setError(`Verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
          setVerificationResult(false);
        }
      } else if (selectedNetwork === 'ethereum') {
        // Verify the message using ethers.js
        const recoveredAddress = verifyMessage(message, signature);
        setVerificationResult(recoveredAddress.toLowerCase() === address.toLowerCase());
      } else {
        throw new Error(`${selectedNetwork} verification not implemented yet`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setVerificationResult(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-gray-900">Verify Message</h1>
          <p className="text-sm text-gray-900">
            Verify a signed message to confirm its authenticity
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {verificationResult !== null && (
            <div className={`p-4 rounded-md border ${
              verificationResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                verificationResult ? 'text-green-600' : 'text-red-600'
              }`}>
                {verificationResult ? 'Message verified successfully!' : 'Message verification failed'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-900">
                Paste Signed Message JSON
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePaste()}
              >
                Paste
              </Button>
            </div>
            <textarea
              value={jsonInput}
              onChange={handleJsonInputChange}
              rows={8}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
              placeholder="Paste your signed message JSON here..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-900">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter the message to verify..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signature" className="block text-sm font-medium text-gray-900">
              Signature
            </label>
            <textarea
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={4}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
              placeholder="Enter the signature to verify..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-900">
              Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter the signer's address..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="network" className="block text-sm font-medium text-gray-900">
              Network
            </label>
            <select
              id="network"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as 'ethereum' | 'cosmos' | 'polkadot' | '')}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a network</option>
              <option value="ethereum">Ethereum</option>
              <option value="cosmos">Cosmos</option>
              <option value="polkadot">Polkadot</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleVerify}
              disabled={!message || !signature || !address || !selectedNetwork || isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Message'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 