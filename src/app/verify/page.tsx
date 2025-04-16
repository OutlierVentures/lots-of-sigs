'use client';

import React, { useState } from 'react';
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
import { NetworkType, WalletType, CosmosChainId } from '../types/wallet';
import { CHAINS } from '../../lib/cosmos/chains';

export default function VerifyPage() {
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('ethereum');
  const [selectedChainId, setSelectedChainId] = useState<CosmosChainId>('cosmoshub-4');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [jsonInput, setJsonInput] = useState('');

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setJsonInput(input);
    setError(null);
    setVerificationResult(null);
    setVerificationMessage('');

    try {
      const parsedJson = JSON.parse(input);
      console.log('Parsed JSON:', parsedJson);

      // Auto-select network based on the JSON
      if (parsedJson.network) {
        setSelectedNetwork(parsedJson.network);
      }

      // For Cosmos networks, try to determine the chain ID from the address prefix
      if (parsedJson.network === 'cosmos' && parsedJson.address) {
        const prefix = parsedJson.address.split('1')[0];
        // Find the chain ID that matches this prefix
        const chainEntry = Object.entries(CHAINS).find(([_, config]) => 
          config.bech32Prefix === prefix
        );
        if (chainEntry) {
          setSelectedChainId(chainEntry[0] as CosmosChainId);
        }
      }

      // Update message, signature, and address from the JSON
      if (parsedJson.message) {
        setMessage(parsedJson.message);
      }
      if (parsedJson.signature) {
        setSignature(typeof parsedJson.signature === 'string' ? parsedJson.signature : JSON.stringify(parsedJson.signature));
      }
      if (parsedJson.address) {
        setAddress(parsedJson.address);
      }
    } catch (e) {
      // Ignore JSON parsing errors as the user might be in the middle of typing
    }
  };

  const handleVerify = async () => {
    if (!message || !signature || !address || !selectedNetwork) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setVerificationResult(null);
      setVerificationMessage('');

      if (selectedNetwork === 'cosmos') {
        try {
          // Handle both string and object signatures
          let signatureData;
          if (typeof signature === 'string') {
            // If it's a string, parse it
            signatureData = JSON.parse(signature);
          } else {
            // If it's already an object, use it directly
            signatureData = signature;
          }
          
          console.log('Signature data:', JSON.stringify(signatureData, null, 2));
          
          if (!signatureData.signature || !signatureData.pub_key || !signatureData.sign_doc) {
            throw new Error('Invalid signature format: missing required fields');
          }

          console.log('Verification input:', JSON.stringify(signatureData, null, 2));
          
          // Verify the signature using our utility module
          const isValid = await verifySignature(signatureData, address);
          console.log('Verification result:', isValid);
          setVerificationResult(isValid);
          
          if (isValid) {
            setVerificationMessage('Message verification successful!');
          } else {
            setVerificationMessage('Message verification failed');
          }
        } catch (e) {
          console.error('Verification error:', e);
          setError(`Verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
          setVerificationResult(false);
          setVerificationMessage('Verification failed');
        }
      } else {
        // Handle other networks (Ethereum, etc.)
        setError('Network not supported yet');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
      setVerificationResult(false);
      setVerificationMessage('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Verify Message</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Network Type</label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value as NetworkType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          >
            <option value="ethereum">EVM (Ethereum, Polygon, etc.)</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot" disabled>Polkadot (Coming Soon)</option>
          </select>
        </div>

        {selectedNetwork === 'cosmos' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Chain</label>
            <select
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(e.target.value as CosmosChainId)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            >
              {Object.entries(CHAINS).map(([id, config]) => (
                <option key={id} value={id}>
                  {config.chainName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Signed Message JSON</label>
          <textarea
            value={jsonInput}
            onChange={handleJsonInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            rows={10}
            placeholder="Paste the signed message JSON here..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            rows={4}
            placeholder="Enter the message to verify..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Signature</label>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-mono"
            rows={4}
            placeholder="Enter the signature to verify..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            placeholder="Enter the signer's address..."
          />
        </div>

        {verificationResult !== null && (
          <div className={`p-4 rounded-md border ${
            verificationResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${
              verificationResult ? 'text-green-600' : 'text-red-600'
            }`}>
              {verificationMessage}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleVerify}
            disabled={!message || !signature || !address || !selectedNetwork || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Message'}
          </Button>
        </div>
      </div>
    </div>
  );
} 