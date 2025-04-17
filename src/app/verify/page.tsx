'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { NetworkType, CosmosChainId } from '@/app/types/wallet';
import { CHAINS } from '../../lib/cosmos/chains';
import { SUBSTRATE_CHAINS, getChainByAddress, getChainByName, SubstrateChain, DEFAULT_CHAIN, getAllChains } from '@/lib/substrate/chains';
import { Upload, CheckCircle2, XCircle, Search } from 'lucide-react';
import { determineChain } from '../../lib/substrate/chain-utils';
import { VerificationService } from '@/lib/verification/verification.service';

export default function VerifyPage() {
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState<string>('');
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('ethereum');
  const [selectedChainId, setSelectedChainId] = useState<string>('');
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
  const [detectedChain, setDetectedChain] = useState<SubstrateChain | null>(null);

  const clearPreviousResults = () => {
    setVerificationResult(null);
    setVerificationMessage('');
    setVerificationDetails(null);
    setError(null);
  };

  const processJsonAndVerify = async (jsonString: string) => {
    console.log('Starting processJsonAndVerify');
    clearPreviousResults();

    try {
      const parsedInput = VerificationService.parseJsonInput(jsonString);
      if (!parsedInput) {
        setError('Invalid JSON format');
        return;
      }
      console.log('Parsed input:', parsedInput);

      // Update all states at once
      setJsonInput(jsonString);
      setMessage(parsedInput.message || '');
      setSignature(typeof parsedInput.signature === 'string' ? parsedInput.signature : JSON.stringify(parsedInput.signature));
      setAddress(parsedInput.address || '');
      setSelectedNetwork(parsedInput.network as NetworkType);

      // For Cosmos networks, try to determine the chain ID from the address prefix
      if (parsedInput.network === 'cosmos' && parsedInput.address) {
        const prefix = parsedInput.address.split('1')[0];
        const chainEntry = Object.entries(CHAINS).find(([_, config]) => 
          config.bech32Prefix === prefix
        );
        if (chainEntry) {
          setSelectedChainId(chainEntry[0] as CosmosChainId);
        }
      }

      // Verify if we have all required fields
      if (parsedInput.message && parsedInput.signature && parsedInput.address && parsedInput.network) {
        console.log('All fields present, triggering verification');
        // Use the parsed input directly instead of relying on state
        await handleVerify({
          message: parsedInput.message,
          signature: parsedInput.signature,
          address: parsedInput.address,
          network: parsedInput.network as NetworkType,
          chainId: parsedInput.chainId
        });
      } else {
        console.log('Missing required fields');
        setError('Missing required fields in the JSON input');
      }
    } catch (error) {
      console.error('Error in processJsonAndVerify:', error);
      setError('Failed to process input: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      const reader = new FileReader();
      reader.onload = async (e) => {
        console.log('File read complete');
        const content = e.target?.result as string;
        await processJsonAndVerify(content);
      };
      reader.readAsText(file);
    }
  };

  const handleJsonInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setJsonInput(input);
    clearPreviousResults();

    try {
      const parsedInput = VerificationService.parseJsonInput(input);
      if (parsedInput) {
        // Update all states at once
        setMessage(parsedInput.message || '');
        setSignature(typeof parsedInput.signature === 'string' ? parsedInput.signature : JSON.stringify(parsedInput.signature));
        setAddress(parsedInput.address || '');
        setSelectedNetwork(parsedInput.network as NetworkType);

        // For Cosmos networks, try to determine the chain ID from the address prefix
        if (parsedInput.network === 'cosmos' && parsedInput.address) {
          const prefix = parsedInput.address.split('1')[0];
          const chainEntry = Object.entries(CHAINS).find(([_, config]) => 
            config.bech32Prefix === prefix
          );
          if (chainEntry) {
            setSelectedChainId(chainEntry[0] as CosmosChainId);
          }
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors as the user might be in the middle of typing
    }
  };

  const handleVerify = async (overrideInput?: {
    message: string;
    signature: string;
    address: string;
    network: NetworkType;
    chainId?: string;
  }) => {
    const verificationInput = overrideInput || {
      message,
      signature,
      address,
      network: selectedNetwork,
      chainId: selectedChainId
    };

    console.log('Starting verification with:', verificationInput);
    
    if (!verificationInput.message || !verificationInput.signature || !verificationInput.address || !verificationInput.network) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setVerificationResult(null);
      setVerificationMessage('');
      setVerificationDetails(null);

      console.log('Calling VerificationService.verify');
      const result = await VerificationService.verify(verificationInput);
      console.log('Verification result:', result);

      setVerificationResult(result.isValid);
      setVerificationMessage(result.message);
      setVerificationDetails(result.details);
      console.log('Updated verification states');

    } catch (error) {
      console.error('Verification error:', error);
      setError(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setVerificationResult(false);
      setVerificationMessage('Verification failed');
      setVerificationDetails({
        checks: [{
          name: 'Error',
          passed: false,
          details: error instanceof Error ? error.message : 'Unknown error'
        }],
        network: verificationInput.network,
        chain: verificationInput.chainId
      });
    } finally {
      setIsLoading(false);
      console.log('Scrolling to results');
      // Scroll to result after a short delay to ensure the component has rendered
      setTimeout(() => {
        const resultElement = document.getElementById('verification-result');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Add effect to detect chain when address changes
  useEffect(() => {
    if (selectedNetwork === 'polkadot' && address) {
      const chain = getChainByAddress(address);
      setDetectedChain(chain);
      if (chain) {
        setSelectedChainId(chain.name);
      }
    }
  }, [address, selectedNetwork]);

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
            onChange={(e) => {
              setSelectedNetwork(e.target.value as NetworkType);
              setSelectedChainId('');
              setDetectedChain(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          >
            <option value="ethereum">EVM (Ethereum, Polygon, etc.)</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot">Polkadot/Substrate</option>
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

        {selectedNetwork === 'polkadot' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Chain
            </label>
            <select
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(e.target.value)}
              className="w-full p-2 border rounded text-gray-900"
            >
              <option value="">Select a chain</option>
              {getAllChains().map((chain) => (
                <option key={chain.name} value={chain.name}>
                  {chain.displayName}
                </option>
              ))}
            </select>
            {detectedChain && (
              <p className="mt-2 text-sm text-gray-900">
                Detected chain: {detectedChain.displayName}
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-900">Signed Message JSON</label>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    await processJsonAndVerify(text);
                  } catch (err) {
                    console.error('Failed to paste:', err);
                    setError('Failed to read from clipboard');
                  }
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Paste
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = handleFileUpload;
                  input.click();
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
          <textarea
            value={jsonInput}
            onChange={handleJsonInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            rows={10}
            placeholder="Paste the signed message JSON here or upload a file..."
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

        <div className="flex justify-end mb-6">
          <Button
            onClick={() => handleVerify()}
            disabled={!message || !signature || !address || !selectedNetwork || isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? 'Verifying...' : (
              <>
                <Search className="h-4 w-4" />
                Verify Message
              </>
            )}
          </Button>
        </div>

        {verificationResult !== null && (
          <div id="verification-result" className="space-y-6">
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
                      <div key={index} className="flex items-center gap-2">
                        {check.passed ? (
                          <CheckCircle2 className="text-green-500" />
                        ) : (
                          <XCircle className="text-red-500" />
                        )}
                        <span className="text-gray-900">{check.name}</span>
                        {check.details && <span className="text-gray-700">{check.details}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 