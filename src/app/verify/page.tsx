'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/app/components/ui/FormField';
import { ErrorMessage } from '@/app/components/ui/ErrorMessage';
import { PageContainer } from '@/app/components/ui/PageContainer';
import { PageHeading } from '@/app/components/ui/PageHeading';
import { Label } from '@/components/ui/Label';
import { Text } from '@/app/components/ui/Text';
import { Heading } from '@/app/components/ui/Heading';
import { NetworkType, CosmosChainId } from '@/app/types/wallet';
import { CHAINS } from '../../lib/cosmos/chains';
import { getChainByAddress, getAllChains } from '@/lib/substrate/chains';
import { Upload, CheckCircle2, XCircle, Search } from 'lucide-react';
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
  const detectedChain =
    selectedNetwork === 'polkadot' && address
      ? getChainByAddress(address)
      : null;

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
    } catch (_e) {
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
      chainId: detectedChain?.name || selectedChainId
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

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <PageContainer>
        <PageHeading>Verify Message</PageHeading>
        
        {error && <ErrorMessage message={error} />}

        <FormField label="Network Type">
          <Select
            value={selectedNetwork}
            onChange={(e) => {
              setSelectedNetwork(e.target.value as NetworkType);
              setSelectedChainId('');
            }}
          >
            <option value="ethereum">EVM (Ethereum, Polygon, etc.)</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot">Polkadot/Substrate</option>
          </Select>
        </FormField>

        {selectedNetwork === 'cosmos' && (
          <FormField label="Chain">
            <Select
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(e.target.value as CosmosChainId)}
            >
              {Object.entries(CHAINS).map(([id, config]) => (
                <option key={id} value={id}>
                  {config.chainName}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {selectedNetwork === 'polkadot' && (
          <FormField label="Chain" className="mb-4">
            <Select
              value={detectedChain?.name ?? selectedChainId}
              onChange={(e) => setSelectedChainId(e.target.value)}
            >
              <option value="">Select a chain</option>
              {getAllChains().map((chain) => (
                <option key={chain.name} value={chain.name}>
                  {chain.displayName}
                </option>
              ))}
            </Select>
            {detectedChain && (
              <Text className="mt-2 text-sm">
                Detected chain: {detectedChain.displayName}
              </Text>
            )}
          </FormField>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Label>Signed Message JSON</Label>
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
                className="flex items-center gap-2"
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
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
          <Textarea
            value={jsonInput}
            onChange={handleJsonInputChange}
            rows={10}
            placeholder="Paste the signed message JSON here or upload a file..."
          />
        </div>

        <FormField label="Message">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Enter the message to verify..."
          />
        </FormField>

        <FormField label="Signature">
          <Textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={4}
            placeholder="Enter the signature to verify..."
            className="font-mono"
          />
        </FormField>

        <FormField label="Address">
          <Input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter the signer's address..."
          />
        </FormField>

        <div className="flex justify-end mb-6">
          <Button
            onClick={() => handleVerify()}
            disabled={!message || !signature || !address || !selectedNetwork || isLoading}
            className="flex items-center gap-2"
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
              verificationResult ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                verificationResult ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {verificationMessage}
              </p>
            </div>

            {verificationDetails && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                <Heading level={5} as="h3" className="text-sm mb-3">Verification Details</Heading>
                <div className="space-y-2">
                  <Text variant="muted" className="text-sm">
                    Network: <span className="font-medium">{verificationDetails.network}</span>
                    {verificationDetails.chain && (
                      <span className="ml-2">
                        Chain: <span className="font-medium">{verificationDetails.chain}</span>
                      </span>
                    )}
                  </Text>
                  <div className="space-y-2">
                    {verificationDetails.checks.map((check, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {check.passed ? (
                          <CheckCircle2 className="text-green-500 dark:text-green-400" />
                        ) : (
                          <XCircle className="text-red-500 dark:text-red-400" />
                        )}
                        <Text>{check.name}</Text>
                        {check.details && <Text variant="muted" className="text-sm">{check.details}</Text>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
} 