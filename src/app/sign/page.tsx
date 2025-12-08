'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../providers/WalletProvider';
import { NetworkType, WalletType } from '../types/wallet';
import { SignedMessage } from '../types/message';
import { Button } from '../components/ui/Button';
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
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Sign Message</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Network Type</label>
          <select
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
            disabled={isConnected}
          >
            <option value="ethereum">EVM (Ethereum, Polygon, etc.)</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot">Polkadot</option>
          </select>
        </div>

        {(selectedNetwork === 'cosmos' || selectedNetwork === 'polkadot') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              {selectedNetwork === 'cosmos' ? 'Cosmos Chain' : 'Polkadot Chain'}
            </label>
            <select
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
              disabled={isConnected}
            >
              {getChainOptions()}
            </select>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Wallet Type</label>
          <select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value as WalletType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
            disabled={isConnected}
          >
            {getWalletOptions()}
          </select>
        </div>

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
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Connected Address</label>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-mono break-all text-gray-900 dark:text-gray-100">{address}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                rows={4}
                placeholder="Enter message to sign"
              />
            </div>

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
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Signature</label>
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
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-mono break-all text-gray-900 dark:text-gray-100">{signature}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Signed Message JSON</label>
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
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                    <pre className="text-sm font-mono break-all text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-x-auto">
                      {signedMessage}
                    </pre>
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