'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SignedMessage } from '../types/message';
import { verifyMessage } from 'ethers';

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

  const handleVerify = async () => {
    if (!message || !signature || !address || !selectedNetwork) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      if (selectedNetwork === 'ethereum') {
        // Verify the message using ethers.js
        const recoveredAddress = verifyMessage(message, signature);
        setVerificationResult(recoveredAddress.toLowerCase() === address.toLowerCase());
      } else {
        setError(`${selectedNetwork} verification not implemented yet`);
        setVerificationResult(false);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Verification failed. Please check your inputs.');
      setVerificationResult(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Verify Message</h1>
          <p className="text-sm text-gray-500">
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
            <label className="block text-sm font-medium text-gray-900">
              Paste Signed Message JSON
            </label>
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
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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