'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../providers/WalletProvider';
import { NetworkType, WalletType } from '../types/wallet';
import { SignedMessage } from '../types/message';
import { Button } from '../components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '../components/ui/FormField';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { CodeDisplay } from '../components/ui/CodeDisplay';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeading } from '../components/ui/PageHeading';
import { Label } from '@/components/ui/Label';
import { CHAINS } from '../../lib/cosmos/chains';
import { getAllChains } from '../../lib/substrate/chains';
import { Copy, Download, PenLine, Wallet, LogOut } from 'lucide-react';
import { getDefaultChain } from '../../lib/substrate/chain-utils';
import { parseSignature } from '@/lib/signature/format';

export default function SignPage() {
  const { isConnected, address, network, chainId: _chainId, error: walletError, actions } = useWallet();
  const [message, setMessage] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('ethereum');
  const [selectedChainId, setSelectedChainId] = useState<string>(getDefaultChain().name);
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string>('');
  const [walletType, setWalletType] = useState<WalletType>('metamask');

  // Update error state when wallet error changes
  useEffect(() => {
    if (walletError) {
      setError(walletError);
    }
  }, [walletError]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Connecting to wallet:', { selectedNetwork, walletType, selectedChainId });
      await actions.connect(selectedNetwork, walletType, selectedChainId);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!message.trim()) {
      setError('Please enter a message to sign');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const sig = await actions.signMessage(message);
      setSignature(sig);
      
      // Use the new parseSignature function
      const parsedSig = parseSignature(sig);
      
      // Generate JSON representation
      const signedMessageObj: SignedMessage = {
        message,
        signature: parsedSig.signature,
        address: address!,
        network: network!,
        timestamp: new Date().toISOString(),
      };
      setSignedMessage(JSON.stringify(signedMessageObj, null, 2));
    } catch (err) {
      console.error('Failed to sign message:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await actions.disconnect();
      setSignature('');
      setSignedMessage('');
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getWalletOptions = () => {
    switch (selectedNetwork) {
      case 'ethereum':
        return (
          <>
            <option value="metamask">Browser Wallet (MetaMask, Rabby, Brave, etc.)</option>
            <option value="walletconnect">WalletConnect</option>
          </>
        );
      case 'cosmos':
        return <option value="keplr">Keplr</option>;
      case 'polkadot':
        return <option value="polkadot-js">Polkadot.js</option>;
      default:
        return null;
    }
  };

  const getChainOptions = () => {
    if (selectedNetwork === 'cosmos') {
      return Object.entries(CHAINS).map(([id, config]) => (
        <option key={id} value={id}>
          {config.chainName}
        </option>
      ));
    } else if (selectedNetwork === 'polkadot') {
      return getAllChains().map((chain) => (
        <option key={chain.name} value={chain.name}>
          {chain.displayName}
        </option>
      ));
    }
    return null;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <PageContainer>
        <PageHeading>Sign Message</PageHeading>
        
        {error && <ErrorMessage message={error} />}

        <FormField label="Network Type">
          <Select
            value={selectedNetwork}
            onChange={(e) => {
              setSelectedNetwork(e.target.value as NetworkType);
              // Reset wallet type and chain ID when network changes
              setWalletType(
                e.target.value === 'ethereum' ? 'metamask' :
                e.target.value === 'cosmos' ? 'keplr' :
                'polkadot-js'
              );
              setSelectedChainId(
                e.target.value === 'cosmos' ? 'cosmoshub-4' :
                e.target.value === 'polkadot' ? getDefaultChain().name :
                ''
              );
            }}
            disabled={isConnected}
          >
            <option value="ethereum">EVM (Ethereum, Polygon, etc.)</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot">Polkadot</option>
          </Select>
        </FormField>

        {(selectedNetwork === 'cosmos' || selectedNetwork === 'polkadot') && (
          <FormField label={selectedNetwork === 'cosmos' ? 'Cosmos Chain' : 'Polkadot Chain'}>
            <Select
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(e.target.value)}
              disabled={isConnected}
            >
              {getChainOptions()}
            </Select>
          </FormField>
        )}

        <FormField label="Wallet Type">
          <Select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value as WalletType)}
            disabled={isConnected}
          >
            {getWalletOptions()}
          </Select>
        </FormField>

        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2"
          >
            {isLoading ? 'Connecting...' : (
              <>
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <FormField label="Connected Address">
              <CodeDisplay>{address}</CodeDisplay>
            </FormField>

            <FormField label="Message">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Enter message to sign"
              />
            </FormField>

            <div className="flex space-x-4">
              <Button
                onClick={handleSign}
                disabled={isLoading || !message.trim()}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Signing...' : (
                  <>
                    <PenLine className="h-4 w-4" />
                    Sign Message
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </Button>
            </div>

            {signature && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Signature</Label>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleCopy(signature)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <CodeDisplay>{signature}</CodeDisplay>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Signed Message JSON</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCopy(signedMessage)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const signedMessageObj = JSON.parse(signedMessage);
                          const timestamp = new Date(signedMessageObj.timestamp)
                            .toISOString()
                            .replace(/[-:]/g, '')
                            .replace('T', '')
                            .split('.')[0];
                          const filename = `${address}-${timestamp}.json`;
                          const blob = new Blob([signedMessage], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = filename;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <CodeDisplay as="pre">{signedMessage}</CodeDisplay>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
} 