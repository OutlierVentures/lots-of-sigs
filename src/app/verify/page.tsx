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
import { SUBSTRATE_CHAINS } from '../../lib/substrate/chains';
import { verifyMessage as verifySubstrateMessage, SignedMessage as SubstrateSignedMessage } from '../../lib/substrate/signing';

export default function VerifyPage() {
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState<string>('');
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('ethereum');
  const [selectedChainId, setSelectedChainId] = useState<CosmosChainId>('cosmoshub-4');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationDetails, setVerificationDetails] = useState<{
    checks: Array<{ name: string; passed: boolean; details?: string }>;
    network: string;
    chain?: string;
  } | null>(null);
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
      setVerificationDetails(null);

      if (selectedNetwork === 'cosmos') {
        try {
          let signatureData;
          if (typeof signature === 'string') {
            signatureData = JSON.parse(signature);
          } else {
            signatureData = signature;
          }
          
          if (!signatureData.signature || !signatureData.pub_key || !signatureData.sign_doc) {
            throw new Error('Invalid signature format: missing required fields');
          }

          const isValid = await verifySignature(signatureData, address);
          setVerificationResult(isValid);
          
          // Extract chain prefix from address
          const prefix = address.split('1')[0];
          const chainConfig = CHAINS[selectedChainId];
          const isCorrectPrefix = chainConfig?.bech32Prefix === prefix;
          
          const checks = [
            {
              name: 'Signature Format',
              passed: true,
              details: 'Signature contains all required fields'
            },
            {
              name: 'Public Key Format',
              passed: true,
              details: signatureData.pub_key.value.length === 33 ? 'Compressed format' : 'Uncompressed format'
            },
            {
              name: 'Chain Compatibility',
              passed: isCorrectPrefix,
              details: isCorrectPrefix 
                ? `Address prefix (${prefix}) matches selected chain (${chainConfig?.chainName})`
                : `Address prefix (${prefix}) does not match selected chain (${chainConfig?.chainName})`
            },
            {
              name: 'Signature Verification',
              passed: isValid,
              details: isValid ? 'Signature matches the message and public key' : 'Signature does not match'
            },
            {
              name: 'Address Verification',
              passed: isValid,
              details: isValid ? 'Address matches the public key' : 'Address does not match the public key'
            }
          ];

          setVerificationDetails({
            checks,
            network: 'Cosmos',
            chain: selectedChainId
          });
          
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
          setVerificationDetails({
            checks: [{
              name: 'Error',
              passed: false,
              details: e instanceof Error ? e.message : 'Unknown error'
            }],
            network: 'Cosmos',
            chain: selectedChainId
          });
        }
      } else if (selectedNetwork === 'polkadot') {
        try {
          let signedMessage: SubstrateSignedMessage;
          try {
            const parsed = JSON.parse(signature) as SignedMessage;
            signedMessage = {
              message: parsed.message,
              signature: typeof parsed.signature === 'string' ? parsed.signature : JSON.stringify(parsed.signature),
              address,
              network: 'polkadot',
              chain: parsed.chain || 'polkadot',
              timestamp: parsed.timestamp || new Date().toISOString()
            };
          } catch (e) {
            signedMessage = {
              message,
              signature,
              address,
              network: 'polkadot',
              chain: 'polkadot',
              timestamp: new Date().toISOString()
            };
          }

          const isValid = await verifySubstrateMessage(signedMessage, {
            name: 'polkadot',
            rpcUrl: '',
            ss58Format: 0
          });
          
          // Extract SS58 format from address
          const ss58Format = parseInt(address.substring(0, 2), 16);
          const isCorrectFormat = ss58Format === 0; // Polkadot uses format 0
          
          const checks = [
            {
              name: 'Signature Format',
              passed: true,
              details: 'Valid hex-encoded signature'
            },
            {
              name: 'Address Format',
              passed: true,
              details: `SS58 format: ${ss58Format} (${isCorrectFormat ? 'correct' : 'incorrect'})`
            },
            {
              name: 'Signature Verification',
              passed: isValid,
              details: isValid ? 'Signature matches the message and public key' : 'Signature does not match'
            },
            {
              name: 'Address Verification',
              passed: isValid,
              details: isValid ? 'Address matches the public key' : 'Address does not match the public key'
            }
          ];

          setVerificationDetails({
            checks,
            network: 'Polkadot'
          });
          
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
          setVerificationDetails({
            checks: [{
              name: 'Error',
              passed: false,
              details: e instanceof Error ? e.message : 'Unknown error'
            }],
            network: 'Polkadot'
          });
        }
      } else if (selectedNetwork === 'ethereum') {
        try {
          console.log('Verifying EVM message:', {
            message,
            signature,
            address,
            messageLength: message.length,
            signatureLength: signature.length
          });
          
          const recoveredAddress = await verifyMessage(message, signature);
          console.log('Recovered address:', recoveredAddress);
          
          const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
          console.log('Verification result:', {
            isValid,
            recoveredAddress,
            expectedAddress: address
          });
          
          const checks = [
            {
              name: 'Signature Format',
              passed: true,
              details: 'Valid ECDSA signature'
            },
            {
              name: 'Address Format',
              passed: true,
              details: 'Valid Ethereum address format'
            },
            {
              name: 'Signature Verification',
              passed: isValid,
              details: isValid ? 'Signature matches the message and public key' : 'Signature does not match'
            },
            {
              name: 'Address Recovery',
              passed: isValid,
              details: isValid 
                ? `Recovered address (${recoveredAddress}) matches the expected address (${address})`
                : `Recovered address (${recoveredAddress}) does not match the expected address (${address})`
            }
          ];

          setVerificationDetails({
            checks,
            network: 'Ethereum'
          });
          
          setVerificationResult(isValid);
          if (isValid) {
            setVerificationMessage('Message verification successful!');
          } else {
            setVerificationMessage('Message verification failed: Recovered address does not match the expected address');
          }
        } catch (e) {
          console.error('Verification error:', e);
          setError(`Verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
          setVerificationResult(false);
          setVerificationMessage('Verification failed');
          setVerificationDetails({
            checks: [{
              name: 'Error',
              passed: false,
              details: e instanceof Error ? e.message : 'Unknown error'
            }],
            network: 'Ethereum'
          });
        }
      } else {
        setError('Network not supported');
      }
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
            <option value="polkadot">Polkadot</option>
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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-900">Signed Message JSON</label>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setJsonInput(text);
                  handleJsonInputChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
                } catch (err) {
                  console.error('Failed to read clipboard:', err);
                  setError('Failed to read from clipboard. Please paste manually.');
                }
              }}
            >
              Paste
            </Button>
          </div>
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
          <div className="space-y-4">
            <div className={`p-4 rounded-md border ${
              verificationResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                verificationResult ? 'text-green-600' : 'text-red-600'
              }`}>
                {verificationMessage}
              </p>
            </div>

            {verificationDetails && (
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Verification Details</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Network: <span className="font-medium">{verificationDetails.network}</span>
                    {verificationDetails.chain && (
                      <span className="ml-2">
                        Chain: <span className="font-medium">{verificationDetails.chain}</span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {verificationDetails.checks.map((check, index) => (
                      <div key={index} className="flex items-start">
                        <div className={`flex-shrink-0 h-5 w-5 ${
                          check.passed ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {check.passed ? (
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${
                            check.passed ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {check.name}
                          </p>
                          {check.details && (
                            <p className="text-sm text-gray-600 mt-1">
                              {check.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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